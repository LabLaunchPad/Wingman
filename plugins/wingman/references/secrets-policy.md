# Secrets Policy

How Wingman and the founder it serves should handle secrets (API keys, tokens,
private keys, credentials). This is the single reference for secrets across the
plugin — read it before adding any integration that touches a credential.

## Principles

1. **Secrets are never persisted in the repo.** No `.env`, no key in a committed
   file, no credential in `vendor/` attributions (those are design references
   only). The only key-shaped strings in this repo are fake, seeded eval
   fixtures and the detection *patterns* in the hooks — never a live value.
2. **Secrets live in a secret manager, not the terminal.** For this repo that
   means GitHub Actions secrets (`Settings → Secrets and variables → Actions →
   New repository secret`, e.g. `ANTHROPIC_API_KEY`). For the founder's own
   services, use the provider's secret store (AWS Secrets Manager, Vercel
   env vars, etc.), not a pasted string in chat or a shell history.
3. **The agent never sees a live key unless it must.** Prefer least-privilege
   tokens with short lifetimes.

## Handling

- **Writing code/config:** never inline a secret. Reference an env var or a
  secret-manager lookup. If you are about to write a key into a file, stop.
- **The two secret hooks enforce this at runtime:**
  - `secret-guard.mjs` (`PreToolUse`, Bash/Write/Edit/NotebookEdit) **blocks**
    destructive commands and secret *writes* before they happen.
  - `secret-scanner.mjs` (`PostToolUse`) **warns** when a secret surfaces in a
    tool *response* (e.g. a command that echoed a token) so it doesn't propagate.
  - `prompt-guard.mjs` (`UserPromptSubmit`) blocks prompt-injection attempts
    that try to exfiltrate secrets.
- **If a secret is exposed:** rotate it *immediately* via the secret manager
  (see `/wingman:incident` — stabilize/ contain means rotate-now, not
  note-it-later). Assume exposed until proven otherwise.
- **Setting a repo secret from this environment:** run
  `gh secret set ANTHROPIC_API_KEY` in the repo root (the value is written
  encrypted and never echoed back). Do not paste the raw key into chat — it
  would live in the transcript.

## What Wingman does NOT do

- It does not read, store, or transmit your secrets. The hooks only *pattern-
  match* for secret *shapes* and deny/warn; they never exfiltrate.
- It does not require any credential to function as a plugin. Every key mention
  in the repo is either a fake fixture, a detection pattern, or documentation.

## Review checklist

- [ ] No live secret committed or pasted.
- [ ] New integration uses env var / secret-manager lookup, not inline value.
- [ ] Exposed key would be rotated, not merely noted.
- [ ] `secret-guard` / `secret-scanner` / `prompt-guard` still wired in
      `hooks/hooks.json`.

## Cited by

- `plugins/wingman/skills/governance/security-checklist/SKILL.md`
