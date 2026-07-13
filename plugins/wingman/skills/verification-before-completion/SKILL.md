---
name: verification-before-completion
description: Use when about to claim work is complete, fixed, or passing, before committing or creating PRs - requires running verification commands and confirming output before making any success claims; evidence before assertions always.
---

<!--
Adapted from obra/superpowers (skills/verification-before-completion), MIT License,
Copyright (c) 2025 Jesse Vincent. See /ATTRIBUTIONS.md for details.
-->

# Verification Before Completion

## Overview

Claiming work is complete without verification is dishonesty, not efficiency.

**Core principle:** Evidence before claims, always.

**Violating the letter of this rule is violating the spirit of this rule.**

## The Iron Law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

If you haven't run the verification command in this message, you cannot claim it passes.

## The Gate Function

```
BEFORE claiming any status or expressing satisfaction:

1. IDENTIFY: What command proves this claim?
2. RUN: Execute the FULL command (fresh, complete)
3. READ: Full output, check exit code, count failures
4. VERIFY: Does output confirm the claim?
   - If NO: State actual status with evidence
   - If YES: State claim WITH evidence
5. ONLY THEN: Make the claim

Skip any step = lying, not verifying
```

## Common Failures

| Claim | Requires | Not Sufficient |
|-------|----------|----------------|
| Tests pass | Test command output: 0 failures | Previous run, "should pass" |
| Linter clean | Linter output: 0 errors | Partial check, extrapolation |
| Build succeeds | Build command: exit 0 | Linter passing, logs look good |
| Bug fixed | Test original symptom: passes | Code changed, assumed fixed |
| Regression test works | Red-green cycle verified | Test passes once |
| Agent completed | VCS diff shows changes | Agent reports "success" |
| Requirements met | Line-by-line checklist | Tests passing |

## Red Flags — STOP

- Using "should", "probably", "seems to"
- Expressing satisfaction before verification ("Great!", "Perfect!", "Done!", etc.)
- About to commit/push/PR without verification
- Trusting agent success reports
- Relying on partial verification
- Thinking "just this once"
- **ANY wording implying success without having run verification**

## Rationalization Prevention

| Excuse | Reality |
|--------|---------|
| "Should work now" | RUN the verification |
| "I'm confident" | Confidence ≠ evidence |
| "Just this once" | No exceptions |
| "Linter passed" | Linter ≠ compiler |
| "Agent said success" | Verify independently |
| "Partial check is enough" | Partial proves nothing |
| "Different words so rule doesn't apply" | Spirit over letter |

## Key Patterns

**Tests:**
```
✅ [Run test command] [See: 34/34 pass] "All tests pass"
❌ "Should pass now" / "Looks correct"
```

**Regression tests (TDD Red-Green):**
```
✅ Write → Run (pass) → Revert fix → Run (MUST FAIL) → Restore → Run (pass)
❌ "I've written a regression test" (without red-green verification)
```

**Build:**
```
✅ [Run build] [See: exit 0] "Build passes"
❌ "Linter passed" (linter doesn't check compilation)
```

**Requirements:**
```
✅ Re-read plan → Create checklist → Verify each → Report gaps or completion
❌ "Tests pass, phase complete"
```

**Agent delegation:**
```
✅ Agent reports success → Check VCS diff → Verify changes → Report actual state
❌ Trust agent report
```

**The One-Check Rule (from engineering-minimalism):**
Non-trivial code paths must leave ONE runnable self-check behind — an `assert`-based `demo()`/`__main__` or one small test. This bridges minimalism and verification: the minimum code that works is unfinished without the minimum check that proves it works. Trivial one-liners are exempt.

```
✅ [Code path] → [assert-based self-check that exercises the path] → [run it, see pass]
❌ "Code works, no test needed for something this simple"
```

Exception: trivial one-liners (single-expression functions, constant assignments) need no test — YAGNI applies to tests too.

**Deliberate Shortcut Verification (from ponytail-debt-harvesting):**
Every `// minimal:` comment must be accompanied by a valid ceiling and upgrade path. Verify:
```
✅ // minimal: O(n²) scan, switch to index if >1000 users
❌ // minimal: this works for now
❌ // TODO: improve later
```

**The Output Rule (from engineering-minimalism):**
After any code change, provide at most three short lines explaining what was skipped and when to add it. If the explanation is longer than the code, delete the explanation.

```
✅ [code] → skipped: [X], add when [Y].
❌ [code] → [5-paragraph essay defending the simplification]
```

**The One-Check Rule (from engineering-minimalism):**
Non-trivial code paths must leave ONE runnable self-check behind — an `assert`-based `demo()`/`__main__` or one small test. This bridges minimalism and verification: the minimum code that works is unfinished without the minimum check that proves it works. Trivial one-liners are exempt.

```
✅ [Code path] → [assert-based self-check that exercises the path] → [run it, see pass]
❌ "Code works, no test needed for something this simple"
```

Exception: trivial one-liners (single-expression functions, constant assignments) need no test — YAGNI applies to tests too.

## Why This Matters in Wingman

Wingman tells a non-technical founder that a stage is done. If that claim is wrong, the founder has no independent way to catch it — they're trusting the plugin. Unverified "done" claims are the single fastest way to destroy that trust and ship broken software to real users.

## When To Apply

**ALWAYS before:**
- ANY variation of success/completion claims
- ANY expression of satisfaction
- ANY positive statement about work state
- Committing, PR creation, task completion
- Moving to the next `/wingman:*` stage
- Delegating to a boardroom agent or subagent

## The Bottom Line

**No shortcuts for verification.**

Run the command. Read the output. THEN claim the result.

This is non-negotiable.

## Anti-Rationalization Defense

### Common Rationalizations

| Excuse | Reality |
|---|---|
| "I can see it works" | You haven't run the command. Seeing is not verifying. Visual inspection is not evidence. |
| "I'll verify after I finish the next task" | Verification debt compounds. The next task might break what you just built. Verify now. |
| "The linter passed, so it's fine" | Linter is one gate, not all gates. Tests, builds, and security checks are separate verification claims. |
| "The agent reported success" | Agent self-reports are not evidence. Check the VCS diff and run the tests yourself. |
| "I already ran this earlier" | "Earlier" is not "now." Fresh evidence only — the state may have changed. |
| "Just this once, I'll skip the full cycle" | The first exception is the only one that matters. Run the command. |
| "Different wording so the rule doesn't apply" | Spirit over letter. If you're finding creative ways to restate a success claim without verification, you're rationalizing. |

### Red Flags

- Using "should," "probably," "seems to" before any completion claim.
- Expressing satisfaction ("Great!", "Perfect!", "Done!") before running verification.
- About to commit, push, or create a PR without fresh test output.
- Trusting a subagent's success report without independent verification.
- Relying on a partial check when the full check exists.
- Thinking "just this once" — that phrase is the rationalization flag, not the exception.
- Claiming requirements are met based on tests passing without re-reading the requirements.

### Anti-Pattern Callouts

- **Verification theater:** Running a command but not reading the output is not verification. Read the full output, check the exit code, count the failures.
- **Historical evidence:** Citing a previous test run as current evidence. Only fresh runs count.
- **Proxy verification:** Using one passing check as evidence for a different, unrelated claim (e.g., "linter passed" proving "build succeeds").
