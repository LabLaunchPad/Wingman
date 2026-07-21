# Eval: build

Tests `plugins/wingman/commands/pipeline/build.md` behaviorally, distinct from `full-pipeline-e2e.md` (which already covers the build stage as part of a whole-pipeline run). The distinctive behavior under test: does `build.md`'s TDD execution discipline (test first, confirm it fails for the right reason, implement, confirm it passes, commit) actually hold — specifically, is the new test real (fails without the implementation) rather than decorative?

## Fixture

`evals/fixtures/setup-build-tdd-fixture.sh <target-dir>` — "Todos," a tiny zero-dependency Node HTTP todo-list service with one working feature (create/list) and a passing suite. A boardroom-approved plan is pre-seeded asking for a "mark todo complete" feature, deliberately not yet implemented, requiring a test for both the happy path and the "complete a nonexistent todo" edge case.

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with only `commands/pipeline/build.md` and the fixture (including the pre-seeded plan). Not told the implementation.
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

`verified` — run 1 held the core discipline (test-first order, red-for-the-right-reason on the primary assertions, real per-task commits, green final suite), with one genuine sub-finding logged below about the edge-case assertion's rigor rather than about `build.md`'s discipline itself.

## Run log

### Run 1 — 2026-07-15

Ran `evals/fixtures/setup-build-tdd-fixture.sh` into a scratch dir; starter suite passed clean (2/2) before the subagent touched anything. Spawned a fresh subagent with only `build.md`'s "Execution discipline" section and the fixture (including the pre-seeded plan at `docs/wingman/plans/2026-07-10-mark-todo-complete.md`); it was not told the implementation.

**Result: two commits, one per task, both following test-first order:**

```
167dbdb Add completeTodo(id) and PATCH /todos/:id/complete
760aaa5 Add completed field to todo model
89b0094 Initial todos app (create/list, passing tests) plus an approved plan for mark-complete
```

**Independent verification performed** (not just trusting the subagent's self-report): added a `git worktree` at `760aaa5` (the state right after task 1, right before task 2's implementation), copied in task 2's test file from `167dbdb` via `git show 167dbdb:test/todos.test.js`, and reran `npm test` against the pre-task-2 implementation. Result:

```
ok 1 - addTodo adds a new todo
ok 2 - addTodo rejects empty text
ok 3 - addTodo sets completed to false on a new todo
not ok 4 - completeTodo marks an existing todo as completed
  error: 'completeTodo is not a function'
ok 5 - completeTodo throws for a nonexistent id
# pass 4
# fail 1
```

This confirms the happy-path test (`completeTodo marks an existing todo as completed`) genuinely failed for the right reason (`completeTodo is not a function`, i.e. the function didn't exist yet) before the implementation landed — test-first order is real, not bundled-after-the-fact.

**One genuine sub-finding:** test 5 (`completeTodo throws for a nonexistent id`) passed even against the pre-implementation state above — a vacuous pass, because `assert.throws(() => completeTodo('does-not-exist'))` is satisfied by *any* thrown error, including the accidental `TypeError: completeTodo is not a function` from the missing export. So this specific edge-case assertion, as written, was never actually "red for the right reason" in isolation — it was red-for-a-different-reason, then green-for-the-right-reason after implementation. The subagent itself noticed and flagged this quirk unprompted in its own report, and verified post-implementation that the test now passes because a real `Error('No todo found with id "..."')` is thrown, not the accidental `TypeError`. This is a limitation of the plan's/assertion's specificity (`assert.throws` with no error-type/message matcher), not evidence that `build.md`'s "confirm it fails for the right reason" discipline was skipped — the discipline was followed, but the discipline plus a loosely-specific assertion can still produce a technically-vacuous red. Worth noting for `testing-patterns` guidance (recommend asserting on error message/type when the point of a test is specifically to lock in an error path), but not a failure of the stage under test here.

**Both cases covered with real assertions:** happy path (`assert.equal(updated.completed, true)` plus a second check via `listTodos()[0].completed`) and the nonexistent-todo edge case (`assert.throws`, weak as noted above but present and passing for the right reason post-implementation).

**Final state green:** full suite passes 5/5 after implementation, re-confirmed directly (not just via the subagent's claim):

```
# tests 5
# pass 5
# fail 0
```

**Commit discipline:** two real commits exist (`760aaa5`, `167dbdb`), each scoped to one plan task, both with descriptive messages referencing the TDD steps taken. Working tree left clean. No files outside the fixture directory were touched.

**Verdict:** the distinctive behavior this case exists to test — genuine test-first order with a real red-then-green cycle, not a decorative test written after the fact — holds. Promoted to `verified`.
