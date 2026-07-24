#!/usr/bin/env bash
# Prototype & Usability-stage eval fixture: a real working project with
# pre-seeded discovery, define, architecture, uxflow, wireframes, and
# visual-design-system outputs. The prototype-usability command reads
# WF-* wireframes and VS-* design tokens and produces a PT-*-tagged
# table of usability/accessibility/content findings.
#
# The wireframes content deliberately plants ONE realistic accessibility
# defect (WF-002's error message region is described as low-contrast
# light-gray-on-white body text) and ONE realistic usability defect
# (WF-001's "Resubscribe" button has no visible label text, only an icon)
# for the prototype-usability stage to actually catch, not just perform
# ceremony around.
#
# Usage: evals/fixtures/setup-prototype-usability-fixture.sh <target-dir>

set -euo pipefail

TARGET="${1:?Usage: setup-prototype-usability-fixture.sh <target-dir>}"

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
| UX-001 | Unsubscribe confirmation page (success) | The page a user lands on after clicking an unsubscribe link; confirms removal from the waitlist | ARCH-004 |
| UX-002 | Unsubscribe confirmation page (not found) | The page shown when the email was not on the waitlist | ARCH-004 |

ARCH-001/002/003 are pure API decisions with no screen to sketch; excluded from this table.
EOF

# Pre-seed wireframes output -- deliberately includes one planted
# accessibility defect (low-contrast error text on WF-002) and one
# planted usability defect (unlabeled icon-only button on WF-001).
mkdir -p docs/wingman/wireframes
cat > docs/wingman/wireframes/waitlist-unsubscribe.md <<'EOF'
# Wireframes: Waitlist Unsubscribe

| ID | Screen | Regions (top to bottom) | Satisfies |
|---|---|---|---|
| WF-001 | Unsubscribe confirmation page (success) | Header (product wordmark), primary content (confirmation message: "You've been removed from the waitlist"), primary action (a circular icon-only button showing a refresh/reload glyph, no visible text label, links back to the signup form) | UX-001 |
| WF-002 | Unsubscribe confirmation page (not found) | Header (product wordmark), primary content (error message: "We couldn't find that email on the waitlist", rendered as light-gray body text, `#bbbbbb`, on the page's white `#ffffff` background), primary action ("Try again" button, primary emphasis, same button component as WF-001's action) | UX-002 |

Both screens share the same header component and button styling for
visual consistency.
EOF

# Pre-seed visual-design-system output
mkdir -p docs/wingman/visual-design-system
cat > docs/wingman/visual-design-system/waitlist-unsubscribe.md <<'EOF'
# Visual Design System: Waitlist Unsubscribe

| ID | Element | Token | Value | Satisfies |
|---|---|---|---|---|
| VS-001 | Body text color | `color-text-body` | `#bbbbbb` on `#ffffff` background | WF-002 |
| VS-002 | Primary button | `button-primary` | Filled, `16px` radius, `44px` min tap target | WF-001, WF-002 |
| VS-003 | Icon-only button | `button-icon` | `40px` circular, no text label by default | WF-001 |

Design tokens carry forward the wireframe's `#bbbbbb`-on-white body text
color and the icon-only button pattern from WF-001.
EOF

git add -A
git commit -q -m "Pre-seed discovery + define + architecture + uxflow + wireframes + visual-design-system artifacts (with a planted low-contrast text defect and a planted unlabeled-button defect) for prototype-usability-stage eval"

echo "Prototype & Usability fixture ready at $TARGET (base app + discovery + define + architecture + uxflow + wireframes + visual-design-system, 2 WF-* screens with 1 planted accessibility defect + 1 planted usability defect)"
