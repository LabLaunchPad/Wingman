---
name: verification-loop
description: Use when completing features, opening PRs, or refactoring in a Wingman session — run this comprehensive verification loop to confirm quality gates pass before declaring done.
---

# Verification Loop

A phased verification system that runs after code changes to ensure quality.

## When to Use

- After completing a feature or significant code change
- Before creating a PR or running `wingman:ship`
- After refactoring
- When quality gates need to pass
- During `wingman:build`'s Definition-of-Done security pass

## Verification Phases

### Phase 1: Build Verification

Run the project's build command. If build fails, STOP and fix before continuing.

### Phase 2: Type Check

Run the project's type checker. Report all type errors. Fix critical ones before continuing.

### Phase 3: Lint Check

Run the project's linter. Report errors and warnings.

### Phase 4: Test Suite

Run the full test suite with coverage. Target: 80% minimum.

Report:
- Total tests: X
- Passed: X
- Failed: X
- Coverage: X%

### Phase 5: Security Scan

Check for:
- Hardcoded secrets (API keys, passwords, tokens)
- Console.log statements in production code
- Unsanitized user inputs
- Missing error handling

### Phase 6: Diff Review

Show what changed. Review each changed file for:
- Unintended changes
- Missing error handling
- Potential edge cases

### Phase 7: Bloat Detection

Apply the 5-tag taxonomy to all new code:
- `#delete` — can it be removed entirely?
- `#stdlib` — does this exist in stdlib/framework?
- `#native` — can browser/OS APIs handle this?
- `#yagni` — is anyone asking for this?
- `#shrink` — can it be fewer lines?

### Phase 8: Debt Ceiling Check

If `debt-ledger` has been run, check if any category exceeds 50%. If yes, recommend harvest before continuing.

## Output Format

After running all applicable phases, produce a verification report:

```
VERIFICATION REPORT
==================

Build:     [PASS/FAIL]
Types:     [PASS/FAIL] (X errors)
Lint:      [PASS/FAIL] (X warnings)
Tests:     [PASS/FAIL] (X/Y passed, Z% coverage)
Security:  [PASS/FAIL] (X issues)
Diff:      [X files changed]
Bloat:     [CLEAN/N] tags found
Debt:      [OK/OVER] (X% max category)

Overall:   [READY/NOT READY] for next step

Issues to Fix:
1. ...
2. ...
```

## Continuous Mode

For long sessions, run verification:
- After completing each function
- After finishing a component
- Before moving to next task

## Integration with Hooks

This skill complements PostToolUse hooks but provides deeper verification.
Hooks catch issues immediately; this skill provides comprehensive review.

## Integration with Pipeline

- **wingman:build** — Run verification after each task, including the Definition-of-Done security scan
- **wingman:ship** — Run verification before preflight checks
- **wingman:boardroom** — Reference verification results in engineer seat

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
| "Build passes, the rest is probably fine" | Each phase checks a different failure class. Build success proves compilation, not types, not lint, not tests, not security. |
| "I'll skip the security scan, there's no sensitive data" | You don't know there's no sensitive data until you check. Hardcoded secrets and unsanitized inputs exist in codebases that "don't have sensitive data." |
| "Coverage is already at 75%, close enough to 80%" | 80% is the threshold. 75% is below it. Write more tests. |
| "I'll run the verification loop at the end, not after each task" | Verification debt compounds. A bug introduced in Task 1 that's caught in Task 10 is 10 tasks of wasted context. Verify continuously. |
| "The diff looks clean, no need for bloat detection" | The 5-tag taxonomy catches things visual review misses. Run the tags. |
| "I already ran the linter earlier, no need to run it again" | Code changes since the last lint run may have introduced new issues. Fresh run only. |
| "Phase 5 found nothing, so I'll skip phases 6-8" | Each phase is independent. Skipping later phases because earlier ones passed is the same as skipping the whole loop. |

### Red Flags

- Skipping a phase because an earlier phase passed — each phase checks a different failure class.
- Reporting "PASS" on a phase without actually running the command.
- Stopping at Phase 4 (tests) and calling verification complete — Phases 5-8 exist for a reason.
- Running verification only at the end of a large task instead of continuously.
- Not reading the full output of a verification command.
- Skipping the security scan because "there's no sensitive data."

### Anti-Pattern Callouts

- **Partial verification:** Running only some phases and claiming verification is complete. Each phase catches a different class of failure. Skipping any phase leaves a blind spot.
- **Verification-as-formality:** Running the command but not reading the output. Verification theater is worse than no verification — it creates false confidence.
- **End-only verification:** Running the full loop only at the end of a large task instead of continuously. Verification debt compounds — a bug caught early costs minutes, a bug caught late costs hours.
