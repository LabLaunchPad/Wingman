# Eval: discovery

Tests `plugins/wingman/commands/pipeline/discovery.md` behaviorally, distinct from `seven-stage-pipeline-e2e.md` (which already covers the discovery stage as part of a whole-pipeline run). The distinctive behaviors under test: does the command (a) ask clarifying questions when the founder's request is vague, focused on business outcomes not technical specifics, (b) avoid escalating technical decisions to the founder (that's architecture's job), and (c) produce a structured discovery artifact flowing into `/wingman:define`?

## Fixture

`evals/fixtures/setup-discovery-fixture.sh <target-dir>` — the base waitlist app with no prior Wingman stage output. Discovery starts from a clean project.

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with `commands/pipeline/discovery.md`, given a deliberately vague founder ask ("add unsubscribe to the waitlist" with no further detail).
3. Independently verify the output against the expectations below.

## Expectations

| Check | Expected |
|---|---|
| Clarifying questions asked | At least one question about business outcomes ("who uses this", "what should happen in the current app without this") |
| No technical questions | No question about frameworks, data models, file layout, or database schema |
| Problem statement produced | A structured output with Problem statement, Target user, Success signal, and Open questions sections |
| Hand-off to define | The output ends by directing to `/wingman:define`, not stopping for approval |
| Project-type consult (added 2026-07-22) | When the founder's ask clearly matches one of `references/org-template/project-types/catalog.md`'s 7 types, the output reflects that type's specific playbook guidance rather than generic advice — and does not force a match when the ask is ambiguous |

## Trust level

`verified` — the discovery-stage behavior is exercised within `seven-stage-pipeline-e2e.md`'s two runs (Run 1 discovered the defect in build-stage code, Run 2 confirmed clean end-to-end with independent discovery questions), and Run 3 (2026-07-18) closed the isolation gap: a dedicated, standalone dispatch with the exact vague ask from this case's own Procedure and no downstream-stage context.

## Run log

Covered by `seven-stage-pipeline-e2e.md` Run 1 (2026-07-14) and Run 2 (2026-07-14) for in-context behavior.

### Run 3 — 2026-07-18 (isolated dispatch, exact scenario from this case's Procedure)

**Setup:** `setup-discovery-fixture.sh`'s clean base fixture (no prior Wingman output). A fresh `general-purpose` subagent was given `commands/pipeline/discovery.md` and the literal ask "add unsubscribe to the waitlist" — nothing else, no other pipeline stage running in the same session, isolating the questioning discipline from any downstream-stage context that might have influenced the two prior in-pipeline runs.

**Result:** asked two business-outcome questions only ("self-serve vs. manual removal for now?", "what does failure look like?") — zero framework/data-model/file-layout/schema questions. Produced the required 4-section structured artifact (Problem statement / Target user / Success signal / Open questions) and handed off directly to `/wingman:define` without stopping for approval, per spec.

**Independently verified** (real filesystem, not the subagent's self-report): `cat docs/wingman/discovery/waitlist-unsubscribe.md` — all 4 sections present with real, specific content (not generic placeholder prose); `grep -iE "framework|database schema|data model|file layout|postgres|mongodb|sql"` against the file returned no matches, confirming no technical question leaked into the output.

**No bugs found this run** — the questioning discipline held in complete isolation, not just as an artifact of the surrounding pipeline context. Promoted to `verified`.

### Run 4 — 2026-07-22 (project-type consult, new behavior added this session)

**Setup:** `setup-discovery-fixture.sh`'s clean base fixture. A fresh `general-purpose` subagent was given `commands/pipeline/discovery.md` and a founder ask deliberately shaped to unambiguously match one of the 7 `references/org-template/project-types/catalog.md` types: "My client hired me to add an unsubscribe feature to their waitlist app. They're paying me for this build — I don't run the business myself." Not told which type this matched or that a match was expected; the subagent was only pointed at `discovery.md` itself, per this case's own Procedure discipline.

**Result:** correctly identified this as "Freelancing delivery," consulted `project-types/freelancing.md` (not told to, inferred from `discovery.md`'s own Step 1 instruction), and folded that playbook's 4 specific points (whose success signal governs sign-off; the client — not the builder — holds ship/no-ship authority; scope should track what was actually paid for; Ship should plan for a clean handoff) into the Discovery output's Target User, Open Questions, and a new "Project type match" section — genuinely distinct content from Run 3's generic scenario, not a coincidental overlap.

**Independently verified** (real filesystem, not the subagent's self-report): `cat docs/wingman/discovery/unsubscribe-feature.md` in the fixture directory — confirmed the file exists with all 4 required sections plus the project-type-match content, and that the specific freelancing-playbook language ("ship/no-ship authority," "Freelancing delivery") appears verbatim, not paraphrased or hallucinated after the fact.

**One process note, not a Wingman defect:** the subagent was instructed (by this eval's own setup, not by `discovery.md`) not to read any Wingman file beyond `discovery.md` itself, so it correctly declined to also execute Step 2's `department-lead-activation`/`management-board-activation` delegation — it flagged this gap explicitly in its own report rather than silently skipping it. This is a testing-scenario artifact, not evidence of a real gap in `discovery.md`.

**No bugs found this run** — the new project-type-consult line produces real, differentiated, playbook-specific output, not a superficial mention.
