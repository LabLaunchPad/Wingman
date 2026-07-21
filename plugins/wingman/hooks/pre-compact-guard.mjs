#!/usr/bin/env node

/**
 * Wingman Pre-Compact Guard
 *
 * PreCompact hook. Wingman's own pipeline state already lives in flat files
 * (.wingman/state.json, .wingman/checkpoints.jsonl, plan-file Boardroom
 * Checkpoint markers), not conversational memory, by design (see
 * skills/discipline/subagent-driven-development) -- so a context compaction event
 * doesn't lose Wingman's own progress the way it would for a plugin that
 * kept state in-conversation. What compaction CAN still lose is the
 * reasoning behind not-yet-committed work: real file changes exist, but the
 * "why" is only in the about-to-be-compacted conversation.
 *
 * Deliberately WARN-ONLY (exit 0), like secret-scanner.mjs: never blocks a
 * compaction, just reminds the agent to checkpoint/commit first if there's
 * real uncommitted work sitting in the working tree.
 *
 * Pure logic in countRelevantChanges() is unit-tested; the CLI below just
 * adapts stdin/git/stdout.
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Counts real, relevant uncommitted changes from `git status --porcelain`
// output, excluding .wingman/ itself: its files (state.json,
// checkpoints.jsonl) change on every normal checkpoint as part of Wingman's
// own bookkeeping -- counting them would make this warning fire on nearly
// every compaction, defeating its purpose (it should flag real
// founder-project work at risk of losing context, not Wingman's own
// routine audit-trail churn).
export function countRelevantChanges(porcelainOutput = "") {
  return porcelainOutput
    .split("\n")
    .filter((l) => l.trim().length > 0)
    .filter((l) => !l.slice(3).startsWith(".wingman/")).length;
}

function readStdin() {
  try {
    return readFileSync(0, "utf-8");
  } catch {
    return "";
  }
}

function loadJson(filePath) {
  try {
    if (existsSync(filePath)) return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    // Corrupted or unreadable -- treat as absent, not fatal.
  }
  return null;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let input;
  try {
    input = JSON.parse(readStdin());
  } catch {
    process.exit(0); // malformed input -- don't block on a parse error
  }

  const cwd = input?.cwd || process.cwd();
  const wingmanDir = join(cwd, ".wingman");

  // Not a Wingman-managed project (or Wingman hasn't initialized yet) -- nothing to guard.
  if (!existsSync(wingmanDir)) process.exit(0);

  const state = loadJson(join(wingmanDir, "state.json"));
  const currentStage = state?.current_stage || state?.pipelineStage || null;

  let gitStatus = "";
  try {
    gitStatus = execSync("git status --porcelain", { cwd, encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    process.exit(0); // not a git repo, or git unavailable -- nothing to check
  }

  const uncommittedCount = countRelevantChanges(gitStatus);

  if (uncommittedCount > 0) {
    const stageNote = currentStage ? ` (currently at the "${currentStage}" stage)` : "";
    console.log(
      `Wingman Pre-Compact Guard: ${uncommittedCount} uncommitted change(s) in the working tree${stageNote}. ` +
      `Compaction is about to discard the reasoning behind them from context -- the files themselves are safe ` +
      `(git already has them), but consider committing or noting progress now if a future session will need the ` +
      `"why," not just the diff.`
    );
  }

  process.exit(0); // warn-only: never blocks compaction
}
