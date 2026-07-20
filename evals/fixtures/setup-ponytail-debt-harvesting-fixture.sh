#!/usr/bin/env bash
# Positive-case fixture for evals/cases/ponytail-debt-harvesting.md: a small
# Node.js project with 3 deliberate `// minimal:` shortcuts (global lock,
# O(n^2) scan, naive heuristic) and no existing DEBT.md, so the harvest step
# has something real to create rather than update.
#
# Usage: evals/fixtures/setup-ponytail-debt-harvesting-fixture.sh <target-dir>
# Wipes and recreates <target-dir> every run.

set -euo pipefail

TARGET="${1:?Usage: setup-ponytail-debt-harvesting-fixture.sh <target-dir>}"

rm -rf "$TARGET"
mkdir -p "$TARGET/src"
cd "$TARGET"

git init -q

cat > package.json <<'EOF'
{ "name": "shortcut-app", "version": "0.1.0", "private": true }
EOF

cat > src/accountLock.js <<'EOF'
// minimal: global lock, per-account locks if throughput matters
let globalLock = false;
function withLock(fn) {
  while (globalLock) { /* spin */ }
  globalLock = true;
  try { return fn(); } finally { globalLock = false; }
}
module.exports = withLock;
EOF

cat > src/userScan.js <<'EOF'
// minimal: O(n²) scan, switch to index if >1000 users
function findDuplicates(users) {
  const dupes = [];
  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {
      if (users[i].email === users[j].email) dupes.push(users[i]);
    }
  }
  return dupes;
}
module.exports = findDuplicates;
EOF

cat > src/spamFilter.js <<'EOF'
// minimal: naive heuristic, replace with ML model if accuracy matters
function isSpam(message) {
  const spamWords = ['free', 'winner', 'click here'];
  return spamWords.some((w) => message.toLowerCase().includes(w));
}
module.exports = isSpam;
EOF

# No DEBT.md -- the harvest step should create one, not update an existing one.

git add -A
git commit -q -m "Initial fixture: shortcut-app with 3 // minimal: comments, no existing DEBT.md"

echo "Fixture ready at $TARGET"
