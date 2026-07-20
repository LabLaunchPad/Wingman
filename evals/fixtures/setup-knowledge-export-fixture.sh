#!/usr/bin/env bash
# Fixture for testing plugins/wingman/scripts/okf-export.mjs: a synthetic
# project ("Porchlight") with a realistic .wingman/checkpoints.jsonl (3 lines
# covering array-stage bundling, a scalar-stage GO checkpoint, and a rejected
# DO NOT SHIP checkpoint) and populated memory/{MEMORY,decisions}.md.
#
# tried.md is deliberately NOT created — the fixture's negative-path case,
# proving the exporter tolerates a genuinely missing memory file instead of
# erroring or fabricating an empty concept file for it.
#
# Usage: evals/fixtures/setup-knowledge-export-fixture.sh <target-dir>
# Wipes and recreates <target-dir> every run.

set -euo pipefail

TARGET="${1:?Usage: setup-knowledge-export-fixture.sh <target-dir>}"

rm -rf "$TARGET"
mkdir -p "$TARGET/.wingman/memory"
cd "$TARGET"

git init -q

cat > package.json <<'EOF'
{
  "name": "porchlight",
  "version": "0.1.0",
  "private": true,
  "description": "A tiny Wingman-shaped project used to test the OKF knowledge-export script."
}
EOF

cat > .wingman/checkpoints.jsonl <<'EOF'
{"schema_version": 4, "checkpoint_id": "2026-07-14T14-32-00Z-implementation-planning", "stage": ["discovery", "define", "architecture", "uxflow", "implementation-planning"], "bundle": "planning-milestone", "scope_ref": "docs/wingman/plans/2026-07-14-billing-integration.md", "seats": [{"seat": "ceo", "verdict": "GO", "summary": "Solves the stated problem, scope is right-sized."}, {"seat": "cpo", "verdict": "GO", "summary": "Real user need, right-sized slice."}, {"seat": "cmo", "verdict": "GO", "summary": "N/A - no material input on this checkpoint."}, {"seat": "cto", "verdict": "GO_WITH_CONCERNS", "summary": "No test plan for the webhook retry path yet."}, {"seat": "ciso", "verdict": "GO", "summary": "No new data exposure identified."}, {"seat": "cfo", "verdict": "GO", "summary": "No new paid services introduced."}, {"seat": "research", "verdict": "GO", "summary": "N/A - no material input on this checkpoint."}], "bottom_line": "GO_WITH_CHANGES", "founder_decision": "fix_concerns_first", "founder_notes": "", "next_stage": "build", "details_ref": ".wingman/checkpoint-details/2026-07-14T14-32-00Z-implementation-planning.md"}
{"schema_version": 4, "checkpoint_id": "2026-07-15T09-10-00Z-build", "stage": "build", "bundle": "build", "scope_ref": "diff", "seats": [{"seat": "ceo", "verdict": "GO", "summary": "Matches the approved plan."}, {"seat": "cto", "verdict": "GO", "summary": "Tests pass, coverage adequate."}, {"seat": "ciso", "verdict": "GO", "summary": "Threat register clean."}], "bottom_line": "GO", "founder_decision": "ship_it", "founder_notes": "", "next_stage": "ship"}
{"schema_version": 4, "checkpoint_id": "2026-07-16T11-45-00Z-ship", "stage": "ship", "bundle": "ship", "scope_ref": "diff", "seats": [{"seat": "ceo", "verdict": "NO_GO", "summary": "Pricing copy contradicts the signed contract terms."}, {"seat": "cfo", "verdict": "GO", "summary": "No billing-logic concerns."}], "bottom_line": "DO NOT SHIP", "founder_decision": "fix_concerns_first", "founder_notes": "Founder to correct pricing copy before re-review.", "next_stage": "ship"}
EOF

cat > .wingman/memory/MEMORY.md <<'EOF'
# Project Memory

- Stack: Next.js + Postgres, deployed on Fly.io.
- Constraint: must stay PCI-DSS SAQ-A eligible (no raw card data ever touches our servers).
- Preference: founder wants weekly, not daily, digest emails.
EOF

cat > .wingman/memory/decisions.md <<'EOF'
# Decisions

- 2026-07-10: Chose Stripe Billing over a custom subscription table — founder preferred less maintenance surface over marginal cost savings.
- 2026-07-12: Deferred multi-currency support until a real non-USD customer signs up.
EOF

# .wingman/memory/tried.md intentionally NOT created.

git add -A
git commit -q -m "Initial Porchlight fixture for okf-export eval"

echo "Fixture ready at $TARGET"
