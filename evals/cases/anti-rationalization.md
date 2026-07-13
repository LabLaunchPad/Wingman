# Eval: anti-rationalization

Tests `plugins/wingman/skills/anti-rationalization/SKILL.md` behaviorally — a meta-skill no other eval exercises directly. Its own description names the testable trigger used here: "auditing existing skills for completeness."

## Fixture

`evals/fixtures/setup-anti-rationalization-fixture.sh <target-dir>` — a tiny stand-in plugin project with one discipline skill file, `code-review-discipline/SKILL.md`, written in Wingman's own skill format but missing the mandatory closing "Anti-Rationalization Defense" section every Wingman discipline skill must have.

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with only `skills/anti-rationalization/SKILL.md` and the fixture. Asked to audit `code-review-discipline/SKILL.md` for completeness.
3. Independently verify: did it (a) notice the missing section, and (b) write a genuinely domain-specific (code-review) rationalizations table rather than copy-pasting the meta-skill's own generic table verbatim?

## Expectations

| Check | Expected |
|---|---|
| Gap noticed | Explicitly flags the missing "Anti-Rationalization Defense" section |
| Domain-specific table written | The added table's rationalization/red-flag rows are about code review specifically, not generic placeholders |
| Not a verbatim copy | Confirmable by diff that the added content isn't the meta-skill's own Universal Rationalizations Table pasted unchanged |
| Correct location/format | Section is added in the position and heading format Wingman's other skills use |

## Trust level

`authored, pending first run` — the fixture and expectations are written but the case has not yet been executed (spawn a fresh subagent against the fixture, grade independently, log the result).

## Run log

(pending — filled in after the eval is actually run and independently verified)
