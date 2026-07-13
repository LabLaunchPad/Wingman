#!/usr/bin/env node

/**
 * Wingman Session Health Monitor
 *
 * PostToolUse hook (fires on most tool calls). Tracks per-session tool call
 * count and injects health warnings when context may be getting long.
 *
 * Adapted from wshobson/agents session-guard pattern:
 *   - YELLOW warning at 40+ tool calls (context may be getting long)
 *   - RED warning at 60+ tool calls (context compaction risk)
 *
 * Writes health signals to .wingman/session-health.json so downstream
 * hooks, boardroom checkpoints, and ship commands can read them.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const YELLOW_THRESHOLD = 40;
const RED_THRESHOLD = 60;

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

function loadHealth(healthPath) {
  try {
    if (existsSync(healthPath)) {
      return JSON.parse(readFileSync(healthPath, "utf-8"));
    }
  } catch {
    // Corrupted file — start fresh
  }
  return {
    sessionId: null,
    toolCallCount: 0,
    warnings: [],
    redWarningCount: 0,
    yellowWarningCount: 0,
    lastUpdated: null,
  };
}

function saveHealth(healthPath, health) {
  ensureDir(join(healthPath, ".."));
  writeFileSync(healthPath, JSON.stringify(health, null, 2));
}

// --- Main ---

let input;
try {
  input = JSON.parse(readStdin());
} catch {
  process.exit(0);
}

// Skip this hook's own tool invocations to avoid infinite recursion,
// and skip lightweight tools that don't meaningfully consume context.
const toolName = input.tool_name || "";
if (SKIP_TOOLS.has(toolName)) process.exit(0);

const cwd = input.cwd || process.cwd();
const healthPath = join(cwd, ".wingman", "session-health.json");
const health = loadHealth(healthPath);

// Generate a stable session ID from the first call's timestamp if absent.
if (!health.sessionId) {
  health.sessionId = `session-${Date.now()}`;
}

health.toolCallCount += 1;
health.lastUpdated = new Date().toISOString();

const count = health.toolCallCount;
let warning = null;

if (count >= RED_THRESHOLD) {
  warning = {
    level: "RED",
    message:
      `Session health RED: ${count} tool calls in this session. ` +
      `Context compaction risk is high. Consider starting a fresh ` +
      `session or asking the user to compact context.`,
    timestamp: new Date().toISOString(),
  };
  health.redWarningCount += 1;
  health.warnings.push(warning);
} else if (count >= YELLOW_THRESHOLD) {
  warning = {
    level: "YELLOW",
    message:
      `Session health YELLOW: ${count} tool calls in this session. ` +
      `Context may be getting long. Watch for degraded performance.`,
    timestamp: new Date().toISOString(),
  };
  health.yellowWarningCount += 1;
  health.warnings.push(warning);
}

saveHealth(healthPath, health);

// Inject a hook-specific output message so Claude sees the warning inline.
if (warning) {
  const emoji = warning.level === "RED" ? "🔴" : "🟡";
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        message: `${emoji} Wingman Session Health [${warning.level}]: ${warning.message}`,
      },
    })
  );
}

process.exit(0);
