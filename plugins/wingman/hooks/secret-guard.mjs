#!/usr/bin/env node
// PreToolUse hook (matchers: Bash, Write, Edit) — fills gap G1.
//
// Stops two founder-expensive mistakes before they happen:
//   1. Destructive commands (rm -rf /, git push --force, git clean -fdx, mkfs,
//      dd if=, fork bombs).
//   2. Writing/secrets into files or commands (AWS keys, GitHub PATs, sk- keys,
//      private keys, ANTHROPIC_API_KEY=, generic high-entropy assignments).
//
// Fails closed: any unparseable or unexpected input is allowed through ONLY if
// it matches nothing — we never auto-deny legitimate work, but we never let a
// secret or a wipe slip by either.
//
// Pure logic in decide() is unit-tested; the CLI below just adapts stdin/stdout.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const DESTRUCTIVE = [
  /rm\s+-rf\s+\//i,                       // rm -rf /
  /git\s+push\s+(--force|-f)\b/i,         // git push --force / -f
  /git\s+clean\s+-[fF]\w*x/i,             // git clean -fdx
  /\bmkfs\b/i,                            // mkfs
  /\bdd\s+if=/i,                          // dd if=
  /:\s*\(\s*\)\s*\{/i,                    // fork bomb :(){ :|:& };:
];

// SECRET is exported (not just used locally) so secret-scanner.mjs can import
// this exact list rather than keeping its own byte-identical copy that could
// silently drift — the same reasoning INJECTION is shared between
// prompt-guard.mjs and content-injection-scanner.mjs. This is a floor, not a
// ceiling: it catches known vendor-prefix shapes, not every possible secret
// (no entropy-based detection) -- see FIXLOG.md SEC2/CQ1.
const SECRET = [
  /AKIA[0-9A-Z]{16}/,                     // AWS access key id
  /\bghp_[A-Za-z0-9]{36}\b/,              // GitHub PAT (classic)
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,     // GitHub PAT (fine-grained)
  /\bgh[soru]_[A-Za-z0-9]{20,}\b/,        // GitHub App/OAuth/refresh tokens
  /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/,     // Slack tokens
  /\bsk_live_[A-Za-z0-9]{20,}\b/,         // Stripe live secret key
  /\bAIzaSy[A-Za-z0-9_-]{33}\b/,          // Google API key
  /\bsk-[A-Za-z0-9]{20,}\b/,              // OpenAI / Anthropic-style keys
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,   // PEM private key
  /\bANTHROPIC_API_KEY\s*=\s*\S+/i,       // literal key assignment
  /(?:password|passwd|secret|token|api[_-]?key)\s*[:=]\s*['"]?[A-Za-z0-9\/+_]{20,}/i,
];

export { SECRET };

export function decide(toolName, toolInput = {}) {
  const haystacks = [];
  if (toolName === 'Bash') haystacks.push(String(toolInput.command || ''));
  if (toolName === 'Write' || toolName === 'Edit') {
    haystacks.push(String(toolInput.content || ''), String(toolInput.new_string || ''));
  }
  if (toolName === 'NotebookEdit') haystacks.push(String(toolInput.new_source || ''));
  const combined = haystacks.join('\n');

  for (const re of DESTRUCTIVE) {
    if (re.test(combined)) {
      return {
        decision: 'deny',
        reason:
          `Wingman secret-guard: a destructive command matched (${re}). ` +
          `This can irreversibly delete or corrupt your project. ` +
          `If you really intend it, run it yourself in a terminal — the agent won't.`,
      };
    }
  }
  for (const re of SECRET) {
    if (re.test(combined)) {
      return {
        decision: 'deny',
        reason:
          `Wingman secret-guard: a possible secret was detected in the input. ` +
          `Never let a live key/token be written to a file or passed on the command ` +
          `line. Store it via the repo secret manager (e.g. \`gh secret set\`) instead.`,
      };
    }
  }
  return { decision: 'allow' };
}

function readStdin() {
  try { return readFileSync(0, 'utf-8'); } catch { return ''; }
}
function allow() {
  console.log(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'allow' },
  }));
  process.exit(0);
}
function deny(reason) {
  console.error(reason);
  process.exit(2);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let input;
  try {
    input = JSON.parse(readStdin());
  } catch {
    allow(); // malformed input — don't block on a parse error
  }
  const toolName = input?.tool_name;
  // Only these tools carry the risk we guard; anything else passes.
  if (!['Bash', 'Write', 'Edit', 'NotebookEdit'].includes(toolName)) allow();
  const result = decide(toolName, input?.tool_input || {});
  if (result.decision === 'deny') deny(result.reason);
  allow();
}
