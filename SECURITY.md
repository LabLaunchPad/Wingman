# Security Policy

Wingman is a Claude Code plugin — markdown commands/agents/skills plus a hooks config, with no
application server, database, or user-facing web surface of its own. The relevant security surface
is: the executable hooks/scripts under `plugins/wingman/hooks/` and `plugins/wingman/scripts/`, the
CI workflows under `.github/workflows/`, and the guidance the skills give agents about handling
secrets (`references/secrets-policy.md`, the `secret-guard`/`secret-scanner`/`prompt-guard` hooks).

## Reporting a vulnerability

**Do not open a public GitHub issue for a security vulnerability.** Instead, use
[GitHub's private security advisory form](https://github.com/LabLaunchPad/Wingman/security/advisories/new)
for this repository. Include:

- The affected file(s) (a hook, script, or workflow — not a documentation/skill-content issue, which
  isn't a security report even if it's a real bug).
- Exact reproduction steps and, where possible, the real command output demonstrating the issue.
- The potential impact (what an attacker could actually do, not just "this looks unsafe").

## Scope

In scope: command injection, path traversal, secret exposure, or unsafe deserialization in anything
under `plugins/wingman/hooks/`, `plugins/wingman/scripts/`, `scripts/`, `evals/run-headless.mjs`, or
`.github/workflows/`. Also in scope: a hook silently failing to enforce a safety gate it claims to
enforce (this project has a real history of exactly that failure mode — see `docs/ARCHITECTURE.md`'s
version history — and treats it as a security-relevant defect, not just a bug).

Out of scope: the content/advice inside skill or command markdown files (file a regular bug report
for those), and vulnerabilities in the 16 vendored reference repositories under `vendor/` (report
those upstream — Wingman only reads them as design inspiration, nothing depends on their runtime).
