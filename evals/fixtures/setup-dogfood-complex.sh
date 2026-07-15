#!/usr/bin/env bash
# Fixture for /wingman:dogfood's maintainer-mode "complex path" -- a
# project seeded with deliberate conditional signals (Design, Data,
# Legal/Security, DevOps -- 4 of the 5 conditionally-activated
# departments) chosen to cross management-board-activation's
# conditional-department threshold (3+) cleanly.
#
# Deliberately reuses setup-fetch-app.sh rather than duplicating it --
# that fixture already has exactly the signal mix this path needs
# (Next.js frontend, Prisma schema+migrations, auth+Stripe billing,
# Dockerfile+CI), and this project's own engineering-minimalism
# discipline argues against a near-duplicate fixture existing solely
# for a different eval entry point.
#
# Usage: evals/fixtures/setup-dogfood-complex.sh <target-dir>
# Wipes and recreates <target-dir> every run.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:?Usage: setup-dogfood-complex.sh <target-dir>}"

"$SCRIPT_DIR/setup-fetch-app.sh" "$TARGET"

echo ""
echo "(dogfood-complex: this is setup-fetch-app.sh's fixture, reused as-is."
echo "Conditional-department count for this fixture: 4 (design, data, legal-security, devops)"
echo "-- above the corrected 3+ conditional threshold, so management-board-activation"
echo "is expected to fire once the project's active department leads reach it.)"
