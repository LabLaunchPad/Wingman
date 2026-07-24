#!/usr/bin/env bash
# Research-synthesis-stage eval fixture, scenario 2: a Discovery output
# built on STRONG primary research (a real structured survey, N=142,
# 72% response rate) that also contains a genuine, internal
# CONTRADICTION between two findings drawn from that same survey --
# unlike fixture v1 (thin anecdotal evidence, no real conflict), this
# checks two different things:
#   (a) does research-synthesis correctly RAISE confidence when the
#       underlying evidence is actually strong, instead of reflexively
#       hedging low the way a weaker stage might always do; and
#   (b) does it actually catch and flag the contradiction between
#       DISC-002 (quantitative) and DISC-003 (qualitative) rather than
#       averaging/blending them into one confidence number.
#
# Usage: evals/fixtures/setup-research-synthesis-fixture-v2.sh <target-dir>

set -euo pipefail

TARGET="${1:?Usage: setup-research-synthesis-fixture-v2.sh <target-dir>}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/setup-waitlist-app.sh" "$TARGET"

cd "$TARGET"

# Pre-seed a real, specific Discovery output for a plausible next feature
# on the waitlist app: a referral-rewards program to turn waitlisted
# users into a growth channel. Unlike the v1 fixture, the evidence here
# is a real completed survey (not founder anecdotes) -- but two of its
# findings genuinely conflict with each other.
mkdir -p docs/wingman/discovery
cat > docs/wingman/discovery/waitlist-referral-rewards.md <<'EOF'
# Discovery: Waitlist Referral Rewards

## Discovery output

**Problem statement:** Growth has stalled at ~400 waitlisted signups with
no organic referral loop. To validate a referral-rewards feature before
building it, the founder ran a structured survey (built in Typeform,
distributed by email to all 197 waitlisted users who had opted into
research contact, closed after two weeks) rather than relying on
informal impressions. 142 of 197 responded (72% response rate) --
a sample large and clean enough to draw real quantitative conclusions
from, not just anecdote.

**Target user:** Someone already on the waitlist who has not yet
referred anyone else to the product.

**Success signal:** A measurable increase in the referral rate (friends
referred per waitlisted user) after the reward mechanism ships, compared
to the current baseline of effectively zero organic referrals.

**Open questions:**
- Should the reward be issued before or after the referred friend
  actually converts (signup vs. paid activation)? The survey did not
  ask this directly.
- Does the qualitative concern about reward framing (see DISC-003)
  apply to all reward types, or only cash-equivalent ones? Untested.

## Research synthesis findings referenced downstream

| ID | Finding | Evidence |
|---|---|---|
| DISC-001 | 72% (142/197) of waitlisted users who opted into research contact completed a structured referral-intent survey; response rate this high for an unpaid, single-topic survey is itself a strong signal of engagement with the topic | Typeform-administered structured survey, N=142 respondents out of 197 invited, two-week field window, no incentive offered for completing it |
| DISC-002 | 68% (97 of 142) of survey respondents selected "Yes" to the closed-ended question "If you received a $10 account credit for each friend who joins the waitlist, would you refer at least one friend?" | Same structured survey, closed-ended multiple-choice item, N=142 |
| DISC-003 | Of the 62 respondents who added optional free-text comments, 41 (66% of that subgroup) independently raised a concern that a cash-equivalent reward would make a referral feel "salesy" or "transactional," several stating this would make them LESS likely to actually send the referral message despite selecting "Yes" above; two independent reviewers coded the free-text responses separately and agreed on this theme (Cohen's kappa 0.81) | Same structured survey, open-ended free-text field, N=62 of 142 respondents who added a comment, double-coded by two reviewers |
| DISC-004 | A structured review of 15 comparable consumer waitlist/referral programs found 11 of 15 use a non-cash reward (early access, status tier, or in-product perk) rather than a cash-equivalent credit for exactly this reason | Direct inspection of 15 competitor referral flows, logged with source URLs in the founder's research notes |
EOF

git add -A
git commit -q -m "Pre-seed discovery artifact for research-synthesis-stage eval, scenario 2 (strong primary research + genuine contradiction)"

echo "Research Synthesis fixture v2 ready at $TARGET (base app + discovery with DISC-001..004, strong survey evidence + a real DISC-002/DISC-003 contradiction)"
