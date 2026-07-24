#!/usr/bin/env bash
# Personas & Jobs-stage eval fixture, Run 2 variant: thin/zero-evidence
# research synthesis.  Unlike setup-personas-jobs-fixture.sh (3 distinct,
# well-evidenced RS-* rows), this fixture seeds a research-synthesis doc
# with a SINGLE row, itself marked "Assumed" (not Known), and explicitly
# calls out in its own phase summary that no theme reached a firm
# evidence bar.  This tests whether the personas-jobs command correctly
# refuses to invent multiple confident personas from one thin data
# point, and whether its own gate ("target user and job to be done both
# clear") honestly fails/flags rather than being rubber-stamped.
#
# Usage: evals/fixtures/setup-personas-jobs-thin-evidence-fixture.sh <target-dir>

set -euo pipefail

TARGET="${1:?Usage: setup-personas-jobs-thin-evidence-fixture.sh <target-dir>}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/setup-waitlist-app.sh" "$TARGET"

cd "$TARGET"

# Pre-seed discovery output — deliberately vague, no clear target user split
mkdir -p docs/wingman/discovery
cat > docs/wingman/discovery/waitlist-referrals.md <<'EOF'
# Discovery: Waitlist Referral Sharing

## Problem statement

A few waitlisted users have asked, in passing support emails, whether
they can "share their spot" or move up the list by referring friends.
Nobody has actually asked for a formal referral program — this is an
inference from a handful of offhand remarks, not a validated request.

## Target user

Unclear. Possibly waitlisted users who want to move up the list;
possibly nobody, since this has not been directly researched.

## Success signal

Not yet defined — contingent on whether real demand exists.

## Open questions

- Is there any real demand for a referral mechanic, or is this founder
  pattern-matching on a couple of stray remarks?
- If demand exists, do users want to move up the list, get a reward, or
  something else entirely?
EOF

# Pre-seed research-synthesis output with exactly ONE row, itself Assumed —
# i.e. zero Known/well-evidenced themes at all.
mkdir -p docs/wingman/research-synthesis
cat > docs/wingman/research-synthesis/waitlist-referrals.md <<'EOF'
# Research Synthesis: Waitlist Referral Sharing

## Research synthesis

| ID | Theme/risk/opportunity/question | Known/Unknown/Assumed | Satisfies |
|---|---|---|---|
| RS-001 | Some waitlisted users may want a way to move up the list by referring others, based on a small number of unprompted support-email remarks (not a survey, not requested feature tracking) | Assumed | DISC-001 |

## Phase summary

No theme in this round reached a "Known" evidence bar — the single
candidate theme (RS-001) rests on a handful of incidental remarks, not
direct research (no interviews, no survey, no feature-request tracking).
Recommend treating this as speculative until real evidence is gathered;
do not treat RS-001 as sufficient grounds for a confident persona/JTBD
definition on its own.
EOF

git add -A
git commit -q -m "Pre-seed thin/zero-evidence discovery + research-synthesis artifacts for personas-jobs-stage eval (Run 2)"

echo "Personas & Jobs thin-evidence fixture ready at $TARGET (base app + discovery + single-Assumed-row research-synthesis)"
