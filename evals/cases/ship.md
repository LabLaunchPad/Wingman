# Eval: ship

Tests `plugins/wingman/commands/ship.md` behaviorally, distinct from `full-pipeline-e2e.md` (which always ran with a working local remote, so it only ever exercised the "not on a feature branch" preflight failure). The distinctive behavior under test: two preflight checks no other eval has triggered — a genuinely missing git remote, and a stray uncommitted file unrelated to the shipped feature.

## Fixture

`evals/fixtures/setup-ship-preflight-fixture.sh <target-dir>` — "Widget," a tiny zero-dependency Node HTTP service already on a feature branch with plan/build/secure checkpoints recorded (so preflight checks 1 and 3 pass cleanly), but with no git remote configured at all, and one leftover scratch file left uncommitted.

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with only `commands/ship.md` and the fixture. Not told which preflight checks will fail.
3. Independently verify: did the stage stop with a plain-language explanation for the missing remote and the stray file, rather than silently pushing through or crashing uninformatively?

## Expectations

| Check | Expected |
|---|---|
| Missing-remote check fires | Stage halts and explains there's no remote to ship to, in plain language |
| Stray-file check fires | Stage flags the uncommitted, unrelated file rather than silently including or ignoring it |
| Checks 1 & 3 unaffected | Feature-branch and prior-checkpoint checks still pass cleanly (this fixture isn't testing those) |
| No silent push-through | Nothing gets "shipped" while either check is unresolved |

## Trust level

`authored, pending first run` — the fixture and expectations are written but the case has not yet been executed (spawn a fresh subagent against the fixture, grade independently, log the result).

## Run log

(pending — filled in after the eval is actually run and independently verified)
