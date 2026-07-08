#!/usr/bin/env bash
# Realistic starter project for the full-pipeline end-to-end eval:
# "Waitlist" — a tiny, real, working Node.js HTTP service (a founder's
# actual MVP) with a passing test suite already in place. Deliberately
# uses zero external dependencies (Node's built-in http/test/assert
# modules only) so `npm test` runs with no install step and no network
# dependency, keeping the fixture fully self-contained and reliable to
# run inside an eval.
#
# Usage: evals/fixtures/setup-waitlist-app.sh <target-dir>
# Wipes and recreates <target-dir> every run.

set -euo pipefail

TARGET="${1:?Usage: setup-waitlist-app.sh <target-dir>}"

rm -rf "$TARGET"
mkdir -p "$TARGET/src" "$TARGET/test"
cd "$TARGET"

git init -q

cat > package.json <<'EOF'
{
  "name": "waitlist",
  "version": "0.1.0",
  "private": true,
  "description": "A simple waitlist signup service.",
  "scripts": {
    "test": "node --test",
    "start": "node src/server.js"
  }
}
EOF

cat > src/waitlist.js <<'EOF'
// In-memory waitlist store. Not persisted to disk -- fine for an MVP,
// the founder knows this will need a real database before it matters.
const entries = new Map(); // email -> { email, joinedAt }

function addToWaitlist(email) {
  if (!email || !email.includes('@')) {
    throw new Error('A valid email is required.');
  }
  if (entries.has(email)) {
    return entries.get(email);
  }
  const entry = { email, joinedAt: new Date().toISOString() };
  entries.set(email, entry);
  return entry;
}

function listWaitlist() {
  return Array.from(entries.values());
}

function _reset() {
  entries.clear();
}

module.exports = { addToWaitlist, listWaitlist, _reset };
EOF

cat > src/server.js <<'EOF'
const http = require('node:http');
const { URL } = require('node:url');
const { addToWaitlist, listWaitlist } = require('./waitlist');

function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'POST' && url.pathname === '/waitlist') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const { email } = JSON.parse(body || '{}');
        const entry = addToWaitlist(email);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(entry));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/waitlist') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(listWaitlist()));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}

const server = http.createServer(handleRequest);

if (require.main === module) {
  const port = process.env.PORT || 3000;
  server.listen(port, () => console.log(`Waitlist server listening on ${port}`));
}

module.exports = { server, handleRequest };
EOF

cat > test/waitlist.test.js <<'EOF'
const test = require('node:test');
const assert = require('node:assert/strict');
const { addToWaitlist, listWaitlist, _reset } = require('../src/waitlist');

test.beforeEach(() => _reset());

test('addToWaitlist adds a new entry', () => {
  const entry = addToWaitlist('founder@example.com');
  assert.equal(entry.email, 'founder@example.com');
  assert.equal(listWaitlist().length, 1);
});

test('addToWaitlist rejects an invalid email', () => {
  assert.throws(() => addToWaitlist('not-an-email'));
});

test('addToWaitlist is idempotent for the same email', () => {
  addToWaitlist('founder@example.com');
  addToWaitlist('founder@example.com');
  assert.equal(listWaitlist().length, 1);
});
EOF

cat > README.md <<'EOF'
# Waitlist

A simple waitlist signup service.

## Run

    npm start

## Test

    npm test
EOF

git add -A
git commit -q -m "Initial waitlist app: signup + list, with passing tests"

echo "Fixture created at $TARGET"
echo "Verifying the starter app's own tests pass..."
cd "$TARGET" && npm test
