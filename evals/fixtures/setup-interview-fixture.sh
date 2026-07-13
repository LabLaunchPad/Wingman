#!/usr/bin/env bash
# Fixture for skills/interview-one-question-at-a-time: "notify-me", a project
# with a deliberately vague, multi-ambiguity founder feature request. There is
# no single "right" fixture format for a conversational discipline skill (it
# governs how questions get asked, not a file to inspect afterward), so this
# fixture provides the request document that a subagent is asked to gather
# requirements against, plus a REVIEWER-NOTES.md describing how a human
# playing "the founder" should behave when queried during the eval run (used
# by the case's procedure, not read by the subagent under test).
#
# Usage: evals/fixtures/setup-interview-fixture.sh <target-dir>
set -euo pipefail
TARGET="${1:?Usage: setup-interview-fixture.sh <target-dir>}"
rm -rf "$TARGET"; mkdir -p "$TARGET"; cd "$TARGET"; git init -q

cat > REQUEST.md <<'EOF'
# Feature request: notifications

From the founder, dropped in as-is:

"We need a notifications feature. Users should get notified when something
happens. Let's make sure it works for everyone and ship it soon. I want it to
feel modern, like the apps I use every day."

No further detail was given. At least three real ambiguities are hiding in
here:
1. What events trigger a notification? ("something happens" is undefined.)
2. Delivery mechanism and latency requirement (push? email? in-app? real-time
   or a few minutes of delay acceptable?)
3. Scope of "everyone" (all users by default, or opt-in? logged-out users?)

There may be more once questioning starts (e.g. a timeline/budget constraint,
or a preference between competing implementation approaches).
EOF

cat > REVIEWER-NOTES.md <<'EOF'
# Notes for whoever plays "the founder" during this eval

This file is for the human/orchestrator running the eval case, not for the
subagent under test -- do not hand this file to the subagent.

When the subagent asks a question, answer briefly and specifically, one
answer per question, e.g.:
- "What triggers a notification?" -> "New comments on a user's post, and
  when someone follows them."
- "Push, email, or in-app?" -> "In-app for now; push later."
- "Real-time or is a short delay OK?" -> "A minute or two of delay is fine."
- "Everyone by default, or opt-in?" -> "Opt-in -- default off, users turn it
  on in settings."

If the subagent ever sends more than one question in the same message, that
is the failure mode this skill exists to prevent -- note it, but still answer
only the first question in your reply (do not let a bundled question get a
bundled answer).
EOF

git add -A
git commit -q -m "Initial fixture: vague notifications feature request"

echo "Fixture created at $TARGET"
echo "Expected: the request has at least 3 real ambiguities that must be"
echo "interviewed one at a time before implementation, per REQUEST.md."
