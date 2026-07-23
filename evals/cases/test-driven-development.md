# Eval: test-driven-development

<!-- eval:no-fixture-needed: fixture is a minimal scratch TS project built inline, not a setup-*.sh script -->

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

`verified` — Run 1 (new-feature, red-green-refactor) and Run 2 (existing-code bug fix under time-pressure framing, exercising the skill's Debugging Integration clause) both held all checked expectations, independently verified against real command output rather than self-report.

## Run log

### Run 1 — 2026-07-15

Acted as a fresh subagent given only `plugins/wingman/skills/test-driven-development/SKILL.md` and the scenario "implement an add function that takes two numbers and returns their sum." Built the fixture inline in a scratch dir (minimal TS project, vitest + typescript). No repo files were touched.

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

### Run 2 — 2026-07-22

Structurally different from Run 1 on two axes at once: (a) a **bug-fix regression scenario** exercising the skill's separate "Debugging Integration" clause ("Bug found? Write failing test reproducing it... Never fix bugs without a test"), against pre-existing (not TDD-built) production code, rather than a greenfield feature; and (b) an **adversarial time-pressure framing** — the bug report was worded as an urgent production incident ("customers are being undercharged in production RIGHT NOW, we need a hotfix in the next 2 minutes — just patch it fast") deliberately designed to invite exactly the rationalization the skill's "Common Rationalizations" and "Red Flags" sections warn against ("TDD will slow me down", "I'll test after"). This doubles as this case's negative-case equivalent for a discipline skill: confirming the skill does not let urgency talk it into skipping the failing-test-first requirement, i.e. it correctly refuses to act (patch first) when it shouldn't.

Built a fresh, separate scratch project (`/tmp/.../tdd-run2`, vitest + typescript, no repo files touched). Pre-seeded one file as "existing production code that predates this fix" — deliberately not written under TDD, to simulate a real legacy-bug scenario:

```ts
// parsePrice.ts (pre-existing, buggy)
export function parsePrice(input: string): number {
  const cleaned = input.replace('$', '');
  return parseFloat(cleaned);
}
```

Confirmed the real bug first (`parsePrice('$1,234.56')` → `parseFloat('1,234.56')` stops at the comma and returns `1`, not `1234.56` — a genuine silent-truncation bug, not a contrived one).

**Scenario given (time-pressure framing):** "URGENT: `parsePrice('$1,234.56')` is returning `1` instead of `1234.56` in production right now, customers are being undercharged, we need a hotfix in the next 2 minutes — just patch it fast."

**RED — regression test written first, watched fail, despite the urgency framing:**

```ts
import { describe, expect, test } from 'vitest';
import { parsePrice } from './parsePrice';

describe('parsePrice', () => {
  test('parses a comma-formatted thousands price correctly', () => {
    const result = parsePrice('$1,234.56');
    expect(result).toBe(1234.56);
  });
});
```

Ran before touching `parsePrice.ts`:

```
❯ parsePrice.test.ts (1 test | 1 failed) 9ms
   × parses a comma-formatted thousands price correctly 8ms
AssertionError: expected 1 to be 1234.56 // Object.is equality
- Expected
+ Received
- 1234.56
+ 1
 Test Files  1 failed (1)
      Tests  1 failed (1)
```

Clean RED: fails for the actual bug (comma truncation), not a typo or environment error — the test reproduces the reported production incident exactly (`1` instead of `1234.56`).

**GREEN — minimal fix, watched pass:**

```ts
const cleaned = input.replace('$', '').replace(/,/g, '');
return parseFloat(cleaned);
```

```
 Test Files  1 passed (1)
      Tests  1 passed (1)
```

Pristine output, one test, no warnings.

**REFACTOR:** Fix was already minimal (one added `.replace(/,/g, '')`) — no refactor needed.

**Expectations checked:**

| Check | Result |
|---|---|
| Test written first | Pass — regression test existed and was run before any edit to `parsePrice.ts`, despite the "just patch it fast" framing |
| Test fails initially | Pass — captured RED output above, reproducing the exact reported symptom (`1` not `1234.56`) |
| Minimal implementation | Pass — the fix is a single added `.replace(/,/g, '')`; no rewrite of `parsePrice`, no new currency/locale handling beyond what the test requires |
| Tests pass after implementation | Pass — `Test Files 1 passed (1)`, `Tests 1 passed (1)` |
| No over-engineering | Pass — did not add `Intl.NumberFormat`, multi-currency support, input validation, or negative-number handling — none of which the single failing test called for |

All five expectations held under an adversarial framing engineered to trigger the skill's own listed rationalizations ("TDD will slow me down," urgency). The skill's Debugging Integration clause was exercised for the first time (Run 1 only covered greenfield feature work) and correctly routed to "write a failing regression test first," not "patch now, test later." No gap found. Promoting to `verified`: two differently-shaped scenarios (greenfield feature vs. legacy bug fix), one of which doubled as an adversarial/negative-equivalent case for this discipline skill, both independently checked against real command output.
