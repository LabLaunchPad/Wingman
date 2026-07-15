#!/usr/bin/env bash
# Fixture for skills/package-manager-selection's POSITIVE case -- a genuinely new Node/JS
# project scaffold with no lock file and no package.json packageManager field yet. This is
# the exact "first time this project needs a package manager at all" moment the skill exists
# to handle: default to a corepack-pinned pnpm, verified by actually running the install for
# real (this environment has network access and a real pnpm/corepack binary available).
#
# Deliberately has one real dependency (a tiny, well-known package) so "install succeeds" is
# a real, checkable claim -- not just a scaffold with nothing to install.
#
# Usage: evals/fixtures/setup-new-node-project.sh <target-dir>
# Wipes and recreates <target-dir> every run.

set -euo pipefail

TARGET="${1:?Usage: setup-new-node-project.sh <target-dir>}"

rm -rf "$TARGET"
mkdir -p "$TARGET/src"
cd "$TARGET"

git init -q
git config user.email founder@example.com
git config user.name "Founder"

cat > package.json <<'EOF'
{
  "name": "greeting-service",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "kleur": "^4.1.5"
  }
}
EOF

cat > src/index.js <<'EOF'
const kleur = require('kleur');
console.log(kleur.green('Hello from the greeting service'));
EOF

git add -A
git commit -q -m "Initial greeting service scaffold (no package manager chosen yet)"

echo "Fixture created at $TARGET"
echo "Confirmed: no lock file, no packageManager field -- this is the positive case."
