---
description: Execute an approved Wingman plan task-by-task with test-driven discipline, then hand off to /wingman:secure.
argument-hint: "[path to plan file, or leave blank to use the most recent approved plan]"
---

# Wingman: Build

Execute the plan approved in `/wingman:plan`. This stage is where code actually gets written — the founder should not need to watch this happen, only see the result at the next checkpoint.

$ARGUMENTS

## Before starting

Confirm there is an approved plan (from `/wingman:plan`, boardroom-approved). If no plan exists, tell the founder plainly that you need a plan first and suggest running `/wingman:plan`.

Use the `department-lead-activation` skill to check the Design, Engineering, Data, and QA activation signals against this project and the plan. `dept-engineering` and `dept-qa` are always active; create `dept-design` if the plan touches any user-facing surface, and `dept-data` if it touches a schema/migrations. Delegate each task to the relevant department lead rather than doing all the work as this command directly.

## Execution discipline

Work through the plan task-by-task, not all at once:

1. For each task: write the test first if the plan specifies one, run it to confirm it fails for the right reason, implement the minimal code to pass it, run it again to confirm it passes, then commit.
2. Never mark a task done without fresh evidence it works — see the bundled `verification-before-completion` skill. "Should work now" is not a completion claim; a passing test run is.
3. If you hit something the plan didn't anticipate (a genuine unknown, not a routine implementation detail), use the bundled `systematic-debugging` skill to investigate rather than guessing at fixes.
4. If a task turns out to require a decision the plan didn't make (and it's a business tradeoff, not a technical one), stop and ask the founder in plain language rather than guessing.
5. Keep commits small and scoped to one task each, with clear messages.
6. Apply `engineering-minimalism` and, for any user-facing work, `design-taste` — both are bundled skills, not department-lead-specific, so they apply whether or not a department lead exists yet for this piece of work.

## Reuse over reinvention

Before writing new code for any task, check whether something in the codebase already does this or something close to it. Extend and reuse before adding a parallel implementation.

## When the plan is fully executed

Run the full verification suite for the project (tests, typecheck, lint — whatever this project actually has). Only once everything passes with fresh evidence, move to the checkpoint.

## Boardroom checkpoint

Run `/wingman:boardroom diff` against the accumulated changes. This is the founder's chance to hear, in plain language, whether what got built matches what was promised, whether it's technically sound, and whether anything needs a security pass before shipping.

- If the boardroom returns "ship it": proceed to `/wingman:secure`.
- If it returns concerns: fix them, then re-run the checkpoint before proceeding.

## References

- `skills/spec-handler` — each task in the plan is a spec; build the handler to its success criteria, then verify against them.
- `skills/testing-patterns` — follow AAA, mock at boundaries, and cover changed paths (>=80%) as you run the verification suite above.
- `skills/definition-of-done` — the standing cross-skill gate every executed task must satisfy before the checkpoint.
