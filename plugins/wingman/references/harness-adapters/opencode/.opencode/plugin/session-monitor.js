// Wingman context-monitor + session-health, ported to a single OpenCode plugin -- combines the two
// canonical Claude Code PostToolUse hooks (plugins/wingman/hooks/context-monitor.mjs and
// plugins/wingman/hooks/session-health.mjs) into one OpenCode `tool.execute.after` hook.
//
// Verification status (2026-07-25, real live investigation via `opencode run -m
// opencode/deepseek-v4-flash-free`, zero API key, against a throwaway fixture project -- NOT via
// `opencode debug agent --tool`, which is confirmed elsewhere in this session to bypass the whole
// plugin/hook pipeline):
//
// 1. `tool.execute.after(input, output)` fires on every real tool call. `input.sessionID` is
//    OpenCode's own real, stable per-session identifier (e.g. `ses_0666e94c4ffeJ7kyVR6La2R6zC`) --
//    used below as the session key, unlike the canonical hooks, which have no such thing available
//    and instead synthesize `session-${Date.now()}`. This is a genuine improvement over the
//    Claude-Code-side hooks, not just a straight port.
// 2. THE ARGS-SHAPE QUESTION (investigated live, not assumed): a probe plugin logged both
//    `tool.execute.before` and `tool.execute.after` payloads for a real `write` + `read` call.
//    Result: in `before`, the tool arguments are nested under the *second* parameter, at
//    `output.args` (e.g. `{filePath, content}`) -- `input.args` is undefined there. In `after`,
//    the arguments are instead on the *first* parameter, at `input.args`, directly alongside
//    `input.tool` and `input.sessionID`. So `tool.execute.after`'s `input.args` DOES carry
//    `filePath` for `write`/`edit` -- confirmed live -- meaning a single hook (`after` only) is
//    sufficient for both byte-size accounting and scope-creep path tracking; `before` is not
//    needed here (contrast with secret-guard.js, which genuinely needs `before` to block).
// 3. Message visibility (investigated live): no confirmed way was found in this session to inject
//    a message into the OpenCode model's own context from a plugin hook (no equivalent of Claude
//    Code's `hookSpecificOutput.message` PostToolUse convention). Warnings below are therefore
//    emitted via `console.error` (visible in the OpenCode process's stderr/log, e.g. surfaced to a
//    human operator watching the terminal or piping output) and are NOT confirmed to reach the
//    model's own reasoning. This mirrors the honest finding already recorded for other hooks in
//    this adapter (see wingman-gate.js's header for the same style of disclosed-not-assumed status).
// 4. Live end-to-end demonstration of scope-creep tracking specifically hit a real, disclosed
//    limitation: `opencode run` (non-interactive) auto-rejects any tool call whose target path is
//    outside the current project directory (`permission requested: external_directory ... auto-
//    rejecting`), and a rejected tool call does NOT fire `tool.execute.after` at all (confirmed via
//    a probe plugin -- the rejected write never appears in the after-hook log). So the exact
//    real-world scenario `extractEditedPaths`/`isInsideProject` guard against is also the one
//    OpenCode's own permission system blocks before this hook ever sees it, in this sandboxed
//    non-interactive mode. The scope-creep branch itself is still directly and thoroughly unit-
//    tested (see tests/opencode-gate/opencode-session-monitor.test.mjs) by calling
//    `updateContextState` with an outside-project path directly -- just not reachable end-to-end
//    through a live `opencode run` in this environment.
// 5. EXPORT SHAPE PITFALL (found live, costly): an earlier version of this file exported the
//    threshold/estimation constants as plain `export const` numbers. OpenCode's plugin loader
//    walks every named export of a file under `.opencode/plugin/` and calls each one as if it
//    were its own plugin factory; a non-function export crashes the whole file's load with
//    `error="Plugin export is not a function"` (see `~/.local/share/opencode/log/opencode.log`),
//    silently disabling the entire hook (both trackers) with no state files ever written and no
//    visible error in `opencode run`'s own stdout. Fixed by keeping every named export in this
//    file a function -- constants are read through `getConfig()` instead (see below).
//
// State files are the same JSON shape/paths the canonical hooks use
// (`.wingman/context-monitor.json`, `.wingman/session-health.json` under the current working
// directory) so any existing tooling that reads those files stays compatible -- only `sessionId`
// now holds OpenCode's real session ID instead of a synthesized one.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// NOTE ON EXPORT SHAPE: OpenCode's plugin loader (confirmed live, 2026-07-25 -- see
// opencode.log: `error="Plugin export is not a function"`) walks EVERY named export of a file
// under `.opencode/plugin/` and expects each one to itself be a callable plugin factory. A plain
// exported constant (a number, a Set) makes the whole file fail to load with that exact error --
// this is a real, disclosed finding from live testing, not a guess. So the threshold/estimation
// constants below are deliberately NOT top-level `export const` bindings; they're read through the
// exported `getConfig()` function instead, keeping every named export in this file a function (the
// one shape confirmed to load cleanly).
const CONTEXT_WARNING_THRESHOLD = 0.35;
const CONTEXT_CRITICAL_THRESHOLD = 0.25;

// Same estimation constant as the canonical context-monitor.mjs: ~200k-token context window,
// approximated at 4 chars/token.
const ESTIMATED_CONTEXT_CHARS = 200_000 * 4;

const HEALTH_YELLOW_THRESHOLD = 40;
const HEALTH_RED_THRESHOLD = 60;

export function getConfig() {
  return {
    CONTEXT_WARNING_THRESHOLD,
    CONTEXT_CRITICAL_THRESHOLD,
    ESTIMATED_CONTEXT_CHARS,
    HEALTH_YELLOW_THRESHOLD,
    HEALTH_RED_THRESHOLD,
  };
}

// --- Generic JSON state I/O (shared by both trackers) ---

export function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export function loadJsonState(path, defaults) {
  try {
    if (existsSync(path)) {
      return JSON.parse(readFileSync(path, 'utf-8'));
    }
  } catch {
    // Corrupted -- start fresh, same behavior as the canonical hooks.
  }
  return typeof defaults === 'function' ? defaults() : structuredClone(defaults);
}

export function saveJsonState(path, state) {
  ensureDir(join(path, '..'));
  writeFileSync(path, JSON.stringify(state, null, 2));
}

// --- context-monitor: pure state-update logic ---

export function defaultContextState() {
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

// Byte-for-byte the same normalization the canonical hook uses.
export function isInsideProject(filePath, projectRoot) {
  const normalizedRoot = projectRoot.replace(/\\/g, '/').replace(/\/$/, '');
  const normalizedPath = filePath.replace(/\\/g, '/');
  return (
    normalizedPath.startsWith(normalizedRoot + '/') || normalizedPath === normalizedRoot
  );
}

// OpenCode's write/edit tools use camelCase `filePath` (confirmed live), unlike Claude Code's
// snake_case `file_path`.
export function extractEditedPaths(toolName, args) {
  const paths = [];
  if ((toolName === 'write' || toolName === 'edit') && args && args.filePath) {
    paths.push(args.filePath);
  }
  return paths;
}

/**
 * Pure update of context-monitor state for one tool call.
 * @param {object} state - previous state (mutated copy returned, input not mutated)
 * @param {object} params - { sessionId, toolName, args, cwd, now }
 * @returns {{ state: object, messages: string[] }}
 */
export function updateContextState(state, { sessionId, toolName, args, cwd, now }) {
  const next = structuredClone(state);
  const timestamp = now || new Date().toISOString();

  if (!next.sessionId) next.sessionId = sessionId || null;

  const rawArgs = JSON.stringify(args || {});
  next.totalPayloadBytes += Buffer.byteLength(rawArgs, 'utf-8');
  next.callCount += 1;

  const estimatedUsagePct = Math.min(1, next.totalPayloadBytes / ESTIMATED_CONTEXT_CHARS);
  next.estimatedContextUsagePct = Math.round(estimatedUsagePct * 100) / 100;
  next.lastUpdated = timestamp;

  // Scope creep tracking
  const editedPaths = extractEditedPaths(toolName, args);
  for (const filePath of editedPaths) {
    if (!isInsideProject(filePath, cwd)) {
      const alreadyTracked = next.scopeCreep.filesOutsideProject.some(
        (f) => f.path === filePath
      );
      if (!alreadyTracked) {
        next.scopeCreep.filesOutsideProject.push({ path: filePath, firstSeen: timestamp });
        next.scopeCreep.warningCount += 1;
      }
    }
  }

  // Context warnings
  const remainingPct = 1 - estimatedUsagePct;
  const messages = [];
  let warning = null;

  if (remainingPct <= CONTEXT_CRITICAL_THRESHOLD) {
    warning = {
      level: 'CRITICAL',
      message:
        `Context window CRITICAL: ~${Math.round(remainingPct * 100)}% remaining. ` +
        `Urgently consider compacting context or starting a new session.`,
      timestamp,
    };
    next.warnings.push(warning);
  } else if (remainingPct <= CONTEXT_WARNING_THRESHOLD) {
    warning = {
      level: 'WARNING',
      message:
        `Context window WARNING: ~${Math.round(remainingPct * 100)}% remaining. ` +
        `Context is getting low. Plan to compact soon.`,
      timestamp,
    };
    next.warnings.push(warning);
  }

  if (warning) {
    const icon = warning.level === 'CRITICAL' ? '\u{1F6A8}' : '⚠️';
    messages.push(`${icon} Wingman Context Monitor [${warning.level}]: ${warning.message}`);
  }

  if (next.scopeCreep.filesOutsideProject.length > 0) {
    messages.push(
      `\u{1F4C1} Wingman Scope Creep: Scope creep detected: ` +
        `${next.scopeCreep.filesOutsideProject.length} file(s) edited outside project root ` +
        `(${cwd}): ${next.scopeCreep.filesOutsideProject.map((f) => f.path).join(', ')}`
    );
  }

  return { state: next, messages };
}

// --- session-health: pure state-update logic ---

export function defaultHealthState() {
  return {
    sessionId: null,
    toolCallCount: 0,
    warnings: [],
    redWarningCount: 0,
    yellowWarningCount: 0,
    lastUpdated: null,
  };
}

/**
 * Pure update of session-health state for one tool call.
 * @param {object} state - previous state
 * @param {object} params - { sessionId, now }
 * @returns {{ state: object, messages: string[] }}
 */
export function updateHealthState(state, { sessionId, now }) {
  const next = structuredClone(state);
  const timestamp = now || new Date().toISOString();

  if (!next.sessionId) next.sessionId = sessionId || null;

  next.toolCallCount += 1;
  next.lastUpdated = timestamp;

  const count = next.toolCallCount;
  const messages = [];
  let warning = null;

  if (count >= HEALTH_RED_THRESHOLD) {
    warning = {
      level: 'RED',
      message:
        `Session health RED: ${count} tool calls in this session. ` +
        `Context compaction risk is high. Consider starting a fresh session or asking the ` +
        `user to compact context.`,
      timestamp,
    };
    next.redWarningCount += 1;
    next.warnings.push(warning);
  } else if (count >= HEALTH_YELLOW_THRESHOLD) {
    warning = {
      level: 'YELLOW',
      message:
        `Session health YELLOW: ${count} tool calls in this session. ` +
        `Context may be getting long. Watch for degraded performance.`,
      timestamp,
    };
    next.yellowWarningCount += 1;
    next.warnings.push(warning);
  }

  if (warning) {
    const emoji = warning.level === 'RED' ? '\u{1F534}' : '\u{1F7E1}';
    messages.push(`${emoji} Wingman Session Health [${warning.level}]: ${warning.message}`);
  }

  return { state: next, messages };
}

// Tools that shouldn't count toward either tracker (mirrors the canonical hooks' SKIP_TOOLS,
// adapted to OpenCode's lowercase tool names -- this plugin has no equivalent tool of its own to
// self-exclude, but skip trivial/no-op tool names just in case a future tool is added here).
const SKIP_TOOLS = new Set([]);

// --- OpenCode plugin wiring ---

export const SessionMonitorPlugin = async ({ directory }) => {
  return {
    'tool.execute.after': async (input, output) => {
      const toolName = input.tool || '';
      if (SKIP_TOOLS.has(toolName)) return;

      const cwd = directory || process.cwd();
      const sessionId = input.sessionID || null;
      const args = input.args || {};

      const contextPath = join(cwd, '.wingman', 'context-monitor.json');
      const contextState = loadJsonState(contextPath, defaultContextState);
      const contextResult = updateContextState(contextState, {
        sessionId,
        toolName,
        args,
        cwd,
      });
      saveJsonState(contextPath, contextResult.state);

      const healthPath = join(cwd, '.wingman', 'session-health.json');
      const healthState = loadJsonState(healthPath, defaultHealthState);
      const healthResult = updateHealthState(healthState, { sessionId });
      saveJsonState(healthPath, healthResult.state);

      // No confirmed way to inject a message into the model's own context from a plugin hook
      // (see header comment, finding 3) -- log to stderr so a human operator can see it.
      for (const message of [...contextResult.messages, ...healthResult.messages]) {
        console.error(message);
      }
    },
  };
};

export default SessionMonitorPlugin;
