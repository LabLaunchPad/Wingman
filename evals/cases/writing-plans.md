# Eval: writing-plans

Tests `plugins/wingman/skills/writing-plans/SKILL.md` behaviorally — the distinctive behavior no other eval exercises: does the skill's own "Scope Check" actually split a request bundling two independent subsystems into two separate plans, rather than writing one blended plan?

## Fixture

`evals/fixtures/setup-writing-plans-fixture.sh <target-dir>` — a small existing Node project with a `SPEC.md` that deliberately bundles two independent subsystems (API rate limiting, and an RSS changelog feed) under one shared global constraint.

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with only `skills/writing-plans/SKILL.md` and the fixture's `SPEC.md`. Not told the two subsystems should be split.
3. Independently verify: did it produce two separate plans (one per subsystem), or one blended plan covering both under the shared constraint?

## Expectations

| Check | Expected |
|---|---|
| Scope Check applied | Explicitly identifies the request bundles two independent subsystems |
| Genuinely split | Produces two separate plan artifacts/sections, not one plan with two sub-bullets |
| Shared constraint handled correctly | The shared global constraint is addressed in each plan appropriately, not dropped or duplicated incoherently |
| No unnecessary splitting elsewhere | Doesn't fragment a single coherent subsystem into multiple plans |

## Trust level

`authored, pending first run` — the fixture and expectations are written but the case has not yet been executed (spawn a fresh subagent against the fixture, grade independently, log the result).

## Run log

(pending — filled in after the eval is actually run and independently verified)
