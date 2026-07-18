# Eval: implementation-planning

Tests `plugins/wingman/commands/implementation-planning.md` behaviorally, distinct from `seven-stage-pipeline-e2e.md` (which already covers this stage as part of a whole-pipeline run). The distinctive behaviors under test: does the command (a) gather Discovery/Define/Architecture/UX Flow output into a single task-by-task plan with `wingman:req` markers, (b) produce a plan file with all 7 required sections (Executive Summary, Current State, Problem Statement, Solution Approach, Success Criteria, Timeline, Risks) plus a Plain-Language Summary, and (c) route through `/wingman:boardroom` for the bundled Planning Milestone checkpoint rather than calling `ExitPlanMode` directly?

## Fixture

`evals/fixtures/setup-implementation-planning-fixture.sh <target-dir>` — the base waitlist app with pre-seeded artifacts from all 4 preceding pipeline stages (discovery, define with DEF-001..003, architecture with ARCH-001..003, uxflow skip note).

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with `commands/implementation-planning.md` and the pre-seeded artifacts from all 4 preceding stages.
3. Independently verify the output against the expectations below.

## Expectations

| Check | Expected |
|---|---|
| Bundled plan produced | A single plan file incorporating all 5 planning stages' output, not just this command's own |
| Plan has all 7 required sections | Executive Summary, Current State, Problem Statement, Solution Approach, Success Criteria, Timeline, Risks — all present |
| Plain-Language Summary present | A `## Plain-Language Summary` section at the end, written for the founder (no unexplained jargon) |
| Every task has wingman:req markers | Each plan task carries at least one `wingman:req` marker to a `DEF-*`/`ARCH-*`/`UX-*` ID |
| Routes through boardroom | The plan is submitted to `/wingman:boardroom` for review, not approved directly — checkpoint is written as `bundle: planning-milestone` with `stage` as an array |
| No ExitPlanMode before boardroom | `ExitPlanMode` is only called after the boardroom checkpoint returns a non-`DO NOT SHIP` bottom line |

## Trust level

`verified` — the implementation-planning stage's bundling mechanics is the central structural claim tested by `seven-stage-pipeline-e2e.md`'s Run 1 (2026-07-14) and Run 2 (2026-07-14). Both runs independently confirmed exactly 3 checkpoints (not 7, not 4), the Planning Milestone's bundle shape, and the traceability chain from DEF through plan tasks to source/test markers. Run 2 additionally confirmed the boardroom checkpoint caught real unscripted concerns (6 distinct findings from 8 seats) that were folded back before Build — directly confirming the `boardroom-gate` requirement works with real agent output, not just simulated checkpoint JSON. Promoted to `verified` because two differently-shaped scenarios (a JSON API with no UX layer vs. a user-facing app with full Boardroom dispatch) both confirm the same bundling structure and each independently surfaced different genuine gaps.

## Run log

Covered by `seven-stage-pipeline-e2e.md` Run 1 (2026-07-14) and Run 2 (2026-07-14). No independent implementation-planning-only run yet — the bundling behavior is inherently end-to-end and would not produce additional signal from an isolated test.
