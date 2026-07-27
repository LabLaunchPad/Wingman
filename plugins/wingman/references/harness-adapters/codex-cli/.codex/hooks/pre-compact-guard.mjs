#!/usr/bin/env node
// Codex CLI port of plugins/wingman/hooks/pre-compact-guard.mjs -- PreCompact.
// Warn-only: when a real compaction is about to happen and the working tree
// has uncommitted, non-.wingman/ changes, reminds the agent that compaction
// is about to discard the reasoning behind them (the files are safe -- git
// already has them -- but the "why" only lives in the about-to-be-compacted
// conversation).
//
// Verification status: schema-confirmed, not yet against a live Codex CLI
// install. A follow-up fetch of https://learn.chatgpt.com/docs/hooks
// (2026-07-25) confirmed `PreCompact` is a real, documented Codex CLI hook
// event -- resolved from an earlier "no confirmed analog" state:
//   - Matcher values: `manual`, `auto` -- the same pair Claude Code itself
//     uses. Registered here with no matcher, firing on both, matching the
//     canonical hook's own registration.
//   - Input fields documented: `trigger`, `turn_id`, `session_id` -- notably,
//     `cwd` is NOT in this documented list (unlike SessionStart/PreToolUse/
//     PostToolUse, which do list `cwd`). This is a genuine, disclosed gap:
//     the canonical hook needs a working directory to run `git status
//     --porcelain` and to find `.wingman/state.json`. This port falls back
//     to `process.cwd()` when `input.cwd` is absent (kept as a defensive
//     read in case a future doc revision or an undocumented real field adds
//     it), the same fallback pattern the canonical hook already uses for
//     its own `input.cwd || process.cwd()` line -- not a new risk, but worth
//     flagging that the confirmed field list gives no assurance `cwd`
//     arrives at all here, unlike the other hooks in this directory.
//   - Output fields: `continue`, `stopReason`, `systemMessage` -- this port
//     writes its warning to `systemMessage`. Field name confirmed; exact
//     nesting not independently re-verified against a live install, same
//     caveat as this directory's other new ports.
//
// countRelevantChanges() is a byte-for-byte port of the canonical hook's own
// exported pure function -- unit-tested independently of git/fs here too.

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Counts real, relevant uncommitted changes from `git status --porcelain`
// output, excluding .wingman/ itself (routine Wingman bookkeeping, not real
// founder-project work at risk of losing context).
export function countRelevantChanges(porcelainOutput = '') {
  return porcelainOutput
    .split('\n')
    .filter((l) => l.trim().length > 0)
    .filter((l) => !l.slice(3).startsWith('.wingman/')).length;
}

function readStdin() {
  try {
    return readFileSync(0, 'utf-8');
  } catch {
    return '';
  }
}

function loadJson(filePath) {
  try {
    if (existsSync(filePath)) return JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch {
    // Corrupted or unreadable -- treat as absent, not fatal.
  }
  return null;
}

function main() {
  let input;
  try {
    input = JSON.parse(readStdin());
  } catch {
    process.stdout.write(JSON.stringify({ continue: true }));
    return;
  }

  const cwd = input?.cwd || process.cwd();
  const wingmanDir = join(cwd, '.wingman');

  if (!existsSync(wingmanDir)) {
    process.stdout.write(JSON.stringify({ continue: true })); // not a Wingman-managed project
    return;
  }

  const state = loadJson(join(wingmanDir, 'state.json'));
  const currentStage = state?.current_stage || state?.pipelineStage || null;

  let gitStatus = '';
  try {
    gitStatus = execSync('git status --porcelain', { cwd, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    process.stdout.write(JSON.stringify({ continue: true })); // not a git repo, or git unavailable
    return;
  }

  const uncommittedCount = countRelevantChanges(gitStatus);

  if (uncommittedCount > 0) {
    const stageNote = currentStage ? ` (currently at the "${currentStage}" stage)` : '';
    process.stdout.write(JSON.stringify({
      systemMessage:
        `Wingman Pre-Compact Guard (Codex CLI port): ${uncommittedCount} uncommitted change(s) in the ` +
        `working tree${stageNote}. Compaction is about to discard the reasoning behind them from context ` +
        `-- the files themselves are safe (git already has them), but consider committing or noting ` +
        `progress now if a future session will need the "why," not just the diff.`,
    }));
    return;
  }
  process.stdout.write(JSON.stringify({ continue: true }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
