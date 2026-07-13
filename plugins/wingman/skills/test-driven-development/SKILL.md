---
name: test-driven-development
description: Use when implementing any feature or bugfix during /wingman:build, before writing implementation code. Enforces red-green-refactor cycle with mandatory test failure verification.
---

<!--
Adapted from obra/superpowers (MIT License, Copyright (c) 2025 Jesse Vincent)
— skills/test-driven-development/SKILL.md. Adapted for Wingman's build-time
use with references to Wingman's own verification-before-completion skill.
-->

# Test-Driven Development (TDD)

## Overview

Write the test first. Watch it fail. Write minimal code to pass.

**Core principle:** If you didn't watch the test fail, you don't know if it tests the right thing.

**Violating the letter of the rules is violating the spirit of the rules.**

## When to Use

**Always:**
- New features
- Bug fixes
- Refactoring
- Behavior changes

**Exceptions (ask the founder):**
- Throwaway prototypes
- Generated code
- Configuration files

Thinking "skip TDD just this once"? Stop. That's rationalization.

## The Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Write code before the test? Delete it. Start over.

**No exceptions:**
- Don't keep it as "reference"
- Don't "adapt" it while writing tests
- Don't look at it
- Delete means delete

Implement fresh from tests. Period.

## Red-Green-Refactor

### RED - Write Failing Test

Write one minimal test showing what should happen.

```typescript
test('retries failed operations 3 times', async () => {
  let attempts = 0;
  const operation = () => {
    attempts++;
    if (attempts < 3) throw new Error('fail');
    return 'success';
  };

  const result = await retryOperation(operation);

  expect(result).toBe('success');
  expect(attempts).toBe(3);
});
```

**Requirements:**
- One behavior
- Clear name
- Real code (no mocks unless unavoidable)

### Verify RED - Watch It Fail

**MANDATORY. Never skip.**

```bash
npm test path/to/test.test.ts
```

Confirm:
- Test fails (not errors)
- Failure message is expected
- Fails because feature missing (not typos)

**Test passes?** You're testing existing behavior. Fix test.

**Test errors?** Fix error, re-run until it fails correctly.

### GREEN - Minimal Code

Write simplest code to pass the test.

```typescript
async function retryOperation<T>(fn: () => Promise<T>): Promise<T> {
  for (let i = 0; i < 3; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === 2) throw e;
    }
  }
  throw new Error('unreachable');
}
```

Don't add features, refactor other code, or "improve" beyond the test.

### Verify GREEN - Watch It Pass

**MANDATORY.**

```bash
npm test path/to/test.test.ts
```

Confirm:
- Test passes
- Other tests still pass
- Output pristine (no errors, warnings)

**Test fails?** Fix code, not test.

**Other tests fail?** Fix now.

### REFACTOR - Clean Up

After green only:
- Remove duplication
- Improve names
- Extract helpers

Keep tests green. Don't add behavior.

### Repeat

Next failing test for next feature.

## Good Tests

| Quality | Good | Bad |
|---------|------|-----|
| **Minimal** | One thing. "and" in name? Split it. | `test('validates email and domain and whitespace')` |
| **Clear** | Name describes behavior | `test('test1')` |
| **Shows intent** | Demonstrates desired API | Obscures what code should do |

## Why Order Matters

**"I'll write tests after to verify it works"**

Tests written after code pass immediately. Passing immediately proves nothing:
- Might test wrong thing
- Might test implementation, not behavior
- Might miss edge cases you forgot
- You never saw it catch the bug

Test-first forces you to see the test fail, proving it actually tests something.

**"I already manually tested all the edge cases"**

Manual testing is ad-hoc. You think you tested everything but:
- No record of what you tested
- Can't re-run when code changes
- Easy to forget cases under pressure
- "It worked when I tried it" ≠ comprehensive

Automated tests are systematic. They run the same way every time.

**"Deleting X hours of work is wasteful"**

Sunk cost fallacy. The time is already gone. Your choice now:
- Delete and rewrite with TDD (X more hours, high confidence)
- Keep it and add tests after (30 min, low confidence, likely bugs)

The "waste" is keeping code you can't trust. Working code without real tests is technical debt.

**"TDD is dogmatic, being pragmatic means adapting"**

TDD IS pragmatic:
- Finds bugs before commit (faster than debugging after)
- Prevents regressions (tests catch breaks immediately)
- Documents behavior (tests show how to use code)
- Enables refactoring (change freely, tests catch breaks)

"Pragmatic" shortcuts = debugging in production = slower.

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Too simple to test" | Simple code breaks. Test takes 30 seconds. |
| "I'll test after" | Tests passing immediately prove nothing. |
| "Tests after achieve same goals" | Tests-after = "what does this do?" Tests-first = "what should this do?" |
| "Already manually tested" | Ad-hoc ≠ systematic. No record, can't re-run. |
| "Deleting X hours is wasteful" | Sunk cost fallacy. Keeping unverified code is technical debt. |
| "Keep as reference, write tests first" | You'll adapt it. That's testing after. Delete means delete. |
| "Need to explore first" | Fine. Throw away exploration, start with TDD. |
| "Test hard = design unclear" | Listen to test. Hard to test = hard to use. |
| "TDD will slow me down" | TDD faster than debugging. Pragmatic = test-first. |
| "Manual test faster" | Manual doesn't prove edge cases. You'll re-test every change. |
| "Existing code has no tests" | You're improving it. Add tests for existing code. |

## Red Flags - STOP and Start Over

- Code before test
- Test after implementation
- Test passes immediately
- Can't explain why test failed
- Tests added "later"
- Rationalizing "just this once"
- "I already manually tested it"
- "Tests after achieve the same purpose"
- "It's about spirit not ritual"
- "Keep as reference" or "adapt existing code"
- "Already spent X hours, deleting is wasteful"
- "TDD is dogmatic, I'm being pragmatic"
- "This is different because..."

**All of these mean: Delete code. Start over with TDD.**

## Verification Checklist

Before marking work complete:

- [ ] Every new function/method has a test
- [ ] Watched each test fail before implementing
- [ ] Each test failed for expected reason (feature missing, not typo)
- [ ] Wrote minimal code to pass each test
- [ ] All tests pass
- [ ] Output pristine (no errors, warnings)
- [ ] Tests use real code (mocks only if unavoidable)
- [ ] Edge cases and errors covered

Can't check all boxes? You skipped TDD. Start over.

## When Stuck

| Problem | Solution |
|---------|----------|
| Don't know how to test | Write wished-for API. Write assertion first. Ask the founder. |
| Test too complicated | Design too complicated. Simplify interface. |
| Must mock everything | Code too coupled. Use dependency injection. |
| Test setup huge | Extract helpers. Still complex? Simplify design. |

## Debugging Integration

Bug found? Write failing test reproducing it. Follow TDD cycle. Test proves fix and prevents regression.

Never fix bugs without a test.

## Final Rule

```
Production code → test exists and failed first
Otherwise → not TDD
```

No exceptions without the founder's permission.

## Continuous Execution

**Principle:** Once you begin executing a workflow, maintain momentum through to completion. The workflow should run as a cohesive unit, not a series of start-stop-check cycles.

### Rules

1. Don't pause to announce what you're about to do — just do it
2. Don't stop to summarize intermediate progress unless specifically asked
3. If you hit a blocker, document it and work around it, don't stop
4. Complete the full workflow before returning to the user
5. Batch related operations rather than doing them one at a time

### Anti-Patterns

- "Let me check if this is working so far..." → just keep going
- "Now I'll move on to..." → just move on
- "Before I continue..." → continue
- Stopping to explain each step as you go

### Exception

Only pause if you encounter a genuine decision point that requires user input, or if the session health hook warns about context limits.

## Anti-Rationalization Defense

### Common Rationalizations

| Excuse | Reality |
|---|---|
| "This is too simple for TDD" | Simple code breaks too. A test takes 30 seconds. Write it first. |
| "I'll write tests after to verify it works" | Tests written after code pass immediately. Passing immediately proves nothing — you never saw it catch the bug. |
| "I've already manually tested all the edge cases" | Manual testing is ad-hoc. No record, can't re-run, easy to forget cases under pressure. |
| "Deleting X hours of work is wasteful" | Sunk cost fallacy. The time is already gone. Keeping unverified code is technical debt. |
| "Keep the implementation as reference, write tests first" | You'll adapt it. That's testing after. Delete means delete. |
| "Need to explore the problem space first" | Fine. Throw away the exploration, start with TDD. Exploration code is not production code. |
| "TDD will slow me down" | TDD is faster than debugging. "Pragmatic" shortcuts = debugging in production = slower. |
| "Test is hard to write, so the design must be unclear" | Listen to the test. Hard to test = hard to use. The test is telling you something. |
| "The existing code has no tests, adding them later is fine" | You're improving it. Add tests for existing code now, not later. |
| "It's about spirit, not ritual" | Violating the letter of TDD is violating the spirit. Write the test first. |

### Red Flags

- Code written before its test — delete it and start over.
- Test passes immediately upon first run — it's testing existing behavior, not new behavior.
- You can't explain why a test failed — you didn't read the output carefully enough.
- "I'll add tests later" — later never comes. Write it now.
- "Keep as reference" or "adapt existing code" — you'll adapt it. That's testing after.
- "Already spent X hours, deleting is wasteful" — sunk cost fallacy. Start over.
- "TDD is dogmatic, I'm being pragmatic" — TDD IS pragmatic. Debugging in production is not.
- "This is different because..." — it's not. The rules apply.

### Anti-Pattern Callouts

- **Test-after theater:** Writing tests after implementation that pass immediately. These tests prove nothing about correctness — they only prove the code does what it already does.
- **Selective deletion:** Keeping implementation code as "reference" instead of deleting it. You will adapt it. Delete means delete.
- **Exploration-as-production:** Treating exploratory code as the starting point for production code. Exploration is disposable. Start fresh with TDD.

## References

- `references/testing-patterns.md` — AAA structure, boundary mocking, and the >=80% coverage floor this skill's tests should meet.
- `skills/spec-handler` — the failing test is the spec's first handler; write it before the implementation.
