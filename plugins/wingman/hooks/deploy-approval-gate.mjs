#!/usr/bin/env node
// PreToolUse hook (matcher: Bash) — enforces references/permission-model.md's Level 3/4 boundary:
// deploy-class actions require Boardroom approval, not just an agent asking for them.
//
// Deliberately NOT identity-based. Every Wingman hook, and an independent second plugin's hooks,
// were checked directly during a red-team pass (2026-07-27): all read only cwd/tool_name/
// tool_input/session_id from their payload -- no Claude Code hook exposes which agent is acting.
// docs/status/ARCHITECTURE.md §4 already disclosed this as an accepted limit; this hook closes the part
// of it that's actually closable -- not "is this specific agent allowed to deploy" (unanswerable),
// but "has this project's Boardroom actually approved a deploy-class action right now" (answerable,
// from real state that already exists).
//
// Reuses dod-structural-gate.mjs's own checkBoardroomVerdictClean() and findLatestBuildCheckpoint()
// rather than re-deriving the same logic -- one definition of "clean Boardroom verdict," shared by
// both gates. Fails open on an absent/unparseable checkpoint log, exactly like that hook, so a
// project not using Wingman's pipeline (or one that hasn't reached Build yet) is never blocked.
//
// Pure logic in decide() is unit-tested; the CLI below just adapts stdin/stdout.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { findLatestBuildCheckpoint, checkBoardroomVerdictClean } from './dod-structural-gate.mjs';

// Deploy-class command patterns. Deliberately narrow and named, matching secret-guard.mjs's own
// DESTRUCTIVE/SECRET list discipline -- a floor, not a ceiling; broadenable as real gaps surface,
// not an attempt at exhaustive coverage of every possible deploy tool on day one.
const DEPLOY_CLASS = [
  /\bkubectl\s+apply\b/i,
  /\bterraform\s+apply\b/i,
  /\bnpm\s+publish\b/i,
  /\bpnpm\s+publish\b/i,
  /\byarn\s+publish\b/i,
  /git\s+push\s+(\S+\s+){0,3}?(--force|-f)\b.*\b(main|master|prod|production)\b/i,
  /git\s+push\s+(\S+\s+){0,3}?\b(main|master|prod|production)\b.*(--force|-f)\b/i,
];

export function decide(toolName, toolInput = {}, cwd) {
  if (toolName !== 'Bash') return { decision: 'allow' };
  const command = String(toolInput.command || '');
  if (!DEPLOY_CLASS.some((re) => re.test(command))) return { decision: 'allow' };

  const checkpoint = findLatestBuildCheckpoint(cwd);
  if (!checkpoint) {
    // No Build-stage checkpoint exists yet -- this isn't a Wingman-piloted project, or Build
    // hasn't run. Allow, per the same "never block ordinary usage outside the pipeline" rule
    // dod-structural-gate.mjs already follows.
    return { decision: 'allow' };
  }

  const verdict = checkBoardroomVerdictClean(checkpoint);
  if (!verdict.ok) {
    return {
      decision: 'deny',
      reason:
        `Wingman deploy-approval-gate: this looks like a deploy-class command, and the most recent ` +
        `Build-stage Boardroom checkpoint was not a clean approval (${verdict.reason}). Get a clean ` +
        `Boardroom GO before deploying — or run this yourself outside the agent if you're certain.`,
    };
  }
  return { decision: 'allow' };
}

function readStdin() {
  try { return readFileSync(0, 'utf-8'); } catch { return ''; }
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

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let input;
  try {
    input = JSON.parse(readStdin());
  } catch {
    allow(); // malformed input — don't block on a parse error
  }
  const result = decide(input?.tool_name, input?.tool_input || {}, input?.cwd || process.cwd());
  if (result.decision === 'deny') deny(result.reason);
  allow();
}
