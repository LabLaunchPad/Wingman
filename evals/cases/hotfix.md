# Eval: hotfix

Tests `plugins/wingman/commands/hotfix.md` behaviorally — given a real production bug report, does a fresh agent actually follow the root-cause-first discipline (`systematic-debugging`'s Iron Law: no fixes without investigation first), fix only the reported issue test-first, and record a proper Boardroom checkpoint — rather than jumping straight to a plausible-looking patch?

## Fixture

`evals/fixtures/setup-hotfix-fixture.sh <target-dir>` — "Coupon," a tiny shipped Node discount calculator (`applyDiscount`, zero dependencies, `node --test`). Has a real, deliberately subtle bug: it rounds discounted prices down (`Math.floor`) instead of to the nearest cent (`Math.round`). The 3 existing tests all happen to use price/percent combinations where floor and round agree, so they pass despite the bug — mirroring how a real regression reaches production undetected. `.wingman/checkpoints.jsonl` is pre-seeded with one prior `ship` entry (so `dept-devops`'s "shipped before" signal is true); no `.claude/agents/` exist yet.

**Bug report fed to the agent:** "A customer's receipt showed $2.99 for a $3.33 item marked 10% off. That looks wrong — 3.33 × 0.9 = 2.997, which should round to $3.00, not $2.99. We think we're undercharging by a cent on this order, and probably on others with similar price/percent combinations."

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with `hotfix.md`, `systematic-debugging/SKILL.md`, `department-lead-activation/SKILL.md` + template, `boardroom.md`, and the 5 boardroom personas — plus the fixture path and the bug report — and have it follow `hotfix.md`'s 7 steps literally.
3. Independently verify against the real filesystem afterward: does the fix actually work, was a regression test written and confirmed failing before the fix (not just added alongside it), and is the checkpoint genuinely recorded.

## Expectations

| Check | Expected |
|---|---|
| Root cause identified | `Math.floor` vs `Math.round` in `src/discount.js`, not a vague "rounding issue" — cites the exact line |
| Investigation before fix | Reproduces the reported input directly, tests the hypothesis against all 3 existing cases (confirming floor/round agree on those) before touching code — per `systematic-debugging`'s Iron Law |
| Regression test is real, not decorative | A new test asserting `applyDiscount(333, 10) === 300` exists and was confirmed to fail against the pre-fix code (red), not just added after the fix and never checked red |
| Fix is scoped | Only `src/discount.js`'s rounding function changes — no unrelated refactoring |
| Full suite passes post-fix | 4/4 (3 original + 1 new), not just the new test in isolation |
| Department leads created | `dept-engineering`, `dept-qa`, `dept-devops` (signal true — prior ship entry exists), each with no unfilled placeholders, in the fixture's own `.claude/agents/`, never under `plugins/wingman/` |
| Checkpoint recorded | `stage: "hotfix"`, `next_stage: "ship"`, valid new line in `.wingman/checkpoints.jsonl`; `state.json` correctly merged (new department leads added, not overwriting anything) |

## Trust level

`verified` — passed two differently-shaped runs: Run 1 (an unambiguous single-hypothesis logic bug) and Run 2 (a bug whose *obvious* hypothesis is wrong, requiring the investigation to reject it on evidence and reach a non-obvious cause before fixing). Both independently verified against real test output. Not yet tested against the 3+-failed-hypothesis "stop and question the architecture" escalation specifically — a possible third dimension, not required for `verified`.

## Run log

### Run 1 — 2026-07-07

**Result: PASS on every expectation**, independently verified against the real filesystem (not the subagent's self-report). The fix subagent:
- Correctly identified the exact root cause (`Math.floor` instead of `Math.round` at the return line) and explicitly distinguished it from a typo — "a systematic one-cent undercharge, not a one-off," reasoning from the fact all 3 shipped tests happened to be floor/round-agreeing cases.
- Genuinely investigated before fixing: reproduced `applyDiscount(333, 10) → 299` directly, checked git history (single initial commit — confirmed this was a latent bug since inception, not a recent regression), and tested the hypothesis against existing cases before writing any fix code.
- Wrote the regression test and reported observing it fail (red) before the fix and pass (green) after — independently confirmed by re-reading `test/discount.test.js` and re-running `npm test` fresh: 4/4 passing, and `applyDiscount(333, 10)` now returns `300`.
- Kept the fix to exactly the one function's return line; no unrelated changes.
- Created all 3 expected department-lead files with zero placeholders, correctly limited to what `hotfix.md` calls for (not the full 8-department roster).
- Recorded the checkpoint correctly: `stage: "hotfix"`, all 5 seats `GO`, `bottom_line: "GO"`, `next_stage: "ship"`; `state.json` shows the merged department-lead list with `current_stage: "ship"`.
- Noticed an unrelated pre-existing diff in the Wingman repo's own `plugins/wingman/commands/boardroom.md` during its `git status` check, correctly identified (via `git diff`) that it predated this task and wasn't something it had touched, and reported this transparently rather than silently ignoring or falsely claiming responsibility.

Kept at `provisional` pending a harder scenario (see above).
