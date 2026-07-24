#!/usr/bin/env bash
# Journey Mapping-stage eval fixture, Run 2 variant: a real working project
# with pre-seeded discovery, research-synthesis, and personas-jobs outputs
# for a persona whose job-to-be-done is genuinely simple and low-friction --
# unlike the base fixture's Dana (login-wall drop-off risk, silent-error
# risk, re-signup confusion), this persona already knows exactly what to do
# and the action is a single, uneventful step. Tests whether journey-mapping
# produces an honest, short journey map rather than inventing friction points
# or drop-off risks that aren't really there just to look thorough.
#
# Usage: evals/fixtures/setup-journey-mapping-fixture-simple.sh <target-dir>

set -euo pipefail

TARGET="${1:?Usage: setup-journey-mapping-fixture-simple.sh <target-dir>}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/setup-waitlist-app.sh" "$TARGET"

cd "$TARGET"

# Pre-seed discovery output
mkdir -p docs/wingman/discovery
cat > docs/wingman/discovery/waitlist-admin-recheck.md <<'EOF'
# Discovery: Waitlist Admin Re-check

## Problem statement

The founder (the sole admin of this small waitlist app) already has a
working `GET /waitlist` endpoint that lists current signups, and checks
it periodically from a saved bookmark. There is no reported problem
with this flow today -- this stage exists only to confirm the existing
admin-check journey is genuinely fine before the team spends any more
effort on it.

## Target user

The founder themself, in the admin role, re-checking waitlist signups
from a device they already use daily.

## Success signal

The founder opens the bookmarked URL and sees the current signup count
and list. No further action needed.

## Open questions

- None outstanding -- this is a stable, already-working flow being
  re-examined for completeness, not a new problem to solve.
EOF

# Pre-seed research-synthesis output
mkdir -p docs/wingman/research-synthesis
cat > docs/wingman/research-synthesis/waitlist-admin-recheck.md <<'EOF'
# Research synthesis: Waitlist Admin Re-check

## Sources reviewed

Founder's own usage logs (the bookmarked admin URL has been hit ~40
times over 6 weeks, always from the same browser/device) plus one
direct self-report from the founder.

## Key findings

- The founder always uses the same saved bookmark; there has never been
  a reported case of the bookmark not working, the page failing to
  load, or the founder being unsure whether the list was current.
- The endpoint responds in well under a second on the founder's usual
  connection; no timeout or loading-state complaints exist in the logs.
- No security or access-control question has ever come up here --the
  founder is the only person who has ever hit this endpoint, and it is
  already scoped to internal use only.

## Implication for design

There is no evidence of friction in this flow today. It should be
mapped honestly as a short, low-friction journey rather than padded
with invented pain points.
EOF

# Pre-seed personas-jobs output
mkdir -p docs/wingman/personas-jobs
cat > docs/wingman/personas-jobs/waitlist-admin-recheck.md <<'EOF'
# Personas & Jobs: Waitlist Admin Re-check

## Persona: Priya, the founder checking her own waitlist

Priya built and runs this waitlist app herself. Once or twice a week
she opens a bookmarked admin URL from her laptop to see how many people
have signed up. She already knows the URL, already trusts it works, and
has never had a reason to hesitate before opening it.

- **Context:** At her desk, laptop, casually curious about signup
  count -- not under time pressure, not blocked by anything.
- **Motivation:** Quick, low-stakes curiosity check on growth.
- **Constraints:** None of note -- she is already authenticated
  by virtue of being on her own trusted device, and the bookmark
  already points at the right place.

| ID | Persona | Job-to-be-done |
|---|---|---|
| PJ-001 | Priya, the founder checking her own waitlist | When I want to know how many people have joined the waitlist, I want to open my saved bookmark and see the current count immediately, so I can satisfy my curiosity without any extra steps. |
EOF

git add -A
git commit -q -m "Pre-seed low-friction discovery + research-synthesis + personas-jobs artifacts for journey-mapping-stage eval (Run 2: simple/no-friction scenario)"

echo "Journey Mapping simple/low-friction fixture ready at $TARGET (base app + discovery + research-synthesis + personas-jobs, Priya/PJ-001)"
