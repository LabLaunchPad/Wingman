# Eval: testing-patterns

Tests `plugins/wingman/skills/mechanics/testing-patterns/SKILL.md` behaviorally — the
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
2. Spawn a fresh subagent with only `skills/mechanics/testing-patterns/SKILL.md` and
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

`verified` — Run 1 covered detecting violations in an existing, green suite
(boundary-mocking, hidden-assertion, untested-error-branch). Run 2 covered
the differently-shaped positive-construction case: writing a *new* test
from scratch for a function with real external dependencies, where the
naive failure mode is either skipping the test or over-mocking it into
decoration. Both runs independently re-verified against the real
filesystem, not the subagent's self-report.

## Run log

### Run 1 — 2026-07-13

**Result: PASS on every expectation**, independently verified against the
real filesystem (not the subagent's self-report). The subagent read
`skills/mechanics/testing-patterns/SKILL.md`, was asked to review test
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

### Run 2 — 2026-07-15

**Result: PASS.** Genuinely different shape from Run 1: instead of grading
an existing green-but-flawed suite, this run asked a fresh subagent to
*write a new test from scratch* for a function with real external
dependencies and zero existing tests — the shape where the naive failure
mode is skipping the test entirely, or over-mocking it into something that
only asserts the mock echoed its own input.

**Fixture**: `src/notifier.js` (a small module built for this run, not the
existing ledger fixture), exporting `notifyUserSignup(user, emailClient,
logger)` — a signup-welcome-email function with two real-world boundaries:
`emailClient.send(to, subject, body)` (stands in for an HTTP call to a
transactional email API) and `logger.append(line)` (stands in for a
filesystem audit-log write). No test file existed beforehand.

**Dispatch**: a fresh subagent, given only
`skills/mechanics/testing-patterns/SKILL.md` and the fixture directory (not told
what to test for or warned about over-mocking), was asked to "write a good
test suite" for the function using `node:test`.

**What it wrote** (`test/notifier.test.js`, quoted in full): 7 tests using
hand-rolled fake `emailClient`/`logger` objects (doubles at the boundary,
not a mocking framework stubbing out the module's own logic) — a happy
path asserting the *actual computed* subject/body/messageId (not just
"send was called"), a name-fallback case, an audit-log-content case, three
input-validation branches (missing email, malformed email, null user) each
also asserting the boundaries were never touched, and a failure-path case
asserting both the rethrown error identity and the FAILED log line. E.g.
the happy-path assertions:
```js
assert.deepEqual(outcome, { success: true, messageId: 'msg-123' });
assert.equal(emailClient.calls[0].subject, 'Welcome aboard!');
assert.equal(emailClient.calls[0].body, 'Hi Ada, thanks for signing up with ada@example.com.');
```
These assert fixed expected literals computed by the function, not merely
that the fake was invoked — the tautological "assert the mock was called
with what we passed it" trap the skill's "Assertions on mocks instead of
on real outcomes" red flag warns against was avoided.

**Independent verification performed here** (not trusting the subagent's
self-report): ran `node --test` fresh — 7/7 pass. Then mutation-tested the
implementation directly, restoring after each: (1) broke the email-body
template string — 2 tests failed; (2) disabled the email-validation
`RangeError` branch — 1 test failed; (3) corrupted the "SENT" log-line
format — 1 test failed; (4) made the function swallow the send error
instead of rethrowing it — 1 test failed. Every mutation was caught by
exactly the test(s) targeting that behavior, confirming the suite exercises
real, breakable logic rather than decoration. `find` + `git status
--porcelain` confirmed only `test/notifier.test.js` was added to the
scratch fixture; nothing under `plugins/wingman/` or elsewhere in the
Wingman repo was touched.

No false positives or fabricated gaps — this was a construction task, not
a review task, so the relevant bar was "is the produced test meaningful,"
which mutation testing confirmed directly.
