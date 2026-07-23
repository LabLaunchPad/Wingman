---
description: Turn Discovery/Define/Architecture/UX Flow's combined output into a concrete, task-by-task implementation plan, then run the single Planning Milestone Boardroom checkpoint before any code is written.
argument-hint: "[optional: anything to focus the plan on]"
---

# Wingman: Implementation Planning

The fifth and last of Wingman's 5 planning stages (Discovery → Define → Architecture → UX Flow → Implementation Planning), immediately followed by `/wingman:build`. This is the only planning stage that runs a Boardroom checkpoint — reviewing the combined output of all 5 stages as one "Planning Milestone," not five separate approvals. A founder should never have to clear 5 checkpoints just to get to the first line of code.

$ARGUMENTS

## Write the plan

Gather the Discovery output, the `DEF-*` requirements, the `ARCH-*` decisions, and the `UX-*` flow (if this project has one) into a single concrete implementation plan. <!-- wingman:req ARCH-001 UX-001 --> Use Wingman's bundled `writing-plans` skill as the bar for quality: exact files, bite-sized tasks, no placeholders, a verification step for every task. Every task must carry at least one `wingman:req` marker (via the `traceability-linking` skill) pointing back to the `DEF-*`/`ARCH-*`/`UX-*` ID(s) it implements — this is what `dod-structural-gate.mjs` checks for before `/wingman:build`'s checkpoint can clear later, so a task with no traceability marker at this stage will surface as a gap then, not silently.

Enter plan mode (if not already in it). The plan file must include the sections `references/plan-review-checklist.md` requires (Executive Summary, Current State, Problem Statement, Solution Approach, Success Criteria, Timeline, Risks) — Discovery's problem statement and success signal map directly onto `## Problem Statement` and `## Success Criteria`; Architecture's decisions map onto `## Current State`/`## Solution Approach`. It must also end with a **Plain-Language Summary** section, written for the founder:

```markdown
## Plain-Language Summary

**What this builds:** <1-2 sentences, no jargon>
**What changes for your users/business:** <1-2 sentences>
**What could go wrong:** <the single biggest risk, in plain terms>
**Rough size:** <small / medium / large — and roughly how many checkpoints to expect (Planning Milestone, Build, Ship — 3 total, regardless of project size)>
```

## Show task dependencies

The plan document itself is never shown to the founder directly — its reader is whoever executes it
(a fresh `build.md` subagent, or a human maintainer). Immediately after the task list (before the
Plain-Language Summary), use `skills/output/visual-founder-output` to append a `## Task Dependencies`
section per `references/visual-output-templates.md` §5, generated from the plan's own task list —
this defaults to Tier B (Mermaid) regardless of session capability, since a rendered Artifact adds
nothing for this document's actual reader. This is additive to the checkbox task list, not a
replacement — `skills/discipline/writing-plans`'s exact-file/exact-step detail still lives in the tasks
themselves.

## Where you are

Use `skills/output/visual-founder-output` to add the pipeline-status tree (mid-planning variant, per
`references/visual-output-templates.md` §2), showing all 5 planning sub-stages complete and this
stage as the last one before the checkpoint. `boardroom.md`'s own report shows this same tree again
once the checkpoint records — that's expected, not wasted effort: this view is "planning just
finished," the checkpoint's is "the milestone is now recorded," one step later.

## Planning Milestone checkpoint

Do not call `ExitPlanMode` directly and do not hand the founder a raw plan to approve. Instead, run `/wingman:boardroom plan`, telling it explicitly that this checkpoint's scope is the **bundled output of all 5 planning stages** (Discovery/Define/Architecture/UX Flow/Implementation Planning), not just this stage alone — `boardroom.md` records this as `"bundle": "planning-milestone"` with `"stage"` as an array of all 5 stage names, not a single scalar. The founder approves or sends back changes through that one plain-language checkpoint, not by reading five separate stage documents.

Only once the boardroom checkpoint returns a "ship it" decision should you proceed to `/wingman:build`.

## References

- `skills/discipline/writing-plans` — the plan-quality bar.
- `references/plan-review-checklist.md` — the 7 required sections the `boardroom-checkpoint` hook enforces before `ExitPlanMode`.
- `skills/output/visual-founder-output` + `references/visual-output-templates.md` §5 — the task-dependency
  diagram appended to the plan; §2 — the pipeline-status tree above.
- `skills/governance/traceability-linking` — every task needs at least one marker before `/wingman:build`'s Definition-of-Done gate can clear.

<!-- See docs/ARCHITECTURE.md for this command's place in Wingman's overall architecture. -->


---

## Harness note: OpenCode (auto-generated by `generate-harness-adapters.mjs` -- do not hand-edit)

This file is a generated copy of the canonical Claude Code source. It references the following Claude-Code-specific mechanism(s); here is the real OpenCode equivalent:

- **ExitPlanMode**: OpenCode's real analog is the `plan_exit` tool (confirmed: opencode.ai/docs). The gating logic this canonical file assumes (`boardroom-checkpoint.mjs`'s ExitPlanMode hook) is ported as a real OpenCode plugin at `references/harness-adapters/opencode/.opencode/plugin/wingman-gate.js` -- wire that plugin in rather than re-deriving the gate.
