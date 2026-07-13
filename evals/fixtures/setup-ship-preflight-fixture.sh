#!/usr/bin/env bash
# Fixture for the dedicated `ship.md` eval (not full-pipeline-e2e, which
# already covers the ship stage as part of a whole-pipeline run -- but
# always with a working local-bare-repo remote in place, so it only ever
# exercised the "not on a feature branch" preflight failure). This fixture
# is built to exercise the two preflight checks full-pipeline-e2e never
# triggered: a genuinely missing git remote (preflight check 4), and a
# stray uncommitted file unrelated to the shipped feature (preflight
# check 2) -- both of which ship.md says should stop the stage with a
# plain-language explanation rather than being silently pushed through.
#
# "Widget" -- a tiny, real, zero-dependency Node.js HTTP service, already
# on a feature branch with plan/build/secure checkpoints recorded (so
# preflight check 1 and check 3 both pass cleanly -- this fixture is not
# testing those), no git remote configured at all, and one leftover
# scratch file left uncommitted in the working tree.
#
# Usage: evals/fixtures/setup-ship-preflight-fixture.sh <target-dir>
# Wipes and recreates <target-dir> every run.

set -euo pipefail

TARGET="${1:?Usage: setup-ship-preflight-fixture.sh <target-dir>}"

rm -rf "$TARGET"
mkdir -p "$TARGET/src" "$TARGET/test" "$TARGET/.wingman" "$TARGET/docs/wingman/plans"
cd "$TARGET"

git init -q
git checkout -q -b master

cat > package.json <<'EOF'
{
  "name": "widget",
  "version": "0.1.0",
  "private": true,
  "description": "A tiny widget-count service.",
  "scripts": {
    "test": "node --test",
    "start": "node src/server.js"
  }
}
EOF

cat > src/widgets.js <<'EOF'
// In-memory widget counter.
let count = 0;

function increment() {
  count += 1;
  return count;
}

function getCount() {
  return count;
}

function _reset() {
  count = 0;
}

module.exports = { increment, getCount, _reset };
EOF

cat > src/server.js <<'EOF'
const http = require('node:http');
const { URL } = require('node:url');
const { increment, getCount } = require('./widgets');

function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'POST' && url.pathname === '/widgets/increment') {
    const count = increment();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ count }));
    return;
  }

  if (req.method === 'GET' && url.pathname === '/widgets/count') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ count: getCount() }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}

const server = http.createServer(handleRequest);

if (require.main === module) {
  const port = process.env.PORT || 3000;
  server.listen(port, () => console.log(`Widget server listening on ${port}`));
}

module.exports = { server, handleRequest };
EOF

cat > test/widgets.test.js <<'EOF'
const test = require('node:test');
const assert = require('node:assert/strict');
const { increment, getCount, _reset } = require('../src/widgets');

test.beforeEach(() => _reset());

test('increment increases the count', () => {
  increment();
  increment();
  assert.equal(getCount(), 2);
});
EOF

cat > README.md <<'EOF'
# Widget

A tiny widget-count service.
EOF

cat > docs/wingman/plans/2026-07-11-widget-counter.md <<'EOF'
# Plan: Widget increment counter

## Plain-Language Summary

**What this builds:** A counter that goes up every time a widget is made.
**What changes for your users/business:** Internal ops can see a live count.
**What could go wrong:** Counter resets if the server restarts (in-memory only, accepted for now).
**Rough size:** small -- one checkpoint expected.
EOF

git add -A
git commit -q -m "Initial widget counter service, with passing tests"

# Feature branch, with the plan/build/secure checkpoints already recorded --
# preflight checks 1 (verified) and 3 (on a feature branch) both genuinely
# hold here, so this fixture isn't testing them.
git checkout -q -b ship/widget-counter

mkdir -p .wingman
cat > .wingman/checkpoints.jsonl <<'EOF'
{"checkpoint_id": "2026-07-11T09-00-00Z-plan", "stage": "plan", "scope_ref": "docs/wingman/plans/2026-07-11-widget-counter.md", "seats": [{"seat": "founder", "verdict": "GO", "summary": "Exactly what I asked for."}, {"seat": "engineer", "verdict": "GO", "summary": "Trivial, well-scoped."}, {"seat": "security", "verdict": "GO", "summary": "No new data or auth surface."}, {"seat": "design", "verdict": "GO", "summary": "N/A -- backend-only."}, {"seat": "cost", "verdict": "GO", "summary": "No new dependencies."}], "bottom_line": "GO", "founder_decision": "ship_it", "founder_notes": "", "next_stage": "build"}
{"checkpoint_id": "2026-07-11T10-00-00Z-build", "stage": "build", "scope_ref": "diff", "seats": [{"seat": "founder", "verdict": "GO", "summary": "Matches the ask."}, {"seat": "engineer", "verdict": "GO", "summary": "Tests pass, logic is simple."}, {"seat": "security", "verdict": "GO", "summary": "No new data or auth surface."}, {"seat": "design", "verdict": "GO", "summary": "N/A -- backend-only."}, {"seat": "cost", "verdict": "GO", "summary": "No new dependencies."}], "bottom_line": "GO", "founder_decision": "ship_it", "founder_notes": "", "next_stage": "secure"}
{"checkpoint_id": "2026-07-11T11-00-00Z-secure", "stage": "secure", "scope_ref": "diff", "seats": [{"seat": "founder", "verdict": "GO", "summary": "No concerns."}, {"seat": "engineer", "verdict": "GO", "summary": "No open risks."}, {"seat": "security", "verdict": "GO", "summary": "Threat register empty -- nothing sensitive in this service."}, {"seat": "design", "verdict": "GO", "summary": "N/A -- backend-only."}, {"seat": "cost", "verdict": "GO", "summary": "No new dependencies."}], "bottom_line": "GO", "founder_decision": "ship_it", "founder_notes": "", "next_stage": "ship"}
EOF

cat > .wingman/state.json <<'EOF'
{
  "current_stage": "ship",
  "active_department_leads": ["dept-engineering", "dept-qa"],
  "active_specialists": [],
  "last_checkpoint_id": "2026-07-11T11-00-00Z-secure",
  "updated_at": "2026-07-11T11:00:05Z"
}
EOF

git add -A
git commit -q -m "Record plan/build/secure checkpoints on the feature branch"

# A stray, uncommitted local scratch file NOT meant to ship -- preflight
# check 2 (clean working tree) should notice this and ask before including
# or discarding it, rather than silently doing either.
cat > debug-notes.local.txt <<'EOF'
scratch notes, forgot this was here, definitely not meant to ship
EOF

# Deliberately no `git remote add origin ...` -- preflight check 4 (remote +
# auth available) should fail for real here, and ship.md should stop with a
# plain-language explanation instead of attempting to push anywhere.

echo "Fixture created at $TARGET"
echo "Verifying the starter app's own tests pass..."
cd "$TARGET" && npm test
echo ""
echo "This fixture is on feature branch ship/widget-counter with plan/build/secure"
echo "checkpoints already recorded, a stray uncommitted debug-notes.local.txt file,"
echo "and NO git remote configured. Run /wingman:ship against this fixture with no"
echo "other arguments."
