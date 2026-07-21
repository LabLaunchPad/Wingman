# Eval: telemetry

Tests `plugins/wingman/commands/adaptive/telemetry.md` — its light-touch production-observability check: reuse existing tooling, confirm errors/usage are visible and no sensitive data leaks, propose the smallest gap-closing addition, and never silently pick a vendor for the founder.

## Fixture

`evals/fixtures/setup-waitlist-app.sh <target-dir>` — a realistic Node/Express waitlist app with no telemetry wired up (so the "nothing exists yet" branch is the realistic shape to test).

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with `telemetry.md` and the fixture path — not told what to conclude. Ask it to check whether the shipped feature has a way to tell if it's working in production.
3. Independently verify: read the fixture's package.json / source for any telemetry it added or referenced, and confirm no secrets/PII are proposed for logging.

## Expectations

| Check | Expected |
|---|---|
| Checks what already exists before proposing anything | Yes |
| Confirms errors are visible (failures won't be silent) | Yes |
| Confirms usage is visible (signal it landed) | Yes |
| Flags sensitive-data leakage risk; never logs secrets/PII | Yes |
| Proposes the *smallest* addition using existing tooling, not a new dependency | Yes |
| Does NOT silently pick a vendor — surfaces the tradeoff and asks the founder when nothing exists | Yes |

## Trust level

`verified` — passed two differently-shaped scenarios, manually graded: Run 1 (nothing exists yet) and Run 2 (existing-but-insufficient telemetry, see below).

## Run log

### Pending — scheduled behavioral eval workflow

Graded via `.github/workflows/evals.yml` (requires `ANTHROPIC_API_KEY` + `/bin/bash`, unavailable in this authoring environment). Case defined to the verified-case format above; grade on next weekly run and record the actual result here.

### Run 2 — 2026-07-16 — existing-but-misleading telemetry, manually graded

Fixture (hand-built, not the `setup-waitlist-app.sh` script): a small Node/Express waitlist app with a *different* shape than Run 1 — this one already has Segment (`analytics-node`) wired up from 6 months ago for the marketing site, tracking a generic `page_view` event on every request via global middleware. The just-shipped feature under review, `POST /api/waitlist`, rides along on that middleware but gets no feature-specific telemetry: success and a swallowed 500 both look identical (a `page_view` hit) to Segment, and the failure path (`src/waitlist.js` throwing, caught in `src/server.js`) has no logging or error tracking at all. The existing analytics setup also has a latent PII leak — it pulls `email` straight from the query string into Segment properties. Fixture lives at `/tmp/.../scratchpad/eval-telemetry-run2/waitlist-app/` (scratch-only, not committed).

Spawned a fresh subagent scoped to only `commands/adaptive/telemetry.md` + the fixture path, not told the answer in advance, asked to report on whether the waitlist feature has a way to tell if it's working in production.

Result — subagent correctly:
- Identified the existing Segment tool first and did not propose a second/competing analytics tool.
- Did NOT credit the pre-existing `page_view` middleware as adequate coverage — correctly called out that it's a vanity metric for this feature (fires identically on success and on a swallowed error, doesn't distinguish signup from browsing).
- Correctly said errors are not visible (swallowed `catch` block, no logging, no error event).
- Flagged the pre-existing PII risk (email via query string into Segment) as a separate, worth-fixing issue, and proactively avoided repeating that mistake in its own proposed fix (explicitly excluded raw email from the new event).
- Proposed the smallest addition (two `analytics.track` calls plus a `console.error`, reusing the already-installed Segment client, zero new dependencies) with a plain-language "what you'll see afterward" explanation.

This is the negative case the trust-level bar called for: it confirms the command's discipline holds even when telemetry superficially "exists" — it surfaces the real gap (misleading vanity metric, silent errors, latent PII leak) rather than reporting confidently that the feature is covered. Combined with Run 1 (nothing exists yet → correctly asks the founder rather than picking a vendor), this covers two genuinely different edges of the same command.
