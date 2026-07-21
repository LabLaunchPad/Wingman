# Eval: git-pr-workflow

<!-- eval:no-fixture-needed: evidence comes from directly-constructed real git scenarios (bare repos, simulated squash-merges) built inline per run, not a dedicated setup-*.sh script -->

Tests `plugins/wingman/skills/mechanics/git-pr-workflow/SKILL.md` and its 3 bundled scripts — does the
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

`verified` (2026-07-15) — Run 1 already covered a real, un-briefed subagent dispatch that
correctly diagnosed and resolved a genuine squash-merge situation (finding and fixing one real
bug in the process). Run 2 (below) closes the one gap explicitly called out as remaining: a
genuine cherry-pick conflict during the resync, built from a real, resolvable git history rather
than reasoned through in the abstract. The script surfaced the conflict correctly (exit 2, no
auto-resolution, no destructive push) and the documented finishing steps worked cleanly once a
human resolved it, with independent ancestry/content verification confirming the final state was
correct. Both of the two previously-open gaps against this skill's bundled scripts are now closed
except the still-standing "no real `gh` binary available" caveat for `watch-pr-until-green.sh`,
which remains an honest, disclosed limitation (see "What's NOT yet verified") rather than a blocker
to promotion — the script's other 5 scenarios were already directly exercised against a mock `gh`,
and this run's target was specifically the sync script's conflict path, the thinner of the two.

## Run log

### Run 1 — 2026-07-15 (real squash-merge-during-ship scenario, un-briefed)

A fresh subagent was given only `commands/pipeline/ship.md` and this skill's `SKILL.md` — not told which
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

### Run 2 — 2026-07-15 (real, resolvable cherry-pick conflict during resync)

Built a real local fixture (bare `origin.git` + a working clone) under
`/tmp/.../eval-git-pr-workflow-run2/work`, all real git commands, no simulated output:

- `main` at one initial commit (`shared.txt` with `line1/line2/line3`).
- `feature/conflict-demo` branched off, with two real commits: commit A changes `line2`, commit B
  (deliberately left un-merged) appends a `line4` whose patch context includes the unmodified
  `line3` line.
- Simulated the squash-merge of *only* commit A onto `main` (`git merge --squash <commit-A-sha>`,
  producing a new SHA, exactly what a real GitHub squash-merge does) — but, to force a genuine
  conflict rather than a clean cherry-pick like Run 1's fixture, the same squash commit also edited
  `line3` (representing a reviewer tweak folded into the same squash-merge), and this was pushed to
  `origin/main`.
- The local `feature/conflict-demo` branch still only knows about commits A and B and has no idea
  `line3` changed on `main`.

Ran the real script: `sync-branch-after-squash-merge.sh feature/conflict-demo main <commit-B-sha>`.
Actual output:

```
Branch 'feature/conflict-demo' is behind origin/main (likely due to an earlier squash-merge) -- resyncing.
Switched to branch 'feature/conflict-demo-resync-12371'
Auto-merging shared.txt
CONFLICT (content): Merge conflict in shared.txt
error: could not apply 3804179... feature: add line4 (B) - NOT YET MERGED
Cherry-pick hit a conflict. Resolve it manually on branch 'feature/conflict-demo-resync-12371', then:
  git add <resolved files> && git cherry-pick --continue
Once clean, re-run this script's final steps yourself (rename + force-push) -- do not auto-resolve conflicts.
```
Exit code: `2`, exactly as documented.

Independently verified before touching anything further:
- `git status` showed a real in-progress cherry-pick (`CHERRY_PICK_HEAD` resolved to the commit-B
  SHA) with `shared.txt` genuinely containing `<<<<<<</=======/>>>>>>>` conflict markers — the
  script left the conflict for a human, it did not silently pick a side or force anything through.
- The original `feature/conflict-demo` branch and `origin/main` were both untouched and unpushed at
  this point (`git show feature/conflict-demo:shared.txt` and `git show origin/main:shared.txt` each
  still showed their pre-script content) — confirming nothing destructive happened before the
  conflict was surfaced.

Then resolved the conflict as a human would (kept both the main-side `line3` edit and the
feature-side new `line4` line), ran `git cherry-pick --continue`, and followed the script's own
printed finishing instructions verbatim (`git branch -D` the old branch, rename the resync branch
onto it, `git push --force-with-lease`) — all three commands ran cleanly with no "used by worktree"
error (confirming the Run 1 bugfix holds under this shape of scenario too, since this run was also
sitting on the exact branch being resynced). Final independent verification:
`git merge-base --is-ancestor main feature/conflict-demo` confirmed real ancestry, and
`shared.txt`'s final content (`line1 / line2-FEATURE-A / line3-CHANGED-DURING-SQUASH-MERGE /
line4-feature-new`) correctly contained both the squash-merged main-side edit and the genuinely new
feature commit, with nothing lost or silently discarded.
