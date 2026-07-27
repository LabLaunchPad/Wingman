#!/usr/bin/env node
// Wingman secret-guard, ported as a Cursor hook command (`beforeShellExecution`/`afterFileEdit`) --
// the same gate the shipped Claude Code plugin runs on Bash/Write/Edit
// (plugins/wingman/hooks/secret-guard.mjs). Self-contained (regex lists duplicated, not imported)
// so this file keeps working once copied out of this repo, matching the same self-containment
// convention every other harness adapter here uses.
//
// Verification status: authored, unverified. The DESTRUCTIVE/SECRET regex lists and decide() logic
// are a byte-for-byte port of the canonical hook. The WIRING is per Cursor's publicly documented
// Hooks schema (`.cursor/hooks.json`, `beforeShellExecution`/`afterFileEdit`/`beforeMCPExecution`
// events, a command hook reading JSON on stdin and returning a `permission` field on stdout) -- but
// no live Cursor install exists in this sandbox to confirm the exact field names at the wire level,
// so this script reads several plausible field-name variants and fails OPEN on anything it can't
// recognize, same defensive posture Gemini CLI's port takes for the same reason. `afterFileEdit`
// fires after the write already happened -- it cannot block, only advise; this script still runs
// there so a founder sees a loud warning even though the write already landed, matching the
// documented Cursor limitation rather than pretending it can gate that event.

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

export function decide(text) {
  for (const re of DESTRUCTIVE) {
    if (re.test(text)) {
      return {
        allow: false,
        reason:
          `Wingman secret-guard: a destructive command matched (${re}). This can irreversibly ` +
          `delete or corrupt your project. If you really intend it, run it yourself in a terminal.`,
      };
    }
  }
  for (const re of SECRET) {
    if (re.test(text)) {
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

function extractHaystack(input) {
  // Plausible field-name variants across beforeShellExecution (command/cwd) and afterFileEdit
  // (file_path/edits/content) -- no live install confirms the exact shape, so all are checked.
  const parts = [
    input.command, input.shell_command,
    input.content, input.file_content, input.new_content,
    JSON.stringify(input.edits || input.diff || ''),
  ];
  return parts.filter(Boolean).join('\n');
}

let input;
try {
  input = JSON.parse(readStdin());
} catch {
  console.log(JSON.stringify({ permission: 'allow' }));
  process.exit(0); // unparseable input -- fail open, never block on a guess
}

const haystack = extractHaystack(input || {});
if (!haystack) {
  console.log(JSON.stringify({ permission: 'allow' }));
  process.exit(0);
}

const result = decide(haystack);
if (!result.allow) {
  console.log(JSON.stringify({ permission: 'deny', userMessage: result.reason, agentMessage: result.reason }));
  process.exit(0); // Cursor hooks communicate via the JSON payload, not a distinct exit-code protocol
}
console.log(JSON.stringify({ permission: 'allow' }));
process.exit(0);
