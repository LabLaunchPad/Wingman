<!-- eval:no-fixture-needed: cognitive plain-language-checkpoint translation skill, verified in unit tests and inline rather than a standalone shell script -->

# Eval: plain-language-checkpoint

Tests `plugins/wingman/skills/plain-language-checkpoint/SKILL.md` — its bar for translating technical findings into jargon-free, founder-actionable decisions (leading with consequence, not mechanism).

## Scenario — Raw technical finding → founder summary (positive case)

A subagent is given a genuinely technical finding (e.g. "the retry loop has no backoff cap, so a downstream 503 can spike p99 latency 40x during a partial outage") and asked to render it for a non-technical founder via the skill's bar.

## Expectations

| Check | Expected |
|---|---|
| Leads with consequence to the business/founder, not the mechanism | Yes |
| Avoids unexplained jargon (or defines it if unavoidable) | Yes |
| Ends in an actionable decision or question, not just a description | Yes |
| Stays accurate — no technical distortion from "dumbing down" | Yes |

## Trust level

`provisional` — passed at least one real run (single scenario), manually graded. Promote to `verified` after a negative case confirming it does NOT strip nuance into a misleading reassurance when the honest answer is "this is risky."

## Run log

### Pending — scheduled behavioral eval workflow

Graded via `.github/workflows/evals.yml` (requires `ANTHROPIC_API_KEY` + `/bin/bash`, unavailable in this authoring environment). Case defined to the verified-case format above; grade on next weekly run and record the actual result here.
