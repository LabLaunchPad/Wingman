#!/usr/bin/env bash
# Information-architecture-stage eval fixture, negative/adversarial variant:
# a real working project with a define doc so small and single-area that a
# correct IA pass should legitimately collapse to ONE section, not force an
# artificial split just to look thorough. Unlike
# setup-information-architecture-fixture.sh (which deliberately spans two
# distinct areas with different auth boundaries), this fixture's define doc
# covers only the public waitlist-signup surface -- no admin console, no
# second auth boundary, no second audience. Real signal for an honest IA
# pass to do LESS, not more.
#
# Usage: evals/fixtures/setup-information-architecture-fixture-single-section.sh <target-dir>

set -euo pipefail

TARGET="${1:?Usage: setup-information-architecture-fixture-single-section.sh <target-dir>}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/setup-waitlist-app.sh" "$TARGET"

cd "$TARGET"

# Pre-seed discovery output -- single audience, single surface.
mkdir -p docs/wingman/discovery
cat > docs/wingman/discovery/waitlist-signup.md <<'EOF'
# Discovery: Waitlist Signup

## Problem statement

The founder wants a minimal public waitlist page: a visitor can join
and check their own position. There is no admin console in scope yet
-- the founder still reads the raw JSON list directly for now, and is
fine with that until the waitlist has real traction.

## Target user

A single audience: a visitor deciding whether to join the product's
waitlist.

## Success signal

A visitor can submit their email to join the waitlist and can look up
their own position in the queue afterward.

## Open questions

- None open -- scope is deliberately minimal for this first pass.
EOF

# Pre-seed define output -- one small, single-area requirement set.
mkdir -p docs/wingman/define
cat > docs/wingman/define/waitlist-signup.md <<'EOF'
# Define: Waitlist Signup

| ID | Requirement | Rationale |
|---|---|---|
| DEF-001 | A visitor can submit their email on a public signup form to join the waitlist | Directly addresses the discovery problem: there is currently no user-facing way to join |
| DEF-002 | A visitor can check their current position in the waitlist queue by email | Second most-requested ask from waitlisted visitors in discovery |

## Phase summary

This stage defines a single, small public waitlist-signup surface
(DEF-001, DEF-002). There is no admin console, no second audience, and
no second auth boundary in scope for this pass -- deliberately minimal.
EOF

git add -A
git commit -q -m "Pre-seed discovery + define artifacts for information-architecture single-section eval (one small area only)"

echo "Information Architecture single-section fixture ready at $TARGET (base app + discovery + define, one small area only)"
