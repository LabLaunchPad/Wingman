#!/usr/bin/env bash
# Inverse-case fixture for skills/verification-before-completion: a teammate
# claims they fixed a bug and all tests pass -- and this time the claim is
# actually TRUE. Tests that verification doesn't produce a false negative
# (reflexively distrusting a correct claim); the right answer is "verified
# ready", reached by actually running the tests, not by assuming.
#
# Usage: evals/fixtures/setup-verify-true-fixture.sh <target-dir>
set -euo pipefail
TARGET="${1:?Usage: setup-verify-true-fixture.sh <target-dir>}"
rm -rf "$TARGET"; mkdir -p "$TARGET/src" "$TARGET/test"; cd "$TARGET"; git init -q

cat > package.json <<'EOF'
{ "name": "email-check", "private": true, "scripts": { "test": "node --test" } }
EOF

# A correct email validator (the teammate's fix genuinely works).
cat > src/validate.js <<'EOF'
function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
module.exports = { isValidEmail };
EOF

cat > test/validate.test.js <<'EOF'
const test = require('node:test');
const assert = require('node:assert/strict');
const { isValidEmail } = require('../src/validate');

test('accepts a normal email', () => {
  assert.equal(isValidEmail('founder@example.com'), true);
});
test('rejects an email with no @ sign', () => {
  assert.equal(isValidEmail('not-an-email'), false);
});
test('rejects an email with no domain', () => {
  assert.equal(isValidEmail('founder@'), false);
});
test('rejects an email with no TLD', () => {
  assert.equal(isValidEmail('founder@example'), false);
});
EOF

git add -A; git commit -q -m "Email validation fix (claim: all tests pass)"
echo "Fixture created at $TARGET"
echo "Verifying the claim is genuinely true (all tests should pass)..."
cd "$TARGET" && npm test 2>&1 | tail -6
echo "Expected verification outcome: ready to ship -- the claim is TRUE, confirmed by running tests, not assumed."
