#!/usr/bin/env bash
# UX Flow-stage eval fixture, 14-stage-order shape: a real working project
# with pre-seeded discovery, define (DEF-*), and information-architecture
# (IA-*) outputs -- but deliberately NO architecture/ARCH-* artifact, since
# in the real 14-stage pipeline order `architecture.md` (stage 11) has not
# run yet by the time `uxflow` (stage 7) does. Mirrors the exact situation
# found by the 2026-07-25/26 dogfood run (see docs/wingman/retros.md and
# evals/cases/uxflow.md Run 4): uxflow must trace to IA-*/DEF-* by default
# when no ARCH-* exists on disk yet.
#
# Usage: evals/fixtures/setup-uxflow-14stage-fixture.sh <target-dir>

set -euo pipefail

TARGET="${1:?Usage: setup-uxflow-14stage-fixture.sh <target-dir>}"

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

# Pre-seed define output (DEF-*)
mkdir -p docs/wingman/define
cat > docs/wingman/define/waitlist-unsubscribe.md <<'EOF'
# Define: Waitlist Unsubscribe

| ID | Requirement | Rationale |
|---|---|---|
| DEF-001 | A user can submit an unsubscribe request with their email to be removed from the waitlist, via a confirmation page they land on from an emailed link | Directly addresses the discovery problem: users need a way to leave the waitlist |
| DEF-002 | Unsubscribe is idempotent: submitting an email not on the list still shows a success confirmation (not an error) | Prevents confusing error states for users who may have already unsubscribed or mistyped |
| DEF-003 | The waitlist listing only shows users who have not unsubscribed | Success signal from discovery: removed users must not appear in the list |
EOF

# Pre-seed information-architecture output (IA-*), stage 6 -- genuinely
# available by stage 7 (uxflow) in the real 14-stage order.
mkdir -p docs/wingman/information-architecture
cat > docs/wingman/information-architecture/waitlist-unsubscribe.md <<'EOF'
# Information Architecture: Waitlist Unsubscribe

| ID | Section/nav item | Parent (if nested) | Task it serves | Satisfies |
|---|---|---|---|---|
| IA-001 | Unsubscribe Confirmation | top-level (reached via emailed link, not site nav) | Letting a user confirm they've been removed from the waitlist | DEF-001, DEF-002, DEF-003 |
EOF

git add -A
git commit -q -m "Pre-seed discovery + define + information-architecture artifacts for 14-stage-order uxflow eval (no architecture/ARCH-* yet, matching real stage-7 position)"

echo "UX Flow 14-stage-order fixture ready at $TARGET (base app + discovery + define + information-architecture, no architecture)"
