#!/usr/bin/env bash
# Opens a pull request as a draft, using this repo's own PR template if one exists, rather
# than an agent inventing its own format on every project. Portable: `gh` CLI + shell only.
#
# Usage:
#   open-pr-with-template.sh <title> <body-file> [--base <branch>] [--ready]
#
#   <title>      PR title
#   <body-file>  path to a file containing the PR body -- pass the description as a *file*,
#                not a shell argument, so multi-line/quote-heavy content (a real test plan,
#                code blocks) never fights shell quoting. If this repo has a PR template
#                (.github/pull_request_template.md, .github/PULL_REQUEST_TEMPLATE/*.md, a
#                root PULL_REQUEST_TEMPLATE.md, or docs/PULL_REQUEST_TEMPLATE.md) found and not
#                overridden by --no-template, its section headings are checked against
#                <body-file> and any missing ones are reported as a warning (not a hard block --
#                the calling agent decides whether to fill them in first).
#   --base       target branch (defaults to the repo's default branch via `gh`)
#   --ready      create as ready-for-review immediately instead of draft (default: draft --
#                draft-first is the safer default so CI runs once before anyone's asked to look)
#   --no-template  skip the template-presence check entirely
#
# Note on the template check: it's a simple case-insensitive substring match of each template
# heading's text against the whole body file, not a strict "is this its own heading" parse -- a
# body that mentions a section's words in unrelated prose (e.g. "no test plan was needed") will
# read as covering a "Test plan" heading even though it isn't a real section. This is a
# deliberately cheap, good-enough nudge, not an authoritative check -- read the warnings, don't
# just trust their absence.
#
# Exit codes: 0 = PR created, 1 = usage error, 2 = `gh` not found or not authenticated.
#
# Prints the created PR's URL on success (and nothing else on stdout), so a calling script can
# capture it directly: PR_URL=$(open-pr-with-template.sh "title" body.md)

set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <title> <body-file> [--base <branch>] [--ready] [--no-template]" >&2
  exit 1
fi

TITLE="$1"
BODY_FILE="$2"
shift 2

BASE_ARGS=()
DRAFT_ARGS=(--draft)
CHECK_TEMPLATE=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base) BASE_ARGS=(--base "$2"); shift 2 ;;
    --ready) DRAFT_ARGS=(); shift ;;
    --no-template) CHECK_TEMPLATE=0; shift ;;
    *) echo "Unknown argument: $1" >&2; exit 1 ;;
  esac
done

if [[ ! -f "$BODY_FILE" ]]; then
  echo "Body file not found: $BODY_FILE" >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI not found -- this script needs it (https://cli.github.com)." >&2
  exit 2
fi

if [[ $CHECK_TEMPLATE -eq 1 ]]; then
  TEMPLATE=""
  for candidate in \
    ".github/pull_request_template.md" \
    ".github/PULL_REQUEST_TEMPLATE.md" \
    "PULL_REQUEST_TEMPLATE.md" \
    "docs/PULL_REQUEST_TEMPLATE.md"; do
    if [[ -f "$candidate" ]]; then TEMPLATE="$candidate"; break; fi
  done
  if [[ -z "$TEMPLATE" && -d ".github/PULL_REQUEST_TEMPLATE" ]]; then
    TEMPLATE="$(find .github/PULL_REQUEST_TEMPLATE -maxdepth 1 -name '*.md' | head -1)"
  fi

  if [[ -n "$TEMPLATE" ]]; then
    echo "Found PR template: $TEMPLATE -- checking its section headings against $BODY_FILE" >&2
    while IFS= read -r heading; do
      HEADING_TEXT="$(echo "$heading" | sed -E 's/^#+\s*//')"
      if ! grep -qiF "$HEADING_TEXT" "$BODY_FILE"; then
        echo "  warning: template section \"$HEADING_TEXT\" not found in the PR body -- confirm this is intentional, not an omission" >&2
      fi
    done < <(grep -E '^#{1,3}\s' "$TEMPLATE" || true)
  fi
fi

PR_URL="$(gh pr create --title "$TITLE" --body-file "$BODY_FILE" "${BASE_ARGS[@]}" "${DRAFT_ARGS[@]}")"
echo "$PR_URL"
