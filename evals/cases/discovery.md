# Eval: discovery

Tests `plugins/wingman/commands/discovery.md` behaviorally, distinct from `seven-stage-pipeline-e2e.md` (which already covers the discovery stage as part of a whole-pipeline run). The distinctive behaviors under test: does the command (a) ask clarifying questions when the founder's request is vague, focused on business outcomes not technical specifics, (b) avoid escalating technical decisions to the founder (that's architecture's job), and (c) produce a structured discovery artifact flowing into `/wingman:define`?

## Fixture

`evals/fixtures/setup-discovery-fixture.sh <target-dir>` — the base waitlist app with no prior Wingman stage output. Discovery starts from a clean project.

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with `commands/discovery.md`, given a deliberately vague founder ask ("add unsubscribe to the waitlist" with no further detail).
3. Independently verify the output against the expectations below.

## Expectations

| Check | Expected |
|---|---|
| Clarifying questions asked | At least one question about business outcomes ("who uses this", "what should happen in the current app without this") |
| No technical questions | No question about frameworks, data models, file layout, or database schema |
| Problem statement produced | A structured output with Problem statement, Target user, Success signal, and Open questions sections |
| Hand-off to define | The output ends by directing to `/wingman:define`, not stopping for approval |

## Trust level

`verified` — the discovery-stage behavior is exercised within `seven-stage-pipeline-e2e.md`'s two runs (Run 1 discovered the defect in build-stage code, Run 2 confirmed clean end-to-end with independent discovery questions), and Run 3 (2026-07-18) closed the isolation gap: a dedicated, standalone dispatch with the exact vague ask from this case's own Procedure and no downstream-stage context.

## Run log

Covered by `seven-stage-pipeline-e2e.md` Run 1 (2026-07-14) and Run 2 (2026-07-14) for in-context behavior.

### Run 3 — 2026-07-18 (isolated dispatch, exact scenario from this case's Procedure)

**Setup:** `setup-discovery-fixture.sh`'s clean base fixture (no prior Wingman output). A fresh `general-purpose` subagent was given `commands/discovery.md` and the literal ask "add unsubscribe to the waitlist" — nothing else, no other pipeline stage running in the same session, isolating the questioning discipline from any downstream-stage context that might have influenced the two prior in-pipeline runs.

**Result:** asked two business-outcome questions only ("self-serve vs. manual removal for now?", "what does failure look like?") — zero framework/data-model/file-layout/schema questions. Produced the required 4-section structured artifact (Problem statement / Target user / Success signal / Open questions) and handed off directly to `/wingman:define` without stopping for approval, per spec.

**Independently verified** (real filesystem, not the subagent's self-report): `cat docs/wingman/discovery/waitlist-unsubscribe.md` — all 4 sections present with real, specific content (not generic placeholder prose); `grep -iE "framework|database schema|data model|file layout|postgres|mongodb|sql"` against the file returned no matches, confirming no technical question leaked into the output.

**No bugs found this run** — the questioning discipline held in complete isolation, not just as an artifact of the surrounding pipeline context. Promoted to `verified`.
