#!/usr/bin/env bash
# Positive-case fixture for evals/cases/bloat-audit.md: a small Node.js
# project with deliberately planted bloat patterns -- a 250+ line monolith,
# a 60+ line function, deep nesting (4+ levels), copy-paste duplication, and
# an oversized import for a single-function use.
#
# Usage: evals/fixtures/setup-bloat-audit-fixture.sh <target-dir>
# Wipes and recreates <target-dir> every run.

set -euo pipefail

TARGET="${1:?Usage: setup-bloat-audit-fixture.sh <target-dir>}"

rm -rf "$TARGET"
mkdir -p "$TARGET/src"
cd "$TARGET"

git init -q

cat > package.json <<'EOF'
{
  "name": "bloaty-app",
  "version": "0.1.0",
  "private": true,
  "dependencies": { "lodash": "^4.17.21" }
}
EOF

# A 60+ line function with 4+ levels of nesting, inside a 250+ line monolith
# file. Generated programmatically so the line counts are real and provable,
# not hand-typed guesses.
{
  echo "const _ = require('lodash');"
  echo ""
  echo "// A single-purpose helper pulled from a full lodash import for one call."
  echo "function pick1(obj, key) { return _.pick(obj, [key]); }"
  echo ""
  echo "function processOrder(order) {"
  echo "  let result = {};"
  echo "  if (order) {"
  echo "    if (order.items) {"
  echo "      if (order.items.length > 0) {"
  echo "        for (const item of order.items) {"
  echo "          if (item.active) {"
  echo "            result[item.id] = item.price * item.qty;"
  echo "          }"
  echo "        }"
  echo "      }"
  echo "    }"
  echo "  }"
  for i in $(seq 1 50); do
    echo "  result.step$i = order && order.id ? order.id + $i : $i; // padding line $i to reach 60+ lines in one function"
  done
  echo "  return result;"
  echo "}"
  echo ""
  echo "function processOrderDuplicate(order) {"
  echo "  let result = {};"
  echo "  if (order) {"
  echo "    if (order.items) {"
  echo "      if (order.items.length > 0) {"
  echo "        for (const item of order.items) {"
  echo "          if (item.active) {"
  echo "            result[item.id] = item.price * item.qty;"
  echo "          }"
  echo "        }"
  echo "      }"
  echo "    }"
  echo "  }"
  echo "  return result;"
  echo "}"
  for i in $(seq 1 200); do
    echo "// padding comment line $i to push this file past 250 lines total"
  done
} > src/monolith.js

cat > README.md <<'EOF'
# Bloaty App

A fixture project with deliberately planted bloat patterns for `/wingman:bloat-audit` to catch:
a 250+ line monolith (`src/monolith.js`), a 60+ line function (`processOrder`), 4+ levels of
nesting inside it, copy-paste duplication (`processOrder` vs `processOrderDuplicate`), and a full
lodash import used for one function (`pick1`).
EOF

git add -A
git commit -q -m "Initial fixture: bloaty-app with planted bloat patterns"

echo "Fixture ready at $TARGET"
