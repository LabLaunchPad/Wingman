#!/usr/bin/env node
// Wingman prompt-guard, ported as a Gemini CLI `BeforeModel` hook command -- the closest confirmed
// real event to Claude Code's `UserPromptSubmit` (plugins/wingman/hooks/prompt-guard.mjs). Gemini
// CLI's real, confirmed event taxonomy (2026-07-27 schema-verification pass) has no discrete
// "prompt submitted" event distinct from a model call -- `BeforeModel` fires immediately before
// each model invocation and is the best available analog, not a confirmed 1:1 match.
//
// Self-contained (regex list duplicated, not imported) so this file keeps working once copied out
// of this repo, matching every other harness adapter's self-containment convention. The INJECTION
// list is a byte-for-byte port of the canonical hook's own list -- see that file's header for the
// "floor, not a ceiling" disclosure (a fixed regex list cannot close prompt-injection risk
// completely; this is an accepted, disclosed residual risk, not a claim otherwise).
//
// Verification status: authored, unverified. No live Gemini CLI account exists in this sandbox to
// confirm `BeforeModel`'s exact stdin payload shape, so this reads several plausible field-name
// variants for the outgoing prompt text and fails OPEN on anything unrecognized -- same defensive
// posture `secret-guard.mjs`'s own Gemini port already takes.

import { readFileSync } from 'node:fs';

const INJECTION = [
  /ignore\s+(all|previous|your|the)\s+(instructions|prompt|system)/i,
  /(disregard|forget)\s+(all\s+|previous\s+|your\s+|the\s+){1,2}(instructions|prompt|rules)/i,
  /you\s+are\s+now\s+[a-z][a-z\s]{0,20}/i,
  /(act\s+as\s+if|pretend\s+(that\s+)?you\s+are|from\s+now\s+on\s+you\s+are)\s+[a-z][a-z\s]{0,20}/i,
  /(reveal|print|show|dump).{0,20}(your\s+)?(system\s+prompt|hidden\s+instructions|internal\s+prompt)/i,
  /(override|bypass|disable)\s+(your\s+)?(safety|guardrails?|guidelines?|restrictions?)/i,
  /(send|email|post|exfiltrate|forward).{0,30}(to\s+https?:\/\/|to\s+[\w.]+@)/i,
];

export function evaluate(prompt = '') {
  const text = String(prompt);
  for (const re of INJECTION) {
    if (re.test(text)) {
      return {
        decision: 'deny',
        reason:
          `Wingman prompt-guard: this prompt looks like a prompt-injection attempt (matched ${re}). ` +
          `Attackers hide these in pasted docs or web pages to hijack the agent. Rephrase as a ` +
          `normal instruction, or ask the founder (not the pasted text) what to do.`,
      };
    }
  }
  return { decision: 'allow', reason: '' };
}

function readStdin() {
  try { return readFileSync(0, 'utf-8'); } catch { return ''; }
}

function extractPrompt(input) {
  return input.prompt || input.text || input.message || input.content || '';
}

let input;
try {
  input = JSON.parse(readStdin());
} catch {
  process.exit(0); // unparseable input -- fail open, never block on a guess
}

const prompt = extractPrompt(input || {});
if (!prompt) process.exit(0);

const result = evaluate(prompt);
if (result.decision === 'deny') {
  console.error(result.reason);
  process.exit(1); // non-zero exit signals block, mirroring every other harness adapter's convention here
}
process.exit(0);
