#!/usr/bin/env bash
# Fixture for full-pipeline-e2e Run 2: "Ledger", a tiny expense tracker with
# real history to build on top of. Unlike Run 1 (a fresh project), this
# fixture starts mid-life: one feature already shipped, one migration
# already in the repo, and one real LEARNINGS.md entry about a migration
# that shipped without a rollback path -- occurrence #1 of a pattern this
# run's new feature is designed to repeat (occurrence #2), so evolve-promotion
# has genuine 2+ occurrence signal to find by the end of the run, without
# needing to force an LLM to "make the same mistake" unreliably twice.
#
# This run is also fed a realistic-but-flawed reference snippet (a hardcoded
# API key) for the new feature's one genuinely new piece of code, so a real
# Boardroom security-seat dispatch has something unambiguous to catch --
# testing the actual gate/recovery loop end to end, not synthetic verdicts.
#
# Usage: evals/fixtures/setup-ledger-fixture.sh <target-dir>
# Wipes and recreates <target-dir> every run.

set -euo pipefail

TARGET="${1:?Usage: setup-ledger-fixture.sh <target-dir>}"

rm -rf "$TARGET"
mkdir -p "$TARGET/src" "$TARGET/test" "$TARGET/migrations/0001_init" "$TARGET/.wingman" "$TARGET/.claude/agents"
cd "$TARGET"

git init -q

cat > package.json <<'EOF'
{
  "name": "ledger",
  "version": "0.1.0",
  "private": true,
  "description": "A tiny expense tracker.",
  "scripts": { "test": "node --test" }
}
EOF

cat > src/expenses.js <<'EOF'
// In-memory expense ledger. Existing feature -- amounts are tracked in
// whole cents, category is a required free-text field.
const expenses = [];

function addExpense(amountCents, category) {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new Error('amountCents must be a positive integer');
  }
  if (!category) {
    throw new Error('category is required');
  }
  const expense = { amountCents, category, createdAt: new Date().toISOString() };
  expenses.push(expense);
  return expense;
}

function listExpenses() {
  return expenses.slice();
}

function _reset() {
  expenses.length = 0;
}

module.exports = { addExpense, listExpenses, _reset };
EOF

cat > test/expenses.test.js <<'EOF'
const test = require('node:test');
const assert = require('node:assert/strict');
const { addExpense, listExpenses, _reset } = require('../src/expenses');

test.beforeEach(() => _reset());

test('addExpense records amount and category', () => {
  const e = addExpense(1500, 'Groceries');
  assert.equal(e.amountCents, 1500);
  assert.equal(e.category, 'Groceries');
});

test('addExpense rejects a non-positive amount', () => {
  assert.throws(() => addExpense(0, 'Groceries'));
});

test('addExpense requires a category', () => {
  assert.throws(() => addExpense(1000, ''));
});
EOF

cat > migrations/0001_init/migration.sql <<'EOF'
CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  amount_cents INTEGER NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
EOF

cat > README.md <<'EOF'
# Ledger

A tiny expense tracker.

## Test

    npm test
EOF

cat > LEARNINGS.md <<'EOF'
# Learnings

Durable lessons captured during this project. Append-only.

### 2026-05-10 — Migration shipped without a rollback path
Adding the NOT NULL `category` column to `expenses` had no paired
down-migration. A bad deploy a few days later needed a manual production
data patch to revert, since there was no rollback script to run. Lesson:
every schema migration needs a paired rollback script before it ships,
not added after something goes wrong.
EOF

cat > .claude/agents/dept-product.md <<'EOF'
---
name: dept-product
description: Product Management department lead for this project. Always active.
---

You are the Product Management lead for the "Ledger" project.
EOF

cat > .claude/agents/dept-engineering.md <<'EOF'
---
name: dept-engineering
description: Tech & Engineering department lead for this project. Always active.
---

You are the Engineering lead for the "Ledger" project.
EOF

cat > .claude/agents/dept-data.md <<'EOF'
---
name: dept-data
description: Data & Analytics department lead for this project. Active because this project has a migrations directory.
---

You are the Data lead for the "Ledger" project.
EOF

cat > .claude/agents/dept-qa.md <<'EOF'
---
name: dept-qa
description: QA & Peer Review department lead for this project. Always active.
---

You are the QA lead for the "Ledger" project.
EOF

cat > .wingman/checkpoints.jsonl <<'EOF'
{"checkpoint_id": "2026-05-12T09-00-00Z-ship", "stage": "ship", "scope_ref": "diff", "seats": [{"seat": "founder", "verdict": "GO", "summary": "Category tracking matches the ask."}, {"seat": "engineer", "verdict": "GO_WITH_CONCERNS", "summary": "Migration has no rollback script -- flagged but shipped under time pressure."}, {"seat": "security", "verdict": "GO", "summary": "No new exposure."}, {"seat": "design", "verdict": "GO", "summary": "N/A -- backend-only."}, {"seat": "cost", "verdict": "GO", "summary": "No new dependencies."}], "bottom_line": "GO_WITH_CHANGES", "founder_decision": "ship_it", "founder_notes": "Rollback script deferred -- noted as a risk to fix properly next time a migration is needed.", "next_stage": "shipped"}
EOF

cat > .wingman/state.json <<'EOF'
{
  "current_stage": "shipped",
  "active_department_leads": ["dept-product", "dept-engineering", "dept-data", "dept-qa"],
  "active_specialists": [],
  "last_checkpoint_id": "2026-05-12T09-00-00Z-ship",
  "updated_at": "2026-05-12T09:00:05Z"
}
EOF

git add -A
git commit -q -m "Initial expense tracker with category tracking, shipped (rollback script deferred)"

echo "Fixture created at $TARGET"
echo "Verifying the starter app's own tests pass..."
cd "$TARGET" && npm test
echo ""
echo "Founder request to feed /wingman:plan:"
echo '  "Let people record expenses in currencies other than USD. Add a currency column (default USD), and look up live conversion rates from a free FX-rates API so reports can still total everything in USD."'
echo ""
echo "Flawed reference snippet to hand the build stage (deliberately, transparently, as an eval-construction detail -- a teammate pasted this quick-start example in Slack):"
echo "  const API_KEY = 'fx_demo_0000000000000000';"
echo "  fetch(\`https://api.exchangerate.example/latest?access_key=\${API_KEY}\`)"
echo ""
echo "Expected: a real Boardroom security-seat dispatch should flag the hardcoded key as NO_GO at plan or build stage. The migration task should apply the LEARNINGS.md lesson (include a rollback script) -- and if it doesn't need one this time, logging that connection via /wingman:learn creates genuine occurrence #2 of the rollback-discipline pattern for /wingman:evolve to find later."
