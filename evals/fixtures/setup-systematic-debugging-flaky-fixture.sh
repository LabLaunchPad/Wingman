#!/usr/bin/env bash
# Second, differently-shaped fixture for skills/discipline/systematic-debugging.
# Run 1 (setup-systematic-debugging-fixture.sh) tested the Iron Law's 3-failed
# -fixes escalation threshold against an always-reproducible cross-group leak.
# This fixture tests a structurally different failure mode: a bug that looks
# order-dependent/flaky (passes alone, fails in the full suite) and comes with
# a plausible but WRONG hint in the bug report blaming "a race condition" --
# there is no concurrency anywhere in this code. The real root cause is a
# module-level counter that is never reset between sessions, so state leaks
# from one session's test into the next one declared after it in the same
# file. No FIXLOG.md and no prior failed attempts are provided here -- this
# exercises Phase 1-3 (reproduce consistently, don't trust a plausible-sounding
# but wrong hypothesis, trace data flow to the real source) rather than
# Phase 4's 3+ fix escalation, which the first fixture already covers.
#
# Usage: evals/fixtures/setup-systematic-debugging-flaky-fixture.sh <target-dir>
# Wipes and recreates <target-dir> every run, so the eval starts clean.

set -euo pipefail

TARGET="${1:?Usage: setup-systematic-debugging-flaky-fixture.sh <target-dir>}"

rm -rf "$TARGET"
mkdir -p "$TARGET/src" "$TARGET/test"
cd "$TARGET"

git init -q

cat > package.json <<'EOF'
{
  "name": "ticketbooth",
  "version": "0.2.0",
  "private": true,
  "scripts": { "test": "node --test" }
}
EOF

# BUG: `counter` is module-level and is only ever incremented, never reset
# when a new session starts. `resetForNewSession` exists but nothing calls
# it. Two sessions run back-to-back in the same process (as they are in the
# test file below) leak counter state from the first session into the
# second. This is the REAL root cause. There is no concurrency in this file
# at all -- everything here is synchronous -- so a "race condition"
# hypothesis is a plausible-sounding dead end.
cat > src/idGenerator.js <<'EOF'
// Assigns sequential reservation IDs within a booking session, e.g.
// "RES-1001", "RES-1002", ... Each new session is supposed to start
// counting from 1001 again.
let counter = 1000;

function nextReservationId() {
  counter += 1;
  return `RES-${counter}`;
}

// Exists for exactly this purpose, but nothing in this codebase calls it --
// that's the bug. Grep before assuming otherwise.
function resetForNewSession() {
  counter = 1000;
}

module.exports = { nextReservationId, resetForNewSession };
EOF

cat > src/booking.js <<'EOF'
const { nextReservationId } = require('./idGenerator');

// Starts a new booking session and assigns IDs to each requested seat.
// NOTE: does not call resetForNewSession() -- see idGenerator.js.
function startSession(seatRequests) {
  return seatRequests.map((seat) => ({
    seat,
    reservationId: nextReservationId(),
  }));
}

module.exports = { startSession };
EOF

cat > BUG_REPORT.md <<'EOF'
# Bug report: "First reservation ID isn't always RES-1001"

Two customer support tickets this week, both about a fresh booking session
NOT starting its first reservation at RES-1001 like it's supposed to. One
rep swears it happened on a call where two customers were checking out
"basically at the same time" in different browser tabs, so the working
theory going into this is a **race condition** -- probably two sessions'
`nextReservationId()` calls interleaving on the shared counter.

Can't reproduce it by hand yet (manual testing is inherently one session at
a time). Team decided to write an automated test to nail it down before
attempting a fix.

Note: `test/booking.test.js` (added below) reproduces something -- but
running just the second test on its own by name passes fine. It only shows
up when the full suite runs. That's either confirming the race-condition
theory (parallelism) or it's a clue that the theory is wrong. Investigate
before fixing.
EOF

cat > test/booking.test.js <<'EOF'
const test = require('node:test');
const assert = require('node:assert/strict');
const { startSession } = require('../src/booking');

test('session A: a fresh session starts its first reservation at RES-1001', () => {
  const result = startSession(['1A', '1B']);
  assert.equal(result[0].reservationId, 'RES-1001');
  assert.equal(result[1].reservationId, 'RES-1002');
});

test('session B: a second, independent fresh session ALSO starts at RES-1001', () => {
  // This is a brand new customer's brand new session -- it has no relationship
  // to session A above and should not know session A ever happened.
  const result = startSession(['2A']);
  assert.equal(result[0].reservationId, 'RES-1001');
});
EOF

git add -A
git commit -q -m "TicketBooth: reservation ID generator with a real session-reset bug + a misleading race-condition hint"

echo "Fixture created at $TARGET"
echo "Confirming the bug reproduces only in the full suite, not in isolation:"
cd "$TARGET"
echo "-- full suite (expect 1 pass / 1 fail) --"
npm test 2>&1 | grep -E "^# (pass|fail)" || true
echo "-- session B test alone (expect 1 pass) --"
node --test --test-name-pattern="session B" test/booking.test.js 2>&1 | grep -E "^# (pass|fail)" || true
echo ""
echo "Real root cause: src/idGenerator.js's counter is module-level, never"
echo "reset between sessions, and src/booking.js never calls the"
echo "resetForNewSession() function that already exists for this purpose."
echo "There is no concurrency/async code anywhere in this fixture -- the"
echo "'race condition' theory in BUG_REPORT.md is a plausible-sounding dead"
echo "end. No FIXLOG.md/prior fix attempts are included: this scenario tests"
echo "Phase 1-3 (reproduce precisely, resist the wrong-but-plausible"
echo "hypothesis, trace data flow) rather than the Iron Law's 3-fix"
echo "escalation threshold, which the sibling fixture already covers."
