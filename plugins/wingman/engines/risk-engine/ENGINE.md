# Engine: Risk

**Status:** built
**Purpose:** the single risk taxonomy (`references/permission-model.md`'s Level 0-4 scale) and every
mechanical gate that enforces it against a live tool call — secrets, prompt injection, deploy
approval. Split out of the Governance Engine 2026-07-30 (EngineOS reorganization): Governance now
owns the adaptive/retrospective process (triage routing, structural DoD checks, learning loop); this
engine owns the risk scale itself and the real-time gates that check a specific action against it.

## Inputs

Any tool call, at any point in the pipeline, that could touch a trust boundary, secrets, auth,
payments, data, or a deploy-class action.

## Output artifacts

A blocked or allowed tool-call decision (the 5 owned hooks), a risk-tier classification consumed by
`skills/change-triage` (Governance Engine) and `skills/tool-selection` (Tool Runtime Engine).

## Members

- `skills/security-checklist/SKILL.md`
- `hooks/content-injection-scanner.mjs`
- `hooks/deploy-approval-gate.mjs`
- `hooks/prompt-guard.mjs`
- `hooks/secret-guard.mjs`
- `hooks/secret-scanner.mjs`
- `references/permission-model.md`
- `references/prompt-defense-baseline.md`
- `references/secrets-policy.md`
- `references/security-checklist.md`
- `references/threat-register.md`

## State read + written

Reads: the live tool-call payload (`tool_name`/`tool_input`), `.wingman/checkpoints.jsonl`'s most
recent verdict (for `deploy-approval-gate.mjs`'s clean-Boardroom-GO check). Writes: nothing to
project state directly — a blocked/allowed decision returned to the calling hook, never project code.

## Escalation

Anything touching a trust boundary is Level 3+ **by definition** regardless of how it's classified.
Any real `NO_GO` recorded in the checkpoint log blocks a deploy-class action unconditionally — never
softened, never bypassed by configuration.

## Permitted tool tiers

Spans all 5 levels by design (`references/permission-model.md`) — this is the engine that *defines*
the tiers other engines operate within.
