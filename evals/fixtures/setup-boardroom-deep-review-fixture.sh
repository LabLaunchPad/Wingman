#!/usr/bin/env bash
# Fixture for the boardroom-deep-review eval: a real feature plan with a
# genuine, deliberately-seeded split across seats — the Security seat has
# real grounds for concern (a hardcoded credential + unvalidated input in
# the accompanying diff), the Engineer seat has real grounds for concern
# (no test plan for the new code path), and the other three seats have no
# strong reason to object. This is what makes round 2 of deep-review mode
# ("the meeting") meaningful to test: there's a genuine disagreement for
# seats to reference and converge on, not a manufactured one.
#
# Usage: evals/fixtures/setup-boardroom-deep-review-fixture.sh <target-dir>
# Wipes and recreates <target-dir> every run, so the eval starts clean.

set -euo pipefail

TARGET="${1:?Usage: setup-boardroom-deep-review-fixture.sh <target-dir>}"

rm -rf "$TARGET"
mkdir -p "$TARGET"
cd "$TARGET"

git init -q

mkdir -p src
cat > package.json <<'EOF'
{
  "name": "csv-import-app",
  "private": true,
  "dependencies": {}
}
EOF

cat > src/import.js <<'EOF'
// Existing, already-shipped code (before this plan's change).
const fs = require("fs");

function readCustomerFile(path) {
  return fs.readFileSync(path, "utf-8");
}

module.exports = { readCustomerFile };
EOF

git add -A
git commit -q -m "Initial fixture: csv-import-app baseline"

mkdir -p docs/wingman/plans
cat > docs/wingman/plans/2026-07-10-bulk-csv-import.md <<'EOF'
# Plan: Bulk CSV customer import

## Context

Founder wants to let their team upload a CSV of customer records (name,
email, external CRM ID) in one batch instead of adding them one at a
time through the existing form.

## Design

Add `src/bulk-import.js`, exporting `importCustomersFromCsv(csvPath)`:
- Reads the file at `csvPath` and splits it into rows.
- For each row, calls the existing CRM sync API using a service credential.
- Writes accepted rows to the customer store; skips malformed rows.

Implementation (already written, staged as an uncommitted diff in this
fixture so a Boardroom review has real code to look at, not just prose):

```js
// src/bulk-import.js
const fs = require("fs");
const CRM_API_KEY = "sk_live_4242424242424242"; // service credential

function importCustomersFromCsv(csvPath) {
  const raw = fs.readFileSync(csvPath, "utf-8");
  const rows = raw.split("\n").map((line) => line.split(","));
  const results = [];
  for (const [name, email, crmId] of rows) {
    // No validation on `name`/`email`/`crmId` before use.
    const query = `INSERT INTO customers (name, email, crm_id) VALUES ('${name}', '${email}', '${crmId}')`;
    results.push(runQuery(query, CRM_API_KEY));
  }
  return results;
}

module.exports = { importCustomersFromCsv };
```

## Files touched

- New: `src/bulk-import.js`

## Verification

Manually tested against a sample CSV of 5 rows locally. No automated
test added yet for this path.
EOF

mkdir -p src
cat > src/bulk-import.js <<'EOF'
const fs = require("fs");
const CRM_API_KEY = "sk_live_4242424242424242"; // service credential

function importCustomersFromCsv(csvPath) {
  const raw = fs.readFileSync(csvPath, "utf-8");
  const rows = raw.split("\n").map((line) => line.split(","));
  const results = [];
  for (const [name, email, crmId] of rows) {
    // No validation on `name`/`email`/`crmId` before use.
    const query = `INSERT INTO customers (name, email, crm_id) VALUES ('${name}', '${email}', '${crmId}')`;
    results.push(runQuery(query, CRM_API_KEY));
  }
  return results;
}

module.exports = { importCustomersFromCsv };
EOF

git add -A
git commit -q -m "Add bulk CSV import (uncommitted-in-spirit; committed here so the fixture has a fixed diff to review)"

echo "Fixture created at $TARGET"
echo "Plan file: docs/wingman/plans/2026-07-10-bulk-csv-import.md"
echo "Diff-equivalent: src/bulk-import.js (hardcoded credential + string-built SQL query, no input validation, no tests)"
echo "Expected round-1 split: Security = GO_WITH_CONCERNS or NO_GO (hardcoded key, SQL injection), Engineer = GO_WITH_CONCERNS (no tests), Founder/Design/Cost likely GO"
