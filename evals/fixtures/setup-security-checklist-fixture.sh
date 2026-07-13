#!/usr/bin/env bash
# Fixture for testing skills/security-checklist: "Boards", a small Express-style
# (hand-rolled, no real network) job-board API with real, concrete STRIDE /
# OWASP-relevant gaps for a security pass to catch -- deliberately different
# shapes so a shallow pass can't get lucky on just one:
#
#   1. Injection (OWASP A03) -- login builds a SQL string via raw
#      concatenation of the username field. Classic Tampering/Information
#      Disclosure under STRIDE.
#   2. Broken Access Control (OWASP A01) -- deleteJobPosting takes only a
#      jobId, no caller/owner identity is checked at all: any caller can
#      delete any other employer's posting (Elevation of Privilege).
#   3. Cryptographic Failures (OWASP A02) -- passwords are stored and
#      compared in plaintext, no hashing at all.
#
# All tests pass (they assert the insecure behavior "works"); nothing in
# the project has a threat register or any CLOSED/OPEN disposition for any
# of these -- the point is that green tests don't mean secure.
#
# Usage: evals/fixtures/setup-security-checklist-fixture.sh <target-dir>
# Wipes and recreates <target-dir> every run.

set -euo pipefail

TARGET="${1:?Usage: setup-security-checklist-fixture.sh <target-dir>}"

rm -rf "$TARGET"
mkdir -p "$TARGET/src" "$TARGET/test"
cd "$TARGET"

git init -q

cat > package.json <<'EOF'
{
  "name": "boards",
  "version": "0.1.0",
  "private": true,
  "description": "A small job-board API: login and manage job postings.",
  "scripts": { "test": "node --test" }
}
EOF

cat > src/db.js <<'EOF'
// Minimal in-memory stand-in for a SQL database. rawQuery just records the
// SQL string it was asked to run, so tests/reviewers can inspect exactly
// what got built from user input.
const users = [
  { username: 'alice', password: 'hunter2' },
  { username: 'bob', password: 'letmein' },
];
const postings = [
  { id: 'p1', owner: 'alice', title: 'Backend Engineer' },
  { id: 'p2', owner: 'bob', title: 'Designer' },
];
function rawQuery(sql) { return { sql, rows: [] }; }
module.exports = { users, postings, rawQuery };
EOF

cat > src/auth.js <<'EOF'
const { users, rawQuery } = require('./db');

// GAP 1 (Injection / Tampering): builds the lookup query by concatenating
// raw user input directly into a SQL string. A username like
// "' OR '1'='1" breaks out of the intended query.
function loginQuery(username) {
  return rawQuery(`SELECT * FROM users WHERE username = '${username}'`);
}

// GAP 3 (Cryptographic Failures): passwords are stored and compared in
// plaintext -- no hashing, no salt, anywhere.
function checkPassword(username, password) {
  const user = users.find((u) => u.username === username);
  return !!user && user.password === password;
}

module.exports = { loginQuery, checkPassword };
EOF

cat > src/postings.js <<'EOF'
const { postings } = require('./db');

// GAP 2 (Broken Access Control / Elevation of Privilege): no caller
// identity is passed or checked at all. Any caller can delete any job
// posting regardless of who owns it.
function deleteJobPosting(jobId) {
  const idx = postings.findIndex((p) => p.id === jobId);
  if (idx === -1) return false;
  postings.splice(idx, 1);
  return true;
}

module.exports = { deleteJobPosting };
EOF

cat > test/boards.test.js <<'EOF'
const test = require('node:test');
const assert = require('node:assert/strict');
const { loginQuery, checkPassword } = require('../src/auth');
const { deleteJobPosting } = require('../src/postings');

// These tests all pass -- they assert the (insecure) behavior works as
// coded. Green tests here say nothing about whether any of this is safe.
test('loginQuery builds a select for the given username', () => {
  assert.match(loginQuery('alice').sql, /SELECT \* FROM users WHERE username = 'alice'/);
});

test('checkPassword accepts the correct plaintext password', () => {
  assert.equal(checkPassword('alice', 'hunter2'), true);
});

test('checkPassword rejects the wrong password', () => {
  assert.equal(checkPassword('alice', 'wrong'), false);
});

test('deleteJobPosting removes a posting by id regardless of caller', () => {
  assert.equal(deleteJobPosting('p2'), true);
});
EOF

cat > README.md <<'EOF'
# Boards

A small job-board API: user login and job-posting management.

## Test

    npm test
EOF

git add -A
git commit -q -m "feat: job board login and posting management"

echo "Fixture created at $TARGET"
echo "Verifying the starter app's own tests currently pass (insecure code still 'passes')..."
cd "$TARGET" && npm test
echo ""
echo "Ask to feed the security-checklist skill: \"This login and job-posting code is ready for a security pass before ship.\""
echo "Expected concrete findings (no threat register or disposition exists anywhere yet):"
echo "  1. SQL injection via string concatenation -- src/auth.js loginQuery"
echo "  2. Broken access control -- src/postings.js deleteJobPosting has no owner/caller check"
echo "  3. Plaintext password storage/comparison -- src/db.js users, src/auth.js checkPassword"
