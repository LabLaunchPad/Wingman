#!/usr/bin/env bash
# Polls a pull request's checks until they all finish, then reports pass/fail. A portable
# substitute for a real-time CI webhook subscription (which not every coding agent's
# environment has) -- any agent with the `gh` CLI and shell access can run this instead.
#
# Requires: `gh` CLI, authenticated (`gh auth status`).
#
# Usage:
#   watch-pr-until-green.sh <pr-number> [--repo <owner/name>] [--interval <seconds>] [--timeout <seconds>]
#
#   <pr-number>          the PR number to watch
#   --repo <owner/name>  defaults to the current directory's git remote
#   --interval <seconds> seconds between polls (default 30) -- keep this coarse; polling every
#                        few seconds wastes API calls and rate-limit budget for no real benefit,
#                        since CI runs take minutes, not seconds
#   --timeout <seconds>  give up and exit 3 after this many seconds of still-pending checks
#                        (default 1800 = 30 minutes) -- prevents an agent looping forever on a
#                        hung or misconfigured workflow
#
# Exit codes:
#   0 = all checks completed successfully (or no checks are configured on this PR at all)
#   1 = usage error, or `gh` isn't installed
#   2 = one or more checks completed with a failing status (their lines are printed)
#   3 = timed out while checks were still pending
#
# Deliberately parses `gh pr checks`'s plain per-line output (each line names a check and its
# status as one of the words pass/fail/pending/skipping) rather than a `--json`/`--jq` flag --
# this sandbox has no `gh` binary to verify that flag's exact behavior against, so this sticks to
# the plain-text form, which is `gh pr checks`'s long-standing default output and lower-risk to
# get right without a live binary to test against. Verify this script for real against a live
# `gh` CLI before fully trusting it in an environment that has one (see SKILL.md's Verification
# section) -- this is disclosed honestly, not asserted as already proven.
#
# This script only reads PR/check state -- it never merges, comments, or pushes anything.

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <pr-number> [--repo <owner/name>] [--interval <seconds>] [--timeout <seconds>]" >&2
  exit 1
fi

PR_NUMBER="$1"
shift
REPO_ARGS=()
INTERVAL=30
TIMEOUT=1800

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo) REPO_ARGS=(--repo "$2"); shift 2 ;;
    --interval) INTERVAL="$2"; shift 2 ;;
    --timeout) TIMEOUT="$2"; shift 2 ;;
    *) echo "Unknown argument: $1" >&2; exit 1 ;;
  esac
done

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI not found -- this script needs it (https://cli.github.com)." >&2
  exit 1
fi

ELAPSED=0
while true; do
  OUTPUT="$(gh pr checks "$PR_NUMBER" "${REPO_ARGS[@]}" 2>&1 || true)"

  if [[ -z "$(echo "$OUTPUT" | tr -d '[:space:]')" ]] || echo "$OUTPUT" | grep -qi "no checks reported\|no status checks"; then
    echo "No checks reported for PR #$PR_NUMBER -- treating as nothing to block on."
    exit 0
  fi

  FAILED_LINES="$(echo "$OUTPUT" | grep -iE $'\t''fail' || true)"
  PENDING_LINES="$(echo "$OUTPUT" | grep -iE $'\t''pending' || true)"

  if [[ -n "$FAILED_LINES" ]]; then
    echo "Check(s) failed for PR #$PR_NUMBER:"
    echo "$FAILED_LINES"
    exit 2
  fi

  if [[ -z "$PENDING_LINES" ]]; then
    echo "All checks passed for PR #$PR_NUMBER:"
    echo "$OUTPUT"
    exit 0
  fi

  echo "Still pending for PR #$PR_NUMBER:"
  echo "$PENDING_LINES"

  if [[ $ELAPSED -ge $TIMEOUT ]]; then
    echo "Timed out after ${TIMEOUT}s waiting for PR #$PR_NUMBER's checks to finish."
    exit 3
  fi

  sleep "$INTERVAL"
  ELAPSED=$((ELAPSED + INTERVAL))
done
