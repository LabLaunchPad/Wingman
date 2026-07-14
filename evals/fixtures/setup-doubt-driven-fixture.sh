#!/usr/bin/env bash
# Fixture for skills/doubt-driven-development: "cartprice", a tiny Node cart
# subtotal calculator. A teammate has left a commit message and a code comment
# using classic doubt-trigger phrases ("tests cover all the important cases,
# should be enough to ship") while a real edge case sits unhandled: passing a
# negative quantity produces a negative line-total and a negative cart total
# instead of being rejected -- a bug the existing tests never exercise because
# they only use positive quantities. Tests whether the discipline actually
# fires investigation on the doubt-trigger phrase and finds the gap, rather
# than taking the "should be enough" claim at face value.
#
# Usage: evals/fixtures/setup-doubt-driven-fixture.sh <target-dir>
set -euo pipefail
TARGET="${1:?Usage: setup-doubt-driven-fixture.sh <target-dir>}"
rm -rf "$TARGET"; mkdir -p "$TARGET/src" "$TARGET/test"; cd "$TARGET"; git init -q

cat > package.json <<'EOF'
{ "name": "cartprice", "private": true, "scripts": { "test": "node --test" } }
EOF

# Cart subtotal: sums price*qty for each item, applies a flat discount code.
# Bug: quantity is never validated, so a negative quantity silently produces
# a negative line-total, which can drive the cart subtotal below zero or
# let a negative-quantity line cancel out a legitimate one.
cat > src/cart.js <<'EOF'
function subtotal(items, discountCode) {
  let total = 0;
  for (const item of items) {
    total += item.price * item.qty;
  }
  if (discountCode === 'SAVE10') {
    total = total * 0.9;
  }
  return Math.round(total * 100) / 100;
}
module.exports = { subtotal };
EOF

cat > test/cart.test.js <<'EOF'
const test = require('node:test');
const assert = require('node:assert/strict');
const { subtotal } = require('../src/cart');

test('sums a single item', () => {
  assert.equal(subtotal([{ price: 10, qty: 2 }]), 20);
});
test('sums multiple items', () => {
  assert.equal(subtotal([{ price: 10, qty: 1 }, { price: 5, qty: 3 }]), 25);
});
test('applies a discount code', () => {
  assert.equal(subtotal([{ price: 10, qty: 2 }], 'SAVE10'), 18);
});
EOF

cat > NOTES.md <<'EOF'
# Cart subtotal - handoff notes

Implemented `subtotal()` for the cart total feature. I think this covers it --
tests cover all the important cases, should be enough to ship. Ran `npm test`
and everything passes.
EOF

git add -A
git commit -q -m "Cart subtotal: tests cover all the important cases, should be enough to ship"

echo "Fixture created at $TARGET"
echo "Real bug present but untested: subtotal([{price: 10, qty: -1}]) returns -10"
echo "instead of rejecting the negative quantity -- none of the 3 shipped tests"
echo "use a negative or zero quantity, so they all pass despite the gap."
