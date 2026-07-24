#!/usr/bin/env bash
# Journey Mapping-stage eval fixture: a real working project with pre-seeded
# discovery, research-synthesis, and personas-jobs outputs.  The
# journey-mapping command consumes PJ-* personas/jobs and produces a JM-*
# journey table (or skips cleanly for projects with no journey at all).
#
# Usage: evals/fixtures/setup-journey-mapping-fixture.sh <target-dir>

set -euo pipefail

TARGET="${1:?Usage: setup-journey-mapping-fixture.sh <target-dir>}"

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

# Pre-seed research-synthesis output
mkdir -p docs/wingman/research-synthesis
cat > docs/wingman/research-synthesis/waitlist-unsubscribe.md <<'EOF'
# Research synthesis: Waitlist Unsubscribe

## Sources reviewed

Informal support-inbox review (12 emails over 3 weeks) from founder's
own waitlist, plus 4 quick calls with people who had asked to be
removed manually.

## Key findings

- Most unsubscribe requests come by replying "please remove me" to the
  waitlist confirmation email, not by looking for a self-serve link --
  people expect email to be the channel, not a web form buried on the
  site.
- Several people asked *whether* they'd actually been removed after
  requesting it -- there's no confirmation today, so they don't trust
  it worked.
- One person tried to re-join the waitlist after unsubscribing and was
  confused when nothing happened (silently no-op'd because their old
  entry was still present but unmarked).

## Implication for design

The unsubscribe flow needs to (a) work from a link a user can find
easily, (b) give clear confirmation the removal happened, and (c) not
silently break re-signup afterward.
EOF

# Pre-seed personas-jobs output
mkdir -p docs/wingman/personas-jobs
cat > docs/wingman/personas-jobs/waitlist-unsubscribe.md <<'EOF'
# Personas & Jobs: Waitlist Unsubscribe

## Persona: Dana, the overwhelmed early subscriber

Dana signed up for the waitlist three months ago out of curiosity
after seeing a link on social media. She gets a weekly update email
but has since lost interest in the product and now just wants the
emails to stop -- she doesn't remember creating an account, doesn't
have a password, and doesn't want to dig through a settings page to
find an "unsubscribe" option.

- **Context:** Reading the weekly update email on her phone, mildly
  annoyed, in between other tasks.
- **Motivation:** Reduce inbox clutter; she has no ongoing interest in
  the product itself.
- **Constraints:** Won't create an account or remember a password just
  to unsubscribe. Expects one click to be enough.

| ID | Persona | Job-to-be-done |
|---|---|---|
| PJ-001 | Dana, the overwhelmed early subscriber | When I no longer want waitlist emails, I want to remove myself in one click from the email itself, so I can stop the noise without extra effort or needing to remember credentials. |
EOF

git add -A
git commit -q -m "Pre-seed discovery + research-synthesis + personas-jobs artifacts for journey-mapping-stage eval"

echo "Journey Mapping fixture ready at $TARGET (base app + discovery + research-synthesis + personas-jobs)"
