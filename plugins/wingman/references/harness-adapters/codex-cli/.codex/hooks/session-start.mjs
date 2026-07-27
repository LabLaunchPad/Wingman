#!/usr/bin/env node
// Codex CLI port of plugins/wingman/hooks/session-start.mjs -- SessionStart.
// Initializes .wingman/state.json on first run and injects a summary of the
// previous session (tool-call count, warning count) at the start of a new
// one, reading/writing a rolling .wingman/session-state.json log (last 20
// sessions), same as the canonical hook.
//
// Verification status: schema-confirmed, not yet against a live Codex CLI
// install. A follow-up fetch of https://learn.chatgpt.com/docs/hooks
// (2026-07-25, same research pass as this directory's other new ports)
// confirmed `SessionStart` is a real, documented Codex CLI hook event --
// this was a genuinely open question this adapter's earlier passes left
// unanswered ("no confirmed lifecycle-hook analog"), now resolved:
//   - Matcher values: `startup`, `resume`, `clear`, `compact` -- a strict
//     superset of Claude Code's own `startup`/`resume`/`clear` (Codex adds
//     `compact`, firing SessionStart again after a compaction completes,
//     which Claude Code does not do). This port registers with no matcher
//     (fires on all four), matching the canonical hook's "run on every
//     session start, don't special-case the reason" behavior.
//   - Input fields: `source`, `session_id`, `transcript_path`, `cwd`,
//     `hook_event_name`, `model`, `permission_mode` -- `cwd` is present and
//     confirmed, so this port can locate `.wingman/` the same way the
//     canonical hook does (no `process.cwd()`-only fallback needed, though
//     one is kept for safety).
//   - Output fields: `continue`, `stopReason`, `systemMessage`,
//     `suppressOutput`, `additionalContext` -- this port writes the
//     previous-session summary into `systemMessage`, the same
//     best-effort-mapping caveat as this directory's other new PostToolUse
//     ports applies here too (field NAME confirmed, exact JSON nesting for
//     a "just show me a message" SessionStart response not independently
//     re-verified against a live install or a second raw source -- the
//     fetch used was an AI-summarized pass over the page, not a raw text
//     dump).
//
// This port keeps the file-state read/write logic byte-faithful to the
// canonical hook (same default-state shapes, same 20-session cap).

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import nodePath from 'node:path';

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function loadJson(path, fallback) {
  try {
    if (existsSync(path)) return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    // Corrupted or unreadable -- use fallback
  }
  return fallback;
}

function readStdin() {
  try {
    return readFileSync(0, 'utf-8');
  } catch {
    return '';
  }
}

// Pure: given the previous rolling session-state object, returns the
// updated state plus the summary of the just-ended previous session (or
// null if there wasn't one) -- extracted here so it's independently
// unit-testable without touching the filesystem or the clock.
export function advanceSessionState(sessionState, now = Date.now()) {
  const previousSessionCount = sessionState.sessionCount || 0;
  const newSessionId = `session-${now}`;

  let previousSummary = null;
  if (previousSessionCount > 0 && sessionState.sessions && sessionState.sessions.length > 0) {
    const last = sessionState.sessions[sessionState.sessions.length - 1];
    previousSummary = {
      sessionId: last.sessionId,
      endedAt: last.endedAt,
      toolCalls: last.toolCalls || 0,
      warnings: last.warnings || 0,
    };
  }

  const updated = {
    sessionCount: previousSessionCount + 1,
    lastSessionId: newSessionId,
    lastSessionEnded: null,
    totalToolCalls: sessionState.totalToolCalls || 0,
    sessions: [
      ...(sessionState.sessions || []),
      { sessionId: newSessionId, startedAt: new Date(now).toISOString(), endedAt: null, toolCalls: 0, warnings: 0 },
    ],
  };
  if (updated.sessions.length > 20) updated.sessions = updated.sessions.slice(-20);

  return { updated, previousSummary, newSessionId };
}

export function buildSummaryMessage(updated, previousSummary) {
  const lines = [`Wingman session #${updated.sessionCount} started.`];
  if (previousSummary) {
    lines.push(
      `Previous session (${previousSummary.sessionId}) had ${previousSummary.toolCalls} tool call(s)` +
      (previousSummary.warnings > 0 ? ` and ${previousSummary.warnings} warning(s)` : '') +
      `, ended ${previousSummary.endedAt || 'unknown'}.`
    );
  }
  return lines.join(' ');
}

function main() {
  let input = {};
  try {
    input = JSON.parse(readStdin());
  } catch {
    input = {};
  }

  const cwd = input?.cwd || process.cwd();
  const wingmanDir = join(cwd, '.wingman');
  const statePath = join(wingmanDir, 'state.json');
  const sessionStatePath = join(wingmanDir, 'session-state.json');

  ensureDir(wingmanDir);

  const defaultState = {
    pipelineStage: null,
    departmentLeads: [],
    activeSpecialists: [],
    lastCheckpoint: null,
    sessionStarted: new Date().toISOString(),
  };
  let initMessage = null;
  try {
    if (!existsSync(statePath)) {
      writeFileSync(statePath, JSON.stringify(defaultState, null, 2));
      initMessage = 'Wingman: Initialized .wingman/state.json';
    }
  } catch (error) {
    initMessage = `Wingman: Could not initialize state: ${error.message}`;
  }

  const defaultSessionState = { sessionCount: 0, lastSessionId: null, lastSessionEnded: null, totalToolCalls: 0, sessions: [] };
  const sessionState = loadJson(sessionStatePath, defaultSessionState);
  const { updated, previousSummary } = advanceSessionState(sessionState);

  try {
    writeFileSync(sessionStatePath, JSON.stringify(updated, null, 2));
  } catch {
    // best-effort
  }

  const summary = buildSummaryMessage(updated, previousSummary);
  const systemMessage = initMessage ? `${initMessage} ${summary}` : summary;
  process.stdout.write(JSON.stringify({ systemMessage }));
}

if (process.argv[1] && nodePath.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
