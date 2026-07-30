# Engine: UX Intelligence

**Status:** built
**Purpose:** the 7 dedicated pipeline stages that turn a defined requirement into a concrete,
navigable user experience — personas, journeys, information architecture, flows, wireframes, visual
system, and usability validation.

## Inputs

`DEF-*` requirements (Planning Engine).

## Output artifacts

Persona/JTBD findings, journey maps, an information-architecture tree, `UX-*` flow rows, wireframes,
a visual design system, and prototype-usability findings — one per stage, each `Satisfies`-linked.

## Members

- `commands/pipeline/personas-jobs.md`
- `commands/pipeline/journey-mapping.md`
- `commands/pipeline/information-architecture.md`
- `commands/pipeline/uxflow.md`
- `commands/pipeline/wireframes.md`
- `commands/pipeline/visual-design-system.md`
- `commands/pipeline/prototype-usability.md`

## State read + written

Reads: Planning Engine output. Writes: `.wingman/traceability.json`'s `UX` counter and each stage's
own checkpoint.

## Escalation

A UX choice with no clearly-better alternative is a **Should-ask** — propose a default, surface the
alternative, let the founder redirect.

## Permitted tool tiers

Draft (`references/permission-model.md` Level 1) — these stages design and document, they don't
write production code.
