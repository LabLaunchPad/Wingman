#!/usr/bin/env bash
# Fixture for skills/anti-rationalization -- a meta-skill (no other eval
# exercises it directly). Its own description names the testable trigger
# used here: "auditing existing skills for completeness." This fixture is a
# tiny stand-in plugin project with ONE discipline skill file,
# "code-review-discipline/SKILL.md", written in Wingman's own skill format
# but MISSING the mandatory closing "Anti-Rationalization Defense" section
# every Wingman discipline skill must have (per anti-rationalization's own
# "How to Apply Per Skill Type"). Tests whether an agent given only the
# meta-skill correctly (a) notices the section is missing, and (b) writes a
# genuinely domain-specific table for THIS skill's domain (code review),
# rather than copy-pasting the meta-skill's own generic Universal
# Rationalizations Table verbatim -- the failure mode the meta-skill
# explicitly warns against ("must be domain-specific, not generic").
#
# Usage: evals/fixtures/setup-anti-rationalization-fixture.sh <target-dir>
# Wipes and recreates <target-dir> every run, so the eval starts clean.

set -euo pipefail

TARGET="${1:?Usage: setup-anti-rationalization-fixture.sh <target-dir>}"

rm -rf "$TARGET"
mkdir -p "$TARGET/skills/code-review-discipline"
cd "$TARGET"

git init -q

cat > README.md <<'EOF'
# stand-in-plugin

A tiny stand-in Claude Code plugin used only to test whether an audit
correctly completes a discipline skill that's missing its required
closing section. Not a real plugin.
EOF

cat > skills/code-review-discipline/SKILL.md <<'EOF'
---
name: code-review-discipline
description: Use before approving any pull request or diff review. Requires reviewing the actual diff, not just the PR description, and requires running the test suite locally before approving -- never approve from the description alone.
---

# Code Review Discipline

## Overview

A review that only reads the PR description and skims the file list is not
a review -- it's a rubber stamp. This skill governs what a real review
requires before approval.

## The Iron Law

```
NO APPROVAL WITHOUT READING THE ACTUAL DIFF AND RUNNING THE TESTS LOCALLY
```

## Requirements

1. **Read the actual diff line by line** -- not the PR description, not the
   commit message, not a summary. The description tells you what the author
   *believes* they did; the diff tells you what they *actually* did.
2. **Run the test suite locally** -- a green CI badge on GitHub is not the
   same as having run it yourself against the merged result. CI can be
   stale, flaky, or skipped on a rebase.
3. **Check for scope creep** -- does the diff touch files the description
   never mentions? That's either an undisclosed change or a sign the PR
   should be split.
4. **Verify claimed test coverage is real** -- if the description says "added
   tests for X," open the actual test file and confirm it does test X, not
   just that a file with "test" in the name exists.

## Red Flags -- Stop and Reconsider

- You're about to approve based on the PR description alone.
- You're about to approve because CI shows green, without running it yourself.
- You notice files changed that the description never mentioned, and you're
  about to let it slide.
- You're skimming instead of reading the diff line by line.

## Quick Reference

| Step | What it catches |
|---|---|
| Read the diff | Undisclosed changes, sloppy code, missed edge cases |
| Run tests locally | Stale/flaky CI, "works on my machine" |
| Check scope | Bundled unrelated changes, accidental file inclusion |
| Verify test coverage | Tests that exist but don't test the claimed thing |
EOF

git add -A
git commit -q -m "Initial fixture: code-review-discipline skill missing its required closing section"

echo "Fixture created at $TARGET"
echo "skills/code-review-discipline/SKILL.md deliberately has NO closing"
echo "'Anti-Rationalization Defense' section (Common Rationalizations table +"
echo "Red Flags + Anti-Pattern Callouts) -- every real Wingman discipline"
echo "skill has one. Tests whether an audit against anti-rationalization's"
echo "own meta-skill notices the gap and fills it with genuinely"
echo "code-review-specific content, not a verbatim copy of the meta-skill's"
echo "own Universal Rationalizations Table."
