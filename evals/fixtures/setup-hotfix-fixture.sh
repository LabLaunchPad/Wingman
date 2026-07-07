#!/usr/bin/env bash
# Fixture for testing /wingman:hotfix: a small, already-shipped Node service
# ("Coupon", a discount calculator) with a real, deliberately subtle
# production bug -- it rounds discounted prices DOWN (Math.floor) instead of
# to the nearest cent (Math.round). The existing test suite only exercises
# price/percent combinations where floor and round happen to agree, so it
# passes despite the bug -- exactly how a real regression reaches
# production undetected. One new input (a $3.33 item at 10% off) exposes it:
# correct = 300 cents ($3.00), buggy = 299 cents ($2.99).
#
# Also pre-seeds .wingman/checkpoints.jsonl with a prior "ship" entry (so
# dept-devops's "has shipped once already" signal is true) and does NOT
# pre-create any .claude/agents/ department leads, so the hotfix run
# exercises department-lead-activation fresh.
#
# Usage: evals/fixtures/setup-hotfix-fixture.sh <target-dir>
# Wipes and recreates <target-dir> every run.

set -euo pipefail

TARGET="${1:?Usage: setup-hotfix-fixture.sh <target-dir>}"

rm -rf "$TARGET"
mkdir -p "$TARGET/src" "$TARGET/test" "$TARGET/.wingman"
cd "$TARGET"

git init -q

cat > package.json <<'EOF'
{
  "name": "coupon",
  "version": "0.1.0",
  "private": true,
  "description": "Applies a percent-off discount to a price, in cents.",
  "scripts": { "test": "node --test" }
}
EOF

cat > src/discount.js <<'EOF'
// Applies a percent-off discount to a price given in integer cents.
// BUG: rounds down (Math.floor) instead of to the nearest cent, so any
// price/percent combination whose exact result has a fractional part of
// .5 or more silently undercharges by a cent. Existing tests happen to
// only use combinations where floor and round agree.
function applyDiscount(priceCents, percentOff) {
  const exact = (priceCents * (100 - percentOff)) / 100;
  return Math.floor(exact);
}

module.exports = { applyDiscount };
EOF

cat > test/discount.test.js <<'EOF'
const test = require('node:test');
const assert = require('node:assert/strict');
const { applyDiscount } = require('../src/discount');

test('20% off $10.00 is $8.00', () => {
  assert.equal(applyDiscount(1000, 20), 800);
});

test('50% off $4.00 is $2.00', () => {
  assert.equal(applyDiscount(400, 50), 200);
});

test('0% off leaves the price unchanged', () => {
  assert.equal(applyDiscount(599, 0), 599);
});
EOF

cat > README.md <<'EOF'
# Coupon

Applies a percent-off discount to a price, in integer cents.

## Test

    npm test
EOF

mkdir -p .wingman
cat > .wingman/checkpoints.jsonl <<'EOF'
{"checkpoint_id": "2026-06-15T10-00-00Z-ship", "stage": "ship", "scope_ref": "diff", "seats": [{"seat": "founder", "verdict": "GO", "summary": "Discount calculator matches the ask."}, {"seat": "engineer", "verdict": "GO", "summary": "Tests pass, logic is simple and correct for the cases tested."}, {"seat": "security", "verdict": "GO", "summary": "No user input, no external calls."}, {"seat": "design", "verdict": "GO", "summary": "N/A -- backend-only."}, {"seat": "cost", "verdict": "GO", "summary": "No new dependencies."}], "bottom_line": "GO", "founder_decision": "ship_it", "founder_notes": "", "next_stage": "shipped"}
EOF

cat > .wingman/state.json <<'EOF'
{
  "current_stage": "shipped",
  "active_department_leads": [],
  "active_specialists": [],
  "last_checkpoint_id": "2026-06-15T10-00-00Z-ship",
  "updated_at": "2026-06-15T10:00:05Z"
}
EOF

git add -A
git commit -q -m "Initial coupon discount calculator, shipped with passing tests"

echo "Fixture created at $TARGET"
echo "Verifying the starter app's own tests currently pass (bug is undetected)..."
cd "$TARGET" && npm test
echo ""
echo "Production bug report to feed /wingman:hotfix:"
echo '  "A customer'\''s receipt showed $2.99 for a $3.33 item marked 10% off. That looks wrong -- 3.33 * 0.9 = 2.997, which should round to $3.00, not $2.99. We think we are undercharging by a cent on this order, and probably on others with similar price/percent combinations."'
echo "Expected root cause: src/discount.js uses Math.floor instead of Math.round."
