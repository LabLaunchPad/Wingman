#!/usr/bin/env node
// Stop hook (event: Stop) — fills gap G2.
//
// Implements a safe, OPT-IN autonomous loop ("ralph-loop" pattern): when the
// founder explicitly enables it in .wingman/loop.json, Wingman keeps working
// toward a stated completion promise instead of stopping and waiting after
// every step. Disabled by default, so the agent never loops unless asked.
//
// Pure logic in evaluate() is unit-tested; the CLI reads the loop config and
// the session transcript to decide whether to continue or stop.

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import nodePath from 'node:path';

// Returns 'continue' (block the stop, keep going) or 'stop' (let it end).
export function evaluate(config, lastText = '') {
  if (!config || config.enabled !== true) return 'stop';
  const promise = config.completionPromise || '';
  if (!promise) return 'stop';
  // Promise already satisfied in the latest assistant message → done.
  if (lastText.includes(promise)) return 'stop';
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

if (process.argv[1] && nodePath.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const cwd = process.env.PWD || process.cwd();
  const loopPath = join(cwd, '.wingman', 'loop.json');
  let config = null;
  if (existsSync(loopPath)) {
    try { config = JSON.parse(readFileSync(loopPath, 'utf-8')); } catch { config = null; }
  }
  let input = {};
  try { input = JSON.parse(readStdin()); } catch { input = {}; }
  const lastText = readLastAssistant(input?.transcript_path || '');
  const decision = evaluate(config, lastText);
  if (decision === 'continue') {
    console.error(
      `Wingman stop-loop: completion promise not yet met — continuing. ` +
      `Disable via .wingman/loop.json to stop between steps.`
    );
    process.exit(2); // non-zero blocks the stop, driving the loop onward
  }
  process.exit(0); // stop normally
}
