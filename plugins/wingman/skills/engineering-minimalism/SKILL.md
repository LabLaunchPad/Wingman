---
name: engineering-minimalism
description: Use when writing or reviewing code during /wingman:build or any department-lead work — before adding a new abstraction, dependency, or line of code, and before proposing a fix. Does not apply to founder-facing explanations, which stay fully explained regardless of how minimal the underlying code is.
---

<!--
Adapted from DietrichGebert/ponytail (MIT License, Copyright (c) 2026
DietrichGebert — see /ATTRIBUTIONS.md), with the decision ladder and
"when NOT to be lazy" carve-out drawn directly from that skill. The
assumption-surfacing and verifiable-success-criteria framing is inspired
by ideas publicly described by Andrej Karpathy and packaged by
multica-ai/andrej-karpathy-skills (MIT, declared in that repo's
plugin.json/README.md/SKILL.md frontmatter though it has no standalone
LICENSE file) — those ideas are restated here in Wingman's own words,
not quoted, which is the right approach regardless of license status.
-->

# Engineering Minimalism

## Overview

The best code is the code that didn't need to be written. This skill governs how Wingman's build-time workers (department leads, and `/wingman:build` itself) approach new code and bug fixes — it does not change how much gets explained to the founder, only how much gets built.

**Core principle:** at every decision point, take the smallest step that actually solves the problem, and say so out loud when you do.

## When To Use

Any time `/wingman:build`, a department lead, or a specialist is about to write new code, add a dependency, or propose a fix.

## Core Workflow

**1. The decision ladder — stop at the first rung that holds:**
1. Does this need to exist at all? If the task can be dropped or the ask satisfied without new code, say so in one line and stop.
2. Does the codebase already do this, or something close enough to extend? Reuse before adding.
3. Does the language/framework standard library already solve this?
4. Does the platform already offer this natively?
5. Is there already an installed dependency that does this?
6. Can this be a one-liner?
7. Only then: write the minimum new code that solves the actual problem.

**2. Before proposing a fix, surface your assumptions.** State plainly what you're assuming about the task, present more than one interpretation if the request is genuinely ambiguous, and ask rather than silently pick one when the ambiguity is consequential. Don't guess at the goal when it's cheap to confirm it.

**3. Reframe vague asks into a verifiable success criterion.** Turn "fix the bug" into "write a failing test that reproduces it, then make it pass." For multi-step work, state the plan and how each step will be checked before starting.

**4. Bug fixes address the root cause, not the symptom.** Before patching, find every caller of the affected code, not just the one that surfaced the bug.

**5. Touch only what the task requires.** Don't refactor or "improve" unrelated code while you're in the area. Clean up dead code or imports your own change orphaned; leave other pre-existing dead code alone, but mention it if you noticed it.

**6. Mark deliberate shortcuts.** If you take a rung-6/7 shortcut instead of a more complete rung-2/3 solution because of a real time or scope constraint, say so explicitly and name what a more complete version would look like — don't let a shortcut masquerade as the finished design.

**7. The output rule.** Code first. Then at most three short lines: what was skipped, when to add it. No essays, no feature tours, no design notes. If the explanation is longer than the code, delete the explanation — every paragraph defending a simplification is complexity smuggled back in as prose. Pattern: `[code] → skipped: [X], add when [Y].`

**8. The `minimal:` comment convention.** Mark deliberate simplifications that cut a real corner with a known ceiling (global lock, O(n²) scan, naive heuristic) with a `// minimal: <ceiling>, <upgrade path>` comment. This creates an auditable trail of shortcuts that can't rot silently into permanent debt. Example: `// minimal: global lock, per-account locks if throughput matters`

## Intensity Levels

| Level | Enforcement |
|-------|-------------|
| **lite** | Build what's asked, but name the lazier alternative in one line. User picks. |
| **full** | The ladder enforced. Stdlib and native first. Shortest diff, shortest explanation. Default. |
| **ultra** | YAGNI extremist. Deletion before addition. Ship the one-liner and challenge the rest of the requirement in the same breath. |

Switch via `/wingman:build --intensity lite|full|ultra` or say "minimalism lite/ultra". Level persists until changed or session end.

## Constraints

**MUST NOT simplify away, regardless of ladder rung:**
- Input validation at trust boundaries
- Error handling that prevents data loss
- Security-relevant checks (auth, injection prevention, secrets handling — see `boardroom-security`'s checklist)
- Accessibility basics
- Anything the founder explicitly asked for, even if it seems like more than the "minimal" solution

**Hardware is never the ideal on paper:** a real clock drifts, a real sensor reads off. Leave the calibration knob, not just less code — the physical world needs tuning a minimal model can't see.

These are the load-bearing exception to "smallest step wins" — minimalism applies to *how much code exists*, never to *how carefully the code that must exist is written*.

## The One-Check Rule

Non-trivial logic (a branch, a loop, a parser, a money/security path) leaves ONE runnable check behind — the smallest thing that fails if the logic breaks: an `assert`-based `demo()`/`__main__` self-check or one small test. No frameworks, no fixtures, no per-function suites unless asked. Trivial one-liners need no test; YAGNI applies to tests too.

This rule bridges minimalism and verification: the minimum code that works is unfinished without the minimum check that proves it works.

## Rationalizations

| Excuse | Reality |
|---|---|
| "I'll add the config/flexibility now, we'll need it later" | Speculative abstraction is exactly what this skill exists to prevent — add it when a second real use case shows up, not before. |
| "While I'm in here, let me also clean up this other thing" | Out of scope for this task — note it, don't do it, unless asked. |
| "This shortcut is basically the real solution" | If it's a shortcut, say so and name the gap — don't let it pass as complete. |
| "The bug is obviously in this one function" | Grep every caller first — the root cause is often upstream of where the symptom appeared. |

## Red Flags — Stop and Reconsider

- You're about to add a new dependency for something the standard library or an existing dependency already does.
- You're about to write a config system, plugin architecture, or generic abstraction for a single current use case.
- You're refactoring code the task didn't ask you to touch.
- You're about to skip input validation, error handling, security checks, or accessibility "to keep it minimal."
- You've patched the same symptom more than once without checking for a shared root cause.
- You're changing quote style, adding type hints, or adding docstrings beyond what the task requires (style drift).
- Your success criterion could be paraphrased as "make it work" — reframe it into something verifiable.
- Would a senior engineer say this is overcomplicated? If yes, simplify.
- New code exceeds ~3x the length you'd expect for the task — consider whether a simpler rung was missed.

## Verification

Every non-trivial code path this skill produces should leave behind one runnable self-check (a test, or at minimum an assert-based demonstration) — minimalism applies to production code, not to whether the work can be verified. See `verification-before-completion` for what counts as evidence before claiming the work is done.

## Output

No fixed template. The test: could someone reading the diff point to the specific rung of the ladder that justified each piece of new code? If a simpler rung would have worked and wasn't tried, the diff isn't minimal yet.

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
| "It's already small enough" | Run `/wingman:over-engineering-review`'s 5-tag taxonomy against it — check each tag (`#delete`, `#stdlib`, `#native`, `#yagni`, `#shrink`) before declaring it done. |
| "I need flexibility for future cases" | Speculative abstraction is exactly what this skill exists to prevent — add it when a second real use case shows up, not before. |
| "I'm already in this file, might as well clean up more" | Out of scope for this task — note it, don't do it, unless asked. Scope creep disguised as diligence. |
| "The shortcut works fine, no need to mark it" | Every shortcut without a `// minimal:` comment is invisible debt. Mark it or it rots silently. |
| "This bug fix is obvious, no need to trace callers" | Grep every caller first — the root cause is often upstream of where the symptom appeared. |
| "The explanation justifies why this is minimal" | If the explanation is longer than the code, you're smuggling complexity back in as prose. Delete it. |

### Red Flags

- You're about to add a new dependency for something the standard library already does.
- You're writing a config system or plugin architecture for a single current use case.
- You're refactoring code the task didn't ask you to touch.
- You're skipping input validation, error handling, or security checks "to keep it minimal."
- Your explanation is longer than your code.
- You've patched the same symptom more than once without checking for a shared root cause.
- You're changing quote style, adding type hints, or adding docstrings beyond what the task requires.
- Would a senior engineer say this is overcomplicated? If yes, simplify.

### Anti-Pattern Callouts

- **YAGNI-as-excuse:** YAGNI means "don't build it yet," not "don't build it correctly." The one-check rule still applies.
- **Minimalism-as-cutting-corners:** Minimalism applies to *how much code exists*, never to *how carefully the code that must exist is written*. Never simplify away validation, security, or accessibility.
- **Explanation-as-complexity:** A paragraph defending a simplification is complexity smuggled back in as prose. Three short lines maximum.
