#!/usr/bin/env node
// PreToolUse hook, matched on ExitPlanMode (see hooks.json).
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
// The checkpoint can be recorded in two places: the plan file on disk (where
// /wingman:boardroom writes it) and/or the inline `plan` text ExitPlanMode
// carries. Neither is guaranteed to echo the other, so the gate checks BOTH
// and treats each as a self-contained checkpoint record — it opens only if
// one of them is a fully approved "ship it" checkpoint, and denies otherwise.
// (Checking only the inline text, as an earlier version did, falsely denied a
// legitimate checkpoint that /wingman:boardroom had appended to the file.)
//
// A single source can also contain MORE THAN ONE checkpoint marker over the
// plan file's life -- plan.md's amendment mode (v8) appends new, unreviewed
// content to the end of an already-approved plan, leaving the earlier
// "ship it" checkpoint physically present but no longer current. Only the
// LAST marker in each source is evaluated (an earlier version scanned the
// whole source, so a stale approval anywhere in the file's history could
// wrongly clear an unreviewed amendment -- found and fixed via the
// drift.md eval's real hook test, not by inspection alone).
//
// Pattern adapted from gsd-plugin's secure-phase gate (blocks phase
// advancement while threats_open > 0) and gstack's plan-ceo-review "EXIT
// PLAN MODE GATE" (verifies required plan sections exist in the plan file
// before allowing ExitPlanMode). See ATTRIBUTIONS.md.

// Gstack's required plan sections for the "EXIT PLAN MODE GATE" validation
// From gstack's plan-ceo-review and plan-eng-review etc.
const REQUIRED_PLAN_SECTIONS = [
  // Executive summary section
  '## Executive Summary',
  // Current state analysis
  '## Current State',
  // Problem statement
  '## Problem Statement',
  // Solution approach
  '## Solution Approach',
  // Success criteria
  '## Success Criteria',
  // Timeline/budget
  '## Timeline',
  // Risk assessment
  '## Risks'
];

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
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'allow' },
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
  // This script is only ever invoked for ExitPlanMode (see hooks.json's
  // matcher), so malformed stdin here is anomalous, not routine traffic from
  // unrelated tool calls. Fail closed, matching the "deterministic backstop"
  // intent above — a gate that quietly opens on unexpected input isn't one.
  deny(
    `Wingman: couldn't read the tool-call input to check for a Boardroom ` +
    `checkpoint. Re-run /wingman:boardroom and try exiting plan mode again.`
  );
}

if (input.tool_name !== 'ExitPlanMode') process.exit(0);

// A checkpoint could live in either the inline plan text or the plan file (see
// header). Gather every place one could have been recorded and evaluate each
// independently — the marker, the "DO NOT SHIP" bottom line, and the founder's
// decision are written together as one unit, so a source is only a valid
// checkpoint if all three agree within that same source.
const sources = [];
const inlinePlan = input.tool_input?.plan;
if (inlinePlan) sources.push(inlinePlan);
const cwd = input.cwd || process.cwd();
const planFile = findMostRecentPlanFile(cwd);
if (planFile) {
  try {
    sources.push(readFileSync(planFile, 'utf-8'));
  } catch {
    // Unreadable plan file — just fall back to whatever other source exists.
  }
}

if (sources.length === 0) {
  // No plan content to check (e.g. a trivial plan-mode exit outside
  // /wingman:plan's flow entirely). Don't block work Wingman never touched.
  allow();
}

// A plan file can accumulate more than one checkpoint marker over its life
// -- plan.md's amendment mode (v8) appends new, unreviewed content to the
// *end* of an already-approved plan, on top of an earlier "ship it"
// checkpoint. That earlier checkpoint is still physically present, but it
// no longer covers the file's current content, because the amendment text
// that follows it was never reviewed. A checkpoint only counts as CURRENT
// if nothing but its own 3 fields (Bottom line / Founder decision /
// Timestamp) follows the marker -- i.e. it's genuinely the last thing in
// the file, not just the last *marker*. (Before amendment mode existed, a
// plan file only ever had one checkpoint section, always at the true end,
// so this distinction never mattered -- it does now. Found and fixed via
// the drift.md eval's real hook test, not by inspection alone: an earlier
// version of this fix only looked at the last marker's fields without
// checking whether trailing content followed it, and still wrongly allowed
// exit on an unreviewed amendment.)
function latestCheckpointStatus(text) {
  const idx = text.lastIndexOf(MARKER);
  if (idx === -1) return null;
  const region = text.slice(idx);
  const block = region.match(
    /^## Wingman Boardroom Checkpoint[ \t]*\r?\n(?:.*\r?\n)*?Timestamp:[^\r\n]*\r?\n?/
  );
  // No recognizable Timestamp line means this isn't a well-formed, complete
  // checkpoint block -- don't trust it as current either way.
  const current = !!block && region.slice(block[0].length).trim().length === 0;
  return { region, current };
}

const markedSources = sources.filter((t) => t.includes(MARKER));
// Pair each source with its own checkpoint status so isApprovedCheckpoint can
// judge a source's CURRENT-ness and its required-sections completeness
// together, without losing which text a given status came from.
const entries = sources
  .map((text) => ({ text, status: latestCheckpointStatus(text) }))
  .filter((e) => e.status);
const currentEntries = entries.filter((e) => e.status.current);
const currentStatuses = currentEntries.map((e) => e.status);

// The founder's own decision, not just the Boardroom's bottom line, is the
// actual gate per plan.md ("only once the boardroom checkpoint returns a
// 'ship it' decision"). A GO / GO WITH CHANGES bottom line with no real
// "ship it" yet (e.g. "still reviewing", used when AskUserQuestion couldn't
// be reached in-turn -- see boardroom.md) must still block exit, so a valid
// checkpoint requires: CURRENT (see above -- genuinely the last thing in its
// source, not superseded by an unreviewed amendment), no "DO NOT SHIP" bottom
// line, an explicit "ship it" founder decision, and (gstack's "EXIT PLAN MODE
// GATE") a complete plan. Only an *approved* source is held to the
// required-sections bar -- a bare plan text without the marker is simply "not
// approved", not "missing sections", so a short inline summary can never
// over-block a file-based checkpoint that has them.
function isApprovedCheckpoint(text, status) {
  if (!status || !status.current) return false;
  if (/Bottom line:\s*DO NOT SHIP/i.test(status.region)) return false;
  const m = status.region.match(/Founder decision:\s*(.+)/i);
  if (!(m && /^ship it\b/i.test(m[1].trim()))) return false;
  const missing = REQUIRED_PLAN_SECTIONS.filter((s) => !text.includes(s));
  if (missing.length > 0) return false;
  return true;
}

// Global veto: an explicit, CURRENT "DO NOT SHIP" in any source blocks exit,
// even if another (possibly stale) source looks approved. An explicit
// rejection is the strongest signal there is, and the gate must fail safe on
// it rather than let a leftover "ship it" elsewhere override it. Scoped to
// CURRENT checkpoints only, so a plan that was rejected once, fixed, and
// later re-approved via a fresh checkpoint isn't vetoed forever by its own
// history.
if (currentStatuses.some((s) => /Bottom line:\s*DO NOT SHIP/i.test(s.region))) {
  deny(
    `Wingman: the Boardroom's last checkpoint on this plan was "DO NOT SHIP". ` +
    `Address the concerns and re-run /wingman:boardroom before exiting plan mode.`
  );
}

// Open only if some source is CURRENT and a fully approved "ship it"
// checkpoint that also satisfies gstack's required-sections gate. Each
// source is judged on its own (per the header contract: the gate opens if
// ONE source is a valid approved checkpoint), so a short inline summary
// without sections cannot veto a file-based checkpoint that has them.
if (currentEntries.some((e) => isApprovedCheckpoint(e.text, e.status))) allow();

// Not approved. Three distinct reasons, each with its own message:
if (markedSources.length === 0) {
  // A bare unmarked plan means the boardroom never ran at all.
  deny(
    `Wingman: this plan hasn't been through a Boardroom checkpoint yet.\n` +
    `Run /wingman:boardroom before exiting plan mode, so the founder gets a ` +
    `plain-language go/no-go summary instead of a raw plan document.`
  );
}

if (currentEntries.length === 0) {
  // Every checkpoint found is stale -- real content (e.g. a drift.md
  // amendment) was appended after the last checkpoint ran, so no existing
  // approval covers what's in the file now.
  deny(
    `Wingman: this plan has changed since its last Boardroom checkpoint ` +
    `(new content was added after the checkpoint marker). Re-run ` +
    `/wingman:boardroom on the new content before exiting plan mode.`
  );
}

// A current checkpoint exists but isn't a valid approval: either the founder
// hasn't said "ship it" yet, or an approved-looking plan is missing required
// sections.
const missing = [
  ...new Set(
    currentEntries.flatMap((e) =>
      REQUIRED_PLAN_SECTIONS.filter((s) => !e.text.includes(s))
    )
  ),
];
const decisionMatch = currentEntries
  .map((e) => e.status.region.match(/Founder decision:\s*(.+)/i))
  .find(Boolean);
if (missing.length > 0) {
  deny(
    `Wingman: the Boardroom-approved plan is missing required sections: ${missing.join(', ')}. ` +
    `A complete plan must include all required sections before exiting plan mode.`
  );
}
deny(
  `Wingman: the founder hasn't actually approved this plan yet ` +
  `(recorded decision: "${decisionMatch ? decisionMatch[1].trim() : 'none found'}"). ` +
  `Get an explicit "ship it" via /wingman:boardroom before exiting plan mode.`
);
