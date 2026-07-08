#!/usr/bin/env bash
# Fixture for testing skills/evolve-promotion: a founder project with
# genuine 2+ occurrence friction (migration-rollback safety, mentioned in
# LEARNINGS.md twice AND once in a retro AND once in a checkpoint — signal
# from all three sources), plus a deliberate single-occurrence distractor
# (a naming-convention note) that should NOT be promoted, to test the
# 2+ threshold is actually enforced rather than promoting on any mention.
#
# Usage: evals/fixtures/setup-evolve-fixture.sh <target-dir>
# Wipes and recreates <target-dir> every run.

set -euo pipefail

TARGET="${1:?Usage: setup-evolve-fixture.sh <target-dir>}"

rm -rf "$TARGET"
mkdir -p "$TARGET/docs/wingman" "$TARGET/.wingman"
cd "$TARGET"

git init -q

cat > LEARNINGS.md <<'EOF'
# Learnings

Durable lessons captured during this project. Append-only.

### 2026-06-01 — Migration shipped without a rollback script
Added the `orders` table migration without a down/rollback script. Had to
write one manually under time pressure when a column type turned out wrong
in staging. Every migration needs a rollback script written and tested
before merging, not after something breaks.

### 2026-06-10 — Prefer kebab-case for API route names
Noticed our routes mix `camelCase` and `kebab-case`. Standardized on
kebab-case for all new routes going forward.

### 2026-06-18 — Another migration missing a rollback script
Same issue as before: the `refunds` table migration went out with no
rollback script. Had to hotfix it live when a NOT NULL constraint broke
an existing integration test's seed data.
EOF

cat > docs/wingman/retros.md <<'EOF'
# Retros

### Retro: Refunds feature — 2026-06-19

**What went well:** The refunds flow itself worked first try.
**What was harder than expected:** We keep shipping database migrations
without rollback scripts, and it keeps costing us a live hotfix each time
something doesn't match staging exactly. This is the second time this
exact thing has happened.
**What we'd do differently next time:** Require a rollback script as part
of the migration task itself, not an afterthought.
**Anything for you to know:** Nothing else major this round.
EOF

cat > .wingman/checkpoints.jsonl <<'EOF'
{"checkpoint_id":"2026-06-18T10-00-00Z-build","stage":"build","scope_ref":"diff","seats":[{"seat":"founder","verdict":"GO","summary":"Refunds feature matches the ask."},{"seat":"engineer","verdict":"GO_WITH_CONCERNS","summary":"Migration for the refunds table has no rollback script, same gap as the orders migration a few weeks ago."},{"seat":"security","verdict":"GO","summary":"No new exposure."},{"seat":"design","verdict":"GO","summary":"N/A."},{"seat":"cost","verdict":"GO","summary":"No new paid services."}],"bottom_line":"GO_WITH_CHANGES","founder_decision":"fix_concerns_first","founder_notes":"","next_stage":"build"}
{"checkpoint_id":"2026-06-19T09-00-00Z-ship","stage":"ship","scope_ref":"diff","seats":[{"seat":"founder","verdict":"GO","summary":"Ready to ship."},{"seat":"engineer","verdict":"GO","summary":"Rollback script added, looks fine now."},{"seat":"security","verdict":"GO","summary":"No new exposure."},{"seat":"design","verdict":"GO","summary":"N/A."},{"seat":"cost","verdict":"GO","summary":"No new paid services."}],"bottom_line":"GO","founder_decision":"ship_it","founder_notes":"","next_stage":"ship"}
EOF

git add -A
git commit -q -m "Initial fixture: repeated migration-rollback friction"

echo "Fixture created at $TARGET"
echo "Expected clustering outcome:"
echo "  Migration-rollback friction: 3 corroborating mentions (LEARNINGS.md x2, retro x1, checkpoint x1) -> SHOULD be proposed for promotion (matches 'Migration Engineer' in the specialist catalog)"
echo "  Route-naming-convention note: 1 mention only -> should NOT be proposed (single occurrence)"
