#!/usr/bin/env bash
# Positive-case fixture for evals/cases/debt-ledger.md: a small Node.js
# project with `// minimal:` comments in each documented state (valid,
# at-ceiling, approaching-ceiling, stale) plus a matching DEBT.md.
#
# Usage: evals/fixtures/setup-debt-ledger-fixture.sh <target-dir>
# Wipes and recreates <target-dir> every run.

set -euo pipefail

TARGET="${1:?Usage: setup-debt-ledger-fixture.sh <target-dir>}"

rm -rf "$TARGET"
mkdir -p "$TARGET/src"
cd "$TARGET"

git init -q

cat > package.json <<'EOF'
{ "name": "debty-app", "version": "0.1.0", "private": true }
EOF

cat > src/service.js <<'EOF'
// minimal: linear scan over active sessions, switch to a Map if session count exceeds 500 (D1, ceiling: 500 sessions, cycle 1 of 3)
function findSession(sessions, id) {
  return sessions.find((s) => s.id === id);
}

// minimal: fixed-size in-memory cache, add LRU eviction if cache exceeds 1000 entries (D2, ceiling: 1000 entries, cycle 3 of 3 -- AT CEILING)
const cache = new Map();

// minimal: single-region deploy, add multi-region if latency complaints exceed 5/week (D3, ceiling: 5 complaints/week, cycle 2 of 2 -- approaching ceiling, currently 4/week)
function deployRegion() { return 'us-east-1'; }

// minimal: hardcoded currency USD-only, add multi-currency if a non-USD customer signs up (D4, ceiling: 1 non-USD customer, cycle 5 of 2 max -- STALE, 3 cycles past its own review window)
function formatPrice(cents) { return `$${(cents / 100).toFixed(2)}`; }

// minimal: retry 3x with fixed backoff, add exponential backoff if timeout rate exceeds 1% (D5, ceiling: 1% timeout rate, cycle 1 of 4)
function retryFetch(url) { /* ... */ }
EOF

cat > DEBT.md <<'EOF'
# Debt Ledger

| id | description | ceiling | cycle | status |
|---|---|---|---|---|
| D1 | Linear session scan | 500 sessions | 1 of 3 | OPEN |
| D2 | Fixed-size cache, no eviction | 1000 entries | 3 of 3 | HIT |
| D3 | Single-region deploy | 5 complaints/week | 2 of 2 | OPEN (approaching, 4/week) |
| D4 | USD-only pricing | 1 non-USD customer | 5 of 2 max | STALE |
| D5 | Fixed retry backoff | 1% timeout rate | 1 of 4 | OPEN |
EOF

git add -A
git commit -q -m "Initial fixture: debty-app with 5 // minimal: comments across all documented states"

echo "Fixture ready at $TARGET"
