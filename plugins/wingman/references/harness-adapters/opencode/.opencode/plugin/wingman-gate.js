// Wingman Boardroom-checkpoint gate, ported to an OpenCode plugin.
//
// Verification status: authored, unverified. No live OpenCode install exists in the Wingman dev
// sandbox this was built in. The DECISION LOGIC below (isApprovedCheckpoint, the marker/section/
// "ship it" checks) is a direct, faithful port of
// plugins/wingman/hooks/boardroom-checkpoint.mjs's own isApprovedCheckpoint function -- same
// MARKER text, same REQUIRED_PLAN_SECTIONS, same "DO NOT SHIP" veto, same two-source (inline +
// most-recent plan file) check. That part is high-confidence: it's plain string/regex logic with
// no OpenCode-specific dependency.
//
// The WIRING below -- the `tool.execute.before` hook shape, its argument names, and matching the
// `plan_exit` tool specifically -- is lower-confidence. It's based on public research (OpenCode's
// plugin docs describe a `tool.execute.before` hook that can throw to block a tool call; OpenCode's
// `plan_exit` tool is the documented analog to Claude Code's `ExitPlanMode` -- see this adapter's
// README for citations), not a live install. A known OpenCode bug (tracked upstream as issue #5894)
// means `tool.execute.before` does not currently intercept tool calls made by SUBAGENTS -- that's
// fine here, since `plan_exit` is called by the PRIMARY agent, not a subagent, but worth knowing if
// this hook doesn't seem to fire in a nested-agent context.
//
// If the exact hook signature below doesn't match your OpenCode version, the decision logic
// (isApprovedCheckpoint and everything above the plugin export) is the part worth keeping --
// re-wire it to whatever the real plugin API expects.

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

// Direct port of boardroom-checkpoint.mjs's isApprovedCheckpoint -- see that file for the full
// rationale (gstack's "EXIT PLAN MODE GATE" section-completeness bar, applied only to sources that
// already carry the marker, so a short inline summary can never over-block a file-based checkpoint).
function isApprovedCheckpoint(text) {
  if (!text.includes(MARKER)) return false;
  if (/Bottom line:\s*DO NOT SHIP/i.test(text)) return false;
  const m = text.match(/Founder decision:\s*(.+)/i);
  if (!(m && /^ship it\b/i.test(m[1].trim()))) return false;
  const missing = REQUIRED_PLAN_SECTIONS.filter((s) => !text.includes(s));
  if (missing.length > 0) return false;
  return true;
}

// Pure decision function, harness-agnostic: given the inline plan text (if any) and cwd, returns
// { allow: true } or { allow: false, reason }. Exported separately from the plugin wiring so it can
// be unit-tested or re-wired without touching the OpenCode-specific glue below.
export function evaluateCheckpoint(inlinePlanText, cwd) {
  const sources = [];
  if (inlinePlanText) sources.push(inlinePlanText);
  const planFile = findMostRecentPlanFile(cwd);
  if (planFile) {
    try {
      sources.push(readFileSync(planFile, 'utf-8'));
    } catch {
      // Unreadable plan file -- fall back to whatever other source exists.
    }
  }

  if (sources.length === 0) {
    return { allow: true }; // Nothing Wingman touched -- don't block unrelated work.
  }

  const markedSources = sources.filter((t) => t.includes(MARKER));

  if (markedSources.some((t) => /Bottom line:\s*DO NOT SHIP/i.test(t))) {
    return {
      allow: false,
      reason: 'Wingman: the Boardroom\'s last checkpoint on this plan was "DO NOT SHIP". ' +
        'Address the concerns and re-run the Boardroom review before exiting plan mode.',
    };
  }

  if (sources.some(isApprovedCheckpoint)) return { allow: true };

  if (markedSources.length === 0) {
    return {
      allow: false,
      reason: 'Wingman: this plan hasn\'t been through a Boardroom checkpoint yet. ' +
        'Run the Boardroom review before exiting plan mode, so the founder gets a ' +
        'plain-language go/no-go summary instead of a raw plan document.',
    };
  }

  return {
    allow: false,
    reason: 'Wingman: a Boardroom checkpoint exists but isn\'t a fully approved "ship it" ' +
      'decision (missing sections, or the founder hasn\'t said "ship it" yet). Re-run the ' +
      'Boardroom review and get an explicit approval before exiting plan mode.',
  };
}

// OpenCode plugin export. Shape per https://opencode.ai/docs/config/ and public plugin-development
// references (a plugin module exports an async function receiving the app context, returning a
// hooks object). Updated 2026-07-23: this file's registration is now confirmed against a real, live
// OpenCode install (v1.18.4) -- `opencode debug config`'s resolved output lists this exact file
// under its top-level `plugin` array, confirming the export shape loaded without error. The
// `tool.execute.before` hook name and `plan_exit` as the matched tool name are both independently
// confirmed against real sources (not just this project's own research): `tool.execute.before` is
// a documented OpenCode plugin hook, and `plan_exit` is referenced as a real tool name in a live
// OpenCode GitHub issue (anomalyco/opencode#18515, "subagents can trigger plan_exit"). What remains
// unverified: this hook actually firing end-to-end during a real plan-mode session -- that needs a
// configured model provider/API key, which this sandbox does not have, so the throw-on-reject path
// has never been observed live, only confirmed to be registered and syntactically/structurally sound.
export const WingmanGatePlugin = async ({ directory }) => {
  return {
    'tool.execute.before': async (input, output) => {
      if (input.tool !== 'plan_exit') return;
      const cwd = directory || process.cwd();
      const inlinePlanText = output?.args?.plan ?? output?.plan ?? null;
      const result = evaluateCheckpoint(inlinePlanText, cwd);
      if (!result.allow) {
        throw new Error(result.reason);
      }
    },
  };
};

export default WingmanGatePlugin;
