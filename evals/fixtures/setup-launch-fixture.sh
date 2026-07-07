#!/usr/bin/env bash
# Fixture for testing /wingman:launch: a small project with a feature that
# has ALREADY shipped (checkpoints.jsonl already has plan/build/ship
# entries, hand-written directly rather than derived by re-running the
# pipeline, matching this repo's other non-e2e fixture scripts). Tests
# launch.md's actual job: drafting changelog/announcement copy and gating
# it through /wingman:boardroom's "content passed directly" review path
# (not a diff, not a plan file) -- a path nothing else in this eval suite
# has exercised yet.
#
# Usage: evals/fixtures/setup-launch-fixture.sh <target-dir>
# Wipes and recreates <target-dir> every run.

set -euo pipefail

TARGET="${1:?Usage: setup-launch-fixture.sh <target-dir>}"

rm -rf "$TARGET"
mkdir -p "$TARGET/src" "$TARGET/test" "$TARGET/.wingman" "$TARGET/.claude/agents"
cd "$TARGET"

git init -q

cat > package.json <<'EOF'
{
  "name": "reminders",
  "version": "0.2.0",
  "private": true,
  "description": "A tiny reminders app.",
  "scripts": { "test": "node --test" }
}
EOF

cat > src/reminders.js <<'EOF'
// In-memory recurring reminders. The feature that just shipped: reminders
// can now repeat on a daily/weekly cadence instead of firing only once.
const reminders = [];

function addReminder(text, repeat = 'none') {
  if (!['none', 'daily', 'weekly'].includes(repeat)) {
    throw new Error('repeat must be one of: none, daily, weekly');
  }
  const reminder = { text, repeat, createdAt: new Date().toISOString() };
  reminders.push(reminder);
  return reminder;
}

function listReminders() {
  return reminders.slice();
}

function _reset() {
  reminders.length = 0;
}

module.exports = { addReminder, listReminders, _reset };
EOF

cat > test/reminders.test.js <<'EOF'
const test = require('node:test');
const assert = require('node:assert/strict');
const { addReminder, listReminders, _reset } = require('../src/reminders');

test.beforeEach(() => _reset());

test('addReminder defaults to a one-time reminder', () => {
  const r = addReminder('Pay rent');
  assert.equal(r.repeat, 'none');
});

test('addReminder accepts daily and weekly repeat', () => {
  addReminder('Stretch', 'daily');
  addReminder('Team sync', 'weekly');
  assert.equal(listReminders().length, 2);
});

test('addReminder rejects an invalid repeat value', () => {
  assert.throws(() => addReminder('Bad', 'monthly'));
});
EOF

cat > README.md <<'EOF'
# Reminders

A tiny reminders app. Reminders can be one-time or repeat daily/weekly.

## Test

    npm test
EOF

cat > .claude/agents/dept-product.md <<'EOF'
---
name: dept-product
description: Product Management department lead for this project. Always active.
---

You are the Product Management lead for the "Reminders" project.
EOF

cat > .wingman/checkpoints.jsonl <<'EOF'
{"checkpoint_id": "2026-06-20T09-00-00Z-plan", "stage": "plan", "scope_ref": "docs/wingman/plans/2026-06-20-recurring-reminders.md", "seats": [{"seat": "founder", "verdict": "GO", "summary": "Recurring reminders is the most-requested feature."}, {"seat": "engineer", "verdict": "GO", "summary": "Small, well-scoped addition to the existing model."}, {"seat": "security", "verdict": "GO", "summary": "No new data exposure."}, {"seat": "design", "verdict": "GO", "summary": "N/A -- backend-only for now."}, {"seat": "cost", "verdict": "GO", "summary": "No new services."}], "bottom_line": "GO", "founder_decision": "ship_it", "founder_notes": "", "next_stage": "build"}
{"checkpoint_id": "2026-06-21T09-00-00Z-ship", "stage": "ship", "scope_ref": "diff", "seats": [{"seat": "founder", "verdict": "GO", "summary": "Matches the plan exactly."}, {"seat": "engineer", "verdict": "GO", "summary": "6/6 tests passing."}, {"seat": "security", "verdict": "GO", "summary": "No new exposure."}, {"seat": "design", "verdict": "GO", "summary": "N/A."}, {"seat": "cost", "verdict": "GO", "summary": "No new dependencies."}], "bottom_line": "GO", "founder_decision": "ship_it", "founder_notes": "", "next_stage": "shipped"}
EOF

cat > .wingman/state.json <<'EOF'
{
  "current_stage": "shipped",
  "active_department_leads": ["dept-product"],
  "active_specialists": [],
  "last_checkpoint_id": "2026-06-21T09-00-00Z-ship",
  "updated_at": "2026-06-21T09:00:05Z"
}
EOF

git add -A
git commit -q -m "Recurring reminders (daily/weekly repeat), shipped with passing tests"

echo "Fixture created at $TARGET"
echo "Verifying the shipped feature's tests pass..."
cd "$TARGET" && npm test
echo ""
echo "Feed /wingman:launch: \"Announce that reminders can now repeat daily or weekly.\""
