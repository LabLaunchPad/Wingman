#!/usr/bin/env bash
# Fixture for skills/writing-plans: a small existing Node project plus a
# SPEC.md that deliberately bundles TWO independent subsystems (rate
# limiting on the API, and an RSS changelog feed) under one shared global
# constraint. Tests whether writing-plans' own "Scope Check" actually splits
# this into two separate plans (one per subsystem) rather than writing one
# blended plan -- the distinctive behavior no other eval exercises.
#
# Usage: evals/fixtures/setup-writing-plans-fixture.sh <target-dir>
# Wipes and recreates <target-dir> every run, so the eval starts clean.

set -euo pipefail

TARGET="${1:?Usage: setup-writing-plans-fixture.sh <target-dir>}"

rm -rf "$TARGET"
mkdir -p "$TARGET/src" "$TARGET/test"
cd "$TARGET"

git init -q

cat > package.json <<'EOF'
{
  "name": "tinyboard",
  "version": "0.3.0",
  "private": true,
  "scripts": { "test": "node --test" }
}
EOF

cat > src/server.js <<'EOF'
// Minimal in-memory API server for a tiny "TinyBoard" changelog/status app.
// No framework -- plain http, so a reviewer with "zero context" can still
// follow it end to end.
const http = require('http');

const posts = [
  { id: 1, title: 'Launched TinyBoard', body: 'First release.', publishedAt: '2026-06-01T00:00:00Z' },
];

function handleRequest(req, res) {
  if (req.method === 'GET' && req.url === '/posts') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(posts));
    return;
  }
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not found' }));
}

function createServer() {
  return http.createServer(handleRequest);
}

module.exports = { createServer, handleRequest, posts };
EOF

cat > test/server.test.js <<'EOF'
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createServer } = require('../src/server');

test('GET /posts returns the seeded posts', async () => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const body = await new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}/posts`, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
  const posts = JSON.parse(body);
  assert.equal(posts.length, 1);
  assert.equal(posts[0].title, 'Launched TinyBoard');
  server.close();
});
EOF

cat > README.md <<'EOF'
# TinyBoard

A tiny in-memory changelog/status API. No database yet -- posts live in
memory and reset on restart. Node 18+, zero dependencies beyond the
standard library.
EOF

cat > SPEC.md <<'EOF'
# SPEC: Two follow-up requests for TinyBoard

Two things the founder asked for in the same message. They are unrelated
to each other -- neither depends on the other's code -- but share one
project-wide constraint below.

## Global constraint (applies to both)

- Node 18+ only. No new npm dependencies without explicit approval --
  everything must be implementable with the Node standard library alone.

## Request A: Basic rate limiting on the API

Right now `GET /posts` has no rate limiting at all -- a single client can
hammer it as fast as it wants. Add a simple per-IP rate limit: no more
than 5 requests per 10-second window per client IP. A client that exceeds
this should get `HTTP 429` with a JSON body `{ "error": "rate_limited" }`.
Requests within the limit behave exactly as before. This only touches
request handling in `src/server.js` -- it doesn't touch what data is
returned.

## Request B: RSS changelog feed

Add a new endpoint `GET /changelog.rss` that renders the existing `posts`
array (the same data `GET /posts` already returns) as a valid RSS 2.0 XML
feed -- one `<item>` per post, using `title`, `body` as `<description>`,
and `publishedAt` as `<pubDate>` (RFC 822 format). This is a read-only,
additive endpoint; it doesn't change `/posts` or how posts are stored.
EOF

git add -A
git commit -q -m "Initial fixture: TinyBoard API + SPEC bundling 2 independent subsystems"

echo "Fixture created at $TARGET"
echo "SPEC.md deliberately bundles 2 independent subsystems (rate limiting, RSS feed)"
echo "under 1 shared global constraint (Node 18+, no new deps) -- tests writing-plans'"
echo "own Scope Check: split into 2 separate plans, not one blended plan."
