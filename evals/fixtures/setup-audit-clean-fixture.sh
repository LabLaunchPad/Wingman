#!/usr/bin/env bash
# Negative-case fixture for skills/systematic-auditing: a small, genuinely
# CLEAN project -- start script correct, README matches the code, every
# function has test coverage, no wiring bugs. Tests that an audit correctly
# reports "nothing material found" instead of manufacturing findings to
# justify having run (the failure mode a negative case exists to catch).
#
# Usage: evals/fixtures/setup-audit-clean-fixture.sh <target-dir>
set -euo pipefail
TARGET="${1:?Usage: setup-audit-clean-fixture.sh <target-dir>}"
rm -rf "$TARGET"; mkdir -p "$TARGET/src" "$TARGET/test"; cd "$TARGET"; git init -q

cat > package.json <<'EOF'
{
  "name": "slugify",
  "version": "1.0.0",
  "private": true,
  "description": "Turns a title into a URL slug.",
  "scripts": { "start": "node src/cli.js", "test": "node --test" }
}
EOF

cat > src/slugify.js <<'EOF'
// Converts a string to a lowercase, hyphen-separated URL slug.
function slugify(input) {
  if (typeof input !== 'string') {
    throw new Error('input must be a string');
  }
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
module.exports = { slugify };
EOF

cat > src/cli.js <<'EOF'
const { slugify } = require('./slugify');
if (require.main === module) {
  const input = process.argv.slice(2).join(' ');
  console.log(slugify(input));
}
module.exports = {};
EOF

cat > test/slugify.test.js <<'EOF'
const test = require('node:test');
const assert = require('node:assert/strict');
const { slugify } = require('../src/slugify');

test('lowercases and hyphenates', () => {
  assert.equal(slugify('Hello World'), 'hello-world');
});
test('strips leading/trailing punctuation', () => {
  assert.equal(slugify('  !Hello, World!  '), 'hello-world');
});
test('collapses runs of non-alphanumerics', () => {
  assert.equal(slugify('a---b__c'), 'a-b-c');
});
test('throws on non-string input', () => {
  assert.throws(() => slugify(42));
});
EOF

cat > README.md <<'EOF'
# slugify

Turns a title into a URL slug.

## Use

    npm start "Your Title Here"      # -> your-title-here

## Test

    npm test
EOF

git add -A; git commit -q -m "slugify: complete, tested, documented"
echo "Fixture created at $TARGET"
echo "Verifying: tests pass and start script works..."
cd "$TARGET" && npm test >/dev/null 2>&1 && echo "tests: PASS" || echo "tests: FAIL"
node src/cli.js "Hello There" | grep -q "hello-there" && echo "start script: works"
echo "Expected audit outcome: nothing material to fix (this project is clean)."
