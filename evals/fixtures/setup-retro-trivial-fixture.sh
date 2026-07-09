#!/usr/bin/env bash
# Negative-case fixture for commands/retro.md: the just-shipped change is
# TRIVIAL (a one-word typo fix in a README), which retro.md explicitly says to
# skip ("Skip this for trivial changes"). Tests that retro correctly RECOMMENDS
# SKIPPING rather than manufacturing a ceremony-retro for a non-event -- the
# inverse of the first retro eval, which had genuinely rich history to reflect on.
#
# Usage: evals/fixtures/setup-retro-trivial-fixture.sh <target-dir>
set -euo pipefail
TARGET="${1:?Usage: setup-retro-trivial-fixture.sh <target-dir>}"
rm -rf "$TARGET"; mkdir -p "$TARGET/.wingman"; cd "$TARGET"; git init -q

cat > README.md <<'EOF'
# notes

A tiny notes app. Recieve and store short notes.
EOF
git add -A; git commit -q -m "Initial notes app"

# The one trivial change: fix the "Recieve" typo. Nothing else.
sed -i 's/Recieve/Receive/' README.md
git add -A; git commit -q -m "Fix typo: Recieve -> Receive"

cat > .wingman/checkpoints.jsonl <<'EOF'
{"checkpoint_id": "2026-07-01T09-00-00Z-ship", "stage": "ship", "scope_ref": "diff", "seats": [{"seat": "founder", "verdict": "GO", "summary": "Typo fix."}, {"seat": "engineer", "verdict": "GO", "summary": "One-word docs change, nothing to test."}, {"seat": "security", "verdict": "GO", "summary": "N/A."}, {"seat": "design", "verdict": "GO", "summary": "N/A."}, {"seat": "cost", "verdict": "GO", "summary": "N/A."}], "bottom_line": "GO", "founder_decision": "ship_it", "founder_notes": "", "next_stage": "shipped"}
EOF
cat > .wingman/state.json <<'EOF'
{ "current_stage": "shipped", "active_department_leads": [], "active_specialists": [], "last_checkpoint_id": "2026-07-01T09-00-00Z-ship", "updated_at": "2026-07-01T09:00:00Z" }
EOF

git add -A; git commit -q -m "wingman: record trivial typo-fix ship checkpoint"
echo "Fixture created at $TARGET"
echo "History: exactly one trivial change (a README typo fix), all-GO checkpoint."
echo 'Feed /wingman:retro (defaults to most recent shipped work).'
echo "Expected: retro RECOMMENDS SKIPPING (trivial change, nothing durable to reflect on),"
echo "per retro.md's own 'Skip this for trivial changes' guidance -- it should NOT force a retro."
