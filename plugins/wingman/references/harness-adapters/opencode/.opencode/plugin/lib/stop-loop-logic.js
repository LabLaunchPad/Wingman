// Pure stop-loop ("ralph-loop") logic, ported byte-for-byte (evaluate/extractAssistantText) or
// newly written to read OpenCode's own message shape (loadLoopConfig/extractLoopSignals) from
// plugins/wingman/hooks/stop-loop.mjs.
//
// WHY THIS FILE LIVES UNDER lib/, NOT DIRECTLY IN .opencode/plugin/ (a real, costly finding,
// 2026-07-25): OpenCode's plugin loader auto-discovers every top-level `*.js` file directly under
// `.opencode/plugin/` and invokes EVERY named export of each one as if it were its own plugin
// factory, `await someExport(pluginContext)` -- already documented in output-scanners.js's and
// session-monitor.js's header comments for the case where a named export ISN'T a function (crashes
// immediately, "Plugin export is not a function"). This file hit a SHARPER version of the same
// footgun: every export here IS a function, so that check passes, but calling `loadLoopConfig`
// with the loader's plugin-context object (not a real file path) returned `null` -- a perfectly
// valid, intentional return value for its real contract ("missing or corrupt loop.json" -- see its
// own tests), but when the loader treats that `null` as a registered plugin's hook object and later
// tries to read `.config`/`.event` off of it, the WHOLE SERVER breaks: every session-create and
// prompt call started failing with `"plugin config hook failed" ... "null is not an object
// (evaluating 'N.config')"`, confirmed live via `opencode serve` (v1.18.5) -- POST /session/{id}/
// message returned a bare `UnknownError` for every request once this file was dropped in unmodified
// at the top level. Wrapping loadLoopConfig's body in try/catch (to stop it from throwing on a bad
// argument) did NOT fix this -- a function that returns `null` cleanly is just as fatal to the
// loader as one that throws, since `null.config` crashes either way.
//
// The confirmed-safe fix, consistent with the "nested lib/ directories are not auto-discovered"
// finding already recorded in output-scanners.js's header comment (1a): moving these pure functions
// here, one level down, removes them from the loader's auto-discovery scan entirely. The sibling
// `../stop-loop.js` imports what it needs from here and exports ONLY the plugin factory
// (`StopLoopPlugin`, `default`) at the top level -- both of which are confirmed to return a proper
// hooks object (`{ event: fn }`), never null, when called with a real plugin context, so re-adding
// them to the discovered file's export surface is safe. Live-tested: after this move, the exact
// same `opencode serve` session-create + message flow that previously failed with the plugin-load
// crash above completed cleanly (see ../../SESSION-LIFECYCLE-FINDINGS.md for the full before/after).

import { readFileSync, existsSync } from 'node:fs';

export const DEFAULT_MAX_ITERATIONS = 50;
export const DEFAULT_STALL_THRESHOLD = 3;

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

// Loads .wingman/loop.json the same way the canonical hook does. Returns null for a missing file, a
// corrupt file, OR a non-string path -- that last case matters only if this were ever called from
// the auto-discovered plugin file directly (see this file's own header comment for why it no longer
// is); kept defensive anyway since a null-safe contract costs nothing here.
export function loadLoopConfig(loopPath) {
  try {
    if (typeof loopPath !== 'string' || !existsSync(loopPath)) return null;
    return JSON.parse(readFileSync(loopPath, 'utf-8'));
  } catch {
    return null;
  }
}

// New pure helper (not in the canonical hook, which reads a JSONL transcript file instead): given
// the array OpenCode's `GET /session/{id}/message` (or the SDK's `client.session.messages()`)
// returns -- each entry shaped `{ info, parts }` -- finds the last assistant message's id and text,
// and the last `stallThreshold` tool-call signatures across the whole history (oldest-first),
// mirroring the canonical hook's readLastAssistant/readRecentToolSignatures but reading OpenCode's
// real message/part shape instead of a Claude Code JSONL transcript.
export function extractLoopSignals(messageList, stallThreshold) {
  let lastAssistantId = null;
  let lastAssistantText = '';
  const toolSignatures = [];

  for (const entry of Array.isArray(messageList) ? messageList : []) {
    const info = entry?.info || {};
    const parts = Array.isArray(entry?.parts) ? entry.parts : [];
    if (info.role === 'assistant') {
      const text = parts
        .filter((p) => p?.type === 'text')
        .map((p) => p.text || '')
        .join('');
      if (text) {
        lastAssistantId = info.id || lastAssistantId;
        lastAssistantText = text;
      }
      for (const part of parts) {
        if (part?.type === 'tool') {
          toolSignatures.push(`${part.tool}:${JSON.stringify(part.state?.input ?? {})}`);
        }
      }
    }
  }

  return {
    lastAssistantId,
    lastAssistantText,
    recentToolSignatures: stallThreshold > 0 ? toolSignatures.slice(-stallThreshold) : [],
  };
}
