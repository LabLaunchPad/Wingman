#!/usr/bin/env bash
# Fixture for the drift.md eval's headless-fallback scenario: an
# already-approved, in-flight plan, used to test that /wingman:drift
# correctly records `still_reviewing` and writes zero code for a
# genuinely new ask when plan-mode/AskUserQuestion tools are unavailable
# (a headless/non-interactive session), rather than either blocking
# incorrectly or silently proceeding on undecided scope.
#
# Usage: evals/fixtures/setup-drift-headless-fixture.sh <target-dir>
# Wipes and recreates <target-dir> every run, so the eval starts clean.

set -euo pipefail

TARGET="${1:?Usage: setup-drift-headless-fixture.sh <target-dir>}"

rm -rf "$TARGET"
mkdir -p "$TARGET"
cd "$TARGET"

git init -q

mkdir -p src
cat > package.json <<'EOF'
{ "name": "invoice-app", "private": true, "dependencies": {} }
EOF

cat > src/invoice.js <<'EOF'
// Existing, already-shipped invoice generator.
function createInvoice(customerId, amountCents) {
  return { customerId, amountCents, status: "draft" };
}
module.exports = { createInvoice };
EOF

mkdir -p docs/wingman/plans
cat > docs/wingman/plans/2026-07-08-invoice-drafts.md <<'EOF'
# Plan: Draft invoice generation

## Context

Founder wants to generate draft invoices for customers before sending
them manually.

## Design

- `createInvoice(customerId, amountCents)` in `src/invoice.js` creates a
  draft-status invoice record.
- No emailing, no PDF generation, no payment collection in this pass —
  drafts only, reviewed and sent manually by the founder's team.

## Files touched

- New: `src/invoice.js`

## Plain-Language Summary

**What this builds:** A way to create draft invoices in the system before
they're sent to customers.
**What changes for your users/business:** The team can prepare an invoice
without it going out automatically.
**What could go wrong:** Low risk — draft-only, no money moves and no
emails are sent by this feature.
**Rough size:** small — one checkpoint.

## Wingman Boardroom Checkpoint
Bottom line: GO
Founder decision: ship it
Timestamp: 2026-07-08T09:00:00Z
EOF

git add -A
git commit -q -m "Initial fixture: invoice-app with an already-approved plan"

echo "Fixture created at $TARGET"
echo "Approved plan: docs/wingman/plans/2026-07-08-invoice-drafts.md (already ship-it, draft-only scope)"
echo "Use for drift.md's headless-fallback case: a genuinely new ask in a session where plan-mode/AskUserQuestion tools are unavailable, e.g. 'also email the invoice to the customer automatically once it's created' — must record still_reviewing and write zero code."
