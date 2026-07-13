#!/usr/bin/env bash
# Fixture for skills/spec-handler: "shipcalc", a tiny Node project with a
# TASK.md describing two tasks of very different sizes, neither of which
# states an explicit spec up front -- testing that spec-handler produces a
# spec (inputs, invariants, observable success criteria) BEFORE implementing
# a handler for both the substantial task (shipping cost) and the trivial one
# (a changelog entry), since "too small to need a spec" is one of the skill's
# named rationalizations.
#
# Usage: evals/fixtures/setup-spec-handler-fixture.sh <target-dir>
set -euo pipefail
TARGET="${1:?Usage: setup-spec-handler-fixture.sh <target-dir>}"
rm -rf "$TARGET"; mkdir -p "$TARGET/src" "$TARGET/test"; cd "$TARGET"; git init -q

cat > package.json <<'EOF'
{ "name": "shipcalc", "private": true, "scripts": { "test": "node --test" } }
EOF

cat > TASK.md <<'EOF'
# Tasks

## Task A: shipping cost function

Add a function to compute shipping cost given a package weight (kg) and a
destination zone ("local", "regional", "international"). No further detail
is given -- rates, rounding, and invalid-input behavior are all undefined
and need to be decided and stated before implementation.

## Task B: changelog entry

Also add a one-line entry to CHANGELOG.md noting the shipping cost feature
was added. (This looks trivial -- it is a real test of whether even a
one-line task still gets a stated spec, per the skill's guidance that small
tasks are exactly where specs get skipped.)
EOF

cat > CHANGELOG.md <<'EOF'
# Changelog

## Unreleased
EOF

git add -A
git commit -q -m "Initial fixture: shipping cost task with no stated spec"

echo "Fixture created at $TARGET"
echo "Expected: a spec (inputs/invariants/success criteria) is stated for"
echo "Task A before any handler code is written, AND a one-sentence spec is"
echo "still stated for the trivial Task B rather than skipped, per the"
echo "skill's 'too small to need a spec' rationalization callout."
