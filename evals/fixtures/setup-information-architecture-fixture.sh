#!/usr/bin/env bash
# Information-architecture-stage eval fixture: a real working project with
# pre-seeded discovery and define outputs spanning more than one logical
# area (signup/waitlist-facing vs. admin/management-facing), so an IA pass
# has real signal to organize into distinct sections, not one trivial
# section.
#
# Usage: evals/fixtures/setup-information-architecture-fixture.sh <target-dir>

set -euo pipefail

TARGET="${1:?Usage: setup-information-architecture-fixture.sh <target-dir>}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/setup-waitlist-app.sh" "$TARGET"

cd "$TARGET"

# Pre-seed discovery output
mkdir -p docs/wingman/discovery
cat > docs/wingman/discovery/waitlist-admin.md <<'EOF'
# Discovery: Waitlist Admin Console

## Problem statement

The founder currently has no way to see, search, or manage waitlist
signups except by reading raw JSON from the API. As signups grow this
becomes unworkable, and there is no way to promote a waitlisted user
to "invited" status or remove a spam entry.

## Target user

Two distinct users: (1) a person signing up for the product's
waitlist (public, unauthenticated), and (2) the founder, managing the
waitlist as an admin (private, authenticated).

## Success signal

A visitor can join the waitlist and check their position. The founder
can log in, search signups, invite a user, and remove a spam entry,
all from one place.

## Open questions

- Should invited users receive an email automatically, or does the
  founder trigger that separately?
- Does the admin console need role-based access (multiple admins) or
  is single-founder auth enough for now?
EOF

# Pre-seed define output, spanning two distinct logical areas:
# public waitlist-signup-facing requirements, and admin/management-facing
# requirements.
mkdir -p docs/wingman/define
cat > docs/wingman/define/waitlist-admin.md <<'EOF'
# Define: Waitlist Admin Console

| ID | Requirement | Rationale |
|---|---|---|
| DEF-001 | A visitor can submit their email on a public signup form to join the waitlist | Directly addresses the discovery problem: there is currently no user-facing way to join |
| DEF-002 | A visitor can check their current position in the waitlist queue by email | Founders report this is the single most-requested feature from waitlisted users |
| DEF-003 | The founder can log in with a password to reach a private admin console, separate from the public site | The admin console must not be reachable by the public; distinct auth boundary from DEF-001/002 |
| DEF-004 | The founder can search and filter the full list of waitlist signups by email or join date | Directly addresses the discovery problem: no way to manage signups at scale today |
| DEF-005 | The founder can promote a waitlisted user to "invited" status from the admin console | Success signal from discovery: founder can invite users from one place |
| DEF-006 | The founder can remove a spam or invalid signup from the admin console | Success signal from discovery: founder can remove spam entries |

## Phase summary

This stage defines both the public waitlist-signup surface (DEF-001,
DEF-002) and the private founder-facing admin surface (DEF-003 through
DEF-006), which are two genuinely distinct areas of the product with
different audiences and different auth boundaries.
EOF

git add -A
git commit -q -m "Pre-seed discovery + define artifacts for information-architecture eval (signup + admin areas)"

echo "Information Architecture fixture ready at $TARGET (base app + discovery + define spanning 2 logical areas)"
