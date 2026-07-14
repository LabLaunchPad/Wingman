#!/usr/bin/env bash
# Fixture for testing skills/testing-patterns: "Ledger", a small expense
# ledger module whose existing test suite passes but violates the exact
# patterns the skill enforces, each a different shape of gap:
#
#   1. Boundary not mocked -- summarizeToday() depends on the real system
#      clock (Date.now()) with no injection point, so its test is flaky by
#      construction (only reliably passes if run before midnight local time)
#      and doesn't actually exercise the boundary in a controlled way.
#   2. Assertion hidden in a helper -- one test's real assertion lives
#      inside a helper function (`expectApproved`) rather than being visible
#      in the test body, masking what's actually being checked.
#   3. Untested error branch -- addExpense() has a real validation branch
#      (rejects negative amounts by throwing) that is never exercised by
#      any test in the suite; only happy-path amounts are tested.
#
# Usage: evals/fixtures/setup-testing-patterns-fixture.sh <target-dir>
# Wipes and recreates <target-dir> every run.

set -euo pipefail

TARGET="${1:?Usage: setup-testing-patterns-fixture.sh <target-dir>}"

rm -rf "$TARGET"
mkdir -p "$TARGET/src" "$TARGET/test"
cd "$TARGET"

git init -q

cat > package.json <<'EOF'
{
  "name": "ledger",
  "version": "0.1.0",
  "private": true,
  "description": "A small expense ledger: add expenses, summarize today's total.",
  "scripts": { "test": "node --test" }
}
EOF

cat > src/ledger.js <<'EOF'
// A small in-memory expense ledger.

// GAP: addExpense has a real validation branch (negative amounts throw)
// that no test in this project ever exercises -- only positive-amount
// happy-path calls are tested anywhere.
function addExpense(ledger, amountCents, label) {
  if (amountCents < 0) {
    throw new RangeError(`amountCents must be >= 0, got ${amountCents}`);
  }
  ledger.push({ amountCents, label, addedAt: Date.now() });
  return ledger;
}

// GAP: depends directly on the real system clock with no way to inject a
// fake "now" -- there is no boundary seam here at all, so a test can only
// ever assert against whatever the real wall clock says right now.
function summarizeToday(ledger) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const cutoff = startOfDay.getTime();
  return ledger
    .filter((e) => e.addedAt >= cutoff)
    .reduce((sum, e) => sum + e.amountCents, 0);
}

module.exports = { addExpense, summarizeToday };
EOF

cat > test/ledger.test.js <<'EOF'
const test = require('node:test');
const assert = require('node:assert/strict');
const { addExpense, summarizeToday } = require('../src/ledger');

// GAP: the real assertion is buried inside this helper instead of being
// visible in the test body -- a reader of the test itself can't see what's
// actually being checked without going to find this function.
function expectApproved(ledger, expectedTotalCents) {
  assert.equal(summarizeToday(ledger), expectedTotalCents);
}

test('addExpense records a positive amount', () => {
  const ledger = [];
  addExpense(ledger, 500, 'coffee');
  assert.equal(ledger.length, 1);
  assert.equal(ledger[0].amountCents, 500);
});

test('summarizeToday totals expenses added today', () => {
  const ledger = [];
  addExpense(ledger, 500, 'coffee');
  addExpense(ledger, 1200, 'lunch');
  // GAP: real system clock, no injected/fake time -- only reliably true
  // "today", and gives no control over the boundary at all.
  expectApproved(ledger, 1700);
});

test('summarizeToday returns 0 for an empty ledger', () => {
  assert.equal(summarizeToday([]), 0);
});
EOF

cat > README.md <<'EOF'
# Ledger

A small expense ledger: add expenses, summarize today's total.

## Test

    npm test
EOF

git add -A
git commit -q -m "feat: expense ledger with add/summarize"

echo "Fixture created at $TARGET"
echo "Verifying the starter app's own tests currently pass (all three gaps stay invisible to npm test)..."
cd "$TARGET" && npm test
echo ""
echo "Ask to feed the testing-patterns skill: \"Review test coverage/quality on this ledger module before merge.\""
echo "Expected real gaps: summarizeToday depends on the unmocked real system clock (boundary gap),"
echo "expectApproved hides its real assertion inside a helper (AAA/visibility gap),"
echo "and addExpense's negative-amount RangeError branch has zero test coverage (error-path coverage gap)."
