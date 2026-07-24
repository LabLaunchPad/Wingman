#!/usr/bin/env bash
# Personas & Jobs-stage eval fixture: a real working project with pre-seeded
# discovery and research-synthesis outputs.  The personas-jobs command
# consumes RS-* rows and produces a PJ-*-tagged persona/JTBD table, each
# row citing the RS-* theme/finding it's grounded in.
#
# Usage: evals/fixtures/setup-personas-jobs-fixture.sh <target-dir>

set -euo pipefail

TARGET="${1:?Usage: setup-personas-jobs-fixture.sh <target-dir>}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/setup-waitlist-app.sh" "$TARGET"

cd "$TARGET"

# Pre-seed discovery output
mkdir -p docs/wingman/discovery
cat > docs/wingman/discovery/waitlist-unsubscribe.md <<'EOF'
# Discovery: Waitlist Unsubscribe

## Problem statement

Users who sign up for the waitlist currently have no way to remove
themselves.  Support has fielded a handful of manual "please take me off
the list" emails, each handled by hand-editing the in-memory store.

## Target user

Any person who has signed up for the waitlist and later wants to stop
receiving communications, plus the founder handling support requests.

## Success signal

A user can remove themselves without emailing support.  The founder no
longer has to hand-edit the waitlist store.

## Open questions

- Should unsubscribe require email confirmation (double opt-out) or
  just an email address submitted directly?
- Should unsubscribing be idempotent (return success even if the email
  is not on the list)?
EOF

# Pre-seed research-synthesis output with 3 distinct, real RS-* rows
mkdir -p docs/wingman/research-synthesis
cat > docs/wingman/research-synthesis/waitlist-unsubscribe.md <<'EOF'
# Research Synthesis: Waitlist Unsubscribe

## Research synthesis

| ID | Theme/risk/opportunity/question | Known/Unknown/Assumed | Satisfies |
|---|---|---|---|
| RS-001 | Users have no self-serve way to leave the waitlist and resort to emailing support directly | Known | DISC-001 |
| RS-002 | The founder currently removes people by hand-editing the in-memory store, which does not scale past a handful of requests | Known | DISC-001 |
| RS-003 | Whether users expect an unsubscribe confirmation page/email versus a silent removal is untested | Assumed | DISC-001 |

## Phase summary

Support load from manual unsubscribe requests is the clearest, best-evidenced
theme (RS-001, RS-002). Whether users need explicit confirmation of removal
(RS-003) is unresolved and flagged as assumed, not known.
EOF

git add -A
git commit -q -m "Pre-seed discovery + research-synthesis artifacts for personas-jobs-stage eval"

echo "Personas & Jobs fixture ready at $TARGET (base app + discovery + research-synthesis)"
