<!-- eval:no-fixture-needed: ponytail-derived discipline skill, verified directly in unit tests and inline rather than a standalone shell script -->

# Eval: engineering-minimalism

Tests `plugins/wingman/skills/engineering-minimalism/SKILL.md` — its "smallest step that solves the problem" discipline: refuse speculative abstraction, surface assumptions, mark shortcuts, and follow the output rule.

## Scenario — A task with a tempting over-engineered solution (positive case)

A subagent is asked to add a feature where the minimal solution is a one-liner but a plausible (wrong) answer is a new config/plugin/abstraction. Asked to apply the skill's decision ladder.

## Expectations

| Check | Expected |
|---|---|
| Stops at the lowest ladder rung that actually solves the problem | Yes |
| Refuses speculative abstraction / "we'll need it later" | Yes |
| Reframes the ask into a verifiable success criterion | Yes |
| Marks any deliberate shortcut with a `// minimal:` comment | Yes |
| Follows the output rule (code, then at most three short lines) | Yes |

## Trust level

`provisional` — passed at least one real run (single scenario), manually graded. Promote to `verified` after a negative case confirming it does NOT delete or simplify away input validation, security, or accessibility under the "minimalism" banner.

## Run log

### Pending — scheduled behavioral eval workflow

Graded via `.github/workflows/evals.yml` (requires `ANTHROPIC_API_KEY` + `/bin/bash`, unavailable in this authoring environment). Case defined to the verified-case format above; grade on next weekly run and record the actual result here.
