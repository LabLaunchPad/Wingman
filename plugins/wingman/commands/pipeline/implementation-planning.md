---
description: Turn all 11 prior pipeline stages' combined output into a concrete, task-by-task implementation plan, then run this stage's own Boardroom checkpoint before any code is written.
argument-hint: "[optional: anything to focus the plan on]"
---

# Wingman: Implementation Planning

The twelfth of Wingman's 14 pipeline stages, immediately followed by `/wingman:build`. As of `docs/ARCHITECTURE.md` §4d's 14-stage pipeline, this stage records only its **own** solo Boardroom checkpoint — it no longer bundles the 5 original planning stages (Discovery/Define/Architecture/UX Flow/Implementation Planning) into one "Planning Milestone" checkpoint. Every one of the 11 prior stages already ran its own checkpoint by the time this stage starts; this stage's checkpoint reviews only the plan this stage itself produces.

$ARGUMENTS

## Write the plan

Gather all 11 prior stage outputs — Discovery, Research Synthesis (`RS-*`), Personas & Jobs (`PJ-*`), Journey Mapping (`JM-*`), the `DEF-*` requirements, Information Architecture (`IA-*`), the `UX-*` flow (if this project has one), Wireframes (`WF-*`), the Visual Design System (`VS-*`), Prototype & Usability findings (`PT-*`), and the `ARCH-*` decisions — into a single concrete implementation plan, reading each by the same short-slug convention (same slug across every `docs/wingman/<stage>/<slug>.md` file in the founder's project). <!-- wingman:req ARCH-001 UX-001 --> Use Wingman's bundled `writing-plans` skill as the bar for quality: exact files, bite-sized tasks, no placeholders, a verification step for every task. Every task must carry at least one `wingman:req` marker (via the `traceability-linking` skill) pointing back to the ID(s) it implements — this is what `dod-structural-gate.mjs` checks for before `/wingman:build`'s checkpoint can clear later, so a task with no traceability marker at this stage will surface as a gap then, not silently.

Enter plan mode (if not already in it). The plan file must include the sections `references/plan-review-checklist.md` requires (Executive Summary, Current State, Problem Statement, Solution Approach, Success Criteria, Timeline, Risks) — Discovery's problem statement and success signal map directly onto `## Problem Statement` and `## Success Criteria`; Architecture's decisions map onto `## Current State`/`## Solution Approach`. It must also end with a **Plain-Language Summary** section, written for the founder:

```markdown
## Plain-Language Summary

**What this builds:** <1-2 sentences, no jargon>
**What changes for your users/business:** <1-2 sentences>
**What could go wrong:** <the single biggest risk, in plain terms>
**Rough size:** <small / medium / large — and roughly how many checkpoints remain (this stage's own checkpoint below, then Build, then Ship — 3 more, regardless of project size)>
```

## Show task dependencies

The plan document itself is never shown to the founder directly — its reader is whoever executes it
(a fresh `build.md` subagent, or a human maintainer). Immediately after the task list (before the
Plain-Language Summary), use `skills/visual-founder-output` to append a `## Task Dependencies`
section per `references/visual-output-templates.md` §5, generated from the plan's own task list —
this defaults to Tier B (Mermaid) regardless of session capability, since a rendered Artifact adds
nothing for this document's actual reader. This is additive to the checkbox task list, not a
replacement — `skills/writing-plans`'s exact-file/exact-step detail still lives in the tasks
themselves.

## Where you are

Use `skills/visual-founder-output` to add the pipeline-status tree (per
`references/visual-output-templates.md` §2), showing all 11 prior stages complete and this stage as
the last one before Build. `boardroom.md`'s own report shows this same tree again once the checkpoint
records — that's expected, not wasted effort: this view is "the plan just finished," the
checkpoint's is "this stage's checkpoint is now recorded," one step later.

## Implementation Planning checkpoint

Do not call `ExitPlanMode` directly and do not hand the founder a raw plan to approve. Instead, run `/wingman:boardroom plan`, telling it explicitly that this checkpoint's scope is **this stage's own plan only** — as of `docs/ARCHITECTURE.md` §4d, this stage no longer bundles the 5 original planning stages into one "Planning Milestone" checkpoint; each of the 11 prior stages already recorded its own checkpoint by the time this stage runs. `boardroom.md` records this as a scalar `"stage": "implementation-planning"` with `"bundle"` set to the same value, same shape as every other stage's checkpoint.

Only once the boardroom checkpoint returns a "ship it" decision should you proceed to `/wingman:build`.

## References

- `skills/writing-plans` — the plan-quality bar.
- `references/plan-review-checklist.md` — the 7 required sections the `boardroom-checkpoint` hook enforces before `ExitPlanMode`.
- `skills/visual-founder-output` + `references/visual-output-templates.md` §5 — the task-dependency
  diagram appended to the plan; §2 — the pipeline-status tree above.
- `skills/traceability-linking` — every task needs at least one marker before `/wingman:build`'s Definition-of-Done gate can clear.

<!-- See docs/ARCHITECTURE.md for this command's place in Wingman's overall architecture. -->
