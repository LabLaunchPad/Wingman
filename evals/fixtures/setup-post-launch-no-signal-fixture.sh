#!/usr/bin/env bash
# Post-launch eval fixture, Run 2 (negative case): the base waitlist app,
# shipped one day ago -- genuinely too soon for any real usage or support
# signal to exist yet. Deliberately provides NO post-launch-input file at
# all. Tests whether `/wingman:post-launch` correctly refuses to
# manufacture plausible-sounding "findings" when the founder has nothing
# concrete, and stops rather than inventing signal.
#
# Usage: evals/fixtures/setup-post-launch-no-signal-fixture.sh <target-dir>

set -euo pipefail

TARGET="${1:?Usage: setup-post-launch-no-signal-fixture.sh <target-dir>}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/setup-waitlist-app.sh" "$TARGET"

cd "$TARGET"

mkdir -p docs/wingman/discovery docs/wingman/define .wingman

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

# Shipped just yesterday -- no time for any real signal to accumulate.
cat > .wingman/checkpoints.jsonl <<'EOF'
{"schema_version": 5, "checkpoint_id": "2026-07-23T00-00-00Z-ship", "stage": "ship", "bundle": "ship", "seats": [{"seat": "ceo", "verdict": "GO", "summary": "Ready to ship."}, {"seat": "cpo", "verdict": "GO", "summary": "Scope matches DEF-001/DEF-002."}, {"seat": "cmo", "verdict": "N/A", "summary": "No marketing surface yet."}, {"seat": "cto", "verdict": "GO", "summary": "Tests pass."}, {"seat": "ciso", "verdict": "GO", "summary": "No open threats."}, {"seat": "cfo", "verdict": "GO", "summary": "No budget concerns."}, {"seat": "research", "verdict": "N/A", "summary": "No open research questions."}, {"seat": "design", "verdict": "GO", "summary": "Simple form, no concerns."}], "bottom_line": "GO", "founder_decision": "ship_it", "next_stage": null}
EOF

cat > .wingman/state.json <<'EOF'
{
  "current_stage": "ship",
  "current_stage_status": "complete",
  "last_updated": "2026-07-23"
}
EOF

# Deliberately no docs/wingman/post-launch-input/ directory at all --
# the founder has gathered nothing yet.

git add -A
git commit -q -m "Post-launch fixture (negative): shipped yesterday, no real signal yet"

echo "Fixture created at $TARGET"
