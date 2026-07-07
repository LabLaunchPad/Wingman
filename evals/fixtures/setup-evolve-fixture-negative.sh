#!/usr/bin/env bash
# Negative-case fixture for skills/evolve-promotion: every topic across
# LEARNINGS.md, docs/wingman/retros.md, and .wingman/checkpoints.jsonl
# appears exactly ONCE, with no cross-source corroboration anywhere. No
# cluster should reach the 2+ occurrence threshold. Tests that the skill
# proposes nothing rather than manufacturing a promotion "to be thorough"
# out of scattered single mentions.
#
# Usage: evals/fixtures/setup-evolve-fixture-negative.sh <target-dir>
# Wipes and recreates <target-dir> every run.

set -euo pipefail

TARGET="${1:?Usage: setup-evolve-fixture-negative.sh <target-dir>}"

rm -rf "$TARGET"
mkdir -p "$TARGET/docs/wingman" "$TARGET/.wingman"
cd "$TARGET"

git init -q

cat > LEARNINGS.md <<'EOF'
# Learnings

Durable lessons captured during this project. Append-only.

### 2026-06-01 — Rate limit header format
The third-party shipping API returns rate-limit info in a non-standard
header (`X-RL-Remaining` instead of the usual `X-RateLimit-Remaining`).
Noted for future integrations with this vendor.

### 2026-06-10 — Timezone assumption in reporting
The weekly summary email assumed UTC when the founder is in a different
timezone, so "this week" boundaries were off by a few hours. Fixed by
reading the founder's configured timezone instead of assuming UTC.

### 2026-06-20 — CSV export column order
A customer asked for a specific column order in the CSV export that
doesn't match the database column order. One-off customization, not a
general pattern — handled with a per-export column-order config.
EOF

cat > docs/wingman/retros.md <<'EOF'
# Retros

### Retro: Shipping integration — 2026-06-05

**What went well:** The integration itself was straightforward once the
rate-limit header quirk was understood.
**What was harder than expected:** Vendor docs were slightly out of date
on the auth flow, cost about an hour of extra debugging.
**What we'd do differently next time:** Nothing major — this was a
one-off vendor-specific issue.
**Anything for you to know:** Nothing else major this round.
EOF

cat > .wingman/checkpoints.jsonl <<'EOF'
{"checkpoint_id":"2026-06-10T09-00-00Z-build","stage":"build","scope_ref":"diff","seats":[{"seat":"founder","verdict":"GO","summary":"Timezone fix matches the ask."},{"seat":"engineer","verdict":"GO","summary":"Fix is minimal and correct."},{"seat":"security","verdict":"GO","summary":"No new exposure."},{"seat":"design","verdict":"GO","summary":"N/A."},{"seat":"cost","verdict":"GO","summary":"No new paid services."}],"bottom_line":"GO","founder_decision":"ship_it","founder_notes":"","next_stage":"ship"}
{"checkpoint_id":"2026-06-20T09-00-00Z-build","stage":"build","scope_ref":"diff","seats":[{"seat":"founder","verdict":"GO","summary":"CSV column order matches the customer ask."},{"seat":"engineer","verdict":"GO_WITH_CONCERNS","summary":"Per-export config is a bit ad hoc but scoped correctly for a one-off request."},{"seat":"security","verdict":"GO","summary":"No new exposure."},{"seat":"design","verdict":"GO","summary":"N/A."},{"seat":"cost","verdict":"GO","summary":"No new paid services."}],"bottom_line":"GO_WITH_CHANGES","founder_decision":"ship_it","founder_notes":"","next_stage":"ship"}
EOF

git add -A
git commit -q -m "Initial fixture: no repeated friction anywhere"

echo "Fixture created at $TARGET"
echo "Expected outcome: NO topic reaches 2+ occurrences. evolve-promotion should propose NOTHING."
echo "  Rate-limit header quirk: 2 mentions (LEARNINGS.md + retro) but about the SAME single vendor-integration event, not a recurring pattern -- worth noting as a judgment call, see eval expectations."
echo "  Timezone assumption bug: 1 mention only -> no promotion"
echo "  CSV export column order: 2 mentions (LEARNINGS.md + checkpoint) but both describe the SAME one-off customer request, not a recurring pattern -- also a judgment call."