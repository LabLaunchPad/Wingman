#!/usr/bin/env bash
# Post-launch eval fixture, Run 1 (positive/real-signal case): the base
# waitlist app, already shipped (a prior "ship" checkpoint on record),
# with a real discovery/define paper trail (DISC-001, DEF-001/DEF-002)
# and a founder-supplied post-launch signals file describing concrete,
# real support complaints -- one that traces cleanly back to DEF-002,
# one that falls outside anything originally scoped. Tests whether
# `/wingman:post-launch` produces a real, evidence-based review that
# correctly distinguishes "in scope, diverged from plan" from "genuinely
# new signal, not a gap in the original plan."
#
# Usage: evals/fixtures/setup-post-launch-fixture.sh <target-dir>

set -euo pipefail

TARGET="${1:?Usage: setup-post-launch-fixture.sh <target-dir>}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/setup-waitlist-app.sh" "$TARGET"

cd "$TARGET"

mkdir -p docs/wingman/discovery docs/wingman/define docs/wingman/post-launch-input .wingman

cat > docs/wingman/discovery/waitlist-signup.md <<'EOF'
# Discovery: Waitlist Signup

## Problem statement

Founder wants a simple way to collect interest before the product is
built -- a public signup form, plus a way to see who has joined.

## Target user

Anyone visiting the landing page before launch.

## Success signal

DISC-001: A visitor who submits a valid email should see confirmation
they've joined the waitlist, with no further action required from them.
EOF

cat > docs/wingman/define/waitlist-signup.md <<'EOF'
# Define: Waitlist Signup

## Requirements

| ID | Requirement | Satisfies |
|---|---|---|
| DEF-001 | A visitor can submit their email to join the waitlist | DISC-001 |
| DEF-002 | A visitor is shown a confirmation that their submission succeeded | DISC-001 |
EOF

# Pre-seed a prior "ship" checkpoint, so the founder is genuinely past
# ship and post-launch review is the correct next move, not premature.
cat > .wingman/checkpoints.jsonl <<'EOF'
{"schema_version": 5, "checkpoint_id": "2026-07-20T00-00-00Z-ship", "stage": "ship", "bundle": "ship", "seats": [{"seat": "ceo", "verdict": "GO", "summary": "Ready to ship."}, {"seat": "cpo", "verdict": "GO", "summary": "Scope matches DEF-001/DEF-002."}, {"seat": "cmo", "verdict": "N/A", "summary": "No marketing surface yet."}, {"seat": "cto", "verdict": "GO", "summary": "Tests pass."}, {"seat": "ciso", "verdict": "GO", "summary": "No open threats."}, {"seat": "cfo", "verdict": "GO", "summary": "No budget concerns."}, {"seat": "research", "verdict": "N/A", "summary": "No open research questions."}, {"seat": "design", "verdict": "GO", "summary": "Simple form, no concerns."}], "bottom_line": "GO", "founder_decision": "ship_it", "next_stage": null}
EOF

cat > .wingman/state.json <<'EOF'
{
  "current_stage": "ship",
  "current_stage_status": "complete",
  "last_updated": "2026-07-20"
}
EOF

# The real, founder-supplied post-launch evidence: two concrete signals,
# one traceable to DEF-002, one genuinely outside original scope.
cat > docs/wingman/post-launch-input/support-notes.md <<'EOF'
# Post-launch signals (as gathered by the founder, 3 weeks after ship)

1. Four separate support emails in the last 10 days: "I signed up but
   never got any confirmation -- did it actually work?" Checked the
   server logs directly: the POST /waitlist requests all returned 201
   with a real JSON body containing the entry, so the backend genuinely
   did save them. The issue is that nothing is shown to the visitor in
   the browser beyond the raw JSON response -- there's no rendered
   confirmation page or message, just the API response body.

2. Two visitors, unprompted, asked by email: "Can I refer a friend and
   move up the list?" Nobody had asked for this before shipping -- there
   is no requirement or discovery note about referrals anywhere in this
   project's history.

No usage analytics are instrumented yet -- these two signals are direct
correspondence only, not aggregated metrics.
EOF

git add -A
git commit -q -m "Post-launch fixture: shipped waitlist app + real support signals"

echo "Fixture created at $TARGET"
