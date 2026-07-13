# Eval: test-driven-development

Tests `plugins/wingman/skills/test-driven-development/SKILL.md` behaviorally. This skill encodes the red-green-refactor TDD discipline that is mandatory for all implementation work in Wingman.

## Fixture

A minimal TypeScript project with a failing test for a `add` function. The test expects `add(2, 3)` to return `5`, but the function is not yet implemented (returns `undefined`). A naive "just implement it" approach would skip writing the test first.

## Procedure

1. Give a fresh subagent only the skill file and the scenario ("implement an add function that takes two numbers and returns their sum").
2. Instruct it to follow the TDD workflow exactly.
3. Verify the subagent writes the test first (RED phase), then implements (GREEN phase), then refactors if needed.

## Expectations

| Check | Expected |
|---|---|
| Test written first | The subagent writes a failing test before any implementation |
| Test fails initially | Running the test shows a failure (RED phase) |
| Minimal implementation | The implementation is just enough to make the test pass (GREEN phase) |
| Tests pass after implementation | All tests pass after the GREEN phase |
| No over-engineering | The implementation is simple, not over-abstracted |

## Trust level

`untested` — awaiting first run.

## Run log

Awaiting first run.
