---
name: systematic-debugging
description: Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes. Triggers whenever /wingman:build (including its Definition-of-Done gate) hits something the plan didn't anticipate, and is the required first step of /wingman:hotfix before any production fix is proposed.
---

<!--
Adapted from obra/superpowers (skills/systematic-debugging), MIT License,
Copyright (c) 2025 Jesse Vincent. See /ATTRIBUTIONS.md for details.
Adjustments from upstream: references to supporting files not bundled with
Wingman (root-cause-tracing.md, defense-in-depth.md, condition-based-waiting.md)
and to superpowers' own test-driven-development skill are removed or
generalized; "your human partner" is generalized to "the founder or reviewer."
-->

# Systematic Debugging

## Overview

Random fixes waste time and create new bugs. Quick patches mask underlying issues.

**Core principle:** ALWAYS find root cause before attempting fixes. Symptom fixes are failure.

## The Iron Law

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

If you haven't completed Phase 1, you cannot propose fixes.

## When to Use

Use for ANY technical issue: test failures, bugs, unexpected behavior, performance problems, build failures, integration issues.

**Use this ESPECIALLY when:**
- Under time pressure (emergencies make guessing tempting)
- "Just one quick fix" seems obvious
- You've already tried multiple fixes
- Previous fix didn't work
- You don't fully understand the issue

**Don't skip when:** the issue seems simple (simple bugs have root causes too) or you're in a hurry (rushing guarantees rework — systematic is faster than thrashing).

## The Four Phases

You MUST complete each phase before proceeding to the next.

### Phase 1: Root Cause Investigation

**BEFORE attempting ANY fix:**

1. **Read Error Messages Carefully** — don't skip past errors or warnings, they often contain the exact solution. Read stack traces completely. Note line numbers, file paths, error codes.
2. **Reproduce Consistently** — can you trigger it reliably? What are the exact steps? If not reproducible, gather more data, don't guess.
3. **Check Recent Changes** — what changed that could cause this? Git diff, recent commits, new dependencies, config changes, environmental differences.
4. **Gather Evidence in Multi-Component Systems** — when a system has multiple components (e.g. a Boardroom seat calling into a department lead calling into a script), add diagnostic instrumentation at each boundary before proposing fixes: log what data enters and exits each component, verify environment/config propagation, check state at each layer. Run once to gather evidence showing WHERE it breaks, then investigate that specific component.
5. **Trace Data Flow** — when the error is deep in a call chain, trace backward: where does the bad value originate? What called this with the bad value? Keep tracing up until you find the source. Fix at the source, not at the symptom.

### Phase 2: Pattern Analysis

1. **Find Working Examples** — locate similar working code in the same codebase. What works that's similar to what's broken?
2. **Compare Against References** — if implementing a pattern, read the reference implementation completely. Don't skim.
3. **Identify Differences** — list every difference between working and broken, however small. Don't assume "that can't matter."
4. **Understand Dependencies** — what other components, settings, config, or environment does this need? What assumptions does it make?

### Phase 3: Hypothesis and Testing

1. **Form a Single Hypothesis** — state clearly: "I think X is the root cause because Y." Be specific, not vague.
2. **Test Minimally** — make the smallest possible change to test the hypothesis. One variable at a time.
3. **Verify Before Continuing** — did it work? Yes → Phase 4. No → form a new hypothesis. Don't add more fixes on top.
4. **When You Don't Know** — say "I don't understand X." Don't pretend to know. Research more, or escalate to the founder or reviewer if it's a business-relevant tradeoff.

### Phase 4: Implementation

1. **Create a Failing Test Case** — simplest possible reproduction, automated if a test framework exists, a one-off script otherwise. Must exist before fixing.
2. **Implement a Single Fix** — address the root cause identified. One change at a time. No "while I'm here" improvements, no bundled refactoring.
3. **Verify the Fix** — test passes now? No other tests broken? Issue actually resolved? (See `verification-before-completion` — evidence before claims, always.)
4. **If the Fix Doesn't Work** — stop and count how many fixes you've tried. Fewer than 3: return to Phase 1 with the new information. **3 or more: stop and question the architecture** (below) — do not attempt a 4th fix without that discussion.
5. **If 3+ Fixes Failed: Question the Architecture** — a pattern where each fix reveals new shared state/coupling in a different place, or each fix creates new symptoms elsewhere, indicates an architectural problem, not a failed hypothesis. Surface this plainly (translated to plain language if it's founder-facing) rather than attempting fix #4.

## Red Flags — STOP and Follow the Process

If you catch yourself thinking any of these, stop and return to Phase 1:
- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "Skip the test, I'll manually verify"
- "It's probably X, let me fix that"
- "I don't fully understand but this might work"
- "One more fix attempt" (when 2+ have already failed)
- Proposing solutions before tracing data flow

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Issue is simple, don't need process" | Simple issues have root causes too. Process is fast for simple bugs. |
| "Emergency, no time for process" | Systematic debugging is FASTER than guess-and-check thrashing. |
| "Just try this first, then investigate" | First fix sets the pattern. Do it right from the start. |
| "Multiple fixes at once saves time" | Can't isolate what worked. Causes new bugs. |
| "I see the problem, let me fix it" | Seeing symptoms ≠ understanding root cause. |
| "One more fix attempt" (after 2+ failures) | 3+ failures = architectural problem. Question the pattern, don't fix again. |

## Quick Reference

| Phase | Key Activities | Success Criteria |
|-------|---------------|------------------|
| **1. Root Cause** | Read errors, reproduce, check changes, gather evidence | Understand WHAT and WHY |
| **2. Pattern** | Find working examples, compare | Identify differences |
| **3. Hypothesis** | Form theory, test minimally | Confirmed or new hypothesis |
| **4. Implementation** | Create test, fix, verify | Bug resolved, tests pass |

## When Process Reveals "No Root Cause"

If systematic investigation reveals the issue is truly environmental, timing-dependent, or external: document what you investigated, implement appropriate handling (retry, timeout, clear error message), and add logging for future investigation. Most "no root cause" conclusions are actually incomplete investigation — check that before accepting this outcome.

## Related Skills

- **verification-before-completion** — verify the fix worked, with fresh evidence, before claiming success.

## Continuous Execution

See `references/continuous-execution.md` — maintain momentum through a workflow once started; don't pause to narrate or summarize mid-flight.


## Anti-Rationalization Defense

### Common Rationalizations

| Excuse | Reality |
|---|---|
| "The bug is obvious, I don't need the full process" | Simple bugs have root causes too. Process is fast for simple bugs — that's by design. |
| "It's an emergency, no time for process" | Systematic debugging is FASTER than guess-and-check thrashing. The emergency is why you need the process. |
| "Let me just try this fix first, then investigate" | First fix sets the pattern. Do it right from the start. |
| "I'll fix multiple things at once to save time" | Can't isolate what worked. Causes new bugs. One change at a time. |
| "I can see the problem in the code" | Seeing symptoms ≠ understanding root cause. Trace the data flow. |
| "Two fixes already failed, but I have another idea" | 3+ failures = architectural problem. Question the pattern, don't fix again. |
| "This doesn't reproduce consistently, so I'll just patch it" | Non-reproducible means you haven't gathered enough data. Add logging, then reproduce. |
| "I'll investigate later if the fix doesn't work" | First fix sets the pattern. Later is never. Investigate now. |

### Red Flags

- "Quick fix for now, investigate later" — the quick fix becomes the permanent fix.
- "Just try changing X and see if it works" — that's guessing, not debugging.
- "Skip the test, I'll manually verify" — manual verification is ad-hoc, not systematic.
- "It's probably X, let me fix that" — "probably" is a hypothesis, not a conclusion. Test it.
- "One more fix attempt" after 2+ failures — 3 failures is the architecture-questioning threshold.
- Proposing solutions before tracing data flow — you're fixing the symptom, not the cause.
- "I don't fully understand but this might work" — say "I don't understand X" and research more.

### Anti-Pattern Callouts

- **Guess-and-check:** Making changes to see if they work, without a hypothesis, is the definition of thrashing. Each guess creates new state that obscures the root cause.
- **Fix stacking:** Applying fix #2 on top of fix #1 without reverting #1 means you can't isolate what changed. One fix at a time.
- **Architectural blindness:** 3+ failed fixes on different parts of the system indicate coupling or design problems. Surface this plainly rather than attempting fix #4.
