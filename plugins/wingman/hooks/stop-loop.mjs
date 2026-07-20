#!/usr/bin/env node
// Stop hook (event: Stop) — fills gap G2.
//
// Implements a safe, OPT-IN autonomous loop ("ralph-loop" pattern): when the
// founder explicitly enables it in .wingman/loop.json, Wingman keeps working
// toward a stated completion promise instead of stopping and waiting after
// every step. Disabled by default, so the agent never loops unless asked.
//
// Boardroom-reviewed enhancement (2026-07-19, CTO/CISO/CFO all GO_WITH_CONCERNS,
// converging on the same fix): a bare iteration cap bounds *step count*, not
// cost or forward progress — an agent stuck retrying an identical failing
// action can still burn every iteration of budget with nothing to show for
// it. Two checks close that gap: an optional wall-clock budget
// (`maxWallClockMinutes`) and stall detection (the last few tool calls being
// identical, in the same order, with no new tool in between). Both are
// additive to the existing default-on iteration cap; neither is required —
// an unset `maxWallClockMinutes` simply skips that check, same as today.
//
// Verified-completion gate (2026-07-19, dedicated CISO review, deliberately
// deferred from the enhancement above): a bare `lastText.includes(promise)`
// check trusts the agent's own free-text claim that it's done, with nothing
// confirming the work actually happened. Optional `verifyCommand` in
// `.wingman/loop.json` (e.g. "npm test") closes that: when set, a text-match
// alone is no longer enough — the loop only stops once the command ALSO
// exits 0. Running a founder-configured command here is no new class of risk
// (dod-structural-gate.mjs's runTestSuite already shells out to a detected
// test command at push time), but firing on every Stop event instead of once
// per push is a materially larger surface for one specific exploitation
// path: a prompt-injected turn rewriting `loop.json` mid-session, then
// triggering its own re-execution on the very next Stop event, repeatedly.
// The CISO-recommended mitigation this hook implements: cache
// `verifyCommand` once, at loop start (into loop-counter.json), and never
// re-read it from loop.json for the rest of that loop's run — a mid-loop
// rewrite of `verifyCommand` has no effect until the next fresh loop start.
// This narrows, but does not claim to close, the gap: nothing here can
// distinguish a founder-written loop.json from an agent-written one.
//
// Pure logic in evaluate() is unit-tested; the CLI reads the loop config and
// the session transcript to decide whether to continue or stop.

import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import nodePath from 'node:path';

const DEFAULT_MAX_ITERATIONS = 50;
const DEFAULT_STALL_THRESHOLD = 3; // N identical, consecutive tool calls in a row = stuck, not just repeating a valid retry once

// Returns 'continue' (block the stop, keep going) or 'stop' (let it end).
// `extra` carries the two Boardroom-recommended checks; both are optional and
// backward-compatible — omitting them (as every pre-existing caller does)
// preserves the original iteration-cap-only behavior exactly.
export function evaluate(config, lastText = '', iterationCount = 0, extra = {}) {
  if (!config || config.enabled !== true) return 'stop';
  const promise = config.completionPromise || '';
  if (!promise) return 'stop';
  // Promise already satisfied in the latest assistant message → done, UNLESS a
  // verifyCommand is configured — in that case a text claim alone isn't
  // enough; extra.verifyPassed must also be true (the CLI runs the cached
  // command and reports the result here; this function stays pure). If no
  // verifyCommand is configured, extra.verifyPassed is simply never checked —
  // identical to pre-verifyCommand behavior.
  if (lastText.includes(promise)) {
    if (!config.verifyCommand || extra.verifyPassed === true) return 'stop';
    // Claimed done but not (yet) verified — fall through to the same caps
    // below, so an agent that keeps claiming victory without passing
    // verification is still bounded by iterations/budget/stall, not allowed
    // to loop forever either.
  }
  const max = config.maxIterations || DEFAULT_MAX_ITERATIONS;
  if (iterationCount >= max) return 'stop';

  // Wall-clock budget (CFO/CISO): a step-count cap is a loose proxy for
  // cost — a founder who raises maxIterations, or whose iterations are each
  // a large multi-file task, has no ceiling on real spend without this.
  if (typeof config.maxWallClockMinutes === 'number' && config.maxWallClockMinutes > 0
      && typeof extra.elapsedMinutes === 'number' && extra.elapsedMinutes >= config.maxWallClockMinutes) {
    return 'stop';
  }

  // Stall detection (CTO/CISO): a text-match completion check alone lets a
  // loop run to full iteration count while repeating the same failing action
  // — the founder's money spent proving nothing new.
  const stallThreshold = config.stallThreshold === 0 ? 0 : (config.stallThreshold || DEFAULT_STALL_THRESHOLD);
  if (stallThreshold > 0 && Array.isArray(extra.recentToolSignatures) && extra.recentToolSignatures.length >= stallThreshold) {
    const window = extra.recentToolSignatures.slice(-stallThreshold);
    if (window.every((sig) => sig === window[0])) return 'stop';
  }

  return 'continue';
}

function readStdin() {
  try { return readFileSync(0, 'utf-8'); } catch { return ''; }
}
function readLastAssistant(transcriptPath) {
  if (!transcriptPath || !existsSync(transcriptPath)) return '';
  try {
    const raw = readFileSync(transcriptPath, 'utf-8');
    const lines = raw.split('\n').filter(Boolean);
    let last = '';
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry?.type === 'assistant' && typeof entry.message?.content === 'string') {
          last = entry.message.content;
        }
      } catch { /* skip non-JSON lines */ }
    }
    return last;
  } catch {
    return '';
  }
}

// Extracts the most recent `limit` tool calls (name + input) from the
// transcript, oldest-first, as comparable signature strings. Assistant
// messages can carry an array of content blocks (text + tool_use) rather
// than a plain string — readLastAssistant() only handles the string shape,
// so this walks the array shape separately rather than overloading it.
function readRecentToolSignatures(transcriptPath, limit) {
  if (!transcriptPath || !existsSync(transcriptPath)) return [];
  try {
    const raw = readFileSync(transcriptPath, 'utf-8');
    const lines = raw.split('\n').filter(Boolean);
    const signatures = [];
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        const content = entry?.type === 'assistant' ? entry.message?.content : null;
        if (Array.isArray(content)) {
          for (const block of content) {
            if (block?.type === 'tool_use') {
              signatures.push(`${block.name}:${JSON.stringify(block.input ?? {})}`);
            }
          }
        }
      } catch { /* skip non-JSON lines */ }
    }
    return signatures.slice(-limit);
  } catch {
    return [];
  }
}

if (process.argv[1] && nodePath.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const cwd = process.env.PWD || process.cwd();
  const loopPath = join(cwd, '.wingman', 'loop.json');
  const counterPath = join(cwd, '.wingman', 'loop-counter.json');
  let config = null;
  if (existsSync(loopPath)) {
    try { config = JSON.parse(readFileSync(loopPath, 'utf-8')); } catch { config = null; }
  }
  let iterationCount = 0;
  let startedAt = Date.now();
  let cachedVerifyCommand; // undefined = not yet cached this loop run
  if (existsSync(counterPath)) {
    try {
      const stored = JSON.parse(readFileSync(counterPath, 'utf-8'));
      iterationCount = stored.count || 0;
      startedAt = stored.startedAt || Date.now();
      cachedVerifyCommand = stored.verifyCommand;
    } catch { iterationCount = 0; }
  }
  // Cache verifyCommand once, at loop start (CISO-reviewed mitigation — see
  // header comment): only when this is a fresh loop (no cached value yet),
  // never re-reading it off loop.json for the rest of this loop's run.
  if (cachedVerifyCommand === undefined) {
    cachedVerifyCommand = (config && typeof config.verifyCommand === 'string' && config.verifyCommand) || null;
  }
  let input = {};
  try { input = JSON.parse(readStdin()); } catch { input = {}; }
  const transcriptPath = input?.transcript_path || '';
  const lastText = readLastAssistant(transcriptPath);
  const stallThreshold = config?.stallThreshold === 0 ? 0 : (config?.stallThreshold || DEFAULT_STALL_THRESHOLD);
  const recentToolSignatures = stallThreshold > 0 ? readRecentToolSignatures(transcriptPath, stallThreshold) : [];
  const elapsedMinutes = (Date.now() - startedAt) / 60000;
  // Only actually run the (cached) verify command when it matters: the
  // promise text has been claimed and a command is configured. Running it
  // unconditionally every Stop event would be wasted cost on every
  // in-progress iteration, not just the one claiming completion.
  let verifyPassed;
  const promise = config?.completionPromise || '';
  if (cachedVerifyCommand && promise && lastText.includes(promise)) {
    try {
      execSync(cachedVerifyCommand, { cwd, stdio: 'pipe', timeout: 120000 });
      verifyPassed = true;
    } catch {
      verifyPassed = false;
      console.error(
        `Wingman stop-loop: completion promise found, but verifyCommand ("${cachedVerifyCommand}") ` +
        `did not pass — continuing instead of stopping.`
      );
    }
  }
  const decision = evaluate(config, lastText, iterationCount, { elapsedMinutes, recentToolSignatures, verifyPassed });
  if (decision === 'continue') {
    const newCount = iterationCount + 1;
    try {
      writeFileSync(counterPath, JSON.stringify({ count: newCount, startedAt, verifyCommand: cachedVerifyCommand }));
    } catch { /* best-effort */ }
    const max = config?.maxIterations || DEFAULT_MAX_ITERATIONS;
    console.error(
      `Wingman stop-loop: completion promise not yet met — continuing (iteration ${newCount}/${max}). ` +
      `Disable via .wingman/loop.json to stop between steps.`
    );
    process.exit(2); // non-zero blocks the stop, driving the loop onward
  }
  // Loop ended (done, max iterations, budget exhausted, or a detected stall)
  // — say which, then reset the counter/timer for the next run.
  if (config?.enabled === true && iterationCount > 0) {
    const max = config?.maxIterations || DEFAULT_MAX_ITERATIONS;
    let reason = 'completion promise met';
    if (iterationCount >= max) reason = `max iterations reached (${iterationCount}/${max})`;
    else if (typeof config.maxWallClockMinutes === 'number' && elapsedMinutes >= config.maxWallClockMinutes) {
      reason = `wall-clock budget reached (${elapsedMinutes.toFixed(1)}/${config.maxWallClockMinutes} min)`;
    } else if (stallThreshold > 0 && recentToolSignatures.length >= stallThreshold
        && recentToolSignatures.slice(-stallThreshold).every((s) => s === recentToolSignatures[recentToolSignatures.length - 1])) {
      reason = `no progress detected — the same tool call repeated ${stallThreshold}x in a row`;
    }
    console.error(`Wingman stop-loop: stopping — ${reason}.`);
  }
  try { writeFileSync(counterPath, JSON.stringify({ count: 0, startedAt: Date.now() })); } catch { /* best-effort */ }
  process.exit(0); // stop normally
}
