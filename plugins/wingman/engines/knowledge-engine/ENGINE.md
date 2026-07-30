# Engine: Knowledge

**Status:** built
**Purpose:** indexes and exports what Wingman knows about a project (and about its own reference
catalog) so a founder or another tool can find it without knowing the internal file layout.

## Inputs

The plugin's own `references/` catalog, or a project's `.wingman/` state ready for export.

## Output artifacts

`doc-index`'s navigation surface over `references/`; ranked search results over `references/*.md`
by title/heading/path match (`scripts/knowledge-index.mjs`); an Open Knowledge Format (OKF v0.1)
export bundle at `.wingman/okf-export/` (`commands/adaptive/knowledge-export.md`).

## Members

- `commands/adaptive/knowledge-export.md`
- `skills/doc-index/SKILL.md`

Companion script (not enforced by `scripts/validate-engines.mjs`, which scopes to
commands/skills/hooks/references only): `scripts/knowledge-index.mjs`.

## State read + written

Reads: `references/*`, `.wingman/checkpoints.jsonl`, `memory/*.md`. Writes: `.wingman/okf-export/`.

## Escalation

None load-bearing today — this engine is read/export only.

## Permitted tool tiers

Read-only (`references/permission-model.md` Level 0).

## Searchability layer (PR8)

`scripts/knowledge-index.mjs` builds an in-memory index over `references/*.md` (title + headings per
doc, parsed fresh on each run — no persisted index file to go stale) and scores a query's words
against title/headings/path, same zero-dependency shape as `scripts/query-founder-knowledge.mjs`.
**Deliberately keyword-matching, not semantic.** Semantic/vector search stays out of the shipped
plugin entirely — `install-smoke.yml` asserts `node_modules` never appears, so an embedding
dependency would break a CI-enforced invariant. The semantic variant already exists in
`agnostic-boardroom/` (LanceDB + FastEmbed) and is the right home for it; this engine's scope stops
at a real, working, dependency-free keyword search over a catalog small enough (22 reference docs)
that a scoring model doesn't add real value over honest keyword matching.
