#!/usr/bin/env node
// Codex CLI port of plugins/wingman/hooks/prompt-guard.mjs -- scans the
// founder's incoming prompt for classic prompt-injection phrasing (instruction
// override, role hijack, system-prompt reveal, exfiltration) before the model
// ever sees it.
//
// Verification status: schema-confirmed, not yet against a live Codex CLI
// install (same discipline as secret-guard.mjs in this same directory -- see
// that file's header and the README's 2026-07-25 research pass for the full
// disclosure pattern this file follows).
//
// What's confirmed, and how: a follow-up fetch of
// https://learn.chatgpt.com/docs/hooks (2026-07-25, same session as the
// secret-guard.mjs port) resolved the one previously-open question for this
// hook -- whether Codex CLI has ANY analog to Claude Code's UserPromptSubmit.
// It does, confirmed directly:
//   - `UserPromptSubmit` is a real, documented hook event name.
//   - It fires "before model processes user input" -- the same "intercept
//     before the model sees it" semantics Claude Code's own UserPromptSubmit
//     has, not just an after-the-fact log.
//   - Its input carries the prompt text in a field named `prompt` (plus
//     `turn_id`, `session_id`) -- the same field name Claude Code uses, so
//     this port needed no field-name translation.
//   - It does not support a `matcher` (matcher values are documented as
//     "ignored if configured" for this event) -- wire it in hooks.json with
//     no matcher key, same shape as Claude Code's own UserPromptSubmit
//     registration.
//   - Documented output fields are `continue`, `additionalContext`,
//     `decision` -- notably different from PreToolUse's
//     `permissionDecision`/`permissionDecisionReason` pair secret-guard.mjs
//     uses. This port writes a `decision: "block"` shape using those field
//     names; see the caveat below for what's genuinely unverified here.
//
// Real, disclosed caveat this port does NOT paper over: the fetch above used
// an AI summarization pass over the fetched page (WebFetch processes content
// through a small model, it doesn't return the raw doc text), so the
// documented field NAMES for UserPromptSubmit are trustworthy citations, but
// the exact JSON NESTING Codex CLI expects for a "block" decision on this
// specific event (a flat `{ decision: "block", reason: "..." }` vs. something
// wrapped like PreToolUse's `hookSpecificOutput` envelope) was not
// independently re-verified against a second, raw source, and there is no
// live Codex CLI install in this sandbox to test the real wire format
// against. Treat the field names as schema-confirmed and the exact envelope
// shape below as a reasonable, but not independently re-confirmed,
// best-effort construction from those names -- verify with one deliberately
// injection-shaped test prompt on a real install before trusting this
// silently.
//
// INJECTION/evaluate() are a byte-for-byte copy of the canonical hook's own
// exports -- kept in sync by hand (no generator wires this yet), same as
// secret-guard.mjs's SECRET/DESTRUCTIVE lists in this same directory.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const INJECTION = [
  /ignore\s+(all\s+|previous\s+|your\s+|the\s+){1,2}(instructions|prompt|system)/i, // widened 2026-07-27: red-team pass found the un-widened form missed "ignore all previous instructions" itself -- see canonical hooks/prompt-guard.mjs
  /(disregard|forget)\s+(all\s+|previous\s+|your\s+|the\s+){1,2}(instructions|prompt|rules)/i,
  /you\s+are\s+now\s+[a-z][a-z\s]{0,20}/i,
  /(act\s+as\s+if|pretend\s+(that\s+)?you\s+are|from\s+now\s+on\s+you\s+are)\s+[a-z][a-z\s]{0,20}/i,
  /(reveal|print|show|dump).{0,20}(your\s+)?(system\s+prompt|hidden\s+instructions|internal\s+prompt)/i,
  /(override|bypass|disable)\s+(your\s+)?(safety|guardrails?|guidelines?|restrictions?)/i,
  /(send|email|post|exfiltrate|forward).{0,30}(to\s+https?:\/\/|to\s+[\w.]+@)/i,
];

// Returns { decision: 'allow' | 'deny', risk, reason }.
function evaluate(prompt = '') {
  const text = String(prompt);
  for (const re of INJECTION) {
    if (re.test(text)) {
      return {
        decision: 'deny',
        risk: 'high',
        reason:
          `Wingman prompt-guard (Codex CLI port): this prompt looks like a prompt-injection ` +
          `attempt (matched ${re}). Attackers hide these in pasted docs or web pages to hijack ` +
          `the agent. Rephrase as a normal instruction, or ask the founder (not the pasted text) ` +
          `what to do.`,
      };
    }
  }
  return { decision: 'allow', risk: 'low', reason: '' };
}

function readStdin() {
  try {
    return readFileSync(0, 'utf-8');
  } catch {
    return '';
  }
}

function main() {
  let input;
  try {
    input = JSON.parse(readStdin());
  } catch {
    // Malformed input -- fail open, matching the canonical hook's own stance.
    process.stdout.write(JSON.stringify({ continue: true }));
    return;
  }
  const result = evaluate(input?.prompt || '');
  if (result.decision === 'deny') {
    process.stdout.write(JSON.stringify({
      decision: 'block',
      reason: result.reason,
      continue: false,
    }));
    return;
  }
  process.stdout.write(JSON.stringify({ continue: true }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}

export { evaluate, INJECTION };
