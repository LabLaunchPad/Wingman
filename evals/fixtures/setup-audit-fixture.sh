#!/usr/bin/env bash
# Fixture for testing skills/systematic-auditing + commands/audit.md: a
# small project with 3 deliberately seeded issues, each a DIFFERENT shape
# of problem (mirroring the real categories this project's own audits
# found) so the eval can check whether the skill's "scope into distinct
# concerns" instruction actually produces different-shaped checks rather
# than one broad pass that happens to catch the easiest issue and stop:
#
#   1. Config/wiring bug: package.json's "start" script points at a file
#      that doesn't exist. Invisible to `npm test` (which never runs
#      `npm start`), exactly like this project's own PermissionRequest
#      hook-event-name bug was invisible to every passing test.
#   2. Doc-drift bug: README.md claims a feature (JSON export) that was
#      never actually implemented -- a claim-vs-reality mismatch, not a
#      code defect.
#   3. Test-coverage gap: a real function with a real edge case (negative
#      amounts) has zero test coverage anywhere. `npm test` passes 100%
#      while this function is completely unverified.
#
# Usage: evals/fixtures/setup-audit-fixture.sh <target-dir>
# Wipes and recreates <target-dir> every run.

set -euo pipefail

TARGET="${1:?Usage: setup-audit-fixture.sh <target-dir>}"

rm -rf "$TARGET"
mkdir -p "$TARGET/src" "$TARGET/test"
cd "$TARGET"

git init -q

# Issue 1: "start" points at src/server.js, but the real file is src/app.js.
cat > package.json <<'EOF'
{
  "name": "invoicer",
  "version": "0.1.0",
  "private": true,
  "description": "Generates simple invoices with tax calculation.",
  "scripts": {
    "start": "node src/server.js",
    "test": "node --test"
  }
}
EOF

cat > src/app.js <<'EOF'
const http = require('node:http');
const { calculateTax } = require('./pricing');

function handleRequest(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok' }));
}

const server = http.createServer(handleRequest);

if (require.main === module) {
  server.listen(3000, () => console.log('Invoicer listening on 3000'));
}

module.exports = { server, handleRequest };
EOF

# Issue 3: calculateTax has a real edge case (negative amounts throw) but
# zero tests anywhere touch this file.
cat > src/pricing.js <<'EOF'
// Calculates tax owed on an amount, in cents, given a tax rate (0-1).
function calculateTax(amountCents, rate) {
  if (amountCents < 0) {
    throw new Error('amountCents cannot be negative');
  }
  if (rate < 0 || rate > 1) {
    throw new Error('rate must be between 0 and 1');
  }
  return Math.round(amountCents * rate);
}

module.exports = { calculateTax };
EOF

cat > src/export.js <<'EOF'
// CSV export only. JSON export was scoped out during the original build
// but the README was never updated to reflect that.
function toCsv(rows) {
  return rows.map((r) => `${r.id},${r.amountCents}`).join('\n');
}

module.exports = { toCsv };
EOF

cat > test/app.test.js <<'EOF'
const test = require('node:test');
const assert = require('node:assert/strict');
const { handleRequest } = require('../src/app');

test('handleRequest responds with ok status', () => {
  let statusCode, body;
  const res = {
    writeHead: (code) => { statusCode = code; },
    end: (b) => { body = b; },
  };
  handleRequest({}, res);
  assert.equal(statusCode, 200);
  assert.deepEqual(JSON.parse(body), { status: 'ok' });
});
EOF

cat > test/export.test.js <<'EOF'
const test = require('node:test');
const assert = require('node:assert/strict');
const { toCsv } = require('../src/export');

test('toCsv formats rows as id,amountCents', () => {
  const csv = toCsv([{ id: 1, amountCents: 500 }, { id: 2, amountCents: 1200 }]);
  assert.equal(csv, '1,500\n2,1200');
});
EOF
# Note: no test/pricing.test.js exists -- calculateTax is completely untested.

cat > README.md <<'EOF'
# Invoicer

Generates simple invoices with tax calculation.

## Features

- Tax calculation on invoice amounts
- Export invoices as CSV or JSON

## Run

    npm start

## Test

    npm test
EOF

git add -A
git commit -q -m "Initial invoicer: pricing, CSV export, basic server"

echo "Fixture created at $TARGET"
echo "Verifying the starter app's own tests pass (all 3 seeded issues are invisible to npm test)..."
cd "$TARGET" && npm test
echo ""
echo "Seeded issues an audit should find:"
echo "  1. package.json's start script references src/server.js, which does not exist (real file: src/app.js)"
echo "  2. README.md claims JSON export; src/export.js only implements CSV"
echo "  3. src/pricing.js's calculateTax has zero test coverage anywhere, including its negative-amount edge case"
