# Engine: Knowledge

**Status:** built (searchability layer deferred — see PR8)
**Purpose:** indexes and exports what Wingman knows about a project so a founder or another tool can
find it without knowing the internal file layout.

## Inputs

The plugin's own `references/` catalog, or a project's `.wingman/` state ready for export.

## Output artifacts

`doc-index`'s navigation surface over `references/`; an Open Knowledge Format (OKF v0.1) export bundle
at `.wingman/okf-export/` (`commands/adaptive/knowledge-export.md`).

## Members

- `commands/adaptive/knowledge-export.md`
- `skills/doc-index/SKILL.md`

## State read + written

Reads: `references/*`, `.wingman/checkpoints.jsonl`, `memory/*.md`. Writes: `.wingman/okf-export/`.

## Escalation

None load-bearing today — this engine is read/export only.

## Permitted tool tiers

Read-only (`references/permission-model.md` Level 0).

## Not yet built (PR8)

A generated searchable index over `references/` with a zero-dependency query script (same shape as
`scripts/query-founder-knowledge.mjs`) — deferred to keep this engine's scope to what's shipped today.
Semantic/vector search stays out of the shipped plugin entirely (`install-smoke.yml` asserts
`node_modules` never appears); that variant already exists in `agnostic-boardroom/`, deliberately
outside this engine's scope.
