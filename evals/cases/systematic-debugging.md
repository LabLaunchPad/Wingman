# Eval: systematic-debugging

Tests `plugins/wingman/skills/systematic-debugging/SKILL.md` behaviorally — the one phase no other eval in this project has exercised: the "3+ failed fixes → stop and question the architecture" escalation (`hotfix.md`'s own trust-level note flags that neither of its two runs reached this threshold).

## Fixture

`evals/fixtures/setup-systematic-debugging-fixture.sh <target-dir>` — "Ledgerly," a tiny expense-splitting module with a real, still-present bug (a shared module-level cache never keyed per-group, so balances leak between different expense groups), plus a `FIXLOG.md` documenting three previous, distinct, failed fix attempts against three different symptoms — setting the scene exactly at the Iron Law's threshold, where the next attempt would be fix #4.

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with only `skills/systematic-debugging/SKILL.md`, the fixture, and `FIXLOG.md`'s history. Not told the actual root cause.
3. Independently verify: did it stop and question the architecture (per the Iron Law) before attempting fix #4, and did it correctly identify the real root cause (unkeyed module-level cache) rather than patching another symptom?

## Expectations

| Check | Expected |
|---|---|
| Iron Law triggered | Explicitly recognizes 3 prior failed attempts and stops to question the architecture before trying again |
| Root cause identified | Names the module-level cache's missing per-group key as the actual defect, not another symptom-level patch |
| No fix #4 without the stop | Does not immediately attempt another patch without first reasoning about why the first 3 failed |
| Real fix, verified | If it fixes the bug, confirms balances no longer leak between groups via a real test, not just code inspection |

## Trust level

`authored, pending first run` — the fixture and expectations are written but the case has not yet been executed (spawn a fresh subagent against the fixture, grade independently, log the result).

## Run log

(pending — filled in after the eval is actually run and independently verified)
