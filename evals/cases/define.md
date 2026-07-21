# Eval: define

Tests `plugins/wingman/commands/pipeline/define.md` behaviorally, distinct from `seven-stage-pipeline-e2e.md` (which already covers the define stage as part of a whole-pipeline run). The distinctive behaviors under test: does the command (a) turn a discovery artifact into scoped `DEF-*`-tagged requirements, (b) avoid over-scoping by requiring each requirement to trace to discovery's problem statement, and (c) produce a structured requirements table flowing into `/wingman:architecture`?

## Fixture

`evals/fixtures/setup-define-fixture.sh <target-dir>` — the base waitlist app with a pre-seeded discovery artifact (`docs/wingman/discovery/waitlist-unsubscribe.md`).

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with `commands/pipeline/define.md` and the pre-seeded discovery artifact.
3. Independently verify the output against the expectations below.

## Expectations

| Check | Expected |
|---|---|
| DEF-* minted | At least one `DEF-001`-style ID in the requirements table |
| Each requirement has rationale | Every `DEF-*` row has a non-empty Rationale column tied to the discovery problem |
| No orphan requirements | No requirement that can't be traced back to the discovery problem statement |
| Hand-off to architecture | The output ends by directing to `/wingman:architecture`, not stopping for approval |

## Trust level

`verified` — the define-stage behavior is exercised within `seven-stage-pipeline-e2e.md`'s two runs (Run 1 confirmed `DEF-001..003` minted and traceability chain resolved, Run 2 confirmed same with a different feature), and Run 3 (2026-07-18) closed the scope-creep gap: a dedicated dispatch against a discovery artifact carrying a deliberate, tempting-but-out-of-scope aside.

## Run log

Covered by `seven-stage-pipeline-e2e.md` Run 1 (2026-07-14) and Run 2 (2026-07-14) for the clean-input, no-temptation case.

### Run 3 — 2026-07-18 (scope-creep temptation, dedicated dispatch)

**Setup:** `setup-define-fixture.sh`'s base fixture with one hand-added sentence appended to the discovery doc's "Open questions" section — a "founder aside" proposing a resubscribe flow and an admin dashboard, explicitly labeled "not part of this problem." Neither prior run's discovery input ever contained a tempting-but-excluded idea; both were clean, in-scope-only inputs.

**Dispatch (fresh `general-purpose` subagent, given only `commands/pipeline/define.md` + the discovery artifact):** correctly minted only `DEF-001`/`DEF-002`, both tracing directly to the real problem statement and success signal, and explicitly excluded the resubscribe/admin-dashboard aside — not silently, but with a written "Flagged, not included as a requirement" note explaining why (out of Discovery's actual scope) and recommending it go through its own Discovery pass. Handed off to `/wingman:architecture` without stopping for approval.

**Independently verified** (real filesystem, not the subagent's self-report): `cat docs/wingman/define/waitlist-unsubscribe.md` — the requirements table has exactly 2 rows (`DEF-001`, `DEF-002`), both traceable to the real problem statement; `grep -iE "resubscribe|admin dashboard"` against the file found matches only inside the "Flagged, not included" prose explaining the exclusion — never inside the `DEF-*` requirements table itself.

**No bugs found this run** — the no-over-scoping discipline held under a genuine temptation, and did so transparently (naming the excluded idea and why) rather than by silent omission. Promoted to `verified`.
