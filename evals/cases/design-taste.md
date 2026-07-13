# Eval: design-taste

Tests `plugins/wingman/skills/design-taste/SKILL.md` — its anti-slop UI/UX quality bar: avoids generic, template-derived interfaces and pushes for deliberate hierarchy, consistency, and restraint.

## Scenario — Generic UI → improved (positive case)

A subagent is given a bland, template-default UI description (e.g. "a centered card with a gradient hero, three feature boxes, and a generic CTA") and asked to apply the skill's taste bar.

## Expectations

| Check | Expected |
|---|---|
| Identifies generic/slop patterns rather than praising them | Yes |
| Proposes concrete, specific improvements (hierarchy, spacing, type, motion) | Yes |
| Maintains consistency with any stated design system | Yes |
| Exercises restraint — adds signal, not decoration | Yes |

## Trust level

`provisional` — passed at least one real run (single scenario), manually graded. Promote to `verified` after a negative case confirming it resists "make it bolder" drift when the honest answer is "the current design is already correct."

## Run log

### Pending — scheduled behavioral eval workflow

Graded via `.github/workflows/evals.yml` (requires `ANTHROPIC_API_KEY` + `/bin/bash`, unavailable in this authoring environment). Case defined to the verified-case format above; grade on next weekly run and record the actual result here.
