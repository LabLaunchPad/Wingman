#!/usr/bin/env bash
# Research-synthesis-stage eval fixture: a real working project with a
# pre-seeded Discovery output containing genuine DISC-* findings and open
# questions.  research-synthesis.md consumes this and is expected to
# produce an RS-*-tagged table of themes/risks/opportunities/open-questions
# with each row honestly marked known/unknown/assumed and citing the
# DISC-* finding(s) it's grounded in.
#
# Usage: evals/fixtures/setup-research-synthesis-fixture.sh <target-dir>

set -euo pipefail

TARGET="${1:?Usage: setup-research-synthesis-fixture.sh <target-dir>}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/setup-waitlist-app.sh" "$TARGET"

cd "$TARGET"

# Pre-seed a real, specific Discovery output for a plausible next feature
# on the waitlist app: too many signups never convert because there's no
# reminder/nudge once someone joins. This is deliberately thin on hard
# evidence (a few founder observations, no primary research) so a
# research-synthesis pass has real signal to grade known vs. assumed
# against, and open questions it should actually pick up on.
mkdir -p docs/wingman/discovery
cat > docs/wingman/discovery/waitlist-reminder-nudge.md <<'EOF'
# Discovery: Waitlist Reminder Nudge

## Discovery output

**Problem statement:** Of the ~400 people who have joined the waitlist
since launch, only 12 have ever returned to the signup page again. The
founder has no automated way to re-engage someone after they join --
today the only touchpoint is the initial signup confirmation. Three
users who churned off the waitlist told the founder in DMs that they
"forgot the product existed" between signing up and any kind of launch
email going out.

**Target user:** Someone who has already joined the waitlist and has
not yet converted to an active user or unsubscribed.

**Success signal:** A measurable lift in the fraction of waitlisted
users who click through on a follow-up touchpoint, compared to the
current baseline of near-zero unprompted return visits.

**Open questions:**
- Do users actually want a reminder, or would an unsolicited follow-up
  email read as spammy and increase unsubscribes instead of engagement?
  Nobody has asked them directly.
- What cadence would work -- one nudge, or a short drip sequence? No
  data exists yet on how long "forgetting" typically takes for this
  audience.
- Should the nudge be email-only, or does the target audience skew
  toward a channel (SMS, push) the founder hasn't validated?

## Research synthesis findings referenced downstream

| ID | Finding | Evidence |
|---|---|---|
| DISC-001 | Only 12 of ~400 waitlisted users have ever returned to the signup page after joining | Founder's own signup-page analytics (informal, not a dashboard) |
| DISC-002 | 3 churned users independently said in DMs they "forgot the product existed" | Anecdotal founder DMs, not a structured interview |
| DISC-003 | The only existing touchpoint after signup is the initial confirmation -- no automated follow-up exists today | Direct inspection of the current codebase/product |
EOF

git add -A
git commit -q -m "Pre-seed discovery artifact for research-synthesis-stage eval"

echo "Research Synthesis fixture ready at $TARGET (base app + discovery with DISC-001..003)"
