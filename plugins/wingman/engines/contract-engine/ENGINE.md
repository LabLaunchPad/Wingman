# Engine: Contract

**Status:** built (thin)
**Purpose:** the versioning/compatibility rule for every schema that changes over time —
`.wingman/checkpoints.jsonl`'s `schema_version` today, and the WKOS document metadata-block contract
(`Parents`/`Children`/`References`, producer/consumer status). Added 2026-07-30 as part of the
EngineOS reorganization, directly out of Layer 15 ("Contracts") of the founder's 19-layer validation
pass — see `docs/status/DATABASE.md`'s "Versioning and compatibility policy" section, which this
engine's real content lives in (a top-level dev-doc, not a `plugins/wingman/references/*.md` file,
so it sits outside `validate-engines.mjs`'s scanned scope, same disclosed pattern as the Graph
Engine's companion scripts).

## Inputs

Any change to a schema an external consumer depends on: `checkpoints.jsonl`'s per-line shape, a
WKOS document's metadata block, a founder project's own state-store format.

## Output artifacts

A migration note (old shape → new shape → consumer instruction) for every schema bump, recorded at
the moment the schema changes — never retroactively.

## Members

None yet inside `plugins/wingman/` scope — this engine's real content
(`docs/status/DATABASE.md`'s "Versioning and compatibility policy" section,
`references/wkos/document-template.md`'s metadata-block contract) lives partly outside the shipped
plugin tree. Deliberately thin rather than padded with a manufactured member list: an
8th WKOS `TEMPLATE_CONTRACT.md` template was considered and declined (no founder project has
produced a document it would serve) — see `docs/roadmap/AGENT-ROSTER.md`'s deferred-mechanism table.

## State read + written

Reads: nothing directly. Writes: nothing directly — a schema bump's producing code writes the new
shape; this engine only states the rule that change must follow.

## Escalation

A schema bump with no accompanying migration note, or one that silently breaks an existing consumer
instead of disclosing the break, is a real finding — not yet mechanically enforced (no test asserts
every `schema_version` value in code has a matching migration note), named honestly as a gap rather
than assumed closed.

## Permitted tool tiers

Read-only (`references/permission-model.md` Level 0) — this engine states a rule, it doesn't execute
a migration itself.
