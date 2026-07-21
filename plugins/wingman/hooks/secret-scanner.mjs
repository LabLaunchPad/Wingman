#!/usr/bin/env node
// PostToolUse hook (registered in hooks.json with no matcher, so it fires on every tool call --
// a superset of the Bash/Read/Write/Edit/NotebookEdit set this comment used to name; broader, not
// narrower, so not a functional gap, just corrected here to match the real wiring) — fills gap G4.
//
// Defense-in-depth companion to secret-guard (G1), which blocks secrets at the
// *input* side (commands/files being written). This hook scans the *output*
// side: secrets that surfaced in a tool's response (e.g. a Bash command that
// echoed a token, or a Read of a config file) before they propagate further
// into context or output.
//
// Deliberately WARN-ONLY (exit 0, message to stderr). Unlike G1 it does NOT
// block: a PostToolUse block would break legitimate reads of files that happen
// to contain keys (the exact over-block trap fixed in v12's boardroom gate).
// The job here is to surface the leak to the founder, not to refuse the result.
//
// Pure logic in scan()/redact()/findSecrets() is unit-tested; the CLI below
// just adapts stdin/stdout.

// Reuses secret-guard.mjs's SECRET pattern set rather than a duplicate
// byte-identical list that could silently drift — the same reasoning
// content-injection-scanner.mjs already applies to prompt-guard.mjs's
// INJECTION list. See FIXLOG.md SEC2/CQ1.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { SECRET } from './secret-guard.mjs';

export function findSecrets(text = '') {
  const hits = [];
  for (const re of SECRET) {
    const m = String(text).match(re);
    if (m) hits.push(m[0]);
  }
  return [...new Set(hits)];
}

export function redact(text = '') {
  let out = String(text);
  for (const re of SECRET) out = out.replace(re, '[REDACTED]');
  return out;
}

// Returns { found: string[], redacted: string }.
export function scan(toolName, toolResponse = '') {
  const found = findSecrets(toolResponse);
  return { found, redacted: redact(toolResponse) };
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
  const result = scan(input?.tool_name, input?.tool_response || '');
  if (result.found.length > 0) {
    process.stderr.write(
      `Wingman secret-scanner: a secret was surfaced in a ${input?.tool_name || 'tool'} ` +
      `response (matched ${result.found.length} pattern(s)). It was NOT written to a file ` +
      `by this hook, but avoid echoing it further. Retrieve secrets via the secret manager ` +
      `(e.g. \`gh secret\`), not the terminal.\n`
    );
  }
  process.exit(0); // warn-only: never blocks the legitimate flow
}
