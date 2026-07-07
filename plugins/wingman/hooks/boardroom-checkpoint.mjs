#!/usr/bin/env node
// PermissionRequest hook, matched on ExitPlanMode (see hooks.json).
//
// This is a deterministic backstop, not the checkpoint mechanism itself.
// The actual plain-language translation happens earlier, when /wingman:plan
// runs /wingman:boardroom and the founder approves via AskUserQuestion.
// /wingman:boardroom then appends a "## Wingman Boardroom Checkpoint" marker
// to the plan file recording that decision. This hook just refuses to let
// Claude exit plan mode if that marker is missing or says the founder didn't
// approve — so a founder never sees a raw plan/diff in place of a checkpoint,
// even if some code path forgets to run the boardroom first.
//
// Pattern adapted from gsd-plugin's secure-phase gate (blocks phase
// advancement while threats_open > 0) and gstack's plan-ceo-review "EXIT
// PLAN MODE GATE" (verifies the plan file ends with a required report
// section before allowing ExitPlanMode). See ATTRIBUTIONS.md.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const MARKER = '## Wingman Boardroom Checkpoint';

function readStdin() {
  try {
    return readFileSync(0, 'utf-8');
  } catch {
    return '';
  }
}

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

function allow() {
  console.log(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PermissionRequest', decision: { behavior: 'allow' } },
  }));
  process.exit(0);
}

function deny(reason) {
  console.error(reason);
  process.exit(2);
}

let input;
try {
  input = JSON.parse(readStdin());
} catch {
  // Malformed input from the harness is not this plugin's problem to fail
  // closed on — let the normal permission flow continue.
  process.exit(0);
}

if (input.tool_name !== 'ExitPlanMode') process.exit(0);

let planText = input.tool_input?.plan;
if (!planText) {
  const cwd = input.cwd || process.cwd();
  const planFile = findMostRecentPlanFile(cwd);
  if (planFile) {
    try {
      planText = readFileSync(planFile, 'utf-8');
    } catch {
      planText = '';
    }
  }
}

if (!planText) {
  // No plan content to check (e.g. a trivial plan-mode exit outside
  // /wingman:plan's flow entirely). Don't block work Wingman never touched.
  allow();
}

if (!planText.includes(MARKER)) {
  deny(
    `Wingman: this plan hasn't been through a Boardroom checkpoint yet.\n` +
    `Run /wingman:boardroom before exiting plan mode, so the founder gets a ` +
    `plain-language go/no-go summary instead of a raw plan document.`
  );
}

if (/Bottom line:\s*DO NOT SHIP/i.test(planText)) {
  deny(
    `Wingman: the Boardroom's last checkpoint on this plan was "DO NOT SHIP". ` +
    `Address the concerns and re-run /wingman:boardroom before exiting plan mode.`
  );
}

allow();
