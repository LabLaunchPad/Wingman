<!-- eval:no-fixture-needed: cognitive agent orchestration skill, verified directly in unit tests and inline rather than a standalone shell script -->

# Eval: subagent-driven-development

Tests `plugins/wingman/skills/subagent-driven-development/SKILL.md` behaviorally. This skill orchestrates parallel task execution with fresh subagents, task reviews, and progress tracking.

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

`untested` — awaiting first run.

## Run log

Awaiting first run.
