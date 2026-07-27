#!/usr/bin/env node
// Wingman secret-guard, ported as a Gemini CLI `BeforeTool` hook command -- the same gate the
// shipped Claude Code plugin runs on Bash/Write/Edit/NotebookEdit
// (plugins/wingman/hooks/secret-guard.mjs). Self-contained (regex lists duplicated, not imported)
// so this file keeps working once copied out of this repo into a real Gemini CLI project, matching
// the same self-containment convention the OpenCode/Codex CLI ports already use.
//
// Verification status: authored, unverified. The DESTRUCTIVE/SECRET regex lists and decide() logic
// are a byte-for-byte port of the canonical hook. The WIRING is not independently confirmed: no
// live Gemini CLI account exists in this sandbox, and the exact stdin JSON payload a `BeforeTool`
// command hook receives was not pinned down at the field-name level by the 2026-07-27 research pass
// (only the event name and the outer hooks.json shape were confirmed). This script therefore reads
// several plausible field-name variants and fails OPEN (allows) on anything it can't recognize --
// never fails closed on an unrecognized shape, since blocking on a guess would be worse than a
// confirmed miss. Tool names below (`run_shell_command`, `write_file`, `replace`) are Gemini CLI's
// documented built-in tool names, not independently re-verified live in this pass either.

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

export function decide(toolName, args = {}) {
  const haystacks = [];
  if (toolName === 'run_shell_command') haystacks.push(String(args.command || ''));
  if (toolName === 'write_file') haystacks.push(String(args.content || ''));
  if (toolName === 'replace') haystacks.push(String(args.new_string || args.newString || ''));
  const combined = haystacks.join('\n');

  for (const re of DESTRUCTIVE) {
    if (re.test(combined)) {
      return {
        allow: false,
        reason:
          `Wingman secret-guard: a destructive command matched (${re}). This can irreversibly ` +
          `delete or corrupt your project. If you really intend it, run it yourself in a terminal.`,
      };
    }
  }
  for (const re of SECRET) {
    if (re.test(combined)) {
      return {
        allow: false,
        reason:
          `Wingman secret-guard: a possible secret was detected in the input. Never let a live ` +
          `key/token be written to a file or passed on the command line. Store it via the repo ` +
          `secret manager (e.g. \`gh secret set\`) instead.`,
      };
    }
  }
  return { allow: true };
}

function readStdin() {
  try { return readFileSync(0, 'utf-8'); } catch { return ''; }
}

function extractToolCall(input) {
  const toolName = input.tool_name || input.tool || input.name || null;
  const args = input.tool_input || input.args || input.input || input.parameters || {};
  return { toolName, args };
}

let input;
try {
  input = JSON.parse(readStdin());
} catch {
  process.exit(0); // unparseable input -- fail open, never block on a guess
}

const { toolName, args } = extractToolCall(input || {});
if (!toolName) process.exit(0);

const result = decide(toolName, args);
if (!result.allow) {
  console.error(result.reason);
  process.exit(1); // non-zero exit signals block, mirroring every other harness adapter's convention here
}
process.exit(0);
