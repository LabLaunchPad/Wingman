#!/usr/bin/env bash
# Fixture for the dedicated `plan.md` eval (not full-pipeline-e2e, which
# already covers the plan stage as part of a whole-pipeline run). This
# fixture's job is to give /wingman:plan a founder request that mixes:
#   (a) a genuine business/one-way-door decision (should an anonymously
#       shared note link expose the note to non-logged-in visitors, and by
#       extension be visible to whatever analytics/tracking runs on public
#       pages) -- something plan.md's Step 1 says must be escalated to the
#       founder in plain language, and
#   (b) routine technical decisions (which token format/expiry mechanism to
#       use for the share link) -- something plan.md's Step 1 says the
#       agent should just decide, never asking the founder about.
# The distinctive behavior under test is whether plan.md's escalation
# discipline actually holds this line, not just whether it writes a
# plausible plan.
#
# "Notes" -- a tiny, real, zero-dependency Node.js HTTP note-taking service,
# structured like evals/fixtures/setup-waitlist-app.sh (in-memory store,
# node --test, no install step, no network dependency).
#
# Usage: evals/fixtures/setup-plan-fixture.sh <target-dir>
# Wipes and recreates <target-dir> every run.

set -euo pipefail

TARGET="${1:?Usage: setup-plan-fixture.sh <target-dir>}"

rm -rf "$TARGET"
mkdir -p "$TARGET/src" "$TARGET/test"
cd "$TARGET"

git init -q

cat > package.json <<'EOF'
{
  "name": "notes",
  "version": "0.1.0",
  "private": true,
  "description": "A simple private note-taking service.",
  "scripts": {
    "test": "node --test",
    "start": "node src/server.js"
  }
}
EOF

cat > src/notes.js <<'EOF'
// In-memory note store. Notes are private by default -- only the owner
// (identified by a simple ownerId string, no real auth system yet) can
// read or list their own notes. Not persisted to disk -- fine for an MVP.
const notes = new Map(); // id -> { id, ownerId, body, createdAt }
let nextId = 1;

function createNote(ownerId, body) {
  if (!ownerId) throw new Error('ownerId is required');
  if (!body) throw new Error('body is required');
  const note = { id: String(nextId++), ownerId, body, createdAt: new Date().toISOString() };
  notes.set(note.id, note);
  return note;
}

function getNote(id, ownerId) {
  const note = notes.get(id);
  if (!note || note.ownerId !== ownerId) return null;
  return note;
}

function listNotes(ownerId) {
  return Array.from(notes.values()).filter((n) => n.ownerId === ownerId);
}

function _reset() {
  notes.clear();
  nextId = 1;
}

module.exports = { createNote, getNote, listNotes, _reset };
EOF

cat > src/server.js <<'EOF'
const http = require('node:http');
const { URL } = require('node:url');
const { createNote, getNote, listNotes } = require('./notes');

function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const ownerId = req.headers['x-owner-id'];

  if (req.method === 'POST' && url.pathname === '/notes') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const { body: noteBody } = JSON.parse(body || '{}');
        const note = createNote(ownerId, noteBody);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(note));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/notes') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(listNotes(ownerId)));
    return;
  }

  const noteMatch = url.pathname.match(/^\/notes\/([^/]+)$/);
  if (req.method === 'GET' && noteMatch) {
    const note = getNote(noteMatch[1], ownerId);
    if (!note) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(note));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}

const server = http.createServer(handleRequest);

if (require.main === module) {
  const port = process.env.PORT || 3000;
  server.listen(port, () => console.log(`Notes server listening on ${port}`));
}

module.exports = { server, handleRequest };
EOF

cat > test/notes.test.js <<'EOF'
const test = require('node:test');
const assert = require('node:assert/strict');
const { createNote, getNote, listNotes, _reset } = require('../src/notes');

test.beforeEach(() => _reset());

test('createNote creates a note owned by the given owner', () => {
  const note = createNote('owner-1', 'hello world');
  assert.equal(note.body, 'hello world');
  assert.equal(note.ownerId, 'owner-1');
});

test('getNote only returns the note to its owner', () => {
  const note = createNote('owner-1', 'secret');
  assert.equal(getNote(note.id, 'owner-1').body, 'secret');
  assert.equal(getNote(note.id, 'owner-2'), null);
});

test('listNotes only lists the calling owner\'s notes', () => {
  createNote('owner-1', 'a');
  createNote('owner-2', 'b');
  assert.equal(listNotes('owner-1').length, 1);
});
EOF

cat > README.md <<'EOF'
# Notes

A simple private note-taking service. Notes are only visible to their
owner today -- there is no sharing mechanism yet.

## Run

    npm start

## Test

    npm test
EOF

git add -A
git commit -q -m "Initial notes app: private create/get/list, with passing tests"

echo "Fixture created at $TARGET"
echo "Verifying the starter app's own tests pass..."
cd "$TARGET" && npm test
echo ""
echo "Founder ask to feed /wingman:plan:"
echo '  "Add a way to share a note via a link, so I can send someone a note'
echo '  without them needing an account. I also want us to think about'
echo '  whether these shared links should work for people who are not'
echo '  logged in at all -- that changes how public these notes end up'
echo '  being, and once people start sharing links around we cannot really'
echo '  take that back, so I want to get this one right the first time."'
