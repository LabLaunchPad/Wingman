#!/usr/bin/env node
// Codex CLI port of plugins/wingman/hooks/secret-scanner.mjs -- PostToolUse,
// warn-only. Defense-in-depth companion to secret-guard.mjs (input side):
// scans a tool's OUTPUT for secrets that surfaced there (e.g. a Bash command
// that echoed a token, or a file read that dumped a config containing a key)
// before they propagate further into context or a later message.
//
// Verification status: schema-confirmed, not yet against a live Codex CLI
// install. A follow-up fetch of https://learn.chatgpt.com/docs/hooks
// (2026-07-25, same research pass as prompt-guard.mjs's port in this same
// directory) confirmed the one previously-open question for this hook: the
// PostToolUse payload field name for a tool's output. It is `tool_response`
// -- documented directly ("tool_response: JSON value. Tool-specific output.
// MCP tools send the MCP call result."), the same field name Claude Code
// itself uses, so no field-name translation was needed. PostToolUse matcher
// values are documented as the same set as PreToolUse (`Bash`, `apply_patch`,
// `Edit`, `Write`, MCP tool names); this port is wired with no matcher
// (fires on every tool call), matching the canonical hook's own "PostToolUse,
// no matcher" registration.
//
// Same caveat as prompt-guard.mjs's port: the field NAME (`tool_response`) is
// a direct documented citation, but the exact behavior for a warn-only,
// exit-0, plain-stderr hook body (as opposed to a structured JSON response)
// was not independently re-verified against a live install. This port keeps
// the canonical hook's own warn-only, plain-stderr-message shape rather than
// inventing a JSON envelope for a case Codex's docs don't specifically
// describe an output schema for beyond `decision`/`continue` (this hook
// deliberately never sets `decision` -- it never blocks).
//
// findSecrets()/redact()/scan() and the SECRET pattern list are a manual copy
// of the canonical hook's own exports (this file is meant to be copied
// standalone into a founder's own project) -- keep them in sync by hand if
// the canonical file's patterns change, same as secret-guard.mjs in this
// directory.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

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

function findSecrets(text = '') {
  const hits = [];
  for (const re of SECRET) {
    const m = String(text).match(re);
    if (m) hits.push(m[0]);
  }
  return [...new Set(hits)];
}

function redact(text = '') {
  let out = String(text);
  for (const re of SECRET) out = out.replace(re, '[REDACTED]');
  return out;
}

// Returns { found: string[], redacted: string }.
function scan(toolName, toolResponse = '') {
  const found = findSecrets(toolResponse);
  return { found, redacted: redact(toolResponse) };
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
    process.exit(0); // malformed input -- don't block on a parse error
  }
  // tool_response is the confirmed field name (see header); it may be a
  // string or a JSON value depending on the tool -- stringify defensively
  // rather than assuming a string, since MCP tools "send the MCP call
  // result" per the docs, which may not be a bare string.
  const raw = input?.tool_response;
  const text = typeof raw === 'string' ? raw : JSON.stringify(raw ?? '');
  const result = scan(input?.tool_name, text);
  if (result.found.length > 0) {
    process.stderr.write(
      `Wingman secret-scanner (Codex CLI port): a secret was surfaced in a ${input?.tool_name || 'tool'} ` +
      `response (matched ${result.found.length} pattern(s)). It was NOT written to a file by this hook, ` +
      `but avoid echoing it further. Retrieve secrets via the secret manager, not the terminal.\n`
    );
  }
  process.exit(0); // warn-only: never blocks the legitimate flow
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}

export { findSecrets, redact, scan };
