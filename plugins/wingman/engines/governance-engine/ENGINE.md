# Engine: Governance

**Status:** built
**Purpose:** the adaptive process discipline that keeps the system honest over time — change triage
routing, structural Definition-of-Done checks, and the retrospective/learning/evolution loop
(department/board activation, evolve-promotion, dogfood-gap-classification). Narrowed 2026-07-30
(EngineOS reorganization): the risk taxonomy and its real-time enforcement hooks moved to the new
Risk Engine, the constitution's 10 rules moved to the new Constitution Engine, and the traceability
chain moved to the new Graph Engine — this engine now owns *process*, not the rules/scale those
processes check against.

## Inputs

A proposed change needing routing (`skills/change-triage`), a `git push` needing a structural
artifact-presence check, or a periodic learning/retrospective/dogfooding pass.

## Output artifacts

A routing decision (`skills/change-triage`), a blocked or allowed `git push` (`dod-structural-gate.mjs`),
a retrospective/learning/evolution record (`retro`/`learn`/`evolve`/`dogfood`).

## Members

- `commands/adaptive/retro.md`
- `commands/adaptive/learn.md`
- `commands/adaptive/evolve.md`
- `commands/adaptive/dogfood.md`
- `skills/department-lead-activation/SKILL.md`
- `skills/management-board-activation/SKILL.md`
- `skills/evolve-promotion/SKILL.md`
- `skills/dogfood-gap-classification/SKILL.md`
- `skills/evidence-gated-catalog/SKILL.md`
- `skills/definition-of-done/SKILL.md`
- `skills/change-triage/SKILL.md`
- `skills/prompt-diff-check/SKILL.md`
- `hooks/dod-structural-gate.mjs`

## State read + written

Reads: every other engine's output for process-relevant signals (test presence, threat-register
cleanliness, checkpoint verdict history). Writes: `LEARNINGS.md`/`docs/history/retros.md` entries,
blocked/allowed `git push` decisions (never project code directly).

## Escalation

Anything touching a trust boundary is Level 3+ **by definition** regardless of how it's classified —
triage may route work up, never down (the risk scale itself is the Risk Engine's; this engine only
applies it at the routing step). A structural DoD failure blocks the push and names the specific
missing artifact, never a generic "not ready."

## Permitted tool tiers

Draft (`references/permission-model.md` Level 1) for triage/retro/learn; the `git push` block itself
is enforced at Conditional (Level 3), composed with the Risk Engine's own gate, not a second scale.
