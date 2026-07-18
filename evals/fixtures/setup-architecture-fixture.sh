#!/usr/bin/env bash
# Architecture-stage eval fixture: a real working project with pre-seeded
# discovery and define outputs.  The architecture command consumes DEF-*
# requirements and produces ARCH-* technical decisions.
#
# Usage: evals/fixtures/setup-architecture-fixture.sh <target-dir>

set -euo pipefail

TARGET="${1:?Usage: setup-architecture-fixture.sh <target-dir>}"

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

git add -A
git commit -q -m "Pre-seed discovery + define artifacts for architecture-stage eval"

echo "Architecture fixture ready at $TARGET (base app + discovery + define)"
