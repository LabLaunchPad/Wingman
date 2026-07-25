#!/usr/bin/env bash
# Post-launch eval fixture: a real shipped project with pre-seeded
# discovery + define artifacts, plus a real "post-launch signal" input
# (a support-tickets file) for the post-launch command to review.
#
# Usage: evals/fixtures/setup-post-launch-fixture.sh <target-dir>

set -euo pipefail

TARGET="${1:?Usage: setup-post-launch-fixture.sh <target-dir>}"

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

# Ship the unsubscribe feature -- but with a real, deliberate gap:
# removeFromWaitlist() was written and unit-tested in isolation, but the
# POST /waitlist/unsubscribe HTTP route required by DEF-001 was never
# actually wired into src/server.js. Calling it 404s. This is exactly
# the kind of gap that passes a narrow unit test but only shows up once
# real users hit it.
cat > src/waitlist.js <<'EOF'
// In-memory waitlist store. Not persisted to disk -- fine for an MVP,
// the founder knows this will need a real database before it matters.
const entries = new Map(); // email -> { email, joinedAt }

function addToWaitlist(email) {
  if (!email || !email.includes('@')) {
    throw new Error('A valid email is required.');
  }
  if (entries.has(email)) {
    return entries.get(email);
  }
  const entry = { email, joinedAt: new Date().toISOString() };
  entries.set(email, entry);
  return entry;
}

function listWaitlist() {
  return Array.from(entries.values());
}

// DEF-001/DEF-002: remove an entry from the waitlist. Idempotent by
// design (doesn't error if the email was never present).
function removeFromWaitlist(email) {
  entries.delete(email);
  return { email, removed: true };
}

function _reset() {
  entries.clear();
}

module.exports = { addToWaitlist, listWaitlist, removeFromWaitlist, _reset };
EOF

git add -A
git commit -q -m "Ship waitlist unsubscribe (DEF-001..003)"

# Real post-launch signal: support tickets gathered after shipping.
mkdir -p docs/wingman
cat > docs/wingman/SUPPORT-TICKETS.md <<'EOF'
# Support tickets — waitlist unsubscribe (first 2 weeks post-launch)

## Ticket #41
"There's no way to actually unsubscribe. I looked for an unsubscribe
link, found none, so I just POSTed to /waitlist/unsubscribe myself
with my email in the body and got back a 404 Not Found. I'm still
getting emails."

## Ticket #44
"Same issue as #41 -- tried the unsubscribe endpoint from the docs and
it just 404s. Ended up emailing support directly to get removed
manually."

## Ticket #47
"Can you add a way to see roughly where I am in line? Not a big deal,
just curious how close I am." (A feature request, not a defect --
nothing in discovery or define ever scoped a queue-position feature.)

## Ticket #52
"Signed up for the waitlist, worked great, no complaints -- just
wanted to say the signup flow itself is fast and simple."
EOF

git add -A
git commit -q -m "Add post-launch support ticket signal"

echo "Post-launch fixture ready at $TARGET (shipped waitlist + unsubscribe, real support tickets)"
