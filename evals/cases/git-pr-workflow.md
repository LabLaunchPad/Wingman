# Eval: git-pr-workflow

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
- **A fresh subagent's judgment-call usage of the skill** (recognizing when a rejected push is a
  squash-merge situation vs. some other cause, choosing to poll rather than guess, marking a draft
  ready only after actually confirming green) — the scripts being individually correct doesn't by
  itself prove an agent reliably reaches for them at the right moments. This needs a real dispatch
  against a fixture exercising at least one real squash-merge-then-push scenario.

## Trust level

`authored, scripts directly verified — pending a fresh-subagent behavioral run`. The 3 scripts'
own correctness is proven (see above); the skill's judgment-call layer (when to invoke which
script) has not yet been exercised by an independent subagent dispatch. Promote to `provisional`
after that run, `verified` after a second, differently-shaped one (e.g. a genuine merge-conflict
during a branch resync, which this round of testing didn't exercise).
