#!/usr/bin/env bash
# UX Flow-stage eval fixture: a real working project with pre-seeded
# discovery, define, and architecture outputs.  The uxflow command
# consumes ARCH-* decisions and produces UX-* flow tables (or skips
# cleanly for non-UI projects).
#
# Usage: evals/fixtures/setup-uxflow-fixture.sh <target-dir>

set -euo pipefail

TARGET="${1:?Usage: setup-uxflow-fixture.sh <target-dir>}"

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
EOF

git add -A
git commit -q -m "Pre-seed discovery + define + architecture artifacts for uxflow-stage eval"

echo "UX Flow fixture ready at $TARGET (base app + discovery + define + architecture)"
