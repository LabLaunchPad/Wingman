#!/usr/bin/env node
// UserPromptSubmit hook (event: UserPromptSubmit) — fills gap G3.
//
// First line of defense against prompt injection: scans the founder's incoming
// prompt for classic manipulation patterns (instruction override, role
// hijack, secret-system-prompt reveal, data exfiltration). High-risk prompts
// are denied with plain-language guidance. Benign prompts pass untouched.
//
// Pure logic in evaluate() is unit-tested; the CLI adapts stdin/stdout.
//
// INJECTION is exported (not just used locally) so content-injection-scanner.mjs
// — the PostToolUse companion that scans *fetched external content* rather than
// the founder's own prompt — can reuse the same pattern set instead of a
// silently-drifting duplicate. Boardroom CISO review (2026-07-19, SAIF 2.0
// cross-check) flagged this list as real coverage for the obvious phrasings but
// easily evaded by rewording — broadened here with a few more common paraphrases,
// while being honest that a fixed regex list is a floor, not a ceiling: no
// amount of pattern-matching closes this class of risk completely — a
// rewritten/obfuscated injection can still evade a fixed pattern set. This is
// an accepted, disclosed residual risk (see docs/status/ARCHITECTURE.md's "Agent
// Permission Model" section for the sibling accepted-risk framing on
// permissions enforcement), not a claim that this hook makes the class of
// risk go away.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const INJECTION = [
  // 1-2 qualifier words, not just 1: a red-team pass (2026-07-27) found the textbook phrase
  // "ignore all previous instructions" itself was NOT caught by this pattern -- it only allowed a
  // single qualifier word ("all" alone, or "previous" alone) before instructions/prompt/system,
  // missing the extremely common two-word "all previous" combination. The sibling
  // disregard/forget pattern below already allowed {1,2}; this one didn't. Fixed to match.
  /ignore\s+(all\s+|previous\s+|your\s+|the\s+){1,2}(instructions|prompt|system)/i,
  /(disregard|forget)\s+(all\s+|previous\s+|your\s+|the\s+){1,2}(instructions|prompt|rules)/i,   // common paraphrase of "ignore previous instructions"
  /you\s+are\s+now\s+[a-z][a-z\s]{0,20}/i,               // role hijack
  /(act\s+as\s+if|pretend\s+(that\s+)?you\s+are|from\s+now\s+on\s+you\s+are)\s+[a-z][a-z\s]{0,20}/i, // role-hijack paraphrases
  /(reveal|print|show|dump).{0,20}(your\s+)?(system\s+prompt|hidden\s+instructions|internal\s+prompt)/i,
  /(override|bypass|disable)\s+(your\s+)?(safety|guardrails?|guidelines?|restrictions?)/i,           // guardrail-override phrasing
  /(send|email|post|exfiltrate|forward).{0,30}(to\s+https?:\/\/|to\s+[\w.]+@)/i,
];

export { INJECTION };

// Strips zero-width/invisible characters (U+200B space, U+200C/U+200D joiners, U+FEFF BOM,
// U+00AD soft hyphen -- written as \u escapes in the regex below, not literal characters,
// since these are by definition invisible in a source file and unverifiable by eye) and
// collapses whitespace runs (including newlines) to a single space before matching. Closes
// two real red-team findings (2026-07-27): a zero-width space inserted mid-phrase and a
// newline inserted between qualifier words both silently broke the \s+-based patterns above,
// since neither character is itself suspicious. This is a floor, not a ceiling: encoding-based
// evasion (base64, rot13, leetspeak, reversed text, Unicode homoglyphs standing in for Latin
// letters) is a different, much larger problem -- real decoding/confusables detection, not
// text normalization -- and stays an accepted, disclosed residual risk (see the module header
// above).
const INVISIBLE_CHARS = /[\u200B\u200C\u200D\uFEFF\u00AD]/g;

function normalize(text) {
  return text
    .replace(INVISIBLE_CHARS, '')
    .replace(/\s+/g, ' ');
}

// Returns { decision: 'allow' | 'deny', risk, reason }.
export function evaluate(prompt = '') {
  const text = normalize(String(prompt));
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
