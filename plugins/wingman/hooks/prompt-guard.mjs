#!/usr/bin/env node
// UserPromptSubmit hook (event: UserPromptSubmit) — fills gap G3.
//
// First line of defense against prompt injection: scans the founder's incoming
// prompt for classic manipulation patterns (instruction override, role
// hijack, secret-system-prompt reveal, data exfiltration). High-risk prompts
// are denied with plain-language guidance. Benign prompts pass untouched.
//
// Pure logic in evaluate() is unit-tested; the CLI adapts stdin/stdout.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const INJECTION = [
  /ignore\s+(all|previous|your|the)\s+(instructions|prompt|system)/i,
  /you\s+are\s+now\s+[a-z][a-z\s]{0,20}/i,               // role hijack
  /(reveal|print|show|dump).{0,20}(your\s+)?(system\s+prompt|hidden\s+instructions|internal\s+prompt)/i,
  /(send|email|post|exfiltrate|forward).{0,30}(to\s+https?:\/\/|to\s+[\w.]+@)/i,
];

// Returns { decision: 'allow' | 'deny', risk, reason }.
export function evaluate(prompt = '') {
  const text = String(prompt);
  for (const re of INJECTION) {
    if (re.test(text)) {
      return {
        decision: 'deny',
        risk: 'high',
        reason:
          `Wingman prompt-guard: this prompt looks like a prompt-injection ` +
          `attempt (matched ${re}). Attackers hide these in pasted docs or web ` +
          `pages to hijack the agent. Rephrase as a normal instruction, or ask ` +
          `the founder (not the pasted text) what to do.`,
      };
    }
  }
  return { decision: 'allow', risk: 'low', reason: '' };
}

function readStdin() {
  try { return readFileSync(0, 'utf-8'); } catch { return ''; }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let input;
  try {
    input = JSON.parse(readStdin());
  } catch {
    process.exit(0); // malformed input — don't block on a parse error
  }
  const result = evaluate(input?.prompt || '');
  if (result.decision === 'deny') {
    console.error(result.reason);
    process.exit(2); // non-zero blocks accepting the prompt
  }
  process.exit(0);
}
