# Eval: uxflow

Tests `plugins/wingman/commands/uxflow.md` behaviorally, distinct from `seven-stage-pipeline-e2e.md` (which already covers the uxflow stage as part of a whole-pipeline run). The distinctive behaviors under test: does the command (a) produce a UX-*-tagged flow table with screen/state descriptions, (b) render the same information as a visual flow diagram using `visual-founder-output`, and (c) skip cleanly for projects with no user-facing surface (pure API, CLI) rather than manufacturing screens?

## Fixture

`evals/fixtures/setup-uxflow-fixture.sh <target-dir>` — the base waitlist app (a JSON API, no user-facing surface) with pre-seeded discovery, define (DEF-001..003), and architecture (ARCH-001..003) artifacts.

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with `commands/uxflow.md` and the pre-seeded ARCH-* decisions.
3. Independently verify the output against the expectations below.

## Expectations

| Check | Expected |
|---|---|
| Graceful skip for non-UI project | A plain-language sentence saying "this project has no user-facing surface, skipping UX flow" — NOT a manufactured screen table |
| No UX-* minted | The flow table is absent (or empty) for a pure-API project |
| Flow produced for UI project | When given a UI fixture, a UX-* table and a visual flow diagram are produced |
| Hand-off to implementation-planning | The output ends by directing to `/wingman:implementation-planning`, not stopping for approval |

## Trust level

`provisional` — the skip-for-non-UI path is confirmed by `seven-stage-pipeline-e2e.md` Run 1 (2026-07-14, waitlist-app JSON API had no UX-* IDs minted), and the produce-flow path is confirmed by Run 2 (2026-07-14, Tip Jar feature produced UX-* IDs with diagrams). A dedicated subagent-driven run against a project with an explicit UI vs. no-UI choice to make would strengthen confidence in the skip/no-skip judgment.

## Run log

Covered by `seven-stage-pipeline-e2e.md` Run 1 (2026-07-14) and Run 2 (2026-07-14). No independent uxflow-only run yet — see Trust level above.
