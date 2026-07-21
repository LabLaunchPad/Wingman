# Eval: subagent-driven-development

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

`provisional` — first run confirms the core mechanism (fresh subagent per task, review gates, ledger, final broad review, no context pollution). See caveat in Run 1 about one review dispatch's async timing. Not yet re-run against a second, differently-shaped scenario including a negative case, per `evals/README.md`'s bar for `verified`. Corrected 2026-07-20 from a `verified` label the run log doesn't actually support (see `FIXLOG.md` T1).

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
