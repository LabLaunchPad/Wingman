<!-- eval:no-fixture-needed: ponytail-derived verification-loop skill, verified directly in unit tests and inline rather than a standalone shell script -->

# Eval: verification-loop

Tests `plugins/wingman/skills/verification-loop/SKILL.md` behaviorally. This skill runs a comprehensive 8-phase verification after code changes.

## Fixture

A minimal TypeScript project with: (1) a type error in `src/utils.ts` (string assigned to number), (2) a lint warning (unused variable), (3) a failing test in `tests/add.test.ts`, (4) a hardcoded API key in `src/config.ts`.

## Procedure

1. Give a fresh subagent only the skill file and the project directory.
2. Instruct it to run the verification loop.
3. Verify it catches all issues across all phases.

## Expectations

| Check | Expected |
|---|---|
| Build phase run | The subagent attempts to build the project |
| Type check phase run | The subagent runs the type checker and reports the type error |
| Lint phase run | The subagent runs the linter and reports the unused variable |
| Test phase run | The subagent runs tests and reports the failure |
| Security phase run | The subagent detects the hardcoded API key |
| Report produced | A structured verification report is produced with pass/fail per phase |
| Overall status correct | The report correctly states "NOT READY" due to failures |

## Trust level

`untested` — awaiting first run.

## Run log

Awaiting first run.
