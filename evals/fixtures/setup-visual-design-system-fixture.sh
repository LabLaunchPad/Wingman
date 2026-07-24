#!/usr/bin/env bash
# Visual Design System-stage eval fixture: a real working project with
# pre-seeded discovery, define, architecture, uxflow, and wireframes
# outputs. The visual-design-system command reads WF-* wireframe rows
# and produces a VS-*-tagged tokens table (typography/spacing/color/
# component/state), deferring actual quality enforcement to the
# design-taste skill at build time.
#
# Usage: evals/fixtures/setup-visual-design-system-fixture.sh <target-dir>

set -euo pipefail

TARGET="${1:?Usage: setup-visual-design-system-fixture.sh <target-dir>}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/setup-waitlist-app.sh" "$TARGET"

cd "$TARGET"

# Pre-seed discovery output
mkdir -p docs/wingman/discovery
cat > docs/wingman/discovery/waitlist-unsubscribe.md <<'EOF'
# Discovery: Waitlist Unsubscribe

## Problem statement

Users who sign up for the waitlist currently have no way to remove
themselves. This creates a poor experience and potential compliance
risk (e.g. GDPR right-to-erasure requests).

## Target user

Any person who has signed up for the waitlist and later wants to stop
receiving communications.

## Success signal

A user can submit their email and be removed from the waitlist. The
GET /waitlist endpoint no longer includes the removed user.

## Open questions

- Should unsubscribe require email confirmation (double opt-out) or
  just an email address submitted directly?
- Should unsubscribing be idempotent (return success even if the email
  is not on the list)?
EOF

# Pre-seed define output
mkdir -p docs/wingman/define
cat > docs/wingman/define/waitlist-unsubscribe.md <<'EOF'
# Define: Waitlist Unsubscribe

| ID | Requirement | Rationale |
|---|---|---|
| DEF-001 | A user can POST /waitlist/unsubscribe with their email to be removed from the waitlist | Directly addresses the discovery problem: users need a way to leave the waitlist |
| DEF-002 | Unsubscribe is idempotent: POST /waitlist/unsubscribe with an email not on the list returns 200 (not an error) | Prevents confusing error states for users who may have already unsubscribed or mistyped |
| DEF-003 | GET /waitlist only returns users who have not unsubscribed | Success signal from discovery: removed users must not appear in the list |
| DEF-004 | A user can visit a web page to confirm their unsubscribe request, not just call an API | Founder wants a real user-facing confirmation, not just a JSON response |
EOF

# Pre-seed architecture output
mkdir -p docs/wingman/architecture
cat > docs/wingman/architecture/waitlist-unsubscribe.md <<'EOF'
# Architecture: Waitlist Unsubscribe

| ID | Decision | Satisfies |
|---|---|---|
| ARCH-001 | Add `removeFromWaitlist(email)` to `src/waitlist.js`, reusing the existing Map-based store pattern | DEF-001, DEF-002 |
| ARCH-002 | Add `POST /waitlist/unsubscribe` route in `src/server.js` using the same handler pattern as POST /waitlist | DEF-001 |
| ARCH-003 | Filter unsubscribed users in `listWaitlist()` by adding an `unsubscribed` boolean field to the entry object (soft delete) | DEF-003 |
| ARCH-004 | Add a server-rendered `GET /waitlist/unsubscribe` confirmation page | DEF-004 |
EOF

# Pre-seed uxflow output
mkdir -p docs/wingman/uxflow
cat > docs/wingman/uxflow/waitlist-unsubscribe.md <<'EOF'
# UX Flow: Waitlist Unsubscribe

| ID | Screen/state | Description | Satisfies |
|---|---|---|---|
| UX-001 | Unsubscribe confirmation page | The page a user lands on after clicking an unsubscribe link; confirms removal from the waitlist | ARCH-004 |

ARCH-001/002/003 are pure API decisions with no screen to sketch; excluded from this table.
EOF

# Pre-seed wireframes output
mkdir -p docs/wingman/wireframes
cat > docs/wingman/wireframes/waitlist-unsubscribe.md <<'EOF'
# Wireframes: Waitlist Unsubscribe

| ID | Screen | Regions (top to bottom) | Satisfies |
|---|---|---|---|
| WF-001 | Unsubscribe confirmation page | Header (product wordmark), primary content (confirmation message: "You've been removed from the waitlist"), primary action ("Resubscribe" button, secondary emphasis) | UX-001 |
| WF-002 | Unsubscribe error state | Header (product wordmark), primary content (error message: "We couldn't find that email on the waitlist"), primary action ("Try again" button, primary emphasis, same button component as WF-001's Resubscribe button) | UX-001 |
EOF

git add -A
git commit -q -m "Pre-seed discovery + define + architecture + uxflow + wireframes artifacts for visual-design-system-stage eval"

echo "Visual Design System fixture ready at $TARGET (base app + discovery + define + architecture + uxflow + wireframes)"
