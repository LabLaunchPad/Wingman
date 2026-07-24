#!/usr/bin/env bash
# Visual Design System-stage eval fixture, NEGATIVE case: a real CLI tool
# with genuinely NO user-facing UI (no frontend, no web page, no screens
# of any kind) -- pre-seeded discovery/define/architecture artifacts, but
# deliberately NO uxflow/wireframes output, since a no-UI project skips
# those stages too. Tests whether visual-design-system.md correctly
# recognizes the no-UI signal and skips this stage entirely rather than
# inventing a design system (typography/color/component tokens) for a
# project that has no visual surface at all.
#
# Usage: evals/fixtures/setup-visual-design-system-nofui-fixture.sh <target-dir>

set -euo pipefail

TARGET="${1:?Usage: setup-visual-design-system-nofui-fixture.sh <target-dir>}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/setup-minimal-cli.sh" "$TARGET"

cd "$TARGET"

# Pre-seed discovery output
mkdir -p docs/wingman/discovery
cat > docs/wingman/discovery/linecount.md <<'EOF'
# Discovery: linecount

## Problem statement

Developers scripting text-processing pipelines need a fast, dependency-free
way to count non-empty lines in a file from the command line, without
pulling in a full text-processing toolkit for one operation.

## Target user

A developer or ops engineer running shell scripts or CI steps, invoking the
tool from a terminal or another script -- never a person interacting with a
graphical interface.

## Success signal

`linecount <file>` prints the correct non-empty line count and exits 0; a
missing argument prints usage to stderr and exits 1.

## Open questions

- Should it support reading from stdin as well as a file argument?
EOF

# Pre-seed define output
mkdir -p docs/wingman/define
cat > docs/wingman/define/linecount.md <<'EOF'
# Define: linecount

| ID | Requirement | Rationale |
|---|---|---|
| DEF-001 | `linecount <file>` prints the count of non-empty lines in `<file>` to stdout | Directly addresses the discovery success signal |
| DEF-002 | `linecount` with no argument prints a usage message to stderr and exits with a non-zero status | Prevents a silent/confusing failure when invoked incorrectly |

This is a pure command-line utility: there is no web page, no GUI, no API
consumed by a browser, and no other user-facing screen of any kind. All
interaction happens through argv/stdout/stderr in a terminal or script.
EOF

# Pre-seed architecture output
mkdir -p docs/wingman/architecture
cat > docs/wingman/architecture/linecount.md <<'EOF'
# Architecture: linecount

| ID | Decision | Satisfies |
|---|---|---|
| ARCH-001 | Read the file synchronously via `fs.readFileSync` and split/filter lines in `index.js` | DEF-001 |
| ARCH-002 | Validate `process.argv[2]` is present before reading; print usage and `process.exit(1)` if missing | DEF-002 |

No user-facing surface exists for this project -- `uxflow` and `wireframes`
were both skipped for the same reason `visual-design-system` should be:
there is no screen to design.
EOF

git add -A
git commit -q -m "Pre-seed discovery + define + architecture artifacts for visual-design-system no-UI negative eval (uxflow/wireframes deliberately absent)"

echo "Visual Design System NO-UI fixture ready at $TARGET (linecount CLI + discovery + define + architecture, no uxflow/wireframes, no .claude/agents/dept-design.md)"
