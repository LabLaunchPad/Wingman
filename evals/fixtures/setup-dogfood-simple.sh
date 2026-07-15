#!/usr/bin/env bash
# Fixture for /wingman:dogfood's maintainer-mode "simple path" -- a
# genuinely minimal real project with zero conditional signals: no
# auth, no payments, no schema/migrations, no user-facing surface.
#
# "Internal Status API" -- a tiny, real, working Node.js HTTP service
# (a single GET /jobs route returning an empty list) with a passing
# test suite already in place. Deliberately zero external dependencies
# (Node's built-in http/test/assert modules only), so `npm test` runs
# with no install step and no network dependency.
#
# Purpose: prove the gates that are supposed to stay dormant on a
# trivial project actually do -- management-board-activation's
# conditional-department threshold, department-lead-activation's
# conditional signals, dod-structural-gate.mjs's checks. This exact
# shape (a single /health-style endpoint) is what caught the real
# complexity-gate miscounting bug documented in docs/wingman/retros.md
# (2026-07-14/15) -- do not "simplify" this fixture further without
# re-checking that retro first.
#
# Usage: evals/fixtures/setup-dogfood-simple.sh <target-dir>
# Wipes and recreates <target-dir> every run.

set -euo pipefail

TARGET="${1:?Usage: setup-dogfood-simple.sh <target-dir>}"

rm -rf "$TARGET"
mkdir -p "$TARGET/src" "$TARGET/test"
cd "$TARGET"

git init -q
git config user.email founder@example.com
git config user.name "Founder"

cat > package.json <<'EOF'
{
  "name": "internal-status-api",
  "version": "0.1.0",
  "private": true,
  "description": "A small internal API a team uses to check job statuses.",
  "scripts": {
    "test": "node --test",
    "start": "node src/server.js"
  }
}
EOF

cat > src/server.js <<'EOF'
const http = require('node:http');
const { URL } = require('node:url');

const PORT = process.env.PORT || 3000;

function createServer() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (req.method === 'GET' && url.pathname === '/jobs') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ jobs: [] }));
      return;
    }
    res.writeHead(404);
    res.end('Not found');
  });
}

if (require.main === module) {
  createServer().listen(PORT, () => console.log(`Status API listening on ${PORT}`));
}

module.exports = { createServer };
EOF

cat > test/server.test.js <<'EOF'
const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const { createServer } = require('../src/server');

test('GET /jobs returns an empty list', async () => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));
  try {
    const port = server.address().port;
    const res = await new Promise((resolve) => http.get(`http://localhost:${port}/jobs`, resolve));
    assert.strictEqual(res.statusCode, 200);
  } finally {
    server.close();
  }
});
EOF

git add -A
git commit -qm "Initial internal status API" --allow-empty

echo "Fixture created at $TARGET"
echo "No conditional signals present -- dept-design/dept-data/dept-legal-security/dept-devops/dept-growth should all stay dormant through the whole pipeline."
