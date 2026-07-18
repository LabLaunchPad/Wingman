#!/usr/bin/env bash
# Discovery-stage eval fixture: a real working project that the discovery
# command will analyse.  Stage 1 (discovery) starts from a clean project
# with no Wingman output yet — the command's job is to understand the
# codebase and produce a discovery artifact.
#
# Usage: evals/fixtures/setup-discovery-fixture.sh <target-dir>

set -euo pipefail

TARGET="${1:?Usage: setup-discovery-fixture.sh <target-dir>}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/setup-waitlist-app.sh" "$TARGET"

cd "$TARGET"
echo "Discovery fixture ready at $TARGET (base waitlist app, no prior stage output)"
