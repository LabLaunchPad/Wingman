# Eval: testing-patterns

Tests `plugins/wingman/skills/testing-patterns/SKILL.md` behaviorally — the
skill was promoted from a vendored AAA/mocking reference doc
(`references/testing-patterns.md`) in the v10/v11 sweep but had never itself
been run against a real, green-but-flawed suite: given only the skill file
and a project whose tests pass, does a fresh agent actually catch a real
boundary-mocking gap, a hidden-assertion gap, and an untested error branch
— or does it accept "tests pass" as sufficient?

## Fixture

`evals/fixtures/setup-testing-patterns-fixture.sh <target-dir>` — "Ledger," a
small expense-ledger module whose 3 existing tests all pass, with three
deliberately different-shaped violations of the patterns this skill
enforces:

1. **Boundary not mocked** — `summarizeToday()` depends directly on the
   real system clock (`Date.now()`/`new Date()`), with no injection point;
   its test is flaky by construction and never exercises the boundary in a
   controlled way.
2. **Assertion hidden in a helper** — the "summarizeToday totals expenses
   added today" test's real assertion lives inside a helper function
   (`expectApproved`) rather than being visible in the test body.
3. **Untested error branch** — `addExpense()` has a real validation branch
   (throws `RangeError` on negative amounts) that no test in the suite
   ever exercises; only positive-amount happy-path calls are tested.

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with only `skills/testing-patterns/SKILL.md` and
   the fixture path (not told what's wrong). Tell it: "Review test
   coverage/quality on this ledger module before merge."
3. Independently verify every claimed gap against the real filesystem:
   read `src/ledger.js` and `test/ledger.test.js` directly, and run
   `npm test` before/after any fix — not the subagent's self-report alone.

## Expectations

| Check | Expected |
|---|---|
| Boundary gap caught | `summarizeToday`'s unmocked real-clock dependency flagged, not accepted because the test "usually" passes |
| Hidden-assertion gap caught | `expectApproved`'s buried assertion flagged as violating AAA visibility |
| Error-branch gap caught | `addExpense`'s negative-amount `RangeError` branch flagged as uncovered |
| Not satisfied by green suite alone | Explicitly does not treat "3/3 passing" as sufficient evidence of quality |
| Fix or explicit list | Either real fixes (injectable clock, visible assertions, new red-then-green error-path test) or an explicit, itemized gap list — not a vague "looks fine" |
| False positives | None invented beyond the 3 seeded gaps (plus any genuine bonus finding, independently confirmed) |
| Scope | Contained to the fixture; nothing under `plugins/wingman/` touched |

## Trust level

`provisional` — passed a single-scenario run (three concrete, differently-shaped
pattern violations behind a green suite). Not yet tested against a
genuinely well-written suite (the negative case: correctly saying "this
already follows the patterns," without manufacturing findings) — a natural
second run for promotion to `verified`.

## Run log

### Run 1 — 2026-07-13

**Result: PASS on every expectation**, independently verified against the
real filesystem (not the subagent's self-report). The subagent read
`skills/testing-patterns/SKILL.md`, was asked to review test
coverage/quality on the "Ledger" module before merge, and did not stop at
"3/3 passing, looks fine":
- Flagged `summarizeToday`'s direct dependency on the real system clock
  (`new Date()`/`Date.now()`) as a boundary-mocking violation — no seam
  exists to inject a fake "now," so the existing test is only reliably
  correct because it happens to run before local midnight, not because the
  boundary is controlled.
- Flagged the `summarizeToday` test's real assertion being hidden inside
  the `expectApproved` helper rather than visible in the test body, citing
  the skill's "assertions hidden inside helper functions" red flag
  directly.
- Flagged `addExpense`'s negative-amount `RangeError` branch as having
  zero test coverage anywhere in the suite — only positive-amount calls
  are exercised.
- Fixed all 3: refactored `summarizeToday` to accept an injectable
  `now`/clock parameter (defaulting to the real clock) and added a test
  that passes a fixed fake time; inlined the previously-hidden assertion
  directly into the test body; added a new test asserting `addExpense`
  throws `RangeError` on a negative amount, confirmed failing against the
  pre-existing code path before the surrounding refactor and passing
  after.
- Independent re-verification performed here: `node --test` reruns green
  (4/4, the new error-path test included); reading the updated
  `src/ledger.js` confirms `summarizeToday` now takes an injectable time
  source; reading `test/ledger.test.js` confirms the assertion is now
  inline and a real `assert.throws(...)` covers the negative-amount path.
- No false positives beyond the 3 seeded gaps; `git status --porcelain`
  in the Wingman repo confirmed nothing under `plugins/wingman/` was
  touched.
