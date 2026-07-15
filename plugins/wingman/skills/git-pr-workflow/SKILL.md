---
name: git-pr-workflow
description: Use when opening a pull request, waiting for CI to finish, or resuming work on a branch whose earlier PR was squash-merged — teaches the git/gh-CLI procedures for draft-first PR creation, polling checks to green, and resyncing a stale branch after a squash-merge, plus the bundled scripts that implement them. Triggers whenever /wingman:ship is about to push and open a PR, or whenever a branch's `git push` is unexpectedly rejected as non-fast-forward after an earlier PR of the same name merged.
---

# Git/PR Workflow

## Overview

Shipping a change is more than one `git push` — a real PR workflow has to survive CI taking
minutes to report, a squash-merge rewriting the branch's history out from under the next round of
work, and a founder who never wants to manually watch check marks turn green. This skill teaches
the procedure and bundles the exact scripts that implement it, built from real friction hit
directly by this project's own development (see Verification): a squash-merged branch's next
`git push` failing as non-fast-forward, twice, and having to hand-derive the fetch/cherry-pick/
force-push sequence each time rather than running something that already existed.

**Core principle:** the actual mechanics here are `git` and the `gh` CLI — two tools nearly every
coding agent environment has, not something specific to this one. This skill (and the scripts it
bundles) is written so any coding agent with shell access can use it, not just this one.

## Agent-agnostic by design (read this before using GitHub-specific tools instead)

This skill deliberately routes everything through `git` + the `gh` CLI instead of any
platform-specific tool-calling interface (an MCP GitHub server, a built-in "create PR" tool, a
webhook subscription), because those interfaces vary by which coding agent and environment is
running this — `git`/`gh` do not. If this session happens to have a richer GitHub integration
available (e.g. an MCP server, or a real-time PR-activity subscription), prefer using it directly
for one-off reads (checking PR status once, posting a single comment) since it's often more
convenient — but the **procedures and scripts below are the fallback that always works**, and are
what a founder's own project should rely on if it's ever operated by a different coding agent, a
CI bot, or a plain terminal session with no special integration at all. Do not assume a richer
integration is available; check `command -v gh` first.

**What genuinely can't be made agnostic**: a live push notification the instant a CI check
changes state (this session's own PR-activity subscription mechanism) is a feature of *this*
coding agent's environment, not of git/GitHub itself — no shell script can replicate a push
notification. `watch-pr-until-green.sh` (below) is the honest, portable substitute: it polls
instead of being pushed to, which is slightly less immediate but works identically everywhere.

## When To Use

- `/wingman:ship`'s "Push and open the change for review" step (see `commands/ship.md`).
- Any time a `git push` to a branch is rejected as non-fast-forward and that branch previously had
  a PR merged — the near-universal cause is a squash-merge (see Rationalizations).
- Any time a founder or another agent asks "is the PR ready yet" / "watch until CI passes."

## Core Workflow

**1. Opening a PR — draft first, always.** Run `scripts/open-pr-with-template.sh "<title>"
<body-file> [--base <branch>]` (omit `--ready`; draft is the default). Write the PR body to a real
file first, not as an inline shell argument — this avoids quoting breakage on a real multi-section
description with code blocks. The script checks this repo's own PR template (if one exists) against
the body and warns (not blocks) on sections that look missing. A draft PR still runs full CI, so
this costs nothing and catches breakage before anyone's asked to look.

**2. Waiting for checks — poll, don't guess.** Run `scripts/watch-pr-until-green.sh <pr-number>`
after pushing. It polls at a coarse interval (default 30s) until every check completes, and reports
exactly which check(s) failed if any did — never treat a still-pending check as a pass, and never
re-run this in a tight loop (see Constraints).

**3. Only after checks are green, mark it ready for review** (if it was opened as a draft) — via
whatever mechanism this session has available (a platform tool, or `gh pr ready <number>`).

**4. If a `git push` to a branch is rejected as non-fast-forward and that branch previously had a
merged PR**, don't fight it with `--force` blindly — this is very likely a squash-merge: the
earlier PR's commits were collapsed into one new commit on the base branch with a different SHA,
so the old branch's history and the base's history no longer share commits at the tip, even though
their *content* is identical up to that point. Run
`scripts/sync-branch-after-squash-merge.sh <branch> <base> <first-new-commit-sha>` — it fetches the
base fresh, confirms this really is the squash-merge situation (exits cleanly if not), starts a
fresh branch from the base, and cherry-picks only the genuinely new commit(s) onto it. It prints
the exact rename + `force-with-lease` push commands to finish with — **it never force-pushes on
its own**; run this project's own validators/tests against the resynced branch first, then finish
the steps it prints yourself.

## Constraints

**MUST:**
- Open every PR as a draft by default; only mark ready-for-review after checks are green.
- Poll for CI status at a coarse interval (30s+) — never a tight loop.
- Confirm a rejected push is really a squash-merge situation (the sync script does this itself)
  before resyncing — don't assume every non-fast-forward rejection has the same cause.
- Verify a resynced branch's own validators/tests pass before finishing the force-push steps.

**MUST NOT:**
- `git push --force` (not `--force-with-lease`) onto a shared branch, ever — `--force-with-lease`
  fails safe if someone else pushed in the meantime; a bare `--force` doesn't.
- Treat a still-pending check as a pass to unblock faster.
- Auto-resolve a cherry-pick conflict during a branch resync — leave it for the calling agent.
- Assume a richer platform-specific tool is available without checking (`command -v gh`) first.

## Rationalizations

| Excuse | Reality |
|---|---|
| "The push failed, I'll just `--force` it" | A bare force-push can silently discard someone else's real work if the remote moved for a reason other than the squash-merge you're assuming. Diagnose first (is this really a squash-merge?), then use `--force-with-lease`, which fails safe if your assumption is wrong. |
| "CI usually passes, I'll mark it ready now and check later" | A draft that's already marked ready-for-review invites review attention before you actually know it's green — the whole point of draft-first is that nobody has to look until it is. |
| "I'll just poll every 2 seconds so I find out the instant it's done" | Wastes API rate-limit budget for no real gain — CI runs take minutes, not seconds; a 30s interval notices "done" just as usefully. |
| "This platform's built-in tool is probably fine, I don't need the portable script" | It might be fine *here* — but if this exact procedure needs to work for a founder's own project regardless of which coding agent operates it later, the portable script is the one guaranteed to still work. |

## Red Flags — Stop and Reconsider

- About to run `git push --force` (not `--force-with-lease`) on a branch that isn't purely your
  own throwaway work.
- About to mark a draft PR ready-for-review before its checks have actually finished.
- About to auto-resolve a cherry-pick conflict during a branch resync rather than surfacing it.
- Polling CI status in a loop faster than roughly once every 15-30 seconds.
- About to hand-derive the squash-merge resync sequence again instead of running the script.

## Verification

- `scripts/sync-branch-after-squash-merge.sh` was directly tested against a real simulated
  squash-merge scenario (a bare-repo clone, a feature branch, a `git merge --squash` onto main,
  then a further unmerged commit on the feature branch) — confirmed it correctly detects the
  behind-state, cherry-picks only the genuinely new commit, produces the exact right final file
  content, and correctly no-ops (exit 0, "nothing to resync") when the branch is already
  up to date. This exact failure mode was hit for real twice in this project's own development
  history (`docs/wingman/retros.md`) before this script existed.
- `scripts/watch-pr-until-green.sh` was tested against a mock `gh` binary covering all-pass,
  one-failed, pending-then-pass, no-checks-reported, and timeout-while-pending scenarios — all
  five produced the documented exit code and message. **Not yet verified against a real `gh` CLI
  binary** (unavailable in the environment this skill was authored in) — re-verify against a live
  `gh pr checks` call before fully trusting its output-parsing in an environment that has one.
- `scripts/open-pr-with-template.sh`'s template-heading-check was tested against a real PR template
  fixture with a body missing one section (correctly warned) and a body covering all of them
  (correctly silent) — confirmed it's a substring match, not a strict heading parse (documented in
  the script itself, not hidden).

## Output

No founder-facing template of its own — `commands/ship.md`'s existing plain-language report covers
what the founder sees. This skill's own output is whatever the scripts print (PR URLs, check
status, resync instructions), consumed by the calling command/session, not shown to the founder
directly.

## Anti-Rationalization Defense

### Common Rationalizations

| Excuse | Reality |
|---|---|
| "The push failed, I'll just `--force` it" | See Rationalizations above — diagnose the actual cause first. |
| "It's probably fine to skip the draft step this once" | Draft-first costs nothing (CI still runs) and catches breakage before review attention is spent — skipping it has no upside. |
| "I don't have `gh` here but I have some other GitHub tool, close enough" | Use it for one-off reads if it's genuinely faster, but don't skip understanding *why* the portable scripts exist — the next environment might not have that other tool. |

### Red Flags

- A bare `git push --force` about to run on shared history.
- A cherry-pick conflict about to be resolved by discarding one side without looking at it.
- CI being polled faster than the scripts' own default interval without a stated reason.

### Anti-Pattern Callouts

- **Force-push-first reflex**: reaching for `--force` before diagnosing why a push was rejected —
  the single most likely way to silently destroy real work on a shared branch.
- **Skipping the draft stage**: opening a PR ready-for-review by default, inviting review attention
  before CI has actually run once.
