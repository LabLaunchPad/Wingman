#!/usr/bin/env bash
# Harder-case fixture for commands/hotfix.md + skills/systematic-debugging:
# a bug whose OBVIOUS hypothesis is wrong, so a correct root-cause pass needs
# more than one hypothesis. The symptom looks like a logic error in a totalling
# function, but the real cause is shared module-level state that isn't reset
# between calls -- the classic "passes alone, fails in sequence" order-
# dependency. Tests that hotfix doesn't ship a symptom-fix on the first guess.
#
# Usage: evals/fixtures/setup-hotfix-hard-fixture.sh <target-dir>
set -euo pipefail
TARGET="${1:?Usage: setup-hotfix-hard-fixture.sh <target-dir>}"
rm -rf "$TARGET"; mkdir -p "$TARGET/src" "$TARGET/test" "$TARGET/.wingman"; cd "$TARGET"; git init -q

cat > package.json <<'EOF'
{ "name": "cart", "version": "0.1.0", "private": true, "scripts": { "test": "node --test" } }
EOF

# BUG: `runningTotal` is module-level state that accumulates across calls and
# is never reset. cartTotal() looks correct in isolation; the real fault is the
# shared accumulator. The obvious hypothesis ("the sum logic is wrong") fails.
cat > src/cart.js <<'EOF'
let runningTotal = 0; // module-level -- the real, non-obvious fault

function cartTotal(items) {
  for (const item of items) {
    runningTotal += item.priceCents * item.qty;
  }
  return runningTotal;
}

module.exports = { cartTotal };
EOF

# Tests pass individually but the second one fails because runningTotal carried
# over from the first -- an order-dependent failure.
cat > test/cart.test.js <<'EOF'
const test = require('node:test');
const assert = require('node:assert/strict');
const { cartTotal } = require('../src/cart');

test('a single 2-item cart totals correctly', () => {
  assert.equal(cartTotal([{ priceCents: 500, qty: 2 }, { priceCents: 300, qty: 1 }]), 1300);
});
test('a different cart totals correctly (fails: state carried over)', () => {
  assert.equal(cartTotal([{ priceCents: 100, qty: 1 }]), 100);
});
EOF

cat > .wingman/checkpoints.jsonl <<'EOF'
{"checkpoint_id": "2026-06-01T09-00-00Z-ship", "stage": "ship", "scope_ref": "diff", "seats": [{"seat": "founder", "verdict": "GO", "summary": "Cart totalling matches the ask."}, {"seat": "engineer", "verdict": "GO", "summary": "Tests pass."}, {"seat": "security", "verdict": "GO", "summary": "No exposure."}, {"seat": "design", "verdict": "GO", "summary": "N/A."}, {"seat": "cost", "verdict": "GO", "summary": "No new deps."}], "bottom_line": "GO", "founder_decision": "ship_it", "founder_notes": "", "next_stage": "shipped"}
EOF
cat > .wingman/state.json <<'EOF'
{ "current_stage": "shipped", "active_department_leads": [], "active_specialists": [], "last_checkpoint_id": "2026-06-01T09-00-00Z-ship", "updated_at": "2026-06-01T09:00:00Z" }
EOF

git add -A; git commit -q -m "Cart totalling (shipped; latent shared-state bug)"
echo "Fixture created at $TARGET"
echo "Confirming the order-dependent failure reproduces (run the full suite):"
cd "$TARGET" && npm test 2>&1 | grep -E "# (pass|fail)" || true
echo ""
echo 'Bug report to feed /wingman:hotfix:'
echo '  "A customer reported their cart total was way too high -- it showed the'
echo '   total from a PREVIOUS customer added on top of theirs. Each cart alone'
echo '   looks fine when we test it, but totals seem to leak between carts."'
echo "Real root cause: module-level runningTotal in src/cart.js is never reset."
echo "The obvious first hypothesis (sum logic) is WRONG -- correct fix needs 2+ hypotheses."
