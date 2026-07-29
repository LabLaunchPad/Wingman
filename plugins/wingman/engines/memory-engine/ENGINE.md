# Engine: Memory

**Status:** built
**Purpose:** persists founder decisions and facts across sessions at the right scope — Global, Org,
Product/Project, Feature, Task, User — so nothing has to be re-explained. See
`research/03-memory/TRUTH-memory-tiers.md` for the design's grounding.

## Inputs

A fact or decision worth remembering, plus the scope it applies at.

## Output artifacts

Tier-tagged entries under `~/.wingman/{global,org/<slug>}/` and `.wingman/memory/` (Product/Project —
deliberately the same store), `feature/`, `task/`, `user/`.

## Members

- `skills/memory/SKILL.md`

Companion script (not enforced by `scripts/validate-engines.mjs`, which scopes to
commands/skills/hooks/references only): `scripts/memory-tiers.mjs`.

## State read + written

Reads and writes all 7 tiers via `readTier()`/`readAllTiers()`/`writeTierEntry()`. Global/Org writes
are **mechanically** gated — `writeTierEntry()` throws without `{ approved: true }`.

## Escalation

Promotion to Global/Org tier is a real founder decision (`AskUserQuestion`), never automatic. A
genuine cross-tier contradiction is surfaced to the reading session, never silently resolved.

## Permitted tool tiers

Scoped-write (`references/permission-model.md` Level 2) for Feature/Task/User/Project tiers;
conditional (Level 3) for Global/Org, gated by the approval check above.
