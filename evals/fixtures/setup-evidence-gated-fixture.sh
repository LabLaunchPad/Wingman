#!/usr/bin/env bash
# Fixture for skills/evidence-gated-catalog: a mini "catalog review" scenario
# with two competing proposed patterns in the same fixture, so a single run
# can check both the positive path (a genuinely evidenced pattern gets
# approved) and the negative path (an unevidenced pattern claiming "proven"
# status gets caught and demoted) without a second fixture.
#
# - proposal-unproven.md: claims status "proven" but has no real test case,
#   a straw-man negative test, and a vague, unmeasurable outcome -- it should
#   fail all three gates and be sent back to draft.
# - proposal-with-evidence.md: a genuinely complete entry with a specific,
#   reproducible real-world test case, a realistic negative test, and a
#   measurable before/after outcome -- it should pass and be promotable.
#
# Usage: evals/fixtures/setup-evidence-gated-fixture.sh <target-dir>
set -euo pipefail
TARGET="${1:?Usage: setup-evidence-gated-fixture.sh <target-dir>}"
rm -rf "$TARGET"; mkdir -p "$TARGET/proposals"; cd "$TARGET"; git init -q

cat > proposals/proposal-unproven.md <<'EOF'
---
name: batch-retry-with-backoff
description: Retry failed batch jobs with exponential backoff.
status: proven
---

# Batch Retry With Backoff

## Purpose
Reduce transient batch-job failures by retrying with backoff.

## When to Use
Whenever a batch job might fail transiently.

## When NOT to Use
When failures are not transient.

## Evidence

### Test Case 1
- Problem: batch jobs sometimes fail.
- Pattern applied: added retry with backoff.
- Result: it clearly works, I've seen it work many times in other projects.

### Negative Test 1
- Scenario: someone tries to use this for a completely unrelated thing.
- Why it fails: it's obviously not for that.

### Measurable Outcome
- Metric: things are more reliable now.
- Baseline: not great.
- After: better.
- Confidence: pretty confident, this is common sense.
EOF

cat > proposals/proposal-with-evidence.md <<'EOF'
---
name: idempotency-key-on-webhook-handler
description: Require an idempotency key on webhook handlers to prevent duplicate side effects from provider retries.
status: draft
---

# Idempotency Key On Webhook Handler

## Purpose
Prevent duplicate side effects (e.g. double-charging, double-emailing) when
a webhook provider retries delivery of the same event.

## When to Use
Any webhook handler that causes a side effect (charge, email, state change)
where the provider is known to retry on timeout/5xx.

## When NOT to Use
Read-only webhook handlers that only log/display an event and cause no side
effect -- adding idempotency-key storage there is pure overhead with nothing
to protect against.

## Evidence

### Test Case 1
- Problem: `stripe-webhook-handler` project's `/webhooks/stripe` endpoint
  processed a `charge.succeeded` event twice (Stripe retried after a 3s
  timeout on the first response) and sent the customer two receipt emails
  for one charge, on 2026-06-02.
- Pattern applied: added an `event_id` idempotency table; handler checks
  `event_id` before processing, no-ops if already seen, all within one
  transaction.
- Result: replaying the exact same webhook payload against the fixed handler
  a second time produced zero additional emails and zero additional DB rows
  -- verified by re-POSTing the captured payload twice and diffing the
  `emails_sent` table row count (1 before, 1 after both POSTs).

### Negative Test 1
- Scenario: a webhook handler that only appends the raw event to an audit
  log table for later manual review, with no other side effect.
- Why it fails: an audit log insert is naturally idempotent-safe to append
  duplicates to (dedup can happen at read time), so the added idempotency
  table is unnecessary complexity for zero benefit in that case.

### Measurable Outcome
- Metric: duplicate customer-facing side effects (emails sent) per 1,000
  webhook deliveries.
- Baseline: 3 duplicate emails per 1,000 deliveries (measured over one week
  pre-fix, from provider retry logs).
- After: 0 duplicate emails per 1,000 deliveries over the following week
  (same provider retry rate, confirmed via logs).
- Confidence: single project, one week each side -- one data point.
EOF

git add -A
git commit -q -m "Two competing catalog proposals: one unevidenced, one evidenced"

echo "Fixture created at $TARGET"
echo "proposal-unproven.md should fail all 3 gates (no real test case, straw-man"
echo "negative, unmeasurable outcome) and be returned to draft despite claiming"
echo "status: proven."
echo "proposal-with-evidence.md should pass all 3 gates and be promotable."
