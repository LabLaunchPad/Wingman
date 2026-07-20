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

`provisional` — run 1 passed all four expectations (see Run log below); not yet re-run against a second, differently-shaped scenario including a negative case, per `evals/README.md`'s bar for `verified`. Corrected 2026-07-20 from a `verified` label the run log doesn't actually support (see `FIXLOG.md` T1).

## Run log

### Run 1 — 2026-07-15

Fixture built with `evals/fixtures/setup-systematic-debugging-fixture.sh`. Confirmed
the second test failed before any fix (`100 !== -400` — alice's balance in the
second, unrelated group was polluted by the +500 left over from the first group).

Debugging was performed against only `SKILL.md`, `FIXLOG.md`, and the fixture source
(no peeking at a separate answer key — the fixture's inline code comments do name the
bug, so the run isn't a blind discovery test, but the check here is procedural
discipline: did the agent stop at the Iron Law threshold and root-cause properly
rather than reflexively patching).

- **Iron Law triggered:** Yes. `FIXLOG.md` was read first and explicitly recognized
  as recording 3 distinct prior failed attempts (rounding drift, `paid[m]`
  initialization, duplicate-member dedup), each against a different guessed symptom,
  none touching the actual leaking code path. Per Phase 4 step 4/5 of the skill, this
  was treated as the "question the architecture" threshold — no 4th guess-and-patch
  was attempted; investigation went back to Phase 1 instead.
- **Root cause identified:** Yes. `src/ledger.js` has a module-level `const
  balanceCache = {}` keyed only by member name (not by group), accumulating
  `balanceCache[m] = (balanceCache[m] || 0) + balance` across every call. Two
  unrelated groups sharing a member name clobber each other's balance. This matches
  the fixture's own stated root cause and explains why all 3 logged attempts failed:
  each touched a different part of the per-call computation while the actual defect
  was persistent, unkeyed, module-level state — the "architectural" pattern the skill
  says 3+ failed fixes in different places should point to.
- **No fix #4 without the stop:** Confirmed. The investigation reasoned explicitly
  about why the 3 prior attempts failed (each modified per-call arithmetic, but the
  bug is in cross-call state) before writing any fix.
- **Real fix, verified:** `node --test` before the fix: 1 pass / 1 fail
  (`100 !== -400`). Fix applied: removed the module-level `balanceCache` entirely and
  made `splitExpenses` return `paid[m] - share` directly per call — the function's
  contract never called for cross-group memory, so the cache was deleted rather than
  re-keyed. `node --test` after: 2/2 pass. Additional manual verification (not just
  code inspection): called `splitExpenses` twice in a row with identical inputs
  (`{alice:500, bob:-500}` both times — no hidden accumulation), and called it again
  with a third, previously-unseen group sharing a member name (`bob`) from an earlier
  group, which computed a clean, correct balance (`{bob:300, carol:-300}`) with no
  leakage. `grep -rn "balanceCache"` confirms no other reference to the removed cache
  remains anywhere in the fixture.

All four expectations in the table above held. No gaps found in this run.
