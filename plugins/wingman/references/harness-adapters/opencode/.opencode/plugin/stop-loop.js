// Wingman Stop-Loop ("ralph-loop"), pure logic ported from
// plugins/wingman/hooks/stop-loop.mjs -- NOT WIRED. See this file's own
// header and ../SESSION-LIFECYCLE-FINDINGS.md for the full, honest
// investigation this conclusion is based on.
//
// Verification status (2026-07-25, real live investigation, not assumed):
// UNCLEAR / NOT CONFIRMED WORKING. Do not treat this file as a functioning
// OpenCode integration -- only `evaluate()` and `extractAssistantText()`
// below are ported and tested; there is no plugin export here, deliberately,
// per this task's own instruction not to build a speculative/unverified
// wiring.
//
// What a real live investigation found, using a genuinely free OpenCode
// model (`opencode/deepseek-v4-flash-free`, zero cost, zero API key):
//
// 1. OpenCode's `event()` plugin hook DOES fire a `session.idle` bus event
//    when a model turn finishes and the session goes idle -- confirmed live,
//    and this is a real structural analog to Claude Code's `Stop` event
//    (a turn has ended; something outside the model gets to decide whether
//    to let it end there or keep going).
//
// 2. The plugin factory's context object exposes a real `client` (an SDK
//    client for the same OpenCode server the plugin is loaded into), and
//    `client.session.prompt({ path: { id: sessionID }, body: {...} })` is a
//    real, callable method -- confirmed live by calling it from inside an
//    `event()` handler on `session.idle`. The call did NOT throw, and it DID
//    persist a genuine new `role: "user"` message into the session's real
//    message history (verified via `GET /session/{id}/message` after the
//    call) -- so the mechanism for "inject a new turn to keep the loop
//    going" is real, not fabricated.
//
// 3. BUT: in `opencode run`'s one-shot CLI mode, the process tears itself
//    down as soon as the ORIGINAL prompt's turn finishes, and does not wait
//    for a plugin-triggered follow-up prompt() call to actually complete a
//    new model turn. Two live tests confirmed this: the injected user
//    message was persisted, but no corresponding assistant reply ever
//    appeared in the session's message history -- even after an explicit
//    15-second `await` inside the hook intended to give the follow-up turn
//    time to finish before the hook (and process) returned. A "result"
//    object the `prompt()` call resolved with looked superficially like a
//    completed turn, but on inspection it was actually the PRIOR
//    (already-completed) assistant message, not a new one -- i.e. the
//    resolved value is not reliable evidence of a completed follow-up turn.
//
// Practical conclusion: the pieces exist (a Stop-like event, a callable
// "send another prompt" API), but this sandbox could not confirm they
// compose into an actual working loop within `opencode run`'s one-shot
// process lifecycle. It's plausible this works differently in OpenCode's
// long-lived TUI or `serve` mode (where the server process outlives any
// single CLI invocation), but that was not tested here -- driving OpenCode's
// interactive TUI is outside what this sandbox can automate. Confirming or
// refuting that is future work, not something to guess at.

import { readFileSync, existsSync } from 'node:fs';

const DEFAULT_MAX_ITERATIONS = 50;
const DEFAULT_STALL_THRESHOLD = 3;

// Direct, faithful port of stop-loop.mjs's exported evaluate() -- same
// signature, same decision/reason shape, same caps (iteration count,
// wall-clock budget, stall detection), same verifyCommand gating semantics.
// See the canonical hook for the full rationale on each check.
export function evaluate(config, lastText = '', iterationCount = 0, extra = {}) {
  if (!config || config.enabled !== true) return { decision: 'stop', reason: 'loop disabled' };
  const promise = config.completionPromise || '';
  if (!promise) return { decision: 'stop', reason: 'no completion promise configured' };
  if (lastText.includes(promise)) {
    if (!config.verifyCommand || extra.verifyPassed === true) {
      return { decision: 'stop', reason: 'completion promise met' };
    }
  }
  const max = config.maxIterations || DEFAULT_MAX_ITERATIONS;
  if (iterationCount >= max) {
    return { decision: 'stop', reason: `max iterations reached (${iterationCount}/${max})` };
  }

  if (
    typeof config.maxWallClockMinutes === 'number' &&
    config.maxWallClockMinutes > 0 &&
    typeof extra.elapsedMinutes === 'number' &&
    extra.elapsedMinutes >= config.maxWallClockMinutes
  ) {
    return {
      decision: 'stop',
      reason: `wall-clock budget reached (${extra.elapsedMinutes.toFixed(1)}/${config.maxWallClockMinutes} min)`,
    };
  }

  const stallThreshold = config.stallThreshold === 0 ? 0 : config.stallThreshold || DEFAULT_STALL_THRESHOLD;
  if (
    stallThreshold > 0 &&
    Array.isArray(extra.recentToolSignatures) &&
    extra.recentToolSignatures.length >= stallThreshold
  ) {
    const window = extra.recentToolSignatures.slice(-stallThreshold);
    if (window.every((sig) => sig === window[0])) {
      return {
        decision: 'stop',
        reason: `no progress detected — the same tool call repeated ${stallThreshold}x in a row`,
      };
    }
  }

  return { decision: 'continue', reason: null };
}

// Direct port of stop-loop.mjs's extractAssistantText -- handles both the
// plain-string and content-block-array assistant message shapes.
export function extractAssistantText(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter((block) => block?.type === 'text')
      .map((block) => block.text || '')
      .join('');
  }
  return '';
}

// Loads .wingman/loop.json the same way the canonical hook does -- exported
// so a future, confirmed wiring can reuse it without re-deriving the same
// "missing/corrupt file = null config" fallback.
export function loadLoopConfig(loopPath) {
  if (!existsSync(loopPath)) return null;
  try {
    return JSON.parse(readFileSync(loopPath, 'utf-8'));
  } catch {
    return null;
  }
}

// No plugin export in this file, deliberately -- see header comment. If a
// future investigation confirms `client.session.prompt()` genuinely
// completes a follow-up turn (e.g. inside OpenCode's long-lived `serve`
// process rather than one-shot `opencode run`), wire `evaluate()` above to
// an `event()` handler on `session.idle`, using `loadLoopConfig()` for the
// config and `extractAssistantText()` on the session's last assistant
// message for `lastText`.
