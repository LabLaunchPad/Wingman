# Engine: Workflow

**Status:** built
**Purpose:** the pipeline's own sequencing and ship-time mechanics — the shared boilerplate every
stage inherits, the gate checklist, and what happens after Build passes (ship, launch, post-launch).

## Inputs

A passing Definition-of-Done gate (Engineering Engine) ready to ship, or a shipped project ready for
post-launch review.

## Output artifacts

A merged, deployed change (`commands/pipeline/ship.md`), a launch record (`commands/adaptive/launch.md`),
and post-launch findings fed back into the next Discovery pass.

## Members

- `commands/pipeline/ship.md`
- `commands/adaptive/launch.md`
- `commands/adaptive/post-launch.md`
- `skills/git-pr-workflow/SKILL.md`
- `skills/visual-founder-output/SKILL.md`
- `references/pipeline-stage-boilerplate.md`
- `references/pipeline-gate-checklist.md`
- `references/continuous-execution.md`
- `references/visual-output-templates.md`

## State read + written

Reads: Engineering Engine's DoD result. Writes: a merged PR, `.wingman/checkpoints.jsonl`'s Ship.5
checkpoint, real usage/support signals gathered post-launch.

## Escalation

Any Boardroom `NO_GO` recorded in the checkpoint log blocks Ship's deploy-class actions
(`hooks/deploy-approval-gate.mjs`, owned by the Governance Engine) — never soft-bypassed.

## Permitted tool tiers

Conditional (`references/permission-model.md` Level 3) — `git push`/PR creation, gated by a clean
Boardroom verdict.
