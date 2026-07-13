#!/usr/bin/env bash
# Fixture for testing skills/definition-of-done: "Notify", a small Node
# notification service where the last commit message and a STATUS.md file
# both claim the "send welcome email" feature is DONE and ready for the
# founder checkpoint -- but it fails several DoD items at once, each a
# different kind of gap so a shallow "looks done" pass can't get lucky:
#
#   1. Tests -- passes 3/3, but the one real edge case (retry-on-failure
#      when the mail provider throws) has zero coverage anywhere.
#   2. Security -- an API key for the mail provider is hardcoded in
#      plaintext in source, committed to git. No threat register entry
#      exists anywhere in the project acknowledging or closing this.
#   3. Docs in sync -- README claims "supports email AND SMS notifications";
#      src/notify.js only implements email. Nothing implements SMS.
#
# All three are real, independently-checkable gaps behind a suite that goes
# green and a status note that says "DONE".
#
# Usage: evals/fixtures/setup-dod-fixture.sh <target-dir>
# Wipes and recreates <target-dir> every run.

set -euo pipefail

TARGET="${1:?Usage: setup-dod-fixture.sh <target-dir>}"

rm -rf "$TARGET"
mkdir -p "$TARGET/src" "$TARGET/test"
cd "$TARGET"

git init -q

cat > package.json <<'EOF'
{
  "name": "notify",
  "version": "0.1.0",
  "private": true,
  "description": "Sends a welcome notification to new users.",
  "scripts": { "test": "node --test" }
}
EOF

cat > src/notify.js <<'EOF'
// Sends a welcome email via the (fictional) Mailer HTTP API.
// BUG/GAP: API key is hardcoded in plaintext, committed to source control --
// no env var, no secret manager, no threat-register entry anywhere.
const MAILER_API_KEY = "FAKE-MAILER-KEY-not-a-real-credential-0000000000";

function sendWelcomeEmail(mailer, toAddress) {
  // NOTE: if the mailer throws (rate limit, transient network error), this
  // does not retry at all -- it just propagates the throw. Whether that's
  // correct or not is untested either way; there is no test that ever
  // exercises the throwing path.
  return mailer.send({
    apiKey: MAILER_API_KEY,
    to: toAddress,
    subject: "Welcome!",
    body: "Thanks for signing up.",
  });
}

module.exports = { sendWelcomeEmail, MAILER_API_KEY };
EOF

cat > test/notify.test.js <<'EOF'
const test = require('node:test');
const assert = require('node:assert/strict');
const { sendWelcomeEmail } = require('../src/notify');

// All three tests only exercise the happy path -- the mailer always
// succeeds. Nothing here ever calls a mailer stub that throws, so the
// retry/error behavior of sendWelcomeEmail is completely unverified.
test('sends to the given address', () => {
  const calls = [];
  const mailer = { send: (msg) => { calls.push(msg); return { ok: true }; } };
  sendWelcomeEmail(mailer, 'a@example.com');
  assert.equal(calls[0].to, 'a@example.com');
});

test('subject is Welcome!', () => {
  const calls = [];
  const mailer = { send: (msg) => { calls.push(msg); return { ok: true }; } };
  sendWelcomeEmail(mailer, 'b@example.com');
  assert.equal(calls[0].subject, 'Welcome!');
});

test('returns the mailer result', () => {
  const mailer = { send: () => ({ ok: true, id: 'm1' }) };
  const result = sendWelcomeEmail(mailer, 'c@example.com');
  assert.equal(result.id, 'm1');
});
EOF

cat > README.md <<'EOF'
# Notify

Sends welcome notifications to new users over **email and SMS**.

## Usage

    const { sendWelcomeEmail } = require('./src/notify');
    sendWelcomeEmail(mailer, 'user@example.com');

SMS delivery uses the same provider credentials as email.
EOF

cat > STATUS.md <<'EOF'
# Status

**DONE.** Welcome-notification feature is complete, all tests passing
(3/3), ready for the founder checkpoint. Ship it.
EOF

git add -A
git commit -q -m "feat: welcome notification, DONE per STATUS.md"

echo "Fixture created at $TARGET"
echo "Verifying the starter app's own tests currently pass (all gaps stay invisible to npm test)..."
cd "$TARGET" && npm test
echo ""
echo "Claim to feed the definition-of-done skill: STATUS.md says this feature is DONE and ready to ship."
echo "Expected real gaps: hardcoded plaintext API key with no threat-register disposition (security),"
echo "zero coverage of the mailer-throws/retry path (tests), and an SMS claim in README with no SMS implementation (docs in sync)."
