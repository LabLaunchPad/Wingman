#!/usr/bin/env bash
# Wireframes-stage eval fixture: a real working project with pre-seeded
# discovery, define, architecture, AND uxflow outputs.  The wireframes
# command consumes UX-* screens/states and produces WF-* low-fidelity
# screen layouts (or skips cleanly for non-UI projects).
#
# Usage: evals/fixtures/setup-wireframes-fixture.sh <target-dir>

set -euo pipefail

TARGET="${1:?Usage: setup-wireframes-fixture.sh <target-dir>}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/setup-waitlist-app.sh" "$TARGET"

cd "$TARGET"

# Pre-seed discovery output
mkdir -p docs/wingman/discovery
cat > docs/wingman/discovery/waitlist-unsubscribe.md <<'EOF'
# Discovery: Waitlist Unsubscribe

## Problem statement

Users who sign up for the waitlist currently have no way to remove
themselves.  This creates a poor experience and potential compliance
risk (e.g. GDPR right-to-erasure requests).

## Target user

Any person who has signed up for the waitlist and later wants to stop
receiving communications.

## Success signal

A user can submit their email and be removed from the waitlist.  The
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
| DEF-004 | A user can view a confirmation page after unsubscribing, and see a clear error if their email was not on the list | Directly addresses the discovery open question: users need visible confirmation, not just a silent API response |
EOF

# Pre-seed architecture output -- includes ARCH-004, a real user-facing
# decision (server-rendered confirmation page), same pattern as the
# uxflow fixture's hand-added ARCH-004 but folded in from the start so
# uxflow has already run and produced real UX-* states for wireframes
# to consume.
mkdir -p docs/wingman/architecture
cat > docs/wingman/architecture/waitlist-unsubscribe.md <<'EOF'
# Architecture: Waitlist Unsubscribe

| ID | Decision | Satisfies |
|---|---|---|
| ARCH-001 | Add `removeFromWaitlist(email)` to `src/waitlist.js`, reusing the existing Map-based store pattern | DEF-001, DEF-002 |
| ARCH-002 | Add `POST /waitlist/unsubscribe` route in `src/server.js` using the same handler pattern as POST /waitlist | DEF-001 |
| ARCH-003 | Filter unsubscribed users in `listWaitlist()` by adding an `unsubscribed` boolean field to the entry object (soft delete) | DEF-003 |
| ARCH-004 | Add a server-rendered `GET /waitlist/unsubscribe` confirmation page (success + not-found states) in `src/server.js` | DEF-004 |
EOF

# Pre-seed uxflow output -- two distinct UX-* states/screens for the
# wireframes stage to lay out, both traced to ARCH-004 (the one
# user-facing decision).
mkdir -p docs/wingman/uxflow
cat > docs/wingman/uxflow/waitlist-unsubscribe.md <<'EOF'
# UX Flow: Waitlist Unsubscribe

## UX flow

| ID | Screen/state | User can... | Satisfies |
|---|---|---|---|
| UX-001 | Unsubscribe confirmation (success) | See confirmation that their email was removed from the waitlist; navigate back to the marketing site | ARCH-004 |
| UX-002 | Unsubscribe confirmation (not found) | See a clear message that the email was not on the waitlist (not an error state); navigate back to the marketing site | ARCH-004 |

## Flow diagram

```mermaid
flowchart TD
  A[User clicks unsubscribe link with email] --> B{Email on waitlist?}
  B -->|Yes| C[UX-001: Success confirmation]
  B -->|No| D[UX-002: Not-found confirmation]
```

## Phase summary

Two states cover the one user-facing surface from Architecture (ARCH-004): a
success confirmation and a not-found confirmation, both reachable from the
same unsubscribe link depending on whether the email was actually on the
waitlist.

## Gate check

- Must include: happy path (UX-001), error/edge path (UX-002) -- PASS
- Must decide: core flow (single GET request, branch server-side on lookup
  result) -- PASS

## Go/no-go status

GO -- both states defined, ready for wireframes.
EOF

git add -A
git commit -q -m "Pre-seed discovery + define + architecture + uxflow artifacts for wireframes-stage eval"

echo "Wireframes fixture ready at $TARGET (base app + discovery + define + architecture + uxflow, 2 UX-* states)"
