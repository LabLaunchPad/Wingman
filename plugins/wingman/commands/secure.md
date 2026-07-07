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

For every risk found, decide: **CLOSED** (mitigated, or a documented accepted risk) or **OPEN** (nothing done about it yet).

## The gate

This stage does not pass with open risks. If anything is OPEN:

1. Fix what can be fixed now (following the same test-then-implement discipline as `/wingman:build`).
2. For anything that genuinely can't be fixed right now, present it to the founder in plain language via `AskUserQuestion`: what the risk is, what it would take to fix, and what accepting it as-is would mean for the business. Only the founder can accept a business risk — do not decide this on their behalf.
3. Re-check until every risk is CLOSED (fixed or explicitly accepted).

## Boardroom checkpoint

Run `/wingman:boardroom diff` with a note that this is the security-focused pass, so the `boardroom-security` seat's verdict carries the most weight in the summary. Only an all-clear (or founder-accepted risks) should produce a "ship it" outcome.

Once the boardroom clears this stage, proceed to `/wingman:ship`.
