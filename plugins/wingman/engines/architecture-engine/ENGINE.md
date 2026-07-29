# Engine: Architecture

**Status:** built
**Purpose:** decides the technical shape of a system (components, data, integration points) and
defines the document contract every artifact in that shape must satisfy.

## Inputs

`DEF-*` requirements (Planning Engine).

## Output artifacts

`ARCH-*` rows (`commands/pipeline/architecture.md`), acceptance criteria per deliverable
(`skills/acceptance-criteria`), and the WKOS document contract (`references/wkos/` — metadata block,
20 standard sections, producer/consumer map, 8 templates) that later engines' artifacts follow.

## Members

- `commands/pipeline/architecture.md`
- `skills/acceptance-criteria/SKILL.md`

## State read + written

Reads: Planning Engine output. Writes: `.wingman/traceability.json`'s `ARCH` counter;
`references/wkos/` is a static document contract, not per-project state.

## Escalation

An architecture decision with no clearly-better option, or one that's a one-way door, is a **Must-ask**
per `references/permission-model.md`'s Level 3+ boundary.

## Permitted tool tiers

Draft (`references/permission-model.md` Level 1) — architecture is decided and documented, not
executed directly.
