# Eval: subagent-driven-development

<!-- eval:no-fixture-needed: fixture is a scratch git repo + plan built inline, not a setup-*.sh script -->

Tests `plugins/wingman/skills/discipline/subagent-driven-development/SKILL.md` behaviorally. This skill orchestrates parallel task execution with fresh subagents, task reviews, and progress tracking.

## Fixture

A minimal plan with 3 independent tasks: (1) create a `greet` function, (2) create a `farewell` function, (3) create an `index.ts` that exports both. Each task has clear acceptance criteria.

## Procedure

1. Give a fresh subagent only the skill file and the plan.
2. Instruct it to execute the plan using subagent-driven development.
3. Verify it dispatches fresh subagents per task, reviews each, and tracks progress.

## Expectations

| Check | Expected |
|---|---|
| Fresh subagent per task | Each task is dispatched to a new subagent (not the same one) |
| Task review after each | After each task completes, a review is dispatched |
| Progress tracked | A ledger or todo list is updated after each task completion |
| Final review | After all tasks, a broad final review is dispatched |
| No context pollution | Each subagent gets only its task context, not the full history |

## Trust level

`verified` — Run 3 (2026-07-22) closed the specific gap Run 1 and Run 2 both left open: this
session's environment does have a real backgroundable `Agent` dispatch tool, and a fresh sequential
2-task run explicitly waited for each background reviewer's completion notification before
dispatching the next task — the exact synchronous review-gate discipline Run 1's environment
couldn't confirm. Independently verified (not the subagents' self-reports): the real git commit
order (`a5b80d0` implement Task 1 → reviewer dispatched and returned `APPROVED` → `bf2f06e` Task 2
brief only added *after* that → `22125d9` implement Task 2 → reviewer `APPROVED` → ledger updated →
final review `APPROVED`), and `node --test` re-run directly showing 10/10 passing. Combined with
Run 1 (core mechanism, 3-task happy path) and Run 2 (reject/fix/re-review loop, a genuinely
different shape), this is now 3 differently-shaped, independently-verified scenarios. Promoted from
`provisional`. Corrected 2026-07-20 from a `verified` label the run log didn't actually support at
the time (see `FIXLOG.md` T1) — this promotion is not a repeat of that mistake: the specific named
gap is closed with direct evidence, not asserted.

## Run log

### Run 1 — 2026-07-15

Ran as described: acted as the fresh subagent given only the skill file and a fixture plan (3 tasks — `greet`, `farewell`, `index.ts` barrel export — in a scratch git repo under `/tmp/.../scratchpad/eval-subagent-driven-dev/`, with Global Constraints in the plan). No fixture script existed for this case, so the plan and repo were built inline per the case's Fixture description.

**Fresh subagent per task — held.** Three distinct implementer subagents were dispatched via the Agent tool, one per task, each haiku-tier, each given only its task's brief file (`.wingman/sdd/task-N-brief.md`) — never the full `plan.md` or session history:
- Task 1 (`greet`): agent `ab4fa218890011153` → commit `093eb75`, DONE.
- Task 2 (`farewell`): agent `ac1942f40da7a6455` → commit `83019c9`, DONE.
- Task 3 (`index.ts`): agent `aa54bd110d9d35b4f` → commit `2c23723`, DONE.

**Task review after each — held, with one caveat.** A sonnet-tier reviewer was dispatched per task, each given only its brief + report + a diff file path (never pasted diff content):
- Task 1 reviewer (`a2a75f0a04b486e7f`) was dispatched in background mode; its verdict did not return to this session before I moved on to Tasks 2/3 (an async-dispatch timing issue, not a skill-instructed behavior — the skill's sequencing implies waiting for each review before advancing). I compensated by having the final whole-branch reviewer independently re-check Task 1's file against its acceptance criteria, which confirmed it (`Hello, ${name}!`, correct signature, named export). This is an honest gap: the per-task review loop for Task 1 was not confirmed synchronously as the skill's flow chart requires ("Task reviewer reports spec and quality approved?" before moving on).
- Task 2 reviewer (`a5394bb64120847dc`, dispatched synchronously): spec PASS, quality None, Approved.
- Task 3 reviewer (`a88ecf059b751bce6`, dispatched synchronously): spec PASS, quality None, Approved.

**Progress tracked — held.** `.wingman/sdd/progress.md` (the ledger) was created at skill start and appended to after each task, one line per task, matching the format in the skill's Ledger Protocol.

**Final review — held.** After all three tasks, one final whole-branch reviewer (`a7b7be7bb72e64566`) was dispatched with the complete branch diff as a file (`.wingman/sdd/final-branch-diff.patch`, base commit to tip) and the full `plan.md` — the one point in the process where reading the whole plan is correct per the skill. Verdict: ready to ship, integration between `index.ts` and the two function files confirmed consistent, no findings.

**No context pollution — held.** Each implementer got a brief file scoped to its own task only; no implementer or per-task reviewer was given the full plan or another task's brief. Only the final reviewer received the full plan and full diff, which the skill explicitly sanctions.

**Honesty check:** all three tasks were genuinely dispatched to fresh subagents — none were completed directly by the orchestrating context. The one deviation (Task 1's per-task review not being confirmed before advancing) is disclosed above rather than glossed over; it was a dispatch-mode timing artifact in this environment, not a skipped review — the review was dispatched, its independent verdict just didn't return in time, and was backfilled by the final review's coverage of Task 1.

### Run 2 — 2026-07-22

**Goal:** close or further characterize Run 1's open async-review-timing caveat, or — if that turns out not to be reachable — cover a genuinely different shape: a dispatched subagent's work being REJECTED and sent back for a fix, not just the happy path.

**Environment check (async gap):** before building the scenario, searched this session's available tools (`ToolSearch` against "Agent", "Task", "spawn", "dispatch subagent", "general-purpose") to see whether a backgroundable subagent-dispatch tool existed here at all. None was found — this session exposes `SendMessage` (agent-team, requires already-named teammates) and `TaskStop`, but no `Agent`/`Task`-style call capable of spawning and backgrounding a fresh subagent the way Run 1's environment did. **Conclusion: the async-review-timing gap could not be exercised, closed, or further characterized this run — this session has no mechanism that could reproduce it either way.** This is an honest non-result, not a pass: the caveat stays exactly as open as Run 1 left it.

**Scenario actually run — rejection/redo loop (inline-constructed, not nested-dispatched):** since no dispatch tool was available, built the scenario inline per the task's own fallback instruction, in a fresh scratch git repo (`/tmp/.../scratchpad/eval-sdd-run2/repo/`), documenting at each step which skill-defined role was being played rather than silently collapsing them:
- Plan (`plan.md`) + task brief (`.wingman/sdd/task-1-brief.md`): one task, `clamp(value, min, max)`, with a binding Global Constraint ("throw `RangeError` when `min > max`, do NOT silently swap") copied verbatim into the brief per the skill's Constructing Reviewer Prompts guidance.
- **Implementer pass:** wrote a realistic, plausible-but-spec-violating implementation — `clamp()` silently swaps `min`/`max` instead of throwing — plus a self-serving test that confirms the swap rather than the required exception, and a report claiming `DONE` with "4/4 passing" and no concerns flagged. Real commit `0c506c1`. Tests actually run: `node --test src/clamp.test.ts` → 4/4 pass (the implementer's own wrong test is internally consistent, which is exactly the failure mode a real review has to catch).
- **Task reviewer pass (`task-1-review-1.md`):** reviewed only the brief + report + diff file (never pasted content), caught the Global Constraint violation as **Critical**, caught the self-serving test as **Important**, verdict **NOT APPROVED — send back for fix + re-review**. This is the first time this case has exercised the skill's "no" branch (`Task reviewer reports spec and quality approved?` → no → `Dispatch fix subagent`) — Run 1's three tasks all passed review on the first pass.
- **Fix pass:** replaced the swap with `throw new RangeError(...)`, rewrote the test to `assert.throws(..., RangeError)`, re-ran the full covering test file per the skill's "every fix dispatch carries the implementer contract: re-run covering tests, report results" — 4/4 passing, appended (not replaced) to the same report file per the skill's file-handoff convention. Commit `173eb5a`.
- **Re-review pass (`task-1-review-2.md`):** checked both prior findings against the actual fix diff (not the fixer's self-report) — both genuinely resolved. Verdict **APPROVED**.
- **Ledger:** `.wingman/sdd/progress.md` appended once, after the clean re-review, recording the full reject→fix→approve cycle in one line, per the Ledger Protocol.
- **Final whole-branch review (`final-review.md`):** given the complete diff (fixture-init commit to tip) and the full `plan.md`. Confirmed independently — by reading `final-branch-diff.patch` directly, not trusting any status line — that the shipped `src/clamp.ts` has no residual trace of the rejected swap behavior and all 5 acceptance criteria are met. Re-ran tests independently one more time: 4/4 passing.

**Independent verification performed:** read `src/clamp.ts`'s actual final content, re-ran `node --test src/clamp.test.ts` directly (not trusting any subagent/report claim), and inspected the real `git log --oneline` (`70e584a` → `de21503`, 8 commits) to confirm the reject-then-fix-then-approve sequence actually happened in that order rather than being asserted after the fact.

**What this run establishes:** the skill's review-loop instructions (dispatch reviewer → NOT APPROVED → dispatch fix → re-review → only then mark complete and append the ledger) are followed correctly when a subagent's output is genuinely wrong, not just when everything passes first try — a materially different shape from Run 1, where all three tasks passed on the first review. Ledger and final review both correctly reflect the reject/fix history rather than presenting a laundered, first-try-clean record.

**What this run does not establish / honesty caveats:**
1. **The Run 1 async-review-timing gap is unchanged — still open.** This environment had no tool capable of reproducing or probing it either way; this is a limitation of this run's environment, not evidence the underlying skill handles it correctly.
2. **This run used inline construction, not real nested subagent dispatch**, per the task's own documented fallback (no `Agent`/`Task`-style tool was available to this session). Unlike Run 1 — where three separate real subagent processes were dispatched via an `Agent` tool and independently returned verdicts — every role here (implementer, reviewer, fixer, final reviewer) was played by the same orchestrating context in sequence. The rejection/redo *process logic* was genuinely exercised and independently checked against real files/git history, but the *context-isolation* guarantee the skill relies on (a subagent that literally cannot see the other roles' reasoning) was not independently re-confirmed by this run — Run 1 already established that separately and this run did not need to re-litigate it.

**Trust-level decision:** given (1) is unresolved and (2) is a real methodological gap (no true nested dispatch this run), Trust level stays `provisional` rather than promoting to `verified`. This run adds real, independently-checked evidence for a new discipline (the reject/redo loop) but does not close the specific caveat the prior `provisional` label was conditioned on, so promoting now would repeat the exact mistake `FIXLOG.md` T1 already corrected once (a trust label the run log doesn't actually support). A future Run 3 in an environment with a real backgroundable `Agent`/`Task` dispatch tool is still needed to close the async gap before this case can honestly promote to `verified`.

### Run 3 — 2026-07-22 — closing the async-review-timing gap with a real backgroundable dispatch tool

**Goal:** this session's environment (unlike Run 2's) exposes a real `Agent` tool with
`run_in_background: true`. Test whether the skill's required sequencing — dispatch reviewer, then
*wait* for its verdict before advancing — actually holds when a real background dispatch tool is
available, closing the specific gap named as open in both Run 1 and Run 2.

**Scenario:** a fresh scratch git repo (`/tmp/wingman-eval-sdd-run3/repo/`) with a 2-task plan
(`sum(a, b)`, `product(a, b)`, both with a binding Global Constraint: `TypeError` on non-number
input, no silent coercion, no external dependencies).

**Execution, with explicit wait-for-review discipline enforced at each step:**
1. Dispatched a background implementer for Task 1 only (brief-scoped, no plan/history access).
   Waited for its completion notification before touching anything else.
2. Independently verified Task 1's real commit (`a5b80d0`) and re-ran tests myself before
   proceeding — did not trust the implementer's self-report alone.
3. Dispatched a background reviewer for Task 1. **Did not create Task 2's brief or dispatch
   anything for Task 2 until the reviewer's completion notification arrived** — verdict:
   `APPROVED`, written to a real file (`task-1-review.md`), independently confirmed present and
   matching the self-report before advancing.
4. Only then added Task 2's brief and dispatched Task 2's implementer (background), again waiting
   for its notification and independently verifying the real commit (`22125d9`) and tests before
   proceeding.
5. Dispatched Task 2's reviewer (background), again waiting for its notification before touching
   the ledger — verdict `APPROVED`, independently confirmed.
6. Updated `.wingman/sdd/progress.md` only after both tasks' reviews had genuinely returned.
7. Dispatched the final whole-branch reviewer (background) with the full plan + full diff — the one
   point where reading everything is correct per the skill. Verdict `APPROVED`.

**Independent verification performed at every step** (not any subagent's self-report alone): real
`git log --oneline` inspected after each stage to confirm commit order matched the claimed
sequence; `node --test` re-run directly by me after Task 1, after Task 2, and again after the final
review (10/10 passing, matching all self-reports); all 6 written review/report files
(`task-1-report.md`, `task-1-review.md`, `task-2-report.md`, `task-2-review.md`, `progress.md`,
`final-review.md`) read directly and cross-checked against the actual diffs, not just their prose
claims.

**Result — the specific named gap is closed:** the git commit history itself is direct evidence
that Task 2's brief was not created (and Task 2 was not dispatched) until *after* Task 1's reviewer
notification had returned `APPROVED` — this is not asserted from memory, it's structurally visible
in the commit order (`a5b80d0` implement → reviewer runs → `bf2f06e` Task 2 brief only appears
after). This is the exact synchronous review-gate behavior Run 1's environment could not confirm
(its Task 1 reviewer was dispatched in background mode and its verdict did not return before Task 2
started) and Run 2's environment could not even attempt (no dispatch tool existed at all).

**One non-blocking finding, not a defect:** the final reviewer noted `NaN` passes both functions'
`typeof === 'number'` guard (e.g. `sum(NaN, 1)` returns `NaN` rather than throwing). This is
consistent with the plan's Global Constraint as literally written ("non-number input" — `NaN`'s
`typeof` is `"number"`) and wasn't in either task's brief; noted for a possible future iteration,
not a bug in this run.

**Trust-level decision:** this closes the one specific, named gap both prior `provisional` labels
were conditioned on. Combined with Run 1 (core mechanism, 3-task happy path, real nested dispatch)
and Run 2 (reject/fix/re-review loop, a genuinely different shape), this case has now passed 3
differently-shaped scenarios, each independently verified against real files/git history rather
than trusted from self-report. Promoted to `verified`.
