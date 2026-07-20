#!/usr/bin/env bash
# Positive-case fixture for evals/cases/over-engineering-review.md: a small
# Node.js project with the 5 documented over-engineering patterns planted --
# a class that could be a regex, a heavy import for one call, an abstract
# base with one implementation, a retry wrapper around an idempotent local
# call, and a manual loop that could be a stdlib one-liner.
#
# Usage: evals/fixtures/setup-over-engineering-review-fixture.sh <target-dir>
# Wipes and recreates <target-dir> every run.

set -euo pipefail

TARGET="${1:?Usage: setup-over-engineering-review-fixture.sh <target-dir>}"

rm -rf "$TARGET"
mkdir -p "$TARGET/src"
cd "$TARGET"

git init -q

cat > package.json <<'EOF'
{
  "name": "overbuilt-app",
  "version": "0.1.0",
  "private": true,
  "dependencies": { "moment": "^2.30.1" }
}
EOF

cat > src/EmailValidator.js <<'EOF'
// 27-line class that could be a 1-line regex check.
class EmailValidator {
  constructor() {
    this.pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  }

  validate(email) {
    if (!email) return false;
    if (typeof email !== 'string') return false;
    if (email.length === 0) return false;
    if (email.length > 254) return false;
    return this.pattern.test(email);
  }

  isValid(email) {
    return this.validate(email);
  }

  getErrors(email) {
    const errors = [];
    if (!this.validate(email)) errors.push('Invalid email format');
    return errors;
  }
}

module.exports = EmailValidator;
EOF

cat > src/formatDate.js <<'EOF'
const moment = require('moment');
// moment.js imported for a single format call.
function formatDate(date) {
  return moment(date).format('YYYY-MM-DD');
}
module.exports = formatDate;
EOF

cat > src/AbstractRepository.js <<'EOF'
// Abstract base class with exactly one real implementation.
class AbstractRepository {
  find(id) { throw new Error('not implemented'); }
  save(entity) { throw new Error('not implemented'); }
}

class UserRepository extends AbstractRepository {
  find(id) { return { id, name: 'placeholder' }; }
  save(entity) { return entity; }
}

module.exports = { AbstractRepository, UserRepository };
EOF

cat > src/retryWrapper.js <<'EOF'
// Retry wrapper around a purely local, idempotent, always-succeeding call.
function withRetry(fn, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    try { return fn(); } catch (e) { if (i === attempts - 1) throw e; }
  }
}

function addOne(n) { return n + 1; } // local, pure, cannot fail

function run(n) { return withRetry(() => addOne(n)); }
module.exports = run;
EOF

cat > src/buildDict.js <<'EOF'
// Manual loop that builds a dict from two parallel arrays -- could be
// Object.fromEntries(keys.map((k, i) => [k, values[i]])).
function buildDict(keys, values) {
  const dict = {};
  for (let i = 0; i < keys.length; i++) {
    dict[keys[i]] = values[i];
  }
  return dict;
}
module.exports = buildDict;
EOF

git add -A
git commit -q -m "Initial fixture: overbuilt-app with 5 planted over-engineering patterns"

echo "Fixture ready at $TARGET"
