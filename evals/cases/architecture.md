# Eval: architecture

<!-- eval:no-fixture-needed: the distinctive behavior under test (making technical decisions without asking the founder, producing ARCH-* decisions chained to DEF-* requirements) is exercised end to end by seven-stage-pipeline-e2e.md's two differently-shaped runs — a dedicated fixture would test the same paths with no additional signal -->

Tests `plugins/wingman/commands/architecture.md` behaviorally, distinct from `seven-stage-pipeline-e2e.md` (which already covers the architecture stage as part of a whole-pipeline run). The distinctive behaviors under test: does the command (a) make technical decisions (data model, file boundaries) without escalating to the founder, (b) tag each decision with an `ARCH-*` ID chained back to the `DEF-*` requirement it satisfies, and (c) check for related existing code before proposing something new (reuse-over-reinvention)?

## Procedure

1. Run the `setup-waitlist-app.sh` fixture to get a real project.
2. Spawn a fresh subagent with `commands/architecture.md` and pre-seeded DEF-* requirements (from a completed define stage).
3. Independently verify the output against the expectations below.

## Expectations

| Check | Expected |
|---|---|
| ARCH-* minted chained to DEF-* | Each `ARCH-*` row has a non-empty `Satisfies` column naming its `DEF-*` ID(s) |
| No founder-level technical escalation | No framework, data-model, or file-layout question posed to the founder |
| Reuse consideration | At least one decision notes what existing code was extended rather than creating something new from scratch |
| Hand-off to uxflow | The output ends by directing to `/wingman:uxflow`, not stopping for approval |

## Trust level

`provisional` — the architecture-stage behavior is exercised within `seven-stage-pipeline-e2e.md`'s two runs (Run 1 confirmed `ARCH-001..003` with `Satisfies` → `DEF-*` chain, Run 2 confirmed same with a different feature). A dedicated subagent-driven run with a specific reuse-temptation (a feature that could extend existing code or be built in parallel) would strengthen confidence in the reuse-over-reinvention check.

## Run log

Covered by `seven-stage-pipeline-e2e.md` Run 1 (2026-07-14) and Run 2 (2026-07-14). No independent architecture-only run yet — see Trust level above.
