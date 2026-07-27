#!/usr/bin/env node
// Codex CLI port of plugins/wingman/hooks/context-monitor.mjs -- PostToolUse.
// Estimates context-window usage from cumulative tool_input payload size
// (WARNING at <=35% remaining, CRITICAL at <=25%) and tracks scope creep
// (files edited outside the project root).
//
// Verification status: schema-confirmed, not yet against a live Codex CLI
// install. The context-percentage half needs only `tool_input` and `cwd`,
// both confirmed PostToolUse input fields (learn.chatgpt.com/docs/hooks,
// fetched 2026-07-25) -- ports over with no adaptation.
//
// The scope-creep half is the one part of this port that is a genuine,
// disclosed ADAPTATION, not a direct field-name translation: the canonical
// hook finds edited file paths via `tool_input.file_path`, a field that only
// exists for Claude Code's own Edit/Write tools. Codex CLI's confirmed
// PreToolUse/PostToolUse matcher list includes `Edit` and `Write` as valid
// matcher VALUES, but the README's own 2026-07-22 research section already
// established that regardless of which matcher value is configured, the
// emitted `tool_name` is always `apply_patch` and the patch/diff TEXT lands
// in `tool_input.command` -- there is no separate `file_path` field at all.
// To recover file paths from that, this port parses the standard apply_patch
// V4A patch-header lines OpenAI's own apply_patch tool documents ("*** Update
// File: path", "*** Add File: path", "*** Delete File: path") out of
// `tool_input.command`. This header format is a well-known, stable part of
// the apply_patch tool contract, but this specific parsing choice was NOT
// separately re-confirmed against a live install or a dedicated doc page --
// it is a reasonable inference built on the confirmed fact that apply_patch
// diff text lands in `tool_input.command`, not an independently-cited field
// mapping the way `tool_response` (secret-scanner.mjs's port) or `prompt`
// (prompt-guard.mjs's port) are. Treat scope-creep detection here as
// "should work against the documented apply_patch header format," not
// "confirmed against a real patch payload."
//
// Same systemMessage-vs-message caveat as session-health.mjs's port in this
// directory applies to the warning-surfacing half of this hook too.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import nodePath from 'node:path';

const WARNING_THRESHOLD = 0.35;
const CRITICAL_THRESHOLD = 0.25;
const ESTIMATED_CONTEXT_CHARS = 200_000 * 4;

const SKIP_TOOLS = new Set([
  'session-health.mjs',
  'context-monitor.mjs',
]);

// Standard apply_patch V4A header lines -- see module header for the
// disclosed inference this parsing rests on.
const APPLY_PATCH_FILE_HEADER = /^\*\*\*\s*(?:Update|Add|Delete)\s+File:\s*(.+)$/gm;

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

function loadMonitorState(statePath) {
  try {
    if (existsSync(statePath)) return JSON.parse(readFileSync(statePath, 'utf-8'));
  } catch {
    // Corrupted -- start fresh
  }
  return {
    sessionId: null,
    totalPayloadBytes: 0,
    callCount: 0,
    estimatedContextUsagePct: 0,
    scopeCreep: { filesOutsideProject: [], warningCount: 0 },
    warnings: [],
    lastUpdated: null,
  };
}

function saveMonitorState(statePath, state) {
  ensureDir(join(statePath, '..'));
  writeFileSync(statePath, JSON.stringify(state, null, 2));
}

// Extracts candidate edited file paths from a tool call. Handles both the
// direct Claude-Code-shaped `file_path` field (kept for portability, in case
// a future Codex tool ever reports one directly) and the apply_patch header
// parse described in the module comment above.
export function extractEditedPaths(toolName, toolInput = {}) {
  const paths = [];
  if ((toolName === 'Edit' || toolName === 'Write') && toolInput.file_path) {
    paths.push(toolInput.file_path);
  }
  if (toolName === 'apply_patch' && typeof toolInput.command === 'string') {
    for (const m of toolInput.command.matchAll(APPLY_PATCH_FILE_HEADER)) {
      paths.push(m[1].trim());
    }
  }
  return paths;
}

export function isInsideProject(filePath, projectRoot) {
  const normalizedRoot = projectRoot.replace(/\\/g, '/').replace(/\/$/, '');
  const normalizedPath = filePath.replace(/\\/g, '/');
  return normalizedPath.startsWith(normalizedRoot + '/') || normalizedPath === normalizedRoot;
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
  const statePath = join(cwd, '.wingman', 'context-monitor.json');
  const state = loadMonitorState(statePath);

  if (!state.sessionId) state.sessionId = `session-${Date.now()}`;

  const rawInput = JSON.stringify(input?.tool_input || {});
  state.totalPayloadBytes += Buffer.byteLength(rawInput, 'utf-8');
  state.callCount += 1;

  const estimatedUsagePct = Math.min(1, state.totalPayloadBytes / ESTIMATED_CONTEXT_CHARS);
  state.estimatedContextUsagePct = Math.round(estimatedUsagePct * 100) / 100;
  state.lastUpdated = new Date().toISOString();

  const editedPaths = extractEditedPaths(toolName, input?.tool_input || {});
  for (const filePath of editedPaths) {
    if (!isInsideProject(filePath, cwd)) {
      const alreadyTracked = state.scopeCreep.filesOutsideProject.some((f) => f.path === filePath);
      if (!alreadyTracked) {
        state.scopeCreep.filesOutsideProject.push({ path: filePath, firstSeen: new Date().toISOString() });
        state.scopeCreep.warningCount += 1;
      }
    }
  }

  const remainingPct = 1 - estimatedUsagePct;
  let warning = null;
  if (remainingPct <= CRITICAL_THRESHOLD) {
    warning = {
      level: 'CRITICAL',
      message: `Context window CRITICAL: ~${Math.round(remainingPct * 100)}% remaining. Urgently consider compacting context or starting a new session.`,
    };
    state.warnings.push({ ...warning, timestamp: new Date().toISOString() });
  } else if (remainingPct <= WARNING_THRESHOLD) {
    warning = {
      level: 'WARNING',
      message: `Context window WARNING: ~${Math.round(remainingPct * 100)}% remaining. Context is getting low. Plan to compact soon.`,
    };
    state.warnings.push({ ...warning, timestamp: new Date().toISOString() });
  }

  let scopeWarning = null;
  if (state.scopeCreep.filesOutsideProject.length > 0) {
    scopeWarning =
      `Scope creep detected: ${state.scopeCreep.filesOutsideProject.length} file(s) edited outside ` +
      `project root (${cwd}): ${state.scopeCreep.filesOutsideProject.map((f) => f.path).join(', ')}`;
  }

  saveMonitorState(statePath, state);

  const messages = [];
  if (warning) {
    const icon = warning.level === 'CRITICAL' ? '\u{1F6A8}' : '⚠️';
    messages.push(`${icon} Wingman Context Monitor [${warning.level}]: ${warning.message}`);
  }
  if (scopeWarning) messages.push(`\u{1F4C1} Wingman Scope Creep: ${scopeWarning}`);

  if (messages.length > 0) {
    process.stdout.write(JSON.stringify({ systemMessage: messages.join('\n') }));
  } else {
    process.stdout.write(JSON.stringify({ continue: true }));
  }
  process.exit(0);
}

if (process.argv[1] && nodePath.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
