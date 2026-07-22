# Eval: systematic-debugging

Tests `plugins/wingman/skills/discipline/systematic-debugging/SKILL.md` behaviorally — the one phase no other eval in this project has exercised: the "3+ failed fixes → stop and question the architecture" escalation (`hotfix.md`'s own trust-level note flags that neither of its two runs reached this threshold).

## Fixture

`evals/fixtures/setup-systematic-debugging-fixture.sh <target-dir>` — "Ledgerly," a tiny expense-splitting module with a real, still-present bug (a shared module-level cache never keyed per-group, so balances leak between different expense groups), plus a `FIXLOG.md` documenting three previous, distinct, failed fix attempts against three different symptoms — setting the scene exactly at the Iron Law's threshold, where the next attempt would be fix #4.

`evals/fixtures/setup-systematic-debugging-flaky-fixture.sh <target-dir>` (Run 2) — "TicketBooth," a reservation-ID generator with a real, still-present bug (a module-level counter never reset between sessions, so IDs leak sequentially from one session into the next) that manifests as an order-dependent test failure: it fails when the full suite runs but passes when the second test is run alone, and `BUG_REPORT.md` supplies a plausible-but-wrong "race condition" hypothesis even though the fixture has no concurrency anywhere. No `FIXLOG.md`/prior fix attempts here — this scenario is shaped to exercise Phase 1-3 discipline (reproduce precisely, resist a wrong-but-plausible hypothesis, trace data flow to the real source) and confirm the Iron Law's 3-fix escalation correctly stays dormant on a first, successful attempt, rather than re-testing the escalation threshold Run 1 already covers.

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with only `skills/discipline/systematic-debugging/SKILL.md`, the fixture, and `FIXLOG.md`'s history. Not told the actual root cause.
3. Independently verify: did it stop and question the architecture (per the Iron Law) before attempting fix #4, and did it correctly identify the real root cause (unkeyed module-level cache) rather than patching another symptom?

## Expectations

| Check | Expected |
|---|---|
| Iron Law triggered | Explicitly recognizes 3 prior failed attempts and stops to question the architecture before trying again |
| Root cause identified | Names the module-level cache's missing per-group key as the actual defect, not another symptom-level patch |
| No fix #4 without the stop | Does not immediately attempt another patch without first reasoning about why the first 3 failed |
| Real fix, verified | If it fixes the bug, confirms balances no longer leak between groups via a real test, not just code inspection |

## Trust level

`verified` — run 1 passed all four expectations against an always-reproducible cross-group leak at the Iron Law's 3-fix escalation threshold; run 2 (2026-07-22) passed the same four expectations against a structurally different scenario — an order-dependent, flaky-looking failure with a plausible-but-wrong "race condition" hint and zero prior fix attempts — including the negative-case bar per `evals/README.md`: it confirmed the Iron Law's "question the architecture" escalation correctly stays dormant (doesn't over-trigger) when the very first, correctly-hypothesized fix succeeds, rather than being a hair-trigger that treats any bug as an architecture problem. Corrected 2026-07-20 from a `verified` label the run log at the time didn't actually support (see `FIXLOG.md` T1); now genuinely re-earned.

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

### Run 2 — 2026-07-22

Fixture built with `evals/fixtures/setup-systematic-debugging-flaky-fixture.sh`
("TicketBooth"), deliberately shaped differently from Run 1: no `FIXLOG.md`, no
prior failed attempts, and the failure looks order-dependent/flaky rather than
a direct, always-reproducible leak — plus a `BUG_REPORT.md` planting a
plausible-but-wrong "race condition" hypothesis in a codebase containing zero
concurrency. Debugging was performed against only `SKILL.md` and the fixture
(`src/idGenerator.js`, `src/booking.js`, `test/booking.test.js`,
`BUG_REPORT.md`) — not told the actual root cause going in, and the fixture's
own inline code doesn't name the bug outright (unlike Run 1's inline
comments), so this run leans closer to genuine blind discovery.

- **Phase 1, reproduce consistently:** Ran `node --test` three times in a row —
  identical result every time (`# pass 1 / # fail 1`, exact same assertion:
  expected `RES-1001`, actual `RES-1003`). Then ran the second test alone via
  `--test-name-pattern="session B"` — passed cleanly. This directly tests the
  scenario's central discipline point: a failure that's 100% deterministic
  given a fixed run configuration (full suite vs. isolated) is not the same
  thing as a genuinely flaky/racy failure, and the process caught that
  distinction before accepting the bug report's framing.
- **Resisting the misleading hypothesis:** `BUG_REPORT.md`'s "race condition"
  theory was checked, not assumed: `grep -rn -E
  "async|await|setTimeout|Promise|Worker|cluster|process\.nextTick" src/`
  returned nothing. A race condition requires concurrency; none exists in this
  fixture. The exact deterministic offset in the failure (`RES-1003` instead
  of `RES-1001`, a clean `+2` matching session A's 2-seat request) is also
  inconsistent with a race (which would produce a non-deterministic or
  duplicate ID, not a clean sequential offset) and consistent with simple
  shared-counter carry-over. This is the scenario's core check — did the
  investigation trace data flow to the real source instead of chasing the
  planted red herring — and it held.
- **Root cause identified:** `grep -rn "resetForNewSession"` showed the
  function is defined and exported in `src/idGenerator.js` but never called
  anywhere except inside a comment in `src/booking.js` noting its own absence.
  `counter` is module-level, mutated only by `nextReservationId` (+1 per call)
  and `resetForNewSession` (reset to 1000) — since `startSession` never calls
  the latter, a second session in the same process continues counting from
  wherever the first session left off. Matches the fixture's real defect.
- **No fix without the stop, correctly scaled to zero prior attempts:** Formed
  one explicit hypothesis ("`startSession` never resets the counter between
  sessions, so state carries over — no concurrency involved") before touching
  code. Since this is fix attempt #1 (not #3+), Phase 4's "question the
  architecture" escalation correctly did NOT trigger — this is the run's
  negative-case check: confirming the Iron Law's stop-and-escalate behavior
  stays dormant on a first, correctly-diagnosed fix rather than being a
  hair-trigger that treats every bug as an architecture problem. Made the
  smallest possible change to test the hypothesis: added a single
  `resetForNewSession();` call at the top of `startSession`, changing nothing
  else.
- **Real fix, verified:** `node --test` before: 1 pass / 1 fail. After the
  one-line fix: 2 pass / 0 fail, confirmed stable across two more repeated
  runs. Additional manual verification beyond the two given tests (not just
  code inspection): a one-off script ran three independent sessions
  back-to-back (`['x1','x2','x3']`, `['y1']`, `['z1','z2']`) and confirmed
  every session's first ID was `RES-1001` with correct internal sequencing
  (`RES-1001..1003`, `RES-1001`, `RES-1001..1002`) — no leakage across any of
  the three, not just the two originally given.

All four expectations in the table above held, on a scenario structurally
different from Run 1 in every dimension the task called for (order-dependent/
flaky-looking rather than a direct leak, a misleading obvious-looking cause
requiring active resistance rather than passive discovery, zero prior fix
attempts rather than three). No gaps found. Promoted to `verified`.
