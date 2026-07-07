#!/usr/bin/env bash
# Minimal fixture for testing /wingman:boardroom's consolidation logic (the
# "Bottom line rule") directly, rather than the quality of any seat's
# judgment. The project content is intentionally trivial -- a one-line diff
# -- because what's under test is whether the command correctly derives
# GO / GO_WITH_CHANGES / DO NOT SHIP from a given set of seat verdicts and
# correctly records it, not whether 5 independent LLM reviews of real code
# reach any particular verdict.
#
# Usage: evals/fixtures/setup-boardroom-gate-fixture.sh <target-dir>
# Wipes and recreates <target-dir> every run.

set -euo pipefail

TARGET="${1:?Usage: setup-boardroom-gate-fixture.sh <target-dir>}"

rm -rf "$TARGET"
mkdir -p "$TARGET"
cd "$TARGET"

git init -q

cat > greet.js <<'EOF'
function greet(name) {
  return `Hello, ${name}!`;
}
module.exports = { greet };
EOF

git add -A
git commit -q -m "Initial greet function"

cat > greet.js <<'EOF'
function greet(name) {
  return `Hello, ${name}! Welcome.`;
}
module.exports = { greet };
EOF

echo "Fixture created at $TARGET"
echo "Uncommitted diff present (git diff) for /wingman:boardroom to review."
