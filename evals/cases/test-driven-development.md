# Eval: test-driven-development

Tests `plugins/wingman/skills/discipline/test-driven-development/SKILL.md` behaviorally. This skill encodes the red-green-refactor TDD discipline that is mandatory for all implementation work in Wingman.

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

`provisional` — Run 1 held all five expectations; not yet re-run against a second, differently-shaped scenario including a negative case, per `evals/README.md`'s bar for `verified`. Corrected 2026-07-20 from a `verified` label the run log doesn't actually support (see `FIXLOG.md` T1).

## Run log

### Run 1 — 2026-07-15

Acted as a fresh subagent given only `plugins/wingman/skills/discipline/test-driven-development/SKILL.md` and the scenario "implement an add function that takes two numbers and returns their sum." Built the fixture inline in a scratch dir (minimal TS project, vitest + typescript). No repo files were touched.

**RED — test written first, watched fail:**

Wrote `add.test.ts` before any `add.ts` existed:

```ts
import { describe, expect, test } from 'vitest';
import { add } from './add';

describe('add', () => {
  test('returns the sum of two numbers', () => {
    const result = add(2, 3);
    expect(result).toBe(5);
  });
});
```

First run errored (module resolution, not a real test failure) because no source file existed at all:

```
Error: Cannot find module './add' imported from .../add.test.ts
```

Per the skill's RED-verification rule ("Test errors? Fix error, re-run until it fails correctly"), added a non-implemented stub (`add.ts` returning `undefined as unknown as number`, matching the case's fixture description) so the test could execute and fail on the actual assertion rather than a resolution error. Re-ran:

```
FAIL  add.test.ts > add > returns the sum of two numbers
AssertionError: expected undefined to be 5 // Object.is equality
- Expected: 5
+ Received: undefined
 Test Files  1 failed (1)
      Tests  1 failed (1)
```

Clean RED: fails for the expected reason (feature missing), not a typo, not an environment error.

**GREEN — minimal implementation, watched pass:**

Replaced the stub body with the simplest code that satisfies the test:

```ts
export function add(a: number, b: number): number {
  return a + b;
}
```

Re-ran:

```
 Test Files  1 passed (1)
      Tests  1 passed (1)
```

Pristine output, one test, no warnings.

**REFACTOR:** Implementation was already minimal (single return statement, no duplication, clear name) — no refactor was needed or performed.

**Expectations checked:**

| Check | Result |
|---|---|
| Test written first | Pass — `add.test.ts` existed before any working `add.ts`; the only pre-`GREEN` source was a non-implemented stub added solely to convert a module-resolution error into a real assertion failure |
| Test fails initially | Pass — captured RED output above: `AssertionError: expected undefined to be 5` |
| Minimal implementation | Pass — `return a + b;`, nothing beyond what the single test requires |
| Tests pass after | Pass — `Test Files 1 passed (1)`, `Tests 1 passed (1)` |
| No over-engineering | Pass — no input validation, no generics, no class wrapper, no extra exports beyond `add` |

All five expectations held. The skill's RED-phase guidance ("Test errors? Fix error, re-run until it fails correctly") was actually exercised, not just theoretical — the first run genuinely errored rather than failed, and the skill's own distinction between "errors" and "fails" correctly routed the next action.
