#!/usr/bin/env node
// Codex CLI port of plugins/wingman/hooks/session-health.mjs -- PostToolUse.
// Tracks a per-project tool-call count and injects a YELLOW/RED warning as it
// climbs, the same two thresholds (40/60) as the canonical hook.
//
// Verification status: schema-confirmed, not yet against a live Codex CLI
// install. Wired PostToolUse with no matcher (fires on every tool call,
// confirmed matcher set is the same as PreToolUse's per
// learn.chatgpt.com/docs/hooks, fetched 2026-07-25) -- this hook only needs
// `tool_name` (to skip its own recursive invocation) and `cwd`, both
// documented PostToolUse input fields, so it needed no field-name
// translation from the canonical hook.
//
// One genuine, disclosed unknown: the canonical hook emits its warning via
// `{ hookSpecificOutput: { hookEventName: "PostToolUse", message: "..." } }`
// -- a Claude-Code-specific envelope. Codex's documented PostToolUse output
// fields are `decision`, `continue`, `additionalContext`, `systemMessage` --
// no field literally named `message`. This port writes `systemMessage`
// instead, the closest documented analog, but that specific field mapping
// was not independently re-confirmed beyond the field NAME existing in the
// docs (see prompt-guard.mjs's port in this directory for the same caveat
// pattern) -- verify the warning actually surfaces to the agent on a real
// install before relying on it silently; state is written to
// .wingman/session-health.json regardless, so the tracking itself is not at
// risk even if the surfaced-message plumbing turns out wrong.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import nodePath from 'node:path';

const YELLOW_THRESHOLD = 40;
const RED_THRESHOLD = 60;

const SKIP_TOOLS = new Set([
  'session-health.mjs',
  'context-monitor.mjs',
]);

function readStdin() {
  try {
    return readFileSync(0, 'utf-8');
  } catch {
    return '';
  }
}

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function loadHealth(healthPath) {
  try {
    if (existsSync(healthPath)) return JSON.parse(readFileSync(healthPath, 'utf-8'));
  } catch {
    // Corrupted file -- start fresh
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
  ensureDir(join(healthPath, '..'));
  writeFileSync(healthPath, JSON.stringify(health, null, 2));
}

// Pure: given the current call count, returns the warning object (or null)
// -- identical decision logic to the canonical hook, extracted here so it's
// independently unit-testable without touching the filesystem.
export function computeWarning(count) {
  if (count >= RED_THRESHOLD) {
    return {
      level: 'RED',
      message:
        `Session health RED: ${count} tool calls in this session. ` +
        `Context compaction risk is high. Consider starting a fresh session or asking the ` +
        `user to compact context.`,
    };
  }
  if (count >= YELLOW_THRESHOLD) {
    return {
      level: 'YELLOW',
      message:
        `Session health YELLOW: ${count} tool calls in this session. ` +
        `Context may be getting long. Watch for degraded performance.`,
    };
  }
  return null;
}

function main() {
  let input;
  try {
    input = JSON.parse(readStdin());
  } catch {
    process.exit(0);
  }

  const toolName = input?.tool_name || '';
  if (SKIP_TOOLS.has(toolName)) process.exit(0);

  const cwd = input?.cwd || process.cwd();
  const healthPath = join(cwd, '.wingman', 'session-health.json');
  const health = loadHealth(healthPath);

  if (!health.sessionId) health.sessionId = `session-${Date.now()}`;

  health.toolCallCount += 1;
  health.lastUpdated = new Date().toISOString();

  const warning = computeWarning(health.toolCallCount);
  if (warning) {
    if (warning.level === 'RED') health.redWarningCount += 1;
    else health.yellowWarningCount += 1;
    health.warnings.push({ ...warning, timestamp: new Date().toISOString() });
  }

  saveHealth(healthPath, health);

  if (warning) {
    const emoji = warning.level === 'RED' ? '\u{1F534}' : '\u{1F7E1}';
    process.stdout.write(JSON.stringify({
      systemMessage: `${emoji} Wingman Session Health [${warning.level}]: ${warning.message}`,
    }));
  } else {
    process.stdout.write(JSON.stringify({ continue: true }));
  }
  process.exit(0);
}

if (process.argv[1] && nodePath.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
