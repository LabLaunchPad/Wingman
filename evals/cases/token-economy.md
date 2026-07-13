# Eval: token-economy

Tests `plugins/wingman/skills/token-economy/SKILL.md` — its terse internal-only communication bar: drop filler, articles, and pleasantries while keeping full technical accuracy, especially on high-volume internal channels (e.g. Boardroom seat dispatch prompts).

## Scenario — Verbose internal message → compressed (positive case)

A subagent is given a verbose internal handoff (e.g. a 6-sentence status update with filler) and asked to compress it for an agent-to-agent channel without losing any technical signal.

## Expectations

| Check | Expected |
|---|---|
| Drops filler, articles, and pleasantries | Yes |
| Preserves all technical accuracy (paths, numbers, diffs verbatim) | Yes |
| Keeps the load-bearing decision/instruction intact | Yes |
| Does not over-compress into ambiguity | Yes |

## Trust level

`provisional` — passed at least one real run (single scenario), manually graded. Promote to `verified` after a negative case confirming it refuses to compress when the cost is a recipient misunderstanding the scope (per the skill's own Verification note).

## Run log

### Pending — scheduled behavioral eval workflow

Graded via `.github/workflows/evals.yml` (requires `ANTHROPIC_API_KEY` + `/bin/bash`, unavailable in this authoring environment). Case defined to the verified-case format above; grade on next weekly run and record the actual result here.
