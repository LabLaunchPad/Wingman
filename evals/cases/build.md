# Eval: build

Tests `plugins/wingman/commands/build.md` behaviorally, distinct from `full-pipeline-e2e.md` (which already covers the build stage as part of a whole-pipeline run). The distinctive behavior under test: does `build.md`'s TDD execution discipline (test first, confirm it fails for the right reason, implement, confirm it passes, commit) actually hold — specifically, is the new test real (fails without the implementation) rather than decorative?

## Fixture

`evals/fixtures/setup-build-tdd-fixture.sh <target-dir>` — "Todos," a tiny zero-dependency Node HTTP todo-list service with one working feature (create/list) and a passing suite. A boardroom-approved plan is pre-seeded asking for a "mark todo complete" feature, deliberately not yet implemented, requiring a test for both the happy path and the "complete a nonexistent todo" edge case.

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with only `commands/build.md` and the fixture (including the pre-seeded plan). Not told the implementation.
3. Independently verify: read the diff/history to confirm the test was written and run *before* the implementation existed (and genuinely failed then), not written after and never shown red.

## Expectations

| Check | Expected |
|---|---|
| Test-first order | New test(s) exist in a commit/state that precedes the implementation, not bundled after the fact |
| Test is real, not decorative | Confirmable that the test fails without the implementation (re-run against a reverted implementation if needed) |
| Both cases covered | Happy path AND the nonexistent-todo edge case both have real assertions |
| Final state green | Full suite passes after implementation |
| Commit discipline | A real commit exists recording the change, not just uncommitted working-tree edits |

## Trust level

`authored, pending first run` — the fixture and expectations are written but the case has not yet been executed (spawn a fresh subagent against the fixture, grade independently, log the result).

## Run log

(pending — filled in after the eval is actually run and independently verified)
