// Shared "pending warnings" queue, read by warning-relay.js and written by output-scanners.js and
// session-monitor.js. New in this pass (2026-07-25) -- closes the gap both those files' own header
// comments disclosed ("no confirmed way to inject a warning back into the model's own context").
//
// Lives under lib/ (not auto-discovered by OpenCode's plugin loader -- see stop-loop.js's own header
// comment for the confirmed reason a pure-logic module must not sit directly under .opencode/plugin/
// if any of its functions could plausibly be invoked with a bogus single argument and return
// something falsy/null; `drainWarnings` here always returns an array, never null, so it would
// likely be safe even if discovered, but there's no reason to take the risk once a known-safe
// pattern (lib/ subfolder) already exists in this same adapter).
//
// State file: `.wingman/pending-warnings.json`, a plain JSON array of strings. `pushWarning` appends
// (best-effort, matching the rest of this adapter's warn-only philosophy); `drainWarnings` reads AND
// clears the file in one call, so each warning surfaces to the model exactly once (on the next real
// turn), not on every subsequent turn forever.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

function queuePath(cwd) {
  return join(cwd, '.wingman', 'pending-warnings.json');
}

export function pushWarning(cwd, message) {
  const path = queuePath(cwd);
  let queue = [];
  try {
    if (existsSync(path)) queue = JSON.parse(readFileSync(path, 'utf-8'));
    if (!Array.isArray(queue)) queue = [];
  } catch {
    queue = [];
  }
  queue.push(message);
  try {
    mkdirSync(join(path, '..'), { recursive: true });
    writeFileSync(path, JSON.stringify(queue));
  } catch {
    // best-effort — never let queuing a warning break the tool call that produced it
  }
}

export function drainWarnings(cwd) {
  const path = queuePath(cwd);
  let queue = [];
  try {
    if (existsSync(path)) queue = JSON.parse(readFileSync(path, 'utf-8'));
    if (!Array.isArray(queue)) queue = [];
  } catch {
    queue = [];
  }
  if (queue.length > 0) {
    try {
      writeFileSync(path, JSON.stringify([]));
    } catch {
      // best-effort — if the clear fails, the same warnings may resurface next turn; harmless
      // duplication, not a correctness bug, given these are advisory-only messages.
    }
  }
  return queue;
}
