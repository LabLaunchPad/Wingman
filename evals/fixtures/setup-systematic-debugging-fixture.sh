#!/usr/bin/env bash
# Fixture for skills/systematic-debugging, testing the one phase no other
# eval in this project has exercised: the "3+ failed fixes -> stop and
# question the architecture" escalation (see hotfix.md's own trust-level
# note: neither of its two runs reached this threshold).
#
# "Ledgerly" is a tiny expense-splitting module with a real, still-present
# bug (a shared module-level cache never keyed per-group, so balances leak
# between different expense groups -- similar in spirit to the classic
# module-level-state trap, but the fixture also ships a FIXLOG.md
# documenting THREE previous, distinct, failed fix attempts against three
# different symptoms. That sets the scene at exactly the Iron Law's
# threshold: the next attempt would be fix #4, which the skill says must
# not happen without first stopping to question the architecture.
#
# Usage: evals/fixtures/setup-systematic-debugging-fixture.sh <target-dir>
# Wipes and recreates <target-dir> every run, so the eval starts clean.

set -euo pipefail

TARGET="${1:?Usage: setup-systematic-debugging-fixture.sh <target-dir>}"

rm -rf "$TARGET"
mkdir -p "$TARGET/src" "$TARGET/test"
cd "$TARGET"

git init -q

cat > package.json <<'EOF'
{
  "name": "ledgerly",
  "version": "0.4.0",
  "private": true,
  "scripts": { "test": "node --test" }
}
EOF

# BUG: `balanceCache` is a module-level object never keyed or cleared per
# group, so a balance computed for one expense group leaks into the next
# group's result if they share any member name. This is the REAL root
# cause. Three previous attempts (see FIXLOG.md) each patched a different
# *symptom* and failed, because none of them addressed the shared cache.
cat > src/ledger.js <<'EOF'
// Splits a group's expenses evenly among its members and returns each
// member's balance (positive = owed money, negative = owes money).
const balanceCache = {}; // BUG: keyed only by member name, shared across ALL groups

function splitExpenses(members, expenses) {
  const share = expenses.reduce((sum, e) => sum + e.amountCents, 0) / members.length;
  const paid = {};
  for (const m of members) paid[m] = 0;
  for (const e of expenses) paid[e.paidBy] = (paid[e.paidBy] || 0) + e.amountCents;

  const result = {};
  for (const m of members) {
    const balance = paid[m] - share;
    // Leaks: overwrites/reads a cache shared across every call, keyed only
    // by member name -- not by group. Two different groups that happen to
    // share a member name will clobber each other's balance.
    balanceCache[m] = (balanceCache[m] || 0) + balance;
    result[m] = balanceCache[m];
  }
  return result;
}

module.exports = { splitExpenses };
EOF

cat > test/ledger.test.js <<'EOF'
const test = require('node:test');
const assert = require('node:assert/strict');
const { splitExpenses } = require('../src/ledger');

test('a single group splits evenly', () => {
  const result = splitExpenses(['alice', 'bob'], [{ paidBy: 'alice', amountCents: 1000 }]);
  assert.equal(result.alice, 500);
  assert.equal(result.bob, -500);
});

test('a second, unrelated group that shares a member name gets a clean balance (fails: cache leaks)', () => {
  const result = splitExpenses(['alice', 'carol'], [{ paidBy: 'carol', amountCents: 800 }]);
  // Expected: alice owes 400, carol is owed 400 -- computed fresh for THIS
  // group. Actual (bug): alice's balance carries over the +500 from the
  // previous, unrelated group above.
  assert.equal(result.alice, -400);
  assert.equal(result.carol, 400);
});
EOF

cat > FIXLOG.md <<'EOF'
# Fix log: "balances look wrong for repeat customers"

Bug report: "When the same person (e.g. 'alice') is in more than one expense
group, her balance in the SECOND group looks wrong -- like it's adding in
something from a totally different group she was in earlier."

Three fixes have been attempted so far. All three failed -- the bug is
still reproducible. Do not attempt a 4th fix the same way these three were
attempted; each addressed a different guessed symptom in a different part
of the code, which is itself a signal worth noticing.

## Attempt 1 (2026-06-20)
Hypothesis: floating-point rounding drift in the division `expenses / members.length`.
Fix tried: rounded `share` to the nearest cent before subtracting.
Result: FAILED. Balances were still wrong by the same non-rounding amount.
Reverted.

## Attempt 2 (2026-06-22)
Hypothesis: `paid[m]` wasn't initialized for members who paid nothing.
Fix tried: defensive `paid[m] = paid[m] || 0` added in an extra pass.
Result: FAILED. No change in the reported symptom -- `paid` was already
correctly initialized before this fix.
Reverted.

## Attempt 3 (2026-06-25)
Hypothesis: `members` array had accidental duplicate entries in some group.
Fix tried: de-duplicated `members` with `[...new Set(members)]` before splitting.
Result: FAILED. The two groups in the bug report have no duplicate members
at all -- this didn't touch the actual code path involved.
Reverted.

Status: bug still reproduces. Next debugger: please don't reach for a 4th
guess-and-patch on a new symptom without first re-reading
`systematic-debugging`'s guidance on what 3 failed attempts usually means.
EOF

git add -A
git commit -q -m "Ledgerly: expense splitter with a real cross-group balance leak + 3 failed fix attempts logged"

echo "Fixture created at $TARGET"
echo "Confirming the bug still reproduces (second test should fail):"
cd "$TARGET" && npm test 2>&1 | grep -E "^# (pass|fail)" || true
echo ""
echo "Real root cause: src/ledger.js's balanceCache is module-level and keyed"
echo "only by member name, shared across every group, and never cleared."
echo "FIXLOG.md documents 3 prior failed fixes, each guessing a different"
echo "symptom -- this fixture starts exactly at the 'fix #4' threshold that"
echo "systematic-debugging's Phase 4 says must not be attempted without first"
echo "stopping to question the architecture."
