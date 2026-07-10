#!/usr/bin/env bash
# Fixture for department-lead-activation's third scenario: tech-stack/MCP
# skill materialization (Core Workflow step 6). Deliberately has EXACTLY
# ONE catalog signal — `next` in package.json dependencies, matching only
# `nextjs-app-router` in docs/SKILL-ROSTER.md — and no others: no `react`
# dependency line, no schema/migrations file, no Dockerfile, no
# .mcp.json. This isolates the "materialize exactly one, nothing else"
# check from the multi-signal noise a realistic app fixture would add.
#
# Usage: evals/fixtures/setup-skill-catalog-fixture.sh <target-dir>
# Wipes and recreates <target-dir> every run, so the eval starts clean.

set -euo pipefail

TARGET="${1:?Usage: setup-skill-catalog-fixture.sh <target-dir>}"

rm -rf "$TARGET"
mkdir -p "$TARGET"
cd "$TARGET"

git init -q

mkdir -p src/app
cat > package.json <<'EOF'
{
  "name": "single-signal-app",
  "private": true,
  "dependencies": { "next": "^14.0.0" }
}
EOF

cat > src/app/page.js <<'EOF'
export default function HomePage() {
  return null;
}
EOF

cat > README.md <<'EOF'
# single-signal-app

A minimal fixture with exactly one tech-stack catalog signal (`next`).
EOF

git add -A
git commit -q -m "Initial fixture: single-signal-app"

echo "Fixture created at $TARGET"
echo "Expected skill-roster materialization for this fixture:"
echo "  nextjs-app-router -> YES (next in package.json dependencies)"
echo "  everything else in docs/SKILL-ROSTER.md -> NO (no other signal present)"
