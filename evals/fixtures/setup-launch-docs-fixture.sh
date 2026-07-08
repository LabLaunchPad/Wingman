#!/usr/bin/env bash
# Second-scenario fixture for commands/launch.md: a shipped feature that
# GENUINELY needs a user-facing docs update (a query API with several options
# a user can't discover without docs), unlike the first launch eval where a
# docs update was correctly skippable. Tests that the docs-update decision is
# a real judgment call, not a reflexive "skip" -- the agent should produce an
# actual docs update here, not default past it.
#
# Usage: evals/fixtures/setup-launch-docs-fixture.sh <target-dir>
set -euo pipefail
TARGET="${1:?Usage: setup-launch-docs-fixture.sh <target-dir>}"
rm -rf "$TARGET"; mkdir -p "$TARGET/src" "$TARGET/test" "$TARGET/.wingman" "$TARGET/.claude/agents"; cd "$TARGET"; git init -q

cat > package.json <<'EOF'
{ "name": "search", "version": "0.3.0", "private": true, "scripts": { "test": "node --test" } }
EOF

# The just-shipped feature: a search() with several non-obvious options
# (filters, sort, pagination) that a user genuinely cannot use without docs.
cat > src/search.js <<'EOF'
const ITEMS = [];
function search(query, opts = {}) {
  const { caseSensitive = false, sortBy = 'relevance', limit = 20, offset = 0, fields = ['title'] } = opts;
  // (implementation elided for the fixture; the point is the option surface)
  return { query, caseSensitive, sortBy, limit, offset, fields, results: ITEMS.slice(offset, offset + limit) };
}
module.exports = { search };
EOF

cat > test/search.test.js <<'EOF'
const test = require('node:test');
const assert = require('node:assert/strict');
const { search } = require('../src/search');
test('defaults are applied', () => {
  const r = search('hi');
  assert.equal(r.sortBy, 'relevance');
  assert.equal(r.limit, 20);
});
test('options override defaults', () => {
  const r = search('hi', { sortBy: 'date', limit: 5, fields: ['title', 'body'] });
  assert.equal(r.sortBy, 'date');
  assert.deepEqual(r.fields, ['title', 'body']);
});
EOF

# README intentionally does NOT document the search options yet.
cat > README.md <<'EOF'
# search

A small search library.

## Test

    npm test
EOF

cat > .claude/agents/dept-product.md <<'EOF'
---
name: dept-product
description: Product Management department lead for this project. Always active.
---
You are the Product Management lead for the "search" project.
EOF

cat > .wingman/checkpoints.jsonl <<'EOF'
{"checkpoint_id": "2026-06-25T09-00-00Z-ship", "stage": "ship", "scope_ref": "diff", "seats": [{"seat": "founder", "verdict": "GO", "summary": "Advanced search options are the top request."}, {"seat": "engineer", "verdict": "GO", "summary": "Tests pass."}, {"seat": "security", "verdict": "GO", "summary": "No exposure."}, {"seat": "design", "verdict": "GO_WITH_CONCERNS", "summary": "Options are powerful but undocumented -- users won't find them."}, {"seat": "cost", "verdict": "GO", "summary": "No new deps."}], "bottom_line": "GO_WITH_CHANGES", "founder_decision": "ship_it", "founder_notes": "Docs for the new options still owed.", "next_stage": "shipped"}
EOF
cat > .wingman/state.json <<'EOF'
{ "current_stage": "shipped", "active_department_leads": ["dept-product"], "active_specialists": [], "last_checkpoint_id": "2026-06-25T09-00-00Z-ship", "updated_at": "2026-06-25T09:00:00Z" }
EOF

git add -A; git commit -q -m "search: add filter/sort/pagination options, shipped (docs owed)"
echo "Fixture created at $TARGET"
cd "$TARGET" && npm test >/dev/null 2>&1 && echo "tests: PASS"
echo 'Founder ask to feed /wingman:launch: "Announce the new advanced search options."'
echo "Expected: launch produces an ACTUAL docs update (README search-options section)"
echo "-- the feature is unusable without it -- not a reflexive skip; plus changelog/announcement."
