#!/usr/bin/env bash
# Define-stage eval fixture: a real working project with a pre-seeded
# discovery artifact.  The define command consumes the discovery output
# and produces DEF-* requirements.
#
# Usage: evals/fixtures/setup-define-fixture.sh <target-dir>

set -euo pipefail

TARGET="${1:?Usage: setup-define-fixture.sh <target-dir>}"

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

git add -A
git commit -q -m "Pre-seed discovery artifact for define-stage eval"

echo "Define fixture ready at $TARGET (base app + discovery artifact)"
