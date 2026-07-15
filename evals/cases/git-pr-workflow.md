# Eval: git-pr-workflow

<!-- eval:no-fixture-needed: evidence comes from directly-constructed real git scenarios (bare repos, simulated squash-merges) built inline per run, not a dedicated setup-*.sh script -->

Tests `plugins/wingman/skills/git-pr-workflow/SKILL.md` and its 3 bundled scripts — does the
squash-merge branch resync correctly detect and fix a stale branch, does the CI-poll script
correctly distinguish pass/fail/pending/no-checks/timeout, and does the PR-opening script
correctly check a repo's own PR template and create a draft?

## What makes this different from a normal behavioral eval case

This skill's actual correctness lives in its 3 bundled shell scripts (`scripts/*.sh`), not in an
agent's judgment call — the scripts are deterministic, git/gh-CLI-driven logic, directly testable
without a subagent dispatch. This case documents that direct testing (already performed while
building the skill, not a separate later pass) plus what a fresh subagent's judgment-call usage of
the skill (when to invoke which script, how to react to their exit codes) still needs to prove.

## Direct script tests (already performed, not simulated)

**`sync-branch-after-squash-merge.sh`**: built a real bare-repo + clone, created a feature branch
with 2 commits, simulated a squash-merge onto `main` (`git merge --squash` + a new commit — this
produces the exact "different SHA, same content" situation a real GitHub squash-merge produces),
then added one further unmerged commit on the feature branch. Ran the script:
- Correctly detected the behind-state and resynced, producing a branch whose file content was
  exactly right (all of the squashed content plus the one genuinely new commit).
- Correctly no-op'd (exit 0, "nothing to resync") when re-run against an already-synced branch.
- Never force-pushed anything itself — only printed the exact commands to finish with.

**`watch-pr-until-green.sh`**: tested against a mock `gh` binary (this sandbox has no real `gh`
CLI) covering 5 scenarios: all-pass (exit 0), one-check-failed (exit 2), pending-then-pass (exit 0
after one more poll), no-checks-reported (exit 0, treated as nothing to block on), and
still-pending-at-timeout (exit 3). All 5 produced the documented exit code and message.

**`open-pr-with-template.sh`**: tested against a real PR template fixture (3 headings) with two
bodies — one missing a section (correctly warned, one line per missing heading) and one covering
all headings except the deliberately-omitted one (correctly warned only for that one, silent for
the rest). Confirmed the check is a substring match, not a strict heading parse (documented in the
script itself as a real, disclosed limitation, not implied to be more precise than it is).

## What's NOT yet verified

- **A real `gh` CLI binary was never available to test against.** The polling script's parsing of
  `gh pr checks`'s plain-text output (not a `--json`/`--jq` flag, deliberately, since that flag's
  exact support couldn't be verified either) is based on `gh`'s long-documented pass/fail/pending
  status vocabulary, not a live run. Re-verify against a real `gh pr checks` call in an environment
  that has the binary before fully trusting the parsing.
- **A genuine merge-conflict during a branch resync** — Run 1 (below) didn't produce one (the
  cherry-pick applied cleanly); the script's conflict path (exit 2, leaves it for the calling agent
  rather than auto-resolving) is implemented but still only unit-reasoned-through, not exercised by
  a real conflicting scenario.

## Trust level

`provisional` (2026-07-15) — a real, un-briefed subagent dispatch (Run 1, below) correctly
diagnosed and resolved a genuine squash-merge situation using only the skill's own documentation,
finding and helping fix one real bug in the process. Promote to `verified` after a second,
differently-shaped run — specifically one that produces a genuine cherry-pick conflict during the
resync, which Run 1 didn't exercise.

## Run log

### Run 1 — 2026-07-15 (real squash-merge-during-ship scenario, un-briefed)

A fresh subagent was given only `commands/ship.md` and this skill's `SKILL.md` — not told which
script to use — and asked simply to ship an already-finished, already-tested change
(`countWidgets` + its test) on a branch whose earlier version had already been squash-merged into
`main` via a stale, never-deleted remote branch ref. It correctly diagnosed the situation from
`git log --graph --all` (not from a rejected push — the push actually *succeeded*, since the stale
ref made it trivially fast-forward, a real gap in the skill's originally-documented trigger
condition, now fixed), used `sync-branch-after-squash-merge.sh` correctly, verified tests passed on
the resynced branch before finishing, and completed the force-with-lease push cleanly. Final state
independently verified: `git merge-base --is-ancestor main feature/widget-count` confirmed real
ancestry, `npm test` 2/2 passing, `git log --oneline` showing exactly the squashed content plus the
one genuinely new commit, nothing lost or duplicated.

**One real bug found and fixed as a direct result of this run**: the script's printed finishing
instructions assumed the calling agent started resync from some branch other than the one being
resynced — a checkout-then-delete sequence that fails with "used by worktree" when you're sitting
on the exact stale branch (the single most common real starting point, as this run itself proved).
Fixed by removing the unnecessary checkout step entirely (the script already leaves you on the temp
branch after cherry-picking, so deleting the old branch never actually requires checking out
anything first) — re-tested against the identical "sitting on the stale branch" scenario after the
fix, confirmed clean both times (once via direct script testing, once implicitly re-confirmed by
the logic the subagent had already exercised).
