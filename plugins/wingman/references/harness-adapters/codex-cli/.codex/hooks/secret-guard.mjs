#!/usr/bin/env node
// Codex CLI port of plugins/wingman/hooks/secret-guard.mjs -- a PreToolUse hook
// stopping two founder-expensive mistakes before they happen: destructive
// commands (rm -rf /, git push --force, ...) and secrets/API keys landing in a
// command or a file edit.
//
// Verification status: schema-confirmed against OpenAI's official Codex CLI
// hooks reference (https://learn.chatgpt.com/docs/hooks, fetched 2026-07-25),
// NOT against a live Codex CLI install. What that fetch resolved, concretely:
//   - Hooks are enabled by default (feature key `hooks`, `codex_hooks` is a
//     deprecated alias) -- no opt-in config needed to use this file.
//   - `Bash` and `apply_patch` (file edits) both emit PreToolUse events, and
//     BOTH put their scannable content in the exact same field:
//     `tool_input.command` (apply_patch's "command" is the patch/diff text
//     being applied -- not a Bash shell command, but the same field name).
//     This is the one detail earlier research explicitly could not confirm
//     and declined to guess at; it's now a direct primary-source citation,
//     not an assumption.
//   - The stdin input payload and stdout response schema
//     (`hookSpecificOutput.{hookEventName,permissionDecision,
//     permissionDecisionReason}`) are byte-identical in shape to Claude Code's
//     own hook contract -- Codex CLI modeled its hooks system on it directly.
// Still genuinely unconfirmed, disclosed rather than hidden: real GitHub
// issues (openai/codex#16732, #20204) report apply_patch hook events not
// firing consistently in practice across all Codex CLI versions, despite
// being documented as supported -- treat this hook as "should fire per spec,"
// not "confirmed firing on your install," until you've checked with a
// trivial known-bad edit.
//
// SECRET/DESTRUCTIVE lists are a manual copy of the canonical
// plugins/wingman/hooks/secret-guard.mjs's exported lists (this file is meant
// to be copied standalone into a founder's own project, with no dependency on
// a Wingman plugin install being present) -- keep them in sync by hand if the
// canonical file's patterns change; there is no generator wiring this one yet.

import { readFileSync } from 'node:fs';

const DESTRUCTIVE = [
  /rm\s+-rf\s+\//i,
  /git\s+push\s+(--force|-f)\b/i,
  /git\s+clean\s+-[fF]\w*x/i,
  /\bmkfs\b/i,
  /\bdd\s+if=/i,
  /:\s*\(\s*\)\s*\{/i,
];

const SECRET = [
  /AKIA[0-9A-Z]{16}/,
  /\bghp_[A-Za-z0-9]{36}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
  /\bgh[soru]_[A-Za-z0-9]{20,}\b/,
  /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/,
  /\bsk_live_[A-Za-z0-9]{20,}\b/,
  /\bAIzaSy[A-Za-z0-9_-]{33}\b/,
  /\bsk-[A-Za-z0-9]{20,}\b/,
  /\bsk-ant-[A-Za-z0-9_-]{20,}\b/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\bANTHROPIC_API_KEY\s*=\s*\S+/i,
  /(?:password|passwd|secret|token|api[_-]?key)\s*[:=]\s*['"]?[A-Za-z0-9\/+_]{20,}/i,
];

function decide(toolName, toolInput = {}) {
  // Both Bash and apply_patch put their scannable text in tool_input.command
  // (confirmed, see module header) -- unlike Claude Code, there's no separate
  // content/new_string field to also check for apply_patch.
  const haystack = String(toolInput.command || '');
  if (!haystack) return { allow: true };

  for (const pattern of DESTRUCTIVE) {
    if (pattern.test(haystack)) {
      return { allow: false, reason: `Blocked: matches a known destructive-command pattern (${pattern}).` };
    }
  }
  for (const pattern of SECRET) {
    if (pattern.test(haystack)) {
      return { allow: false, reason: 'Blocked: content appears to contain a real secret/API key pattern.' };
    }
  }
  return { allow: true };
}

function readStdin() {
  try {
    return readFileSync(0, 'utf-8');
  } catch {
    return '';
  }
}

function main() {
  let payload;
  try {
    payload = JSON.parse(readStdin());
  } catch {
    // Unparseable input: fail open on OUR check (never seen this shape
    // before), matching secret-guard.mjs's own "never auto-deny on garbage
    // input" stance -- Codex's own hook harness handles malformed hooks.json
    // wiring separately from this script's own logic.
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'allow' },
    }));
    return;
  }

  const { tool_name: toolName, tool_input: toolInput } = payload;
  const result = decide(toolName, toolInput);

  if (result.allow) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'allow' },
    }));
  } else {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: result.reason,
      },
    }));
  }
}

main();

export { decide };
