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
// Pure logic in evaluate() is unit-tested; the CLI reads the loop config and
// the session transcript to decide whether to continue or stop.

import { readFileSync, existsSync, writeFileSync } from 'node:fs';
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
  // Promise already satisfied in the latest assistant message → done.
  if (lastText.includes(promise)) return 'stop';
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
  if (existsSync(counterPath)) {
    try {
      const stored = JSON.parse(readFileSync(counterPath, 'utf-8'));
      iterationCount = stored.count || 0;
      startedAt = stored.startedAt || Date.now();
    } catch { iterationCount = 0; }
  }
  let input = {};
  try { input = JSON.parse(readStdin()); } catch { input = {}; }
  const transcriptPath = input?.transcript_path || '';
  const lastText = readLastAssistant(transcriptPath);
  const stallThreshold = config?.stallThreshold === 0 ? 0 : (config?.stallThreshold || DEFAULT_STALL_THRESHOLD);
  const recentToolSignatures = stallThreshold > 0 ? readRecentToolSignatures(transcriptPath, stallThreshold) : [];
  const elapsedMinutes = (Date.now() - startedAt) / 60000;
  const decision = evaluate(config, lastText, iterationCount, { elapsedMinutes, recentToolSignatures });
  if (decision === 'continue') {
    const newCount = iterationCount + 1;
    try { writeFileSync(counterPath, JSON.stringify({ count: newCount, startedAt })); } catch { /* best-effort */ }
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
