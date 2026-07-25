#!/usr/bin/env node
// Codex CLI port of plugins/wingman/hooks/stop-loop.mjs -- Stop. Opt-in
// autonomous loop ("ralph-loop" pattern): when a founder explicitly enables
// it in .wingman/loop.json, keeps working toward a stated completion promise
// instead of stopping after every turn. Disabled by default.
//
// Verification status: schema-confirmed, not yet against a live Codex CLI
// install. A follow-up fetch of https://learn.chatgpt.com/docs/hooks
// (2026-07-25) confirmed `Stop` is a real, documented Codex CLI hook event
// -- resolved from an earlier "no confirmed analog" state (compare
// ../../opencode/SESSION-LIFECYCLE-FINDINGS.md's honest "UNCLEAR" verdict
// for the same hook's OpenCode port, reached after real live testing found
// no working equivalent there; Codex's case is different -- a real,
// documented event exists here, just not live-tested):
//   - Matcher: not supported (ignored if configured), matching Claude Code's
//     own unmatched Stop registration.
//   - Input fields documented: `turn_id`, `stop_hook_active`,
//     `last_assistant_message`. Output fields: `continue`, `decision`,
//     `reason`.
//
// TWO genuine, disclosed gaps this port does NOT paper over, both because
// Codex's documented Stop input is narrower than Claude Code's:
//
//   1. No `transcript_path` field is documented for Stop (unlike Claude
//      Code, which hands the hook a transcript file to parse). Codex instead
//      hands the last assistant message directly as `last_assistant_message`
//      -- actually a more convenient shape for the completion-promise check
//      (no JSONL parsing needed), but it means this port has no way to
//      inspect the RECENT TOOL CALL HISTORY. `evaluate()`'s stall-detection
//      check (repeating the same tool call N times in a row) is ported
//      byte-faithfully below and remains independently unit-testable, but
//      the CLI wiring at the bottom of this file cannot populate
//      `recentToolSignatures` from anything real -- it is always passed as
//      an empty array, which means stall detection is a documented no-op
//      until a real tool-call-history field is found for this event. This is
//      a real capability gap, not an oversight.
//   2. No `cwd` field is documented for Stop either (unlike SessionStart/
//      PreToolUse/PostToolUse/PreCompact, all of which do list one, PreCompact
//      partially). This port falls back to `process.cwd()` unconditionally.
//
// The wall-clock budget and verified-completion (`verifyCommand`) checks
// port over cleanly -- both only need a local counter file
// (.wingman/loop-counter.json) and the clock, neither of which depends on
// the transcript.
//
// evaluate() is a byte-for-byte copy of the canonical hook's own exported
// pure function.

import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import nodePath from 'node:path';

const DEFAULT_MAX_ITERATIONS = 50;
const DEFAULT_STALL_THRESHOLD = 3;

// Returns { decision, reason }. decision is 'continue' (block the stop, keep
// going) or 'stop' (let it end). Identical logic/signature to the canonical
// hook's own evaluate() -- see plugins/wingman/hooks/stop-loop.mjs for the
// full reasoning behind each check.
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

  if (typeof config.maxWallClockMinutes === 'number' && config.maxWallClockMinutes > 0
      && typeof extra.elapsedMinutes === 'number' && extra.elapsedMinutes >= config.maxWallClockMinutes) {
    return {
      decision: 'stop',
      reason: `wall-clock budget reached (${extra.elapsedMinutes.toFixed(1)}/${config.maxWallClockMinutes} min)`,
    };
  }

  const stallThreshold = config.stallThreshold === 0 ? 0 : (config.stallThreshold || DEFAULT_STALL_THRESHOLD);
  if (stallThreshold > 0 && Array.isArray(extra.recentToolSignatures) && extra.recentToolSignatures.length >= stallThreshold) {
    const window = extra.recentToolSignatures.slice(-stallThreshold);
    if (window.every((sig) => sig === window[0])) {
      return { decision: 'stop', reason: `no progress detected — the same tool call repeated ${stallThreshold}x in a row` };
    }
  }

  return { decision: 'continue', reason: null };
}

function readStdin() {
  try {
    return readFileSync(0, 'utf-8');
  } catch {
    return '';
  }
}

function main() {
  const cwd = process.cwd(); // no cwd field documented for Stop -- see header
  const loopPath = join(cwd, '.wingman', 'loop.json');
  const counterPath = join(cwd, '.wingman', 'loop-counter.json');

  let config = null;
  if (existsSync(loopPath)) {
    try { config = JSON.parse(readFileSync(loopPath, 'utf-8')); } catch { config = null; }
  }

  let iterationCount = 0;
  let startedAt = Date.now();
  let cachedVerifyCommand;
  if (existsSync(counterPath)) {
    try {
      const stored = JSON.parse(readFileSync(counterPath, 'utf-8'));
      iterationCount = stored.count || 0;
      startedAt = stored.startedAt || Date.now();
      cachedVerifyCommand = stored.verifyCommand;
    } catch { iterationCount = 0; }
  }
  if (cachedVerifyCommand === undefined) {
    cachedVerifyCommand = (config && typeof config.verifyCommand === 'string' && config.verifyCommand) || null;
  }

  let input = {};
  try { input = JSON.parse(readStdin()); } catch { input = {}; }
  // last_assistant_message is the confirmed Codex Stop input field -- unlike
  // the canonical hook, no transcript parsing is needed to get this text.
  const lastText = String(input?.last_assistant_message || '');
  // No documented tool-call-history field for Stop -- stall detection is a
  // documented no-op here (see header gap #1). Kept as an empty array rather
  // than omitted, so evaluate()'s stallThreshold branch runs the same code
  // path it always does, just never triggers.
  const recentToolSignatures = [];
  const elapsedMinutes = (Date.now() - startedAt) / 60000;

  let verifyPassed;
  const promise = config?.completionPromise || '';
  if (cachedVerifyCommand && promise && lastText.includes(promise)) {
    try {
      execSync(cachedVerifyCommand, { cwd, stdio: 'pipe', timeout: 120000 });
      verifyPassed = true;
    } catch {
      verifyPassed = false;
      process.stderr.write(
        `Wingman stop-loop (Codex CLI port): completion promise found, but verifyCommand ` +
        `("${cachedVerifyCommand}") did not pass — continuing instead of stopping.\n`
      );
    }
  }

  const { decision, reason: stopReason } = evaluate(config, lastText, iterationCount, { elapsedMinutes, recentToolSignatures, verifyPassed });

  if (decision === 'continue') {
    const newCount = iterationCount + 1;
    try {
      writeFileSync(counterPath, JSON.stringify({ count: newCount, startedAt, verifyCommand: cachedVerifyCommand }));
    } catch { /* best-effort */ }
    const max = config?.maxIterations || DEFAULT_MAX_ITERATIONS;
    const reason =
      `Wingman stop-loop: completion promise not yet met — continuing (iteration ${newCount}/${max}). ` +
      `Disable via .wingman/loop.json to stop between turns.`;
    // Documented Stop output fields are decision/continue/reason -- write
    // the JSON shape those field names imply. Also exit non-zero as a
    // defensive hedge in case Codex additionally honors Claude Code's own
    // exit-code convention (process.exit(2) blocks the stop there) -- this
    // dual signal is a disclosed hedge, not a second confirmed mechanism.
    process.stdout.write(JSON.stringify({ decision: 'block', reason, continue: true }));
    process.exit(2);
  }

  if (config?.enabled === true && iterationCount > 0) {
    process.stderr.write(`Wingman stop-loop: stopping — ${stopReason || 'completion promise met'}.\n`);
  }
  try { writeFileSync(counterPath, JSON.stringify({ count: 0, startedAt: Date.now() })); } catch { /* best-effort */ }
  process.stdout.write(JSON.stringify({ continue: false }));
}

if (process.argv[1] && nodePath.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
