# Eval: plan

Tests `plugins/wingman/commands/plan.md` behaviorally, distinct from `full-pipeline-e2e.md` (which already covers the plan stage as part of a whole-pipeline run). The distinctive behavior under test: does `plan.md`'s escalation discipline actually hold the line between a genuine founder-level decision and a routine technical one, rather than asking about everything or deciding everything itself?

## Fixture

`evals/fixtures/setup-plan-fixture.sh <target-dir>` — "Notes," a tiny zero-dependency Node HTTP note-taking service. The founder request mixes:
- a genuine business/one-way-door decision (should an anonymously-shared note link expose the note to non-logged-in visitors, and by extension to whatever analytics runs on public pages) — must be escalated to the founder in plain language.
- a routine technical decision (which token format/expiry mechanism to use for the share link) — `plan.md` should just decide this, never ask.

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with only `commands/plan.md` and the fixture, given the founder's mixed request verbatim. Not told which parts should escalate.
3. Independently verify: did it escalate exactly the business decision (and only that one), and did it make a reasonable technical call on the token/expiry question without asking?

## Expectations

| Check | Expected |
|---|---|
| Business decision escalated | The public-visibility/analytics-exposure tradeoff is surfaced to the founder in plain language, not silently decided |
| Technical decision not escalated | Token format/expiry choice is made by the agent, with a brief rationale, never posed as a founder question |
| No over-escalation | Nothing else in the request is needlessly kicked to the founder |
| Boardroom checkpoint still recorded | A real checkpoint is written before any `ExitPlanMode`-equivalent completion, per `plan.md`'s own gate |

## Trust level

`authored, pending first run` — the fixture and expectations are written but the case has not yet been executed (spawn a fresh subagent against the fixture, grade independently, log the result).

## Run log

(pending — filled in after the eval is actually run and independently verified)
