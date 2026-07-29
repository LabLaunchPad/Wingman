#!/usr/bin/env node

/**
 * Wingman Session Start Hook
 *
 * Initializes .wingman/state.json if it doesn't exist.
 * Loads previous session state from .wingman/session-state.json if present
 * and injects a session summary into the hook output for learning purposes.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { unify } from "../scripts/query-founder-knowledge.mjs";

const WINGMAN_DIR = join(process.cwd(), ".wingman");
const statePath = join(WINGMAN_DIR, "state.json");
const sessionStatePath = join(WINGMAN_DIR, "session-state.json");

const defaultState = {
  pipelineStage: null,
  departmentLeads: [],
  activeSpecialists: [],
  lastCheckpoint: null,
  sessionStarted: new Date().toISOString(),
};

const defaultSessionState = {
  sessionCount: 0,
  lastSessionId: null,
  lastSessionEnded: null,
  totalToolCalls: 0,
  sessions: [],
};

function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function loadJson(path, fallback) {
  try {
    if (existsSync(path)) {
      return JSON.parse(readFileSync(path, "utf-8"));
    }
  } catch {
    // Corrupted or unreadable — use fallback
  }
  return fallback;
}

// --- Ensure .wingman directory exists ---
ensureDir(WINGMAN_DIR);

// --- Initialize state.json if missing ---
try {
  if (!existsSync(statePath)) {
    writeFileSync(statePath, JSON.stringify(defaultState, null, 2));
    console.log("Wingman: Initialized .wingman/state.json");
  }
} catch (error) {
  console.error("Wingman: Could not initialize state:", error.message);
}

// --- Load previous session state ---
const sessionState = loadJson(sessionStatePath, defaultSessionState);
const previousSessionCount = sessionState.sessionCount || 0;
const newSessionId = `session-${Date.now()}`;

// Build a summary of what happened in the previous session
let previousSummary = null;
if (previousSessionCount > 0 && sessionState.sessions.length > 0) {
  const last = sessionState.sessions[sessionState.sessions.length - 1];
  previousSummary = {
    sessionId: last.sessionId,
    endedAt: last.endedAt,
    toolCalls: last.toolCalls || 0,
    warnings: last.warnings || 0,
  };
}

// Update session state with the new session
const updatedSessionState = {
  sessionCount: previousSessionCount + 1,
  lastSessionId: newSessionId,
  lastSessionEnded: null,
  totalToolCalls: (sessionState.totalToolCalls || 0),
  sessions: [
    ...(sessionState.sessions || []),
    {
      sessionId: newSessionId,
      startedAt: new Date().toISOString(),
      endedAt: null,
      toolCalls: 0,
      warnings: 0,
    },
  ],
};

// Keep only the last 20 sessions to avoid unbounded growth
if (updatedSessionState.sessions.length > 20) {
  updatedSessionState.sessions = updatedSessionState.sessions.slice(-20);
}

try {
  writeFileSync(sessionStatePath, JSON.stringify(updatedSessionState, null, 2));
} catch (error) {
  console.error("Wingman: Could not write session state:", error.message);
}

// --- Memory read-back: mechanize skills/memory's operating rule 4 ---
//
// skills/memory/SKILL.md rule 4 says "On SessionStart, surface a one-line recall of the most
// relevant memory" -- until now that was instruction-only, with no hook enforcing it, which
// references/constitution.md rule 9 disclosed plainly rather than implying recall was automatic.
// This closes the standing "write-verified, not read-loop-verified" watch item
// (docs/status/PROJECT.md) for the one thing a hook actually can check every session: whether
// anything is in the store at all, and what the most recent entries say.
//
// Reuses query-founder-knowledge.mjs's unify() rather than re-parsing .wingman/memory/*.md here
// -- the exact duplication references/constitution.md rule 3 forbids.
function memoryRecall(cwd) {
  let entries;
  try {
    entries = unify(cwd);
  } catch {
    return null; // never let a malformed store block session start
  }
  const memoryAndDecisions = entries.filter((e) => e.source === "memory" || e.source === "decisions");
  if (memoryAndDecisions.length === 0) return null;
  const last = memoryAndDecisions[memoryAndDecisions.length - 1];
  return last.text;
}

// --- Inject session summary into hook output ---
const lines = [];
lines.push(`Wingman session #${updatedSessionState.sessionCount} started.`);

if (previousSummary) {
  lines.push(
    `Previous session (${previousSummary.sessionId}) had ` +
    `${previousSummary.toolCalls} tool call(s)` +
    (previousSummary.warnings > 0
      ? ` and ${previousSummary.warnings} warning(s)`
      : "") +
    `, ended ${previousSummary.endedAt || "unknown"}.`
  );
}

const recall = memoryRecall(process.cwd());
if (recall) {
  lines.push(`Recall: ${recall}`);
}

console.log(lines.join(" "));
process.exit(0);
