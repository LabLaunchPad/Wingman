# Engine: Design

**Status:** built
**Purpose:** the design-quality knowledge behind what's usable, clear, consistent, and accessible —
distinct from the UX Intelligence Engine's stage-by-stage flow production and from the Evaluation
Engine's Design seat verdict, which reviews the result using this engine's own standards.

## Inputs

A UI, flow, or developer-facing surface (an API, a CLI, a skill's own output shape) to be judged
against a design-taste and accessibility bar.

## Output artifacts

Design-taste judgments and accessibility findings consumed by `agents/boardroom-design.md`'s review
(owned by the Evaluation Engine) — this engine supplies the standard, not the verdict.

## Members

- `skills/design-taste/SKILL.md`
- `references/accessibility-checklist.md`
- `scripts/check-design-system.mjs` — mechanizes `commands/pipeline/visual-design-system.md`'s
  Visual Design System.4 gate checklist: confirms all 10 Must-include categories are named in a
  founder project's spec doc (added 2026-07-30, Layer 12 of the 19-layer validation pass). Not in
  `validate-engines.mjs`'s scanned scope (that check covers commands/skills/hooks/references, not
  `scripts/`) — listed here for completeness, same as other scripts other engines reference.

## State read + written

Reads: whatever UI/flow/API surface is under review. Writes: nothing directly — findings flow into
the Evaluation Engine's Design seat verdict.

## Escalation

An accessibility gap on a real user-facing flow (missing labels, unusable-by-keyboard, poor contrast)
is a real finding, not a style nitpick — surfaced plainly, not softened.

## Permitted tool tiers

Read-only (`references/permission-model.md` Level 0) — advisory standard, no write access.
