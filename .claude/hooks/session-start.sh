#!/bin/bash
set -euo pipefail

# Wingman has no root package.json — its "code" is markdown (commands,
# agents, skills) plus two Node-stdlib-only validator scripts. The one thing
# a fresh checkout needs is the vendor/ submodules: check-repo-consistency.mjs
# walks vendor/ for attribution coverage, and an uninitialized submodule dir
# is empty, which would make that check silently pass over nothing.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

echo '{"async": true, "asyncTimeout": 300000}'

cd "${CLAUDE_PROJECT_DIR:-$PWD}"
git submodule update --init --recursive
