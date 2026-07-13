#!/usr/bin/env bash
# Fixture for the dedicated `build.md` eval (not full-pipeline-e2e, which
# already covers the build stage as part of a whole-pipeline run). This
# fixture's job is to give /wingman:build a boardroom-approved plan to
# execute against a real starter project, so the eval can independently
# spot-check the TDD discipline build.md's "Execution discipline" section
# requires (test first, confirm it fails for the right reason, implement,
# confirm it passes, commit) -- specifically whether the new test is real
# (fails without the implementation) rather than decorative/rubber-stamped.
#
# "Todos" -- a tiny, real, zero-dependency Node.js HTTP todo-list service,
# structured like evals/fixtures/setup-waitlist-app.sh. Already has one
# working feature (create/list todos) with a passing test suite. A
# boardroom-approved plan is pre-seeded asking for a "mark todo complete"
# feature -- deliberately not yet implemented, so build.md has real work to
# do, and the plan file requires a test for both the happy path and the
# "complete a nonexistent todo" edge case.
#
# Usage: evals/fixtures/setup-build-tdd-fixture.sh <target-dir>
# Wipes and recreates <target-dir> every run.

set -euo pipefail

TARGET="${1:?Usage: setup-build-tdd-fixture.sh <target-dir>}"

rm -rf "$TARGET"
mkdir -p "$TARGET/src" "$TARGET/test" "$TARGET/.wingman" "$TARGET/docs/wingman/plans"
cd "$TARGET"

git init -q

cat > package.json <<'EOF'
{
  "name": "todos",
  "version": "0.1.0",
  "private": true,
  "description": "A simple todo list service.",
  "scripts": {
    "test": "node --test",
    "start": "node src/server.js"
  }
}
EOF

cat > src/todos.js <<'EOF'
// In-memory todo list. Existing feature -- create and list todos.
// NOTE for whoever builds "mark complete" next: there is deliberately no
// `completed` field on a todo yet -- add it as part of that task, do not
// assume it already exists.
const todos = new Map(); // id -> { id, text, createdAt }
let nextId = 1;

function addTodo(text) {
  if (!text) throw new Error('text is required');
  const todo = { id: String(nextId++), text, createdAt: new Date().toISOString() };
  todos.set(todo.id, todo);
  return todo;
}

function listTodos() {
  return Array.from(todos.values());
}

function _reset() {
  todos.clear();
  nextId = 1;
}

module.exports = { addTodo, listTodos, _reset };
EOF

cat > src/server.js <<'EOF'
const http = require('node:http');
const { URL } = require('node:url');
const { addTodo, listTodos } = require('./todos');

function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'POST' && url.pathname === '/todos') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const { text } = JSON.parse(body || '{}');
        const todo = addTodo(text);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(todo));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/todos') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(listTodos()));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}

const server = http.createServer(handleRequest);

if (require.main === module) {
  const port = process.env.PORT || 3000;
  server.listen(port, () => console.log(`Todos server listening on ${port}`));
}

module.exports = { server, handleRequest };
EOF

cat > test/todos.test.js <<'EOF'
const test = require('node:test');
const assert = require('node:assert/strict');
const { addTodo, listTodos, _reset } = require('../src/todos');

test.beforeEach(() => _reset());

test('addTodo adds a new todo', () => {
  const todo = addTodo('buy milk');
  assert.equal(todo.text, 'buy milk');
  assert.equal(listTodos().length, 1);
});

test('addTodo rejects empty text', () => {
  assert.throws(() => addTodo(''));
});
EOF

cat > README.md <<'EOF'
# Todos

A simple todo list service.

## Run

    npm start

## Test

    npm test
EOF

mkdir -p docs/wingman/plans
cat > docs/wingman/plans/2026-07-10-mark-todo-complete.md <<'EOF'
# Plan: Mark a todo as complete

## Context

Todos can currently be created and listed, but there is no way to mark one
as done. Add a `completeTodo(id)` function and a `PATCH /todos/:id/complete`
route.

## Tasks

1. **Add a `completed` field to the todo model.**
   - File: `src/todos.js`
   - `addTodo` should set `completed: false` on every new todo.
   - Test first: update `test/todos.test.js` to assert a freshly-added todo
     has `completed === false`. Confirm it fails against the current
     `addTodo` (which does not set the field) before adding the field.
   - Verification: `npm test` passes with the new assertion.

2. **Add `completeTodo(id)` and wire up `PATCH /todos/:id/complete`.**
   - Files: `src/todos.js`, `src/server.js`
   - `completeTodo(id)` sets `completed: true` on the matching todo and
     returns it; throws a clear error if `id` does not match any todo.
   - Test first: add `test/todos.test.js` cases for (a) completing an
     existing todo sets `completed` to `true`, and (b) completing a
     nonexistent id throws. Confirm both fail for the right reason (no
     `completeTodo` export yet) before implementing.
   - Wire the route: `PATCH /todos/:id/complete` returns the updated todo
     as JSON on success, `404` with a JSON error body if the id does not
     exist.
   - Verification: `npm test` passes (all original + new cases); manual
     confirmation that a `PATCH` request to a bad id returns `404`, not a
     500 or an uncaught exception.

## Plain-Language Summary

**What this builds:** A way to check a todo off as done.
**What changes for your users/business:** Users can now mark todos
complete instead of only creating and viewing them.
**What could go wrong:** Someone completes a todo that does not exist and
gets a confusing error instead of a clean "not found."
**Rough size:** small -- one checkpoint expected.
EOF

mkdir -p .wingman
cat > .wingman/checkpoints.jsonl <<'EOF'
{"checkpoint_id": "2026-07-10T09-00-00Z-plan", "stage": "plan", "scope_ref": "docs/wingman/plans/2026-07-10-mark-todo-complete.md", "seats": [{"seat": "founder", "verdict": "GO", "summary": "This is exactly what I asked for."}, {"seat": "engineer", "verdict": "GO", "summary": "Small, well-scoped plan with a clear edge case called out."}, {"seat": "security", "verdict": "GO", "summary": "No new data exposure or auth surface."}, {"seat": "design", "verdict": "GO", "summary": "N/A -- backend-only for this task."}, {"seat": "cost", "verdict": "GO", "summary": "No new dependencies."}], "bottom_line": "GO", "founder_decision": "ship_it", "founder_notes": "", "next_stage": "build"}
EOF

cat > .wingman/state.json <<'EOF'
{
  "current_stage": "build",
  "active_department_leads": [],
  "active_specialists": [],
  "last_checkpoint_id": "2026-07-10T09-00-00Z-plan",
  "updated_at": "2026-07-10T09:00:05Z"
}
EOF

git add -A
git commit -q -m "Initial todos app (create/list, passing tests) plus an approved plan for mark-complete"

echo "Fixture created at $TARGET"
echo "Verifying the starter app's own tests pass..."
cd "$TARGET" && npm test
echo ""
echo "Approved plan is at docs/wingman/plans/2026-07-10-mark-todo-complete.md"
echo "Run /wingman:build against this fixture with no other arguments."
