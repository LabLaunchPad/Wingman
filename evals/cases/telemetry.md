# Eval: telemetry

Tests `plugins/wingman/commands/telemetry.md` — its light-touch production-observability check: reuse existing tooling, confirm errors/usage are visible and no sensitive data leaks, propose the smallest gap-closing addition, and never silently pick a vendor for the founder.

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

`provisional` — passed at least one real run (single scenario), manually graded. Promote to `verified` after a negative case on a fixture that already has telemetry, confirming it reuses rather than introduces a competing tool.

## Run log

### Pending — scheduled behavioral eval workflow

Graded via `.github/workflows/evals.yml` (requires `ANTHROPIC_API_KEY` + `/bin/bash`, unavailable in this authoring environment). Case defined to the verified-case format above; grade on next weekly run and record the actual result here.
