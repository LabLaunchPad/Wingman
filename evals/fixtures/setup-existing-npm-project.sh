#!/usr/bin/env bash
# Fixture for skills/package-manager-selection's NEGATIVE case -- a Node/JS project that
# already has a real, genuine package-lock.json from a prior `npm install`, committed to the
# project's history. This is the higher-stakes scenario: the skill must not fire at all here,
# leaving the existing lock file and package.json completely untouched.
#
# The lock file is produced by a real `npm install` at fixture-build time (not hand-written),
# so it has real integrity hashes and a real dependency tree -- indistinguishable from a
# genuine founder project's own history.
#
# Usage: evals/fixtures/setup-existing-npm-project.sh <target-dir>
# Wipes and recreates <target-dir> every run. Requires network access (real npm install).

set -euo pipefail

TARGET="${1:?Usage: setup-existing-npm-project.sh <target-dir>}"

rm -rf "$TARGET"
mkdir -p "$TARGET/src"
cd "$TARGET"

git init -q
git config user.email founder@example.com
git config user.name "Founder"

cat > package.json <<'EOF'
{
  "name": "greeting-service-existing",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "kleur": "4.1.5"
  }
}
EOF

cat > src/index.js <<'EOF'
const kleur = require('kleur');
console.log(kleur.blue('Hello from the existing greeting service'));
EOF

npm install --silent

git add -A
git commit -q -m "Initial greeting service, already using npm (real package-lock.json committed)"

echo "Fixture created at $TARGET"
echo "Confirmed: real package-lock.json present from this project's own npm history -- this is the negative case."
