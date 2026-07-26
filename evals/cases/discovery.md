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

`verified` — Run 6 (2026-07-26) confirmed the Step 3 8-field template and the Gate checklist's 8
Must-include items now genuinely correspond one-to-one, and that a template-compliant Discovery
output draws zero "missing sections" false positives from four independent reviewers spanning the
same seat archetypes (CEO, CPO, CTO, Research) that mis-flagged the old 4-field output in Run 5.
Promoted back from `provisional` (was `verified`; downgraded by Run 5, 2026-07-25/26's real
template/gate-checklist mismatch finding — see Run 5). The discovery-stage behavior is also
exercised within `seven-stage-pipeline-e2e.md`'s two runs (Run 1 discovered the defect in
build-stage code, Run 2 confirmed clean end-to-end with independent discovery questions), and Run 3
(2026-07-18) closed the isolation gap: a dedicated, standalone dispatch with the exact vague ask
from this case's own Procedure and no downstream-stage context.

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

### Run 5 — 2026-07-25/26 (14-stage dogfood run, real gap found and fixed) — `provisional`

**Setup:** first-ever real 14-stage-pipeline dogfood run (`evals/dogfood-runs/2026-07-25T19-45-00Z-14stage-complex.json`), a real "fetch-app" fixture (dog meal-plan subscriptions). Not this case's own isolated dispatch — found while executing the real Discovery stage as one stage of the full run.

**Real gap found:** this stage's own Step 3 output template (4 fields: Problem statement / Target
user / Success signal / Open questions) and its Gate checklist a few lines below (8 Must-include
items) had drifted out of sync — the template never grew the other 4 fields
(jobs-to-be-done/trigger-why-now/constraints/scope-boundary/solo-founder-realism-check) that the
gate demands. A real 8-seat Boardroom dispatch against a template-compliant Discovery output
independently caught this: 3 of 8 seats (CEO, CPO, CTO, Research) flagged "missing sections" on
output that matched the template exactly.

**Fix:** the Step 3 template now includes all 8 fields, with a note explaining why (this exact
finding), so the template and gate stay in sync going forward.

**Status:** `provisional` at the time — fixed and reproduced against the same finding, but not yet
confirmed by a second, independent run. See Run 6 below for that confirmation.

### Run 6 — 2026-07-26 (isolated dispatch against the fixed 8-field template, plus a 4-reviewer gate check) — `verified`

**Setup:** first, direct line-by-line verification (not taken on faith from the retro) that the
current `discovery.md` Step 3 template and its Gate checklist's Must-include list actually
correspond: Step 3's template has 9 labeled fields (Problem statement, Target user, Success signal,
Open questions, Jobs-to-be-done notes, Trigger/why-now, Constraints, Scope boundary, Solo-founder
realism check); the Gate checklist's 8 Must-include items (problem statement, user statement,
jobs-to-be-done notes, trigger/why-now, constraints, success criteria, scope boundary, solo-founder
realism check) map onto 8 of those 9 fields under a different label in two cases (`Target user` ↔
"user statement", `Success signal` ↔ "success criteria") — a soft, not literal, match. `Open
questions` is the one template field with no directly corresponding Must-include item (it was in
the original 4-field template and was kept, not required by the gate). This labeling looseness is
exactly the kind of thing worth stress-testing, not just eyeballing, since Run 5's whole finding was
independent reviewers reading the same content differently.

Then a genuinely different scenario from Runs 3-5: a fresh, unbriefed `general-purpose` subagent was
given `commands/pipeline/discovery.md` and a new founder ask never used before in this case
("subscription tool for freelance photographers: clients log in to a private watermarked proof
gallery and pay monthly to unlock full-res downloads; founder is building it as their own product,
not for a client") against the clean `setup-discovery-fixture.sh` base. This is a Mini SaaS-shaped
idea (project-type catalog match), distinct from Run 3's vague ask, Run 4's Freelancing-delivery
match, and Run 5's real fetch-app dogfood scenario.

**Result:** the subagent asked 3 plain business-outcome clarifying questions (who pays whom — a
genuine one-way-door billing-architecture question — what happens on non-payment, who owns pricing)
with zero technical/framework/data-model questions, correctly matched "Mini SaaS" from
`references/org-template/project-types/catalog.md` (explicitly ruling out Freelancing delivery
since the founder owns the product), and wrote all 9 Step-3 fields with real, specific,
non-generic content to
`docs/wingman/discovery/photographer-gallery-subscription.md` in the fixture directory.

**Independently verified** (real filesystem, not the subagent's self-report):
`cat docs/wingman/discovery/photographer-gallery-subscription.md` — confirmed directly, not
paraphrased: the file has all 9 fields (`**Problem statement:**` through
`**Solo-founder realism check:**`), each with concrete, ask-specific prose (e.g. the constraints
field: "recurring billing and payment processing (Stripe or equivalent) is now a hard product
requirement, not optional; image storage/serving at scale ... has real, ongoing hosting-cost
implications"), no boilerplate placeholders remaining.

**Gate-check test (the actual edge Run 5's bug hit):** four independent, unbriefed
`general-purpose` reviewer subagents — one per the same seat archetype named in Run 5's finding
(CEO, CPO, CTO, Research) — were each given only the Gate checklist's 8 Must-include items and this
produced file, and asked to mark each item PASS/MISSING with a supporting quote, explicitly told not
to require literal-string label matches. All four returned a clean sweep with zero MISSING items and
an overall PASS verdict. Representative quotes: the CEO reviewer marked "Success criteria — PASS
... Labeled 'Success signal' rather than 'success criteria' verbatim, but it's a concrete, testable
definition of done ... substance is present"; the CPO reviewer: "All eight required elements are
present with real substantive content ... No missing items"; the CTO reviewer: "All eight
must-include items are present with substantive content. No missing items"; the Research reviewer:
"All eight required sections are present with substantive, non-boilerplate content ... No missing
items; no blocking gaps." This directly reproduces Run 5's test shape (independent reviewers judging
a template-compliant doc against the same checklist) with the opposite, correct outcome.

**Bug found in the fix's own execution:** none. The one honest residual gap noted above (`Open
questions` has no literal Must-include counterpart, and two fields use gate-vs-template label
variants) did not cause any reviewer to false-positive, because reviewers were told to check
substance, not literal wording — which matches how the real Boardroom checkpoint in `discovery.md`
is specified ("confirms every Must-include item is present," not "confirms every label matches
verbatim"). Worth a documentation-only follow-up someday (aligning `Success signal`/`success
criteria` and `Target user`/`user statement` wording) but this is a non-blocking polish item, not a
functional gap — logging it here rather than silently closing the loop.

**Promoted to `verified`.**
