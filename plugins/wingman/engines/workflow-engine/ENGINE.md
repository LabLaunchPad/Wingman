# Engine: Workflow

**Status:** built
**Purpose:** the pipeline's own sequencing and ship-time mechanics — the shared boilerplate every
stage inherits, the gate checklist, and the Ship stage itself. Narrowed 2026-07-30 (EngineOS
reorganization): launch/post-launch moved to the new Operations Engine — "getting a passing change
merged and deployed" (this engine) is distinct from "what happens to it once it's live" (Operations).

## Inputs

A passing Definition-of-Done gate (Engineering Engine) ready to ship.

## Output artifacts

A merged, deployed change (`commands/pipeline/ship.md`).

## Members

- `commands/pipeline/ship.md`
- `skills/git-pr-workflow/SKILL.md`
- `skills/visual-founder-output/SKILL.md`
- `references/pipeline-stage-boilerplate.md`
- `references/pipeline-gate-checklist.md`
- `references/continuous-execution.md`
- `references/visual-output-templates.md`

## State read + written

Reads: Engineering Engine's DoD result. Writes: a merged PR, `.wingman/checkpoints.jsonl`'s Ship.5
checkpoint.

## Escalation

Any Boardroom `NO_GO` recorded in the checkpoint log blocks Ship's deploy-class actions
(`hooks/deploy-approval-gate.mjs`, owned by the Risk Engine) — never soft-bypassed.

## Permitted tool tiers

Conditional (`references/permission-model.md` Level 3) — `git push`/PR creation, gated by a clean
Boardroom verdict.
