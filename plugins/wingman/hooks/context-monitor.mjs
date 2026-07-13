#!/usr/bin/env node

/**
 * Wingman Context Window Monitor
 *
 * PostToolUse hook. Monitors context usage percentage and tracks scope
 * creep (files edited outside project scope).
 *
 * Adapted from ECC (Enterprise Cloud Code) context monitoring pattern:
 *   - Injects warnings at <=35% remaining (WARNING)
 *   - Injects warnings at <=25% remaining (CRITICAL)
 *   - Tracks scope creep via file paths in tool input
 *
 * Context percentage is estimated from the raw input payload size,
 * which approximates the context window consumed by this tool call.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const WARNING_THRESHOLD = 0.35;
const CRITICAL_THRESHOLD = 0.25;

// Rough estimation: typical context windows are ~200k tokens.
// We approximate context usage from the input payload size in bytes,
// using a conservative 4 chars per token ratio.
const ESTIMATED_CONTEXT_CHARS = 200_000 * 4;

const SKIP_TOOLS = new Set([
  "session-health.mjs",
  "context-monitor.mjs",
]);

function readStdin() {
  try {
    return readFileSync(0, "utf-8");
  } catch {
    return "";
  }
}

function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function loadMonitorState(statePath) {
  try {
    if (existsSync(statePath)) {
      return JSON.parse(readFileSync(statePath, "utf-8"));
    }
  } catch {
    // Corrupted — start fresh
  }
  return {
    sessionId: null,
    totalPayloadBytes: 0,
    callCount: 0,
    estimatedContextUsagePct: 0,
    scopeCreep: {
      filesOutsideProject: [],
      warningCount: 0,
    },
    warnings: [],
    lastUpdated: null,
  };
}

function saveMonitorState(statePath, state) {
  ensureDir(join(statePath, ".."));
  writeFileSync(statePath, JSON.stringify(state, null, 2));
}

function extractEditedPaths(toolName, toolInput) {
  const paths = [];

  if (toolName === "Edit" && toolInput.filePath) {
    paths.push(toolInput.filePath);
  } else if (toolName === "Write" && toolInput.filePath) {
    paths.push(toolInput.filePath);
  } else if (toolName === "MultiEdit" && Array.isArray(toolInput.filePath)) {
    paths.push(...toolInput.filePath);
  }

  return paths;
}

function isInsideProject(filePath, projectRoot) {
  const normalizedRoot = projectRoot.replace(/\\/g, "/").replace(/\/$/, "");
  const normalizedPath = filePath.replace(/\\/g, "/");

  return (
    normalizedPath.startsWith(normalizedRoot + "/") ||
    normalizedPath === normalizedRoot
  );
}

// --- Main ---

let input;
try {
  input = JSON.parse(readStdin());
} catch {
  process.exit(0);
}

const toolName = input.tool_name || "";
if (SKIP_TOOLS.has(toolName)) process.exit(0);

const cwd = input.cwd || process.cwd();
const statePath = join(cwd, ".wingman", "context-monitor.json");
const state = loadMonitorState(statePath);

if (!state.sessionId) {
  state.sessionId = `session-${Date.now()}`;
}

// Track payload size for context estimation
const rawInput = JSON.stringify(input.tool_input || {});
state.totalPayloadBytes += Buffer.byteLength(rawInput, "utf-8");
state.callCount += 1;

const estimatedUsagePct = Math.min(
  1,
  state.totalPayloadBytes / ESTIMATED_CONTEXT_CHARS
);
state.estimatedContextUsagePct = Math.round(estimatedUsagePct * 100) / 100;
state.lastUpdated = new Date().toISOString();

// --- Scope creep tracking ---
const editedPaths = extractEditedPaths(toolName, input.tool_input || {});
for (const filePath of editedPaths) {
  if (!isInsideProject(filePath, cwd)) {
    const alreadyTracked = state.scopeCreep.filesOutsideProject.some(
      (f) => f.path === filePath
    );
    if (!alreadyTracked) {
      state.scopeCreep.filesOutsideProject.push({
        path: filePath,
        firstSeen: new Date().toISOString(),
      });
      state.scopeCreep.warningCount += 1;
    }
  }
}

// --- Context warnings ---
const remainingPct = 1 - estimatedUsagePct;
let warning = null;

if (remainingPct <= CRITICAL_THRESHOLD) {
  warning = {
    level: "CRITICAL",
    message:
      `Context window CRITICAL: ~${Math.round(remainingPct * 100)}% remaining. ` +
      `Urgently consider compacting context or starting a new session.`,
    timestamp: new Date().toISOString(),
  };
  state.warnings.push(warning);
} else if (remainingPct <= WARNING_THRESHOLD) {
  warning = {
    level: "WARNING",
    message:
      `Context window WARNING: ~${Math.round(remainingPct * 100)}% remaining. ` +
      `Context is getting low. Plan to compact soon.`,
    timestamp: new Date().toISOString(),
  };
  state.warnings.push(warning);
}

// --- Scope creep warning ---
let scopeWarning = null;
if (state.scopeCreep.filesOutsideProject.length > 0) {
  scopeWarning = {
    level: "SCOPE_CREEP",
    message:
      `Scope creep detected: ${state.scopeCreep.filesOutsideProject.length} ` +
      `file(s) edited outside project root (${cwd}): ` +
      state.scopeCreep.filesOutsideProject.map((f) => f.path).join(", "),
    timestamp: new Date().toISOString(),
  };
}

saveMonitorState(statePath, state);

// Inject output so Claude sees the warnings inline
const messages = [];
if (warning) {
  const icon = warning.level === "CRITICAL" ? "🚨" : "⚠️";
  messages.push(
    `${icon} Wingman Context Monitor [${warning.level}]: ${warning.message}`
  );
}
if (scopeWarning) {
  messages.push(`📁 Wingman Scope Creep: ${scopeWarning.message}`);
}

if (messages.length > 0) {
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        message: messages.join("\n"),
      },
    })
  );
}

process.exit(0);
