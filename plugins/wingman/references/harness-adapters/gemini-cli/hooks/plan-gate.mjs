#!/usr/bin/env node
// Disclosed substitute for Claude Code's ExitPlanMode + boardroom-checkpoint.mjs gate, wired as a
// Gemini CLI `BeforeAgent` hook command. Genuinely new logic (not a port) -- see
// docs/status/ARCHITECTURE.md §8f and gemini-cli.mjs's ExitPlanMode note for why Gemini CLI has no
// discrete, interceptable "plan approved" transition event the way ExitPlanMode does (exiting Plan
// mode auto-escalates straight to YOLO mode, bypassing further tool-approval gating entirely).
//
// Because there's no confirmed discrete mode-switch event to hook, this runs the same check
// boardroom-checkpoint.mjs runs (MARKER/REQUIRED_PLAN_SECTIONS/"ship it" text in the most recent
// plan file) on every BeforeAgent turn instead of on one specific transition -- a coarser proxy,
// disclosed as such, not an equivalent gate. It only blocks when a plan file exists AND looks
// unapproved; a project with no plan file at all (not using Wingman's pipeline) is never blocked.
//
// Verification status: authored, unverified -- no live Gemini CLI account exists in this sandbox to
// confirm BeforeAgent actually fires per-turn or that a non-zero exit here actually blocks the
// agent's turn the way it blocks a tool call. This is the one genuinely novel piece of hook logic
// in this adapter (every other primitive here is a port); see
// evals/cases/plan-gate-mode-switch-intercept.md for its own eval case.
//
// dod-pre-push-check.mjs (wired via install-git-hooks.mjs) is the second, independent backstop this
// gate's own weakness makes necessary -- it fires on `git push` regardless of which agent drove the
// session, so an unapproved plan that slips past this hook still can't reach a real push.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const MARKER = '## Wingman Boardroom Checkpoint';
const REQUIRED_PLAN_SECTIONS = [
  '## Executive Summary',
  '## Current State',
  '## Problem Statement',
  '## Solution Approach',
  '## Success Criteria',
  '## Timeline',
  '## Risks',
];

function findMostRecentPlanFile(cwd) {
  const plansDir = join(cwd, 'docs', 'wingman', 'plans');
  try {
    const files = readdirSync(plansDir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => join(plansDir, f));
    if (files.length === 0) return null;
    files.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
    return files[0];
  } catch {
    return null;
  }
}

function isApprovedCheckpoint(text) {
  if (!text.includes(MARKER)) return false;
  if (/Bottom line:\s*DO NOT SHIP/i.test(text)) return false;
  const m = text.match(/Founder decision:\s*(.+)/i);
  if (!(m && /^ship it\b/i.test(m[1].trim()))) return false;
  const missing = REQUIRED_PLAN_SECTIONS.filter((s) => !text.includes(s));
  return missing.length === 0;
}

const cwd = process.cwd();
const planFile = findMostRecentPlanFile(cwd);
if (!planFile) process.exit(0); // no plan file at all -- not a Wingman pipeline run, don't block

let text;
try {
  text = readFileSync(planFile, 'utf-8');
} catch {
  process.exit(0); // unreadable plan file -- fail open, never block on a read error
}

if (!text.includes(MARKER)) process.exit(0); // Boardroom never ran on this plan yet -- that's this
// hook's own upstream concern (run /wingman:boardroom), not something to block every agent turn on.

if (isApprovedCheckpoint(text)) process.exit(0);

console.error(
  `Wingman: the most recent plan (${planFile}) has a Boardroom checkpoint marker but it isn't a ` +
  `fully approved "ship it" checkpoint yet. Gemini CLI has no equivalent of Claude Code's ` +
  `ExitPlanMode gate, so this is a best-effort per-turn check, not a guarantee -- ` +
  `dod-pre-push-check.mjs still blocks the actual \`git push\` regardless.`
);
process.exit(1);
