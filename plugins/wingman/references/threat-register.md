# Threat Register (gsd-plugin pattern)

Adapted from `jnuyens/gsd-plugin`'s phase-gate pattern: a threat register with explicit `CLOSED`/`OPEN` dispositions that blocks advancement while `threats_open > 0`. In Wingman this lives inside `/wingman:secure` — the secure stage does not pass while any threat is `OPEN`.

## The rule

> Advancement is blocked while `threats_open > 0`.

Every concrete risk found during a security pass is recorded with an explicit disposition. "I looked at it" is not a disposition. "It's probably fine" is not a disposition.

## Register shape

| ID | Risk Description | Status | Owner | Detection Date | Disposition / Acceptance |
|----|------------------|--------|-------|----------------|--------------------------|
| 1 | Hardcoded AWS credentials in source | OPEN | dept-legal-security | 2026-07-13 | — |
| 2 | SQL injection in user search input | CLOSED | dept-engineering | 2026-07-13 | Fixed in PR #42, regression test added |
| 3 | PII logged at info level | CLOSED | founder | 2026-07-13 | Accepted: needed for support, 30-day retention, masked |

## Dispositions

- **OPEN** — nothing done yet. Blocks advancement. Either fix it or get an explicit founder acceptance.
- **CLOSED (fixed)** — mitigated, with the change referenced (PR/commit) and, where relevant, a regression test.
- **CLOSED (accepted)** — the founder explicitly accepted the business risk via `AskUserQuestion`. Recorded in `docs/wingman/founder-todos.md` with date and what accepting means. Only the founder can accept a business risk.

## Gate behavior

1. Build the list of concrete risks (specific to what was built, not a generic checklist recitation).
2. For each: fix now (test-then-implement, same discipline as `/wingman:build`), or escalate to founder for acceptance.
3. Re-check until every row is `CLOSED`.
4. Only then run the boardroom security checkpoint and proceed to `/wingman:ship`.

## Anti-rationalization

- "It's a low-risk thing, no need to register it" → Low-risk items are exactly the ones that slip through. Register everything; close it in one line.
- "I'll fix it after ship" → After ship there is no gate. `threats_open > 0` means no ship.
- Red flag: the secure stage is about to pass and the register has any `OPEN` row. Block.
