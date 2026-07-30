# Engine: Graph

**Status:** built
**Purpose:** the traceability chain — the `DISC-*` root through every downstream ID's `Satisfies`
column, all the way to `IP-*`, and the WKOS document Parents/Children graph rule that generalizes the
same idea from requirement IDs to whole documents. Split out of the Governance Engine 2026-07-30
(EngineOS reorganization): "does this ID/document trace back to the vision" is a distinct concern
from "does this action pass a risk/process gate," even though both used to sit under one engine.

## Inputs

Any command that mints a traceability ID (`DISC`/`RS`/`PJ`/`JM`/`DEF`/`IA`/`UX`/`WF`/`VS`/`PT`/`ARCH`/`IP`)
or a WKOS document declaring its `Parents`/`Children`/`References`.

## Output artifacts

A `PASS`/`FAIL` traceability report, a resolved or broken chain for a given ID (`--chain`, `--orphans`
in `scripts/check-traceability.mjs`), a zero-orphan WKOS document graph (`scripts/validate-wkos.mjs`).

## Members

- `skills/traceability-linking/SKILL.md`

Companion scripts (not enforced by `scripts/validate-engines.mjs`, which scopes to
commands/skills/hooks/references only): `scripts/check-traceability.mjs`,
`scripts/traceability-prefixes.mjs`, `scripts/validate-wkos.mjs`, `scripts/wkos-check.mjs`.

## State read + written

Reads: every pipeline stage's own output file for `Satisfies`/ID-table rows, `references/wkos/producer-map.md`.
Writes: `.wingman/traceability.json`'s per-prefix ID counters.

## Escalation

An orphaned marker (a `wingman:req` citation with no minted row behind it) or a chain that doesn't
resolve back to a `DISC-*` root is a real, blocking finding — surfaced by name, never silently
allowed through as a warning.

## Permitted tool tiers

Read-only (`references/permission-model.md` Level 0) — this engine checks and reports, it never
writes project code or infrastructure.
