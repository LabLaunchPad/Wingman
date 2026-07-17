# Eval: discovery

<!-- eval:no-fixture-needed: the distinctive behavior under test (does the command ask the right clarifying questions without escalating technical decisions) is exercised end to end by seven-stage-pipeline-e2e.md's two differently-shaped runs — a dedicated fixture would test the same paths with no additional signal -->

Tests `plugins/wingman/commands/discovery.md` behaviorally, distinct from `seven-stage-pipeline-e2e.md` (which already covers the discovery stage as part of a whole-pipeline run). The distinctive behaviors under test: does the command (a) ask clarifying questions when the founder's request is vague, focused on business outcomes not technical specifics, (b) avoid escalating technical decisions to the founder (that's architecture's job), and (c) produce a structured discovery artifact flowing into `/wingman:define`?

## Procedure

1. Run the `setup-waitlist-app.sh` fixture to get a real project.
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

`provisional` — the discovery-stage behavior is exercised within `seven-stage-pipeline-e2e.md`'s two runs (Run 1 discovered the defect in build-stage code, Run 2 confirmed clean end-to-end with independent discovery questions). A dedicated subagent-driven run against a fixture with a specifically vague founder ask would strengthen confidence in the questioning discipline in isolation from the downstream stages.

## Run log

Covered by `seven-stage-pipeline-e2e.md` Run 1 (2026-07-14) and Run 2 (2026-07-14). No independent discovery-only run yet — see Trust level above.
