# Engine: Governance

**Status:** built
**Purpose:** the single risk taxonomy (`references/permission-model.md`'s Level 0-4 scale), the
constitution's 10 rules, and every mechanical gate that enforces them — secrets, injection, deploy
approval, structural DoD checks, and the adaptive/retrospective commands that keep the system honest
over time.

## Inputs

Any change, at any point in the pipeline, that touches a trust boundary, secrets, auth, payments,
data, or a deploy-class action.

## Output artifacts

A routing decision (`skills/change-triage`), a blocked or allowed action (the 6 owned hooks), a
retrospective/learning/evolution record (`retro`/`learn`/`evolve`/`dogfood`/`incident`).

## Members

- `commands/adaptive/retro.md`
- `commands/adaptive/learn.md`
- `commands/adaptive/evolve.md`
- `commands/adaptive/dogfood.md`
- `commands/adaptive/incident.md`
- `skills/department-lead-activation/SKILL.md`
- `skills/management-board-activation/SKILL.md`
- `skills/evolve-promotion/SKILL.md`
- `skills/dogfood-gap-classification/SKILL.md`
- `skills/evidence-gated-catalog/SKILL.md`
- `skills/traceability-linking/SKILL.md`
- `skills/definition-of-done/SKILL.md`
- `skills/security-checklist/SKILL.md`
- `skills/change-triage/SKILL.md`
- `skills/prompt-diff-check/SKILL.md`
- `skills/incident-response/SKILL.md`
- `hooks/content-injection-scanner.mjs`
- `hooks/deploy-approval-gate.mjs`
- `hooks/dod-structural-gate.mjs`
- `hooks/prompt-guard.mjs`
- `hooks/secret-guard.mjs`
- `hooks/secret-scanner.mjs`
- `references/constitution.md`
- `references/permission-model.md`
- `references/prompt-defense-baseline.md`
- `references/secrets-policy.md`
- `references/security-checklist.md`
- `references/threat-register.md`

## State read + written

Reads: every other engine's output for risk-relevant signals. Writes: `.wingman/checkpoints.jsonl`'s
verdict field, blocked/allowed tool-call decisions (never project code directly).

## Escalation

Anything touching a trust boundary is Level 3+ **by definition** regardless of how it's classified —
triage may route work up, never down. Any real `NO_GO` blocks unconditionally; this is never softened.

## Permitted tool tiers

Spans all 5 levels by design (`references/permission-model.md`) — this is the engine that *defines*
the tiers other engines operate within.
