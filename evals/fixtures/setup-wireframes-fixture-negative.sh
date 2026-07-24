#!/usr/bin/env bash
# Wireframes-stage eval fixture (negative case): a real working project
# with pre-seeded discovery, define, architecture, AND uxflow outputs --
# but this time a pure-API project with NO user-facing surface anywhere
# in the chain (no ARCH-* decision produces a screen, uxflow correctly
# skipped and minted no UX-* IDs). Tests whether wireframes.md's own
# "skipped entirely for projects with no user-facing surface, same as
# uxflow.md" clause actually holds, rather than manufacturing WF-*
# screens with nothing real to trace back to.
#
# Usage: evals/fixtures/setup-wireframes-fixture-negative.sh <target-dir>

set -euo pipefail

TARGET="${1:?Usage: setup-wireframes-fixture-negative.sh <target-dir>}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/setup-waitlist-app.sh" "$TARGET"

cd "$TARGET"

# Pre-seed discovery output -- pure API problem, no user-facing framing.
mkdir -p docs/wingman/discovery
cat > docs/wingman/discovery/waitlist-export.md <<'EOF'
# Discovery: Waitlist CSV Export

## Problem statement

The founder currently has no way to pull the waitlist out of the app to
import it into their email tool. They ask a developer to run a script
by hand whenever they need the list, which doesn't scale.

## Target user

The founder themselves (an internal, API-only consumer), not the
waitlist signups.

## Success signal

The founder can call an authenticated endpoint and get the current
waitlist back as CSV, with no manual script-running required.

## Open questions

- Should the export be paginated for very large waitlists?
- Should the export support a date-range filter?
EOF

# Pre-seed define output -- all requirements are API-shaped.
mkdir -p docs/wingman/define
cat > docs/wingman/define/waitlist-export.md <<'EOF'
# Define: Waitlist CSV Export

| ID | Requirement | Rationale |
|---|---|---|
| DEF-001 | An authenticated client can GET /waitlist/export.csv and receive the full waitlist as CSV | Directly addresses the discovery problem: no manual script-running |
| DEF-002 | The CSV includes email and joinedAt columns, one row per entry | Minimum data the founder needs to import into an email tool |
| DEF-003 | The endpoint requires a bearer token matching an admin secret | Prevents the waitlist (personal data) from being publicly scrapable |
EOF

# Pre-seed architecture output -- three backend-only decisions, no
# server-rendered page or any other user-facing surface anywhere.
mkdir -p docs/wingman/architecture
cat > docs/wingman/architecture/waitlist-export.md <<'EOF'
# Architecture: Waitlist CSV Export

| ID | Decision | Satisfies |
|---|---|---|
| ARCH-001 | Add `toCsv(entries)` to `src/waitlist.js`, a pure function producing the CSV string | DEF-001, DEF-002 |
| ARCH-002 | Add `GET /waitlist/export.csv` route in `src/server.js`, checking `Authorization: Bearer <token>` against `process.env.ADMIN_TOKEN` before calling `toCsv(listWaitlist())` | DEF-001, DEF-003 |
| ARCH-003 | Return 401 with a JSON error body (not a CSV) when the bearer token is missing or wrong | DEF-003 |
EOF

# Pre-seed uxflow output -- correctly skipped, no UX-* table minted,
# matching uxflow.md's own documented skip behavior for a project with
# no user-facing surface.
mkdir -p docs/wingman/uxflow
cat > docs/wingman/uxflow/waitlist-export.md <<'EOF'
# UX Flow: Waitlist CSV Export

This project has no user-facing surface -- all three Architecture
decisions (ARCH-001..003) are backend-only (a pure CSV-formatting
function and an authenticated API route). Skipping UX flow entirely;
no UX-* IDs minted.

## Go/no-go status

GO -- nothing for this stage to do, proceeding straight to
implementation-planning.
EOF

git add -A
git commit -q -m "Pre-seed discovery + define + architecture + uxflow (no-UI) artifacts for wireframes-negative eval"

echo "Wireframes negative fixture ready at $TARGET (base app + discovery + define + architecture + uxflow, 0 UX-* states, no user-facing surface)"
