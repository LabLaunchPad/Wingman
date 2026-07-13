---
name: testing-patterns
description: Use when writing or reviewing tests in /wingman:build or any department-lead work — follow AAA structure, mock at boundaries, and target meaningful coverage (>=80% on changed paths). The testing bar, not a formality.
---

<!--
Testing discipline adapted from `affaan-m/ECC` (MIT) and general AAA/mocking
practice; the 80% floor and boundary-mocking guidance restated for Wingman.
Full patterns at `references/testing-patterns.md`. Attribution in
/ATTRIBUTIONS.md.
-->

# Testing Patterns

## Overview

Tests are evidence that the spec's success criteria hold (see `spec-handler`, `verification-before-completion`). They follow Arrange-Act-Assert, mock at boundaries, and cover changed behavior meaningfully — not a line-count ritual.

## When To Use

Whenever `/wingman:build` or a department lead/specialist writes code that should be verified, and when reviewing a change's test coverage.

## Core Workflow

1. **AAA.** Arrange inputs/state, Act on the unit, Assert the observable outcome. One behavior per test; name it for the behavior, not the method.
2. **Mock at boundaries.** Replace clocks, networks, files, and randomness with controlled doubles — test logic, not the boundary's luck.
3. **Red-green.** Write the failing test first (it fails without the change), then make it pass (see `test-driven-development`).
4. **Cover changed paths.** Target >=80% on the paths your change touched, including the error/edge branches, not just the happy path.
5. **No flaky, no mocked-away logic.** A test that can't fail when the code breaks is decoration. Assert real outcomes.

## Rationalizations

| Excuse | Reality |
|---|---|
| "I tested it manually, no test needed" | Manual is not evidence; it doesn't survive the next change. Write the test. |
| "100% coverage is the goal" | Coverage is a floor, not a virtue. A passing test that can't fail is worse than none. |
| "This is too trivial to test" | Trivial one-liners need no test (YAGNI applies to tests too) — but non-trivial branches do. |
| "Mocking everything is safer" | Over-mocking tests the mock, not the code. Mock the boundary, exercise the logic. |

## Red Flags — Stop and Reconsider

- A test that passes even when you break the implementation.
- Assertions on mocks instead of on real outcomes.
- Only happy-path tests on a change with error branches.
- Coverage claimed without a runnable, failing-first test.

## Verification

Run the suite: the new test fails on the old code and passes on the new, and changed paths meet the coverage floor. See `verification-before-completion` and `references/testing-patterns.md`.
