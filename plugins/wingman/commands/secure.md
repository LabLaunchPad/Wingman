---
description: Run a dedicated security pass over the built changes, block on anything open, and report the outcome in plain language.
argument-hint: "[optional: specific area to focus the security pass on]"
---

# Wingman: Secure

This stage exists so a founder never has to personally judge whether something is "secure enough" — that call gets made by a dedicated, evidence-based review, and the founder only sees the outcome.

$ARGUMENTS

## Build a threat picture

Use the `department-lead-activation` skill to check the Legal & Security activation signal: if this project touches auth, payments, or personal data, create `dept-legal-security` (if it doesn't exist yet) and delegate this pass to it.

Look at what changed since the last checkpoint (or the whole project, if this is the first security pass) and build a short list of concrete risks — not a generic checklist recitation, but specific to what was actually built:

- Secrets or credentials that could leak (hardcoded, logged, committed).
- Unsanitized input reaching a database query, shell command, or rendered template (injection/XSS).
- Missing or weak authentication/authorization on new endpoints, routes, or actions.
- Sensitive data (customer data, payment info, PII) being over-exposed, logged, or returned somewhere it shouldn't be.
- New third-party dependencies or services that expand what could go wrong, without a clear reason.

If this session has access to Claude Code's built-in `/security-review` capability, run it over the diff and fold its findings into this list rather than duplicating the work.

If the founder has explicitly asked for deeper scrutiny than this standard checklist (e.g. "audit this thoroughly," "make sure this is production-grade"), use the `systematic-auditing` skill for this pass instead of just the list above.

For every risk found, decide: **CLOSED** (mitigated, or a documented accepted risk) or **OPEN** (nothing done about it yet). Store risk entries in a structured **threat register**:

| ID | Risk Description | Status | Owner | Detection Date | Disposition / Acceptance |
|----|------------------|--------|-------|----------------|--------------------------|
| 1 | Hardcoded AWS credentials in source code | OPEN | dept-legal-security | 2026-07-13 | — |
| 2 | SQL injection vulnerability in user input | CLOSED | dept-engineering | 2026-07-13 | Fixed in PR #42, regression test added |
| ... | ... | ... | ... | ... | ... |

The threat register tracks **all risks** with explicit **CLOSED/OPEN statuses**. This implements gsd-plugin's phase-gate pattern: advancement is BLOCKED while **threats_open > 0**.

## The gate

This stage does not pass with open risks. If anything is OPEN:

1. Fix what can be fixed now (following the same test-then-implement discipline as `/wingman:build`).
2. For anything that genuinely can't be fixed right now, present it to the founder in plain language via `AskUserQuestion`: what the risk is, what it would take to fix, and what accepting it as-is would mean for the business. Only the founder can accept a business risk — do not decide this on their behalf. Once the founder decides, append a structured entry to `docs/wingman/founder-todos.md` in their project (create it if it doesn't exist yet, mirroring the `docs/wingman/retros.md` convention) — a one-line risk summary, what accepting it means, and the date — so this decision is scannable in one place instead of buried in a checkpoint's `founder_notes` field.
3. Re-check until every risk is CLOSED (fixed or explicitly accepted).

## Boardroom checkpoint

Run `/wingman:boardroom diff` with a note that this is the security-focused pass, so the `boardroom-security` seat's verdict carries the most weight in the summary. Only an all-clear (or founder-accepted risks) should produce a "ship it" outcome.

Once the boardroom clears this stage, proceed to `/wingman:ship`.

## References

- `skills/security-checklist` — the enforced STRIDE + OWASP + prompt-injection discipline; run it to produce the concrete risk list above.
- `references/threat-register.md` — the full CLOSED/OPEN disposition model and the `threats_open > 0` blocking rule this stage implements.
- `skills/definition-of-done` — the security gate is one column of the standing cross-skill DoD; confirm the rest before declaring secure complete.
