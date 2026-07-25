// Wingman Session Start Hook, ported to an OpenCode plugin -- the same
// .wingman/state.json init + rolling session-log behavior the shipped Claude
// Code plugin runs on SessionStart (plugins/wingman/hooks/session-start.mjs).
//
// Verification status (2026-07-25, real live investigation, not assumed):
//
// 1. `buildSessionUpdate()` below is a direct, faithful port of the canonical
//    hook's inline session-state update logic (previous-session summary +
//    rolling last-20-sessions log), extracted into a standalone pure function
//    so it can be unit-tested independently of file I/O -- covered by
//    tests/opencode-gate/opencode-session-lifecycle.test.mjs.
//
// 2. The WIRING -- OpenCode's `config(cfg)` plugin hook -- is CONFIRMED to
//    fire exactly once per `opencode run` process invocation, via a real
//    live test with a genuinely free OpenCode model
//    (`opencode/deepseek-v4-flash-free`, zero cost, zero API key). Two
//    distinct, real observations from that test:
//      a. `config()` fires on every single `opencode run` invocation --
//         confirmed for both a brand-new session and a `--continue`d one
//         (`session.created` -- the bus event a naive port might reach for
//         instead -- only fires for the brand-new case, NOT on `--continue`;
//         `config()` is the more universal signal of the two).
//      b. `console.log`/`console.error` calls made from inside `config()`
//         are genuinely printed to the real terminal, appearing BEFORE the
//         CLI's own `> build · <model>` banner -- confirmed by a live A/B
//         run with a marker string, not assumed from docs. This is a real,
//         visible analog to Claude Code's SessionStart hook printing a
//         previous-session summary the founder actually sees.
//   Honest caveat: `opencode run` is one-shot -- each invocation is its own
//   process, so there is no distinct "resume this long-lived session"
//   lifecycle event to test separately the way Claude Code's SessionStart
//   fires on both "startup" and "resume" within one long session. What IS
//   confirmed is that `config()` fires reliably once per process bootstrap,
//   which is the closest real equivalent available in this harness and CLI
//   mode -- not a claim that OpenCode's interactive TUI mode behaves
//   identically (untested here; no interactive TUI session was driven).

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const defaultState = () => ({
  pipelineStage: null,
  departmentLeads: [],
  activeSpecialists: [],
  lastCheckpoint: null,
  sessionStarted: new Date().toISOString(),
});

const defaultSessionState = () => ({
  sessionCount: 0,
  lastSessionId: null,
  lastSessionEnded: null,
  totalToolCalls: 0,
  sessions: [],
});

// Pure logic, direct port of session-start.mjs's inline update -- given the
// previously-persisted session-state object and a fresh session id, returns
// the new session-state object plus a summary of the previous session (or
// null if there wasn't one). Exported separately from the file I/O below so
// it can be unit-tested without touching disk.
export function buildSessionUpdate(sessionState, newSessionId, nowIso = new Date().toISOString()) {
  const previousSessionCount = sessionState.sessionCount || 0;

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

  const updatedSessionState = {
    sessionCount: previousSessionCount + 1,
    lastSessionId: newSessionId,
    lastSessionEnded: null,
    totalToolCalls: sessionState.totalToolCalls || 0,
    sessions: [
      ...(sessionState.sessions || []),
      {
        sessionId: newSessionId,
        startedAt: nowIso,
        endedAt: null,
        toolCalls: 0,
        warnings: 0,
      },
    ],
  };

  if (updatedSessionState.sessions.length > 20) {
    updatedSessionState.sessions = updatedSessionState.sessions.slice(-20);
  }

  return { updatedSessionState, previousSummary };
}

function loadJson(filePath, fallback) {
  try {
    if (existsSync(filePath)) return JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch {
    // Corrupted or unreadable -- use fallback
  }
  return fallback;
}

export const SessionStartPlugin = async ({ directory }) => {
  const cwd = directory || process.cwd();
  const wingmanDir = join(cwd, '.wingman');
  const statePath = join(wingmanDir, 'state.json');
  const sessionStatePath = join(wingmanDir, 'session-state.json');

  return {
    config: async () => {
      try {
        if (!existsSync(wingmanDir)) mkdirSync(wingmanDir, { recursive: true });

        if (!existsSync(statePath)) {
          writeFileSync(statePath, JSON.stringify(defaultState(), null, 2));
          console.log('Wingman: Initialized .wingman/state.json');
        }

        const sessionState = loadJson(sessionStatePath, defaultSessionState());
        const newSessionId = `session-${Date.now()}`;
        const { updatedSessionState, previousSummary } = buildSessionUpdate(sessionState, newSessionId);

        writeFileSync(sessionStatePath, JSON.stringify(updatedSessionState, null, 2));

        const lines = [`Wingman session #${updatedSessionState.sessionCount} started.`];
        if (previousSummary) {
          lines.push(
            `Previous session (${previousSummary.sessionId}) had ` +
              `${previousSummary.toolCalls} tool call(s)` +
              (previousSummary.warnings > 0 ? ` and ${previousSummary.warnings} warning(s)` : '') +
              `, ended ${previousSummary.endedAt || 'unknown'}.`
          );
        }
        console.log(lines.join(' '));
      } catch (error) {
        console.error('Wingman: session-start hook failed:', error && error.message);
      }
    },
  };
};

export default SessionStartPlugin;
