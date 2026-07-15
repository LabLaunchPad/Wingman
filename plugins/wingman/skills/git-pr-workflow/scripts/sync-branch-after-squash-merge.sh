#!/usr/bin/env bash
# Resyncs a local feature branch after its earlier PR was squash-merged, so new work can
# continue on top of current history instead of on stale, already-merged commits.
#
# Why this exists: a squash-merged PR collapses the feature branch's commits into one new
# commit on the base branch with a *different* SHA. A plain `git pull`/`git rebase` on the old
# branch either does nothing useful or produces a wall of spurious conflicts, because git has
# no way to know the squash commit and the original commits are "the same" content. The fix
# is mechanical: start a fresh branch from the current base, then cherry-pick only the commits
# made *after* the branch was last known to be fully merged (never re-cherry-pick anything that
# already landed).
#
# This is intentionally plain git + POSIX shell -- no language runtime, no dependency, so any
# coding agent with shell access (not just this one) can run it directly.
#
# Usage:
#   sync-branch-after-squash-merge.sh <branch> <base> <first-new-commit>[..<last-new-commit>]
#
#   <branch>            the feature branch to resync (e.g. feature/my-work)
#   <base>              the base branch it merges into (e.g. main)
#   <first-new-commit>  the oldest commit SHA on <branch> that is NOT yet in <base> --
#                        i.e. the first commit made after the last squash-merge.
#                        Pass a single SHA, or a "SHA1..SHA2" range (inclusive of SHA2,
#                        exclusive of SHA1, same as `git cherry-pick SHA1..SHA2`).
#
# What it does:
#   1. Fetches <base> fresh from origin.
#   2. Confirms <branch> is actually behind origin/<base> (if not, exits 0, nothing to do --
#      this is the common case for a fresh branch that was never squash-merged before).
#   3. Creates <branch> fresh from origin/<base>.
#   4. Cherry-picks the given commit(s) onto it.
#   5. Reports the exact force-push command to run -- it does NOT push for you. A
#      force-with-lease push rewrites shared history; the calling agent must run it
#      deliberately, in its own turn, after confirming the cherry-pick result looks right
#      (clean validator/test run) -- never as an unattended side effect of running this script.
#
# Exit codes: 0 = synced (or already up to date), 1 = usage error, 2 = cherry-pick conflict
# (left in progress for the calling agent to resolve -- never auto-aborted or force-resolved).

set -euo pipefail

if [[ $# -lt 3 ]]; then
  echo "Usage: $0 <branch> <base> <first-new-commit>[..<last-new-commit>]" >&2
  exit 1
fi

BRANCH="$1"
BASE="$2"
COMMIT_RANGE="$3"

git fetch origin "$BASE"

if git merge-base --is-ancestor "origin/$BASE" "$BRANCH" 2>/dev/null; then
  echo "Branch '$BRANCH' already contains all of origin/$BASE -- nothing to resync."
  exit 0
fi

echo "Branch '$BRANCH' is behind origin/$BASE (likely due to an earlier squash-merge) -- resyncing."

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
TEMP_BRANCH="${BRANCH}-resync-$$"

git branch "$TEMP_BRANCH" "origin/$BASE"
git checkout "$TEMP_BRANCH"

if ! git cherry-pick "$COMMIT_RANGE"; then
  echo "Cherry-pick hit a conflict. Resolve it manually on branch '$TEMP_BRANCH', then:" >&2
  echo "  git add <resolved files> && git cherry-pick --continue" >&2
  echo "Once clean, re-run this script's final steps yourself (rename + force-push) -- do not auto-resolve conflicts." >&2
  exit 2
fi

echo ""
echo "Cherry-pick succeeded. Before finishing, verify this project's own validators/tests pass on '$TEMP_BRANCH'."
echo "Once verified, finish the resync yourself:"
echo "  git checkout '$CURRENT_BRANCH' 2>/dev/null || true"
echo "  git branch -D '$BRANCH'"
echo "  git branch -M '$TEMP_BRANCH' '$BRANCH'"
echo "  git push --force-with-lease -u origin '$BRANCH'"
echo ""
echo "This script never force-pushes on its own -- that step is deliberate and yours."
