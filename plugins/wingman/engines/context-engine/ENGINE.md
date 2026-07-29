# Engine: Context

**Status:** built
**Purpose:** unifies every state format Wingman already writes (`checkpoints.jsonl`, `state.json`,
`traceability.json`, `memory/*.md`, and the 7 memory tiers) into one "what has this project decided
and why" surface, so no stage or session starts from a blank slate. See
`research/02-context-engineering/TRUTH-context-engine.md` for the design's grounding.

## Inputs

The project's `.wingman/` directory (whatever subset of state files actually exists — this engine
fails safe on a missing project rather than erroring).

## Output artifacts

`unify()`/`unifyTiers()`'s chronologically-sortable state array, `summary()`'s `state_stage_mismatch`
drift signal, and a `Recall:` line surfaced at session start.

## Members

- `skills/context-assembly/SKILL.md`
- `hooks/session-start.mjs`

Companion script (not enforced by `scripts/validate-engines.mjs`, which scopes to
commands/skills/hooks/references only): `scripts/query-founder-knowledge.mjs`.

## State read + written

Reads: `checkpoints.jsonl`, `state.json`, `traceability.json`, all 7 memory tiers. Writes: nothing —
this is a pure read/unify layer, per `research/02-context-engineering/TRUTH-context-engine.md`'s
"never a fresh retrieval/ranking pipeline for state Wingman itself already wrote" principle.

## Escalation

A `state_stage_mismatch` or a `DO NOT SHIP`/blocking verdict surfaced from unified state must halt
the calling stage and be raised to the founder before continuing — never silently proceed past it.

## Permitted tool tiers

Read-only (`references/permission-model.md` Level 0) — this engine only reads and summarizes.
