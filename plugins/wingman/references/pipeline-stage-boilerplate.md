# Pipeline Stage Boilerplate

Shared explanatory prose that several `commands/pipeline/*.md` stages repeat verbatim around the
same two mechanical checks. Extracted here so each stage file states only what's specific to it
(which department/manager roles apply) and points here for the shared "why" — the actual skill
invocations stay inline in each command file; this doc never replaces them, only the boilerplate
prose that used to surround them. See `docs/ARCHITECTURE.md` §5 for the department-lead/management-
board model this documents the mechanics of.

## Activation Checks

**Management Board activation.** Every pipeline stage that just activated (or confirmed active) a
department lead immediately follows with a Management Board check: use the
`management-board-activation` skill to check whether this project has crossed the 3+
conditionally-activated-department-lead complexity threshold — **Design/Data/Legal-Security/DevOps/
Growth only**, never counting the always-active Product/Engineering/QA. If the project has crossed
that threshold, whichever manager role(s) correspond to the department lead(s) this stage just
touched may need creating — each stage file names its own specific manager(s) (e.g. `mgr-product`,
`mgr-engineering`, `mgr-design`, `mgr-platform`) since that mapping differs stage to stage.

**Department-lead activation.** Each pipeline stage checks its own relevant department-lead
activation signal(s) via the `department-lead-activation` skill before doing the stage's actual
work, and delegates that work to the department lead once it exists rather than doing it directly
as the command itself. Which signal(s) apply, and which department(s), is stage-specific — see each
command file's own "Confirm the ... department is active" step for the exact signal it checks.

## Where You Are

Most pipeline stages end (or begin, for `build.md`/`ship.md`) with the same visual step: use
`skills/visual-founder-output` to add the pipeline-status tree (all 14 stages, nested under their
6 Phase groups, per `references/visual-output-templates.md` §2) showing which stages are complete
and which is current. This is generated fresh from the project's own state each time, never
hand-authored, and is additive to whatever else that stage produced — it never replaces a stage's
own output (a requirements table, a plan, a diff).

## Referenced by

- `commands/pipeline/discovery.md`
- `commands/pipeline/define.md`
- `commands/pipeline/architecture.md`
- `commands/pipeline/uxflow.md`
- `commands/pipeline/implementation-planning.md`
- `commands/pipeline/build.md`
- `commands/pipeline/ship.md`
- `commands/pipeline/build.md`
- `commands/pipeline/ship.md`
