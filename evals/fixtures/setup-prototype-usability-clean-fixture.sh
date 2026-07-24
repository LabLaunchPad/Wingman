#!/usr/bin/env bash
# Prototype & Usability-stage eval fixture, Run 2 variant: a real working
# project with pre-seeded discovery, define, architecture, uxflow,
# wireframes, and visual-design-system outputs for a genuinely SIMPLE
# feature (a one-screen "waitlist position" lookup) whose wireframes and
# design-system content are deliberately clean -- good contrast, a
# clearly labeled button, plain-language copy, sane focus order.
#
# This is the inverse test of setup-prototype-usability-fixture.sh, which
# plants a real accessibility defect and a real usability defect for the
# stage to catch. This variant plants NONE: the point is to check whether
# the prototype-usability stage can correctly report a clean bill of
# health (a real gate pass, a real GO) instead of manufacturing findings
# just to look thorough -- a legitimate "nothing to fix here" is a valid
# outcome the stage must be able to produce honestly.
#
# Usage: evals/fixtures/setup-prototype-usability-clean-fixture.sh <target-dir>

set -euo pipefail

TARGET="${1:?Usage: setup-prototype-usability-clean-fixture.sh <target-dir>}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/setup-waitlist-app.sh" "$TARGET"

cd "$TARGET"

# Pre-seed discovery output
mkdir -p docs/wingman/discovery
cat > docs/wingman/discovery/waitlist-position.md <<'EOF'
# Discovery: Waitlist Position Lookup

## Problem statement

Users who sign up for the waitlist have no way to check where they
stand in line, which drives repeated support emails asking "am I still
on the list?"

## Target user

Anyone who has already signed up for the waitlist and wants to check
their own status.

## Success signal

A user can enter their email and see their current position in the
waitlist, or a clear message if their email isn't on the list.

## Open questions

- None outstanding; this is a small, self-contained lookup feature.
EOF

# Pre-seed define output
mkdir -p docs/wingman/define
cat > docs/wingman/define/waitlist-position.md <<'EOF'
# Define: Waitlist Position Lookup

| ID | Requirement | Rationale |
|---|---|---|
| DEF-001 | A user can GET /waitlist/position?email=... to see their 1-based position in the waitlist | Directly addresses the discovery problem: users want to self-serve their status |
| DEF-002 | If the email is not on the waitlist, the response clearly says so rather than showing a blank or error page | Prevents confusing states for users who mistype or never signed up |
EOF

# Pre-seed architecture output
mkdir -p docs/wingman/architecture
cat > docs/wingman/architecture/waitlist-position.md <<'EOF'
# Architecture: Waitlist Position Lookup

| ID | Decision | Satisfies |
|---|---|---|
| ARCH-001 | Add `getPosition(email)` to `src/waitlist.js`, returning a 1-based index or null, reusing the existing Map-based store's insertion order | DEF-001, DEF-002 |
| ARCH-002 | Add a server-rendered `GET /waitlist/position` page using the same handler pattern as the existing routes | DEF-001, DEF-002 |
EOF

# Pre-seed uxflow output
mkdir -p docs/wingman/uxflow
cat > docs/wingman/uxflow/waitlist-position.md <<'EOF'
# UX Flow: Waitlist Position Lookup

| ID | Screen/state | Description | Satisfies |
|---|---|---|---|
| UX-001 | Position lookup form | A single form: an email field and a submit button | ARCH-002 |
| UX-002 | Position result (found) | Shows the user's 1-based position in plain language | ARCH-002 |
| UX-003 | Position result (not found) | Shows a plain-language message that the email wasn't found, with a link back to the form | ARCH-002 |
EOF

# Pre-seed wireframes output -- deliberately clean: good contrast, a
# clearly labeled button (text, not icon-only), plain-language copy,
# a single logical tab order per screen, no motion.
mkdir -p docs/wingman/wireframes
cat > docs/wingman/wireframes/waitlist-position.md <<'EOF'
# Wireframes: Waitlist Position Lookup

| ID | Screen | Regions (top to bottom, tab order matches) | Satisfies |
|---|---|---|---|
| WF-001 | Position lookup form | Header (product wordmark), form label "Enter the email you signed up with", text input (labelled, `aria-required`), submit button (text label "Check my position", not icon-only) | UX-001 |
| WF-002 | Position result (found) | Header (product wordmark), primary content ("You're number {n} on the waitlist." rendered as `color-text-body` = `#222222` on `#ffffff` background), secondary action (text link "Back to form") | UX-002 |
| WF-003 | Position result (not found) | Header (product wordmark), primary content ("We couldn't find that email on the waitlist. Double-check it and try again." rendered as `color-text-body` = `#222222` on `#ffffff` background), secondary action (text link "Back to form") | UX-003 |

All three screens share the same header component. No animation or
auto-advancing content on any screen. Tab order on WF-001 is: email
input, then submit button, matching the visual top-to-bottom order.
EOF

# Pre-seed visual-design-system output -- deliberately clean tokens.
mkdir -p docs/wingman/visual-design-system
cat > docs/wingman/visual-design-system/waitlist-position.md <<'EOF'
# Visual Design System: Waitlist Position Lookup

| ID | Element | Token | Value | Satisfies |
|---|---|---|---|---|
| VS-001 | Body text color | `color-text-body` | `#222222` on `#ffffff` background (~15.9:1 contrast, well above WCAG AA's 4.5:1) | WF-002, WF-003 |
| VS-002 | Primary/secondary button and link | `button-text` / `link-text` | Text-labelled only, `16px` min font size, `44px` min tap target, visible focus ring | WF-001, WF-002, WF-003 |

No icon-only interactive elements are used anywhere in this feature.
EOF

git add -A
git commit -q -m "Pre-seed discovery + define + architecture + uxflow + wireframes + visual-design-system artifacts (deliberately clean: no planted defects) for prototype-usability-stage eval, clean-scenario variant"

echo "Prototype & Usability clean-scenario fixture ready at $TARGET (base app + discovery + define + architecture + uxflow + wireframes + visual-design-system, 3 WF-* screens, no planted defects)"
