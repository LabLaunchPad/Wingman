#!/usr/bin/env bash
# Fixture for testing skills/definition-of-done's two newer techniques (added
# alongside build.md's Golden Dataset Regression / Cost & Performance Control
# Definition-of-Done sub-checks): "Widgets", a small Node inventory API where
# the last commit claims a refactor is DONE and ready for the founder
# checkpoint, but hides two real gaps that a green automated suite alone
# cannot catch -- each specific to one of the two new techniques:
#
#   1. Golden Dataset Regression -- GOLDEN-SCENARIOS.md documents 5 core user
#      scenarios, including "list widgets returns them oldest-first". The
#      last commit "optimized" the list endpoint's sort and silently flipped
#      it to newest-first. The automated test suite only asserts the list is
#      non-empty and has the right length -- it never checks order -- so
#      `npm test` stays green while scenario 3 (a real, previously-passing
#      golden-dataset scenario) now fails if actually re-run by hand.
#   2. Cost & Performance Control -- a newly added `/widgets/bulk-price-check`
#      endpoint loops over every widget in the store and calls an external,
#      per-call-billed pricing API with no batching, no cap on widget count,
#      no rate limit, and no documented reason none is needed. A single
#      request against a large inventory is an unbounded, externally-billed
#      cost surface.
#
# Both gaps are real and independently checkable; neither is caught by
# `npm test` going green, which is exactly the point -- the DoD skill's job
# is to check what automated tests structurally can't.
#
# Usage: evals/fixtures/setup-golden-dataset-cost-fixture.sh <target-dir>
# Wipes and recreates <target-dir> every run.

set -euo pipefail

TARGET="${1:?Usage: setup-golden-dataset-cost-fixture.sh <target-dir>}"

rm -rf "$TARGET"
mkdir -p "$TARGET/src" "$TARGET/test"
cd "$TARGET"

git init -q

cat > package.json <<'EOF'
{
  "name": "widgets",
  "version": "0.1.0",
  "private": true,
  "description": "A small widget inventory API.",
  "scripts": { "test": "node --test" }
}
EOF

cat > src/store.js <<'EOF'
function createStore() {
  const widgets = [
    { id: 'w1', name: 'Bolt', price: 2, createdAt: 1 },
    { id: 'w2', name: 'Nut', price: 1, createdAt: 2 },
    { id: 'w3', name: 'Washer', price: 1, createdAt: 3 },
  ];

  return {
    add(widget) {
      widgets.push(widget);
      return widget;
    },
    // BUG/GAP (Golden Dataset Regression): this used to sort oldest-first
    // (ascending createdAt), matching GOLDEN-SCENARIOS.md scenario 3. A
    // recent "optimize the list view" change flipped this to descending
    // (newest-first) to put recently-added widgets at the top for the admin
    // UI -- but nobody re-ran the golden scenario checklist, and the
    // automated test below only checks length, never order, so the suite
    // stayed green through the regression.
    list() {
      return [...widgets].sort((a, b) => b.createdAt - a.createdAt);
    },
    get(id) {
      return widgets.find((w) => w.id === id);
    },
    all() {
      return widgets;
    },
  };
}

module.exports = { createStore };
EOF

cat > src/pricing.js <<'EOF'
// Fictional external, per-call-billed pricing API client.
async function fetchExternalPrice(widgetId) {
  // In real life this is a metered HTTP call to a third-party pricing
  // service, billed per request.
  return { widgetId, externalPrice: Math.random() * 10 };
}

// BUG/GAP (Cost & Performance Control): this new endpoint's handler loops
// over *every* widget in the store and fires one metered external API call
// per widget, with no batching, no page size cap, and no rate limit -- and
// nothing in the codebase documents why that's an acceptable bound (it
// isn't; this is meant to be public-facing). A store with 50,000 widgets
// means 50,000 billed external calls from a single incoming request.
async function bulkPriceCheck(store) {
  const widgets = store.all();
  const results = [];
  for (const w of widgets) {
    results.push(await fetchExternalPrice(w.id));
  }
  return results;
}

module.exports = { fetchExternalPrice, bulkPriceCheck };
EOF

cat > test/store.test.js <<'EOF'
const test = require('node:test');
const assert = require('node:assert/strict');
const { createStore } = require('../src/store');

// This suite only checks length/membership, never order -- so the sort
// direction regression in list() is invisible here.
test('list returns all widgets', () => {
  const store = createStore();
  const listed = store.list();
  assert.equal(listed.length, 3);
});

test('add adds a new widget and it appears in list', () => {
  const store = createStore();
  store.add({ id: 'w4', name: 'Screw', price: 3, createdAt: 4 });
  const listed = store.list();
  assert.equal(listed.length, 4);
  assert.ok(listed.some((w) => w.id === 'w4'));
});

test('get returns the widget by id', () => {
  const store = createStore();
  assert.equal(store.get('w2').name, 'Nut');
});
EOF

cat > test/pricing.test.js <<'EOF'
const test = require('node:test');
const assert = require('node:assert/strict');
const { createStore } = require('../src/store');
const { bulkPriceCheck } = require('../src/pricing');

// Only ever exercised against the 3-widget starter store -- nothing here
// exercises or bounds behavior at any real scale.
test('bulkPriceCheck returns one price per widget', async () => {
  const store = createStore();
  const results = await bulkPriceCheck(store);
  assert.equal(results.length, 3);
});
EOF

cat > GOLDEN-SCENARIOS.md <<'EOF'
# Golden Dataset -- Widgets core scenarios

Re-run every scenario below by hand whenever a feature is added or changed,
not just the scenario for the new feature. A previously-passing scenario
that now fails is a regression, regardless of whether the changed code path
touches it directly.

1. Adding a widget makes it retrievable by id via `get(id)`.
2. `list()` never drops a widget that was added.
3. `list()` returns widgets **oldest-first** (ascending `createdAt`) -- the
   admin dashboard's "history" view depends on this order to show widgets in
   the order they were created.
4. `get(id)` for an id that was never added returns `undefined`, not a throw.
5. `bulkPriceCheck` returns exactly one priced result per widget currently in
   the store.
EOF

cat > README.md <<'EOF'
# Widgets

A small widget inventory API with bulk external price checking.

## Endpoints

- `add(widget)` -- add a widget to the store.
- `list()` -- list all widgets, oldest first.
- `get(id)` -- fetch one widget by id.
- `bulkPriceCheck(store)` -- fetch an external, per-call-billed price for
  every widget in the store.
EOF

cat > STATUS.md <<'EOF'
# Status

**DONE.** List-view optimization plus the new bulk price-check endpoint are
complete, all tests passing (4/4), ready for the founder checkpoint. Ship it.
EOF

git add -A
git commit -q -m "feat: optimize list ordering for admin view, add bulk price-check endpoint -- DONE per STATUS.md"

echo "Fixture created at $TARGET"
echo "Verifying the starter app's own tests currently pass (both gaps stay invisible to npm test)..."
cd "$TARGET" && npm test
echo ""
echo "Claim to feed the definition-of-done skill: STATUS.md says this is DONE and ready to ship."
echo "Expected real gaps: GOLDEN-SCENARIOS.md scenario 3 (oldest-first order) now fails if actually"
echo "re-run by hand, even though npm test stays green (Golden Dataset Regression); and"
echo "bulkPriceCheck loops over the entire store with no batching/cap/rate-limit and no documented"
echo "reason none is needed (Cost & Performance Control)."
