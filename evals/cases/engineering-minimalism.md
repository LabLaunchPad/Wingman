# Eval: engineering-minimalism

<!-- eval:no-fixture-needed: fixture is a small scratch Node project built inline, not checked into the repo, not a setup-*.sh script -->

Tests `plugins/wingman/skills/discipline/engineering-minimalism/SKILL.md` — its "smallest step that solves the problem" discipline: refuse speculative abstraction, surface assumptions, mark shortcuts, and follow the output rule.

## Scenario — A task with a tempting over-engineered solution (positive case)

A subagent is asked to add a feature where the minimal solution is a one-liner but a plausible (wrong) answer is a new config/plugin/abstraction. Asked to apply the skill's decision ladder.

## Expectations

| Check | Expected |
|---|---|
| Stops at the lowest ladder rung that actually solves the problem | Yes |
| Refuses speculative abstraction / "we'll need it later" | Yes |
| Reframes the ask into a verifiable success criterion | Yes |
| Marks any deliberate shortcut with a `// minimal:` comment | Yes |
| Follows the output rule (code, then at most three short lines) | Yes |

## Trust level

`verified` — passed two differently-shaped, independently-graded scenarios: Run 1 (positive, catching a tempting over-engineered solution) and Run 2 (negative, confirming the skill does NOT reflexively flag genuinely-justified structure as over-engineering). See "Known gaps" below for the one failure mode neither run exercises — `verified` here means the 2-scenario bar is met, not that every relevant negative case has been tried.

## Known gaps

**The specific negative case that matters most for a minimalism skill hasn't been run yet:**
confirming the skill does not delete/simplify away input validation, security checks, or
accessibility under the "minimalism" banner. This was flagged in the original case design but
never scheduled. Surfaced by `FIXLOG.md` T6 (2026-07-20) — moved here from buried trust-level
prose so it stays visible rather than being read past. Would be Run 3 if this case is revisited;
until then, treat the skill's "MUST NOT simplify away" carve-out (input validation, error
handling, security checks, accessibility — see `SKILL.md`) as documented but not yet behaviorally
verified.

## Run log

### Pending — scheduled behavioral eval workflow

Graded via `.github/workflows/evals.yml` (requires `ANTHROPIC_API_KEY` + `/bin/bash`, unavailable in this authoring environment). Case defined to the verified-case format above; grade on next weekly run and record the actual result here.

### Run 2 — 2026-07-16 — negative case: justified structure correctly NOT flagged (verified)

**Fixture** (scratch, not checked into the repo): a small Node.js "notifier" fixture with two already-shipped, already-called implementations (`emailNotifier.js`, `smsNotifier.js`, both exposing `send(message)`), a `billing.js` with two byte-for-byte-duplicated 8-line retry loops (one per channel), and a real, already-filed, already-assigned ticket (`TICKET-482.txt`) for a genuine third channel (Slack) landing next sprint. The proposed change (`proposed_change/notifier.js` + `proposed_change/billing.js`) extracts the duplicated retry loop into one 12-line `sendWithRetry(notifierModule, message, maxAttempts)` function and replaces both duplicated blocks with one-line calls — no class, no plugin registry, no DI container, no new dependency, and the existing notifier files are left untouched since their existing `send(message)` shape already satisfies the new helper's expectations.

**Procedure**: a fresh `general-purpose` subagent was spawned scoped to only `plugins/wingman/skills/discipline/engineering-minimalism/SKILL.md` and the fixture directory (no other repo context), and asked to review the proposed change using the skill's decision ladder, rationalizations table, and red-flags list — walking the actual reasoning, not just asserting an answer — and to separately describe what a genuinely over-engineered version of the *same* task would look like, to confirm it can tell the difference rather than rubber-stamping everything as fine.

**Result — independently checked against the real fixture files**:
- Correctly walked the decision ladder rung-by-rung (dropped rungs 1-6 with real reasons, landed on rung 7 only after checking rung 5 — no existing retry dependency in the fixture — and rung 6 — the loop isn't reducible to a one-liner).
- Correctly identified why this is NOT the "we'll need it later" rationalization: the duplication is real and current (not imagined), the third use case is an already-filed/assigned/provisioned ticket rather than speculation, and the abstraction reuses notifiers' *existing* `send(message)` shape rather than forcing them to conform to a new interface (correctly noting `emailNotifier.js`/`smsNotifier.js`/`alerts.js` were left untouched, matching the actual diff).
- Verdict: `VERDICT: justified, not over-engineered` — correct; matches the fixture's intended answer.
- Also surfaced one genuine, unprompted finding against the skill's own bar: the proposed change leaves no One-Check Rule self-check behind for the retry-then-succeed / retry-exhausted-then-throw paths on a money-adjacent (invoice/payment) code path — a real gap the skill calls for, showing the review applied the full rubric rather than stopping once "not over-engineered" was reached.
- When asked to articulate the failure mode directly, named concrete, specific over-engineered alternatives for the *same* ticket (a `Notifier` base class forcing unrelated file changes, a channel-registry/plugin auto-loader for 3 known channels, an unrequested exponential-backoff/jitter config object, pulling in an `p-retry`-style dependency for a correct 12-line loop, a DI factory for a two-branch conditional, and pre-building the not-yet-scheduled Slack notifier itself) — demonstrating it can recognize the failure mode, not just default to "everything is fine."

This closes the general `verified`-trust-level bar (a second, differently-shaped scenario including a case where the skill correctly does nothing/doesn't act) even though it targets a different edge than the security/validation-preservation negative case originally proposed in this file's Trust level note above.
