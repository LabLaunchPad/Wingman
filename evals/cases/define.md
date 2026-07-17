# Eval: define

<!-- eval:no-fixture-needed: the distinctive behavior under test (scoping requirements with traceability IDs, avoiding scope-creep) is exercised end to end by seven-stage-pipeline-e2e.md's two differently-shaped runs — a dedicated fixture would test the same paths with no additional signal -->

Tests `plugins/wingman/commands/define.md` behaviorally, distinct from `seven-stage-pipeline-e2e.md` (which already covers the define stage as part of a whole-pipeline run). The distinctive behaviors under test: does the command (a) turn a discovery artifact into scoped `DEF-*`-tagged requirements, (b) avoid over-scoping by requiring each requirement to trace to discovery's problem statement, and (c) produce a structured requirements table flowing into `/wingman:architecture`?

## Procedure

1. Run the `setup-waitlist-app.sh` fixture to get a real project.
2. Spawn a fresh subagent with `commands/define.md` and a pre-seeded discovery artifact (`docs/wingman/discovery/waitlist-unsubscribe.md` written by discovery's template).
3. Independently verify the output against the expectations below.

## Expectations

| Check | Expected |
|---|---|
| DEF-* minted | At least one `DEF-001`-style ID in the requirements table |
| Each requirement has rationale | Every `DEF-*` row has a non-empty Rationale column tied to the discovery problem |
| No orphan requirements | No requirement that can't be traced back to the discovery problem statement |
| Hand-off to architecture | The output ends by directing to `/wingman:architecture`, not stopping for approval |

## Trust level

`provisional` — the define-stage behavior is exercised within `seven-stage-pipeline-e2e.md`'s two runs (Run 1 confirmed `DEF-001..003` minted and traceability chain resolved, Run 2 confirmed same with a different feature). A dedicated subagent-driven run against a fixture with a scope-creep temptation (a requirement not traceable to the discovery output) would strengthen confidence in the no-over-scoping discipline.

## Run log

Covered by `seven-stage-pipeline-e2e.md` Run 1 (2026-07-14) and Run 2 (2026-07-14). No independent define-only run yet — see Trust level above.
