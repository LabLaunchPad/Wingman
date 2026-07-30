# Engine: Planning

**Status:** built
**Purpose:** turns a grounded vision into a concrete, sequenced, reviewable plan — requirements,
scope, and an implementation sequence a build stage can actually execute.

## Inputs

`DISC-*` findings (Vision Engine) and, where relevant, `RS-*` research findings (Research Engine).

## Output artifacts

`DEF-*` requirement rows (`commands/pipeline/define.md`), `IP-*` plan/task rows and the plan file
itself (`commands/pipeline/implementation-planning.md`), each `Satisfies`-linked back to Discovery.

## Members

- `commands/pipeline/define.md`
- `commands/pipeline/implementation-planning.md`
- `skills/writing-plans/SKILL.md`
- `skills/spec-handler/SKILL.md`
- `references/plan-review-checklist.md`
- `references/spec-handler-pattern.md`

## State read + written

Reads: Vision/Research Engine output. Writes: `.wingman/traceability.json`'s `DEF`/`IP` counters, the
plan file path stated in `commands/pipeline/implementation-planning.md`.

## Escalation

Ambiguous scope or a plan with no clear acceptance criteria is a **Should-ask** at minimum — surface
the alternative and let the founder redirect rather than silently picking one.

## Permitted tool tiers

Draft (`references/permission-model.md` Level 1) — plans are written and reviewed, not executed.
