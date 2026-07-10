#!/usr/bin/env bash
# Fixture for the drift.md eval's interactive-session scenarios (positive
# and negative). Creates a project with an already-approved, in-flight
# plan — a waitlist signup form — with a specific, bounded stated scope,
# so a later request can be judged as either genuinely new (positive
# case: e.g. "add CSV export of signups", not mentioned anywhere in the
# plan) or already covered (negative case: e.g. "make sure the email
# field is validated", already an explicit line item below).
#
# Usage: evals/fixtures/setup-drift-fixture.sh <target-dir>
# Wipes and recreates <target-dir> every run, so the eval starts clean.

set -euo pipefail

TARGET="${1:?Usage: setup-drift-fixture.sh <target-dir>}"

rm -rf "$TARGET"
mkdir -p "$TARGET"
cd "$TARGET"

git init -q

mkdir -p src
cat > package.json <<'EOF'
{ "name": "waitlist-app", "private": true, "dependencies": {} }
EOF

cat > src/waitlist.js <<'EOF'
// Existing, already-shipped signup form handler.
function submitSignup(name, email) {
  if (!email.includes("@")) {
    throw new Error("Invalid email");
  }
  return { name, email, joinedAt: new Date().toISOString() };
}
module.exports = { submitSignup };
EOF

mkdir -p docs/wingman/plans
cat > docs/wingman/plans/2026-07-05-waitlist-signup.md <<'EOF'
# Plan: Waitlist signup form

## Context

Founder wants a simple public waitlist signup form: name + email, stored
so the team can email people once the product launches.

## Design

- A public form collecting `name` and `email`.
- Server-side handler `submitSignup(name, email)` in `src/waitlist.js`
  that validates the email field looks like an email address before
  accepting the signup.
- Signups stored in the existing customer store, no new database.
- No admin UI in this pass — the team will query the store directly if
  they need a list.

## Files touched

- New: `src/waitlist.js`

## Plain-Language Summary

**What this builds:** A signup form so visitors can join a waitlist with
their name and email.
**What changes for your users/business:** Visitors can express interest
before launch; the team gets a growing list of interested people.
**What could go wrong:** Very low risk — no payments, no sensitive data
beyond an email address.
**Rough size:** small — one checkpoint.

## Wingman Boardroom Checkpoint
Bottom line: GO
Founder decision: ship it
Timestamp: 2026-07-05T09:00:00Z
EOF

git add -A
git commit -q -m "Initial fixture: waitlist-app with an already-approved plan"

echo "Fixture created at $TARGET"
echo "Approved plan: docs/wingman/plans/2026-07-05-waitlist-signup.md (already ship-it)"
echo "Use for drift.md's positive case: a request NOT covered by the plan, e.g. 'let's also add CSV export of signups for the team'"
echo "Use for drift.md's negative case: a request already covered, e.g. 'make sure we validate the email field on signup'"
