---
name: doubt-driven-development
description: Use when you catch yourself assuming correctness, completeness, or safety without evidence — writing or reviewing code, declaring tests sufficient, or about to ship/merge/promote. Treat doubt as a quality signal that triggers evidence-gathering before shipping.
---

# Doubt-Driven Development

Doubt is a feature, not a bug. When you're uncertain, that's your cue to investigate further, not to barrel ahead.

## When to Use This Skill

Use this skill whenever you catch yourself making assumptions about correctness, completeness, or safety — especially during implementation, review, or before declaring work done. Triggers:

- Writing or modifying production code
- Reviewing your own changes before committing
- Declaring tests sufficient
- Merging, shipping, or promoting code
- Responding to a code review comment with "that should be fine"

## Core Principle

**Doubt drives investigation. Investigation drives quality.**

Comfort is the enemy of correctness. The moment you feel confident without evidence, that's the moment to pause and ask: *what am I missing?*

## Doubt Triggers

These phrases in your own reasoning are red flags. When you hear yourself think or say them, invoke the resolution protocol.

| Trigger Phrase | What It Actually Means | Doubt It Because |
|---|---|---|
| "This should be enough" | You're guessing at sufficiency | Test coverage gaps exist where you haven't looked |
| "I think this covers it" | You're relying on memory, not evidence | Memory is lossy; grep is not |
| "Tests pass" | The happy path works | Passing tests don't prove the absence of bugs |
| "It works on my machine" | Your environment is non-representative | Environments diverge; CI exists for a reason |
| "No one will notice" | You're optimizing for speed over correctness | Someone will notice; it's always someone who matters |
| "It's just a small change" | You're minimizing risk without assessing it | Small changes break things in proportion to how little you looked |
| "Nobody reads this code" | You're rationalizing sloppiness | You read it; future-you reads it; AI reads it |
| "I'll fix it later" | You're deferring known debt | Later never comes until it's an incident |

## Doubt Resolution Protocol

When a doubt trigger fires, follow these four steps in order. Do not skip to step 4.

### Step 1: Name the doubt

State it explicitly. Write it down if needed.

```
Doubt: I'm not sure this edge case is handled.
Doubt: I'm assuming the existing tests cover this path.
Doubt: I haven't verified this works in the CI environment.
```

### Step 2: Identify what evidence would resolve it

Be specific. Vague doubts produce vague investigation.

```
Evidence needed: A test that exercises the empty-input edge case.
Evidence needed: Coverage report showing the modified function.
Evidence needed: CI run on the target branch.
```

### Step 3: Gather that evidence

Run the test. Check the coverage report. Read the code path. Ask the question. Do not stop until you have the evidence or have confirmed it is unavailable.

### Step 4: Make a decision based on evidence, not comfort

If the evidence confirms your assumption, proceed with documented confidence. If it doesn't, fix the gap before moving on. "Good enough" is only acceptable when backed by data.

## Integration Points

### With verification-before-completion

Doubt-driven development is the input layer for verification. Every doubt becomes a verification task:

1. Doubt fires → name it
2. Verification loop executes → gather evidence
3. Evidence resolves doubt → proceed or fix

Never claim work is complete without first running the doubt trigger list against your changes.

### With test-driven-development

Doubt should shape *what* you test, not just *that* you test. Before writing a test:

- What am I assuming about the input range?
- What edge cases am I not thinking about?
- What would break if my implementation is wrong?

If you can't name what a test is protecting against, the test is theater. Rewrite it with a clear purpose.

## Anti-Rationalization Defense

The greatest threat to doubt-driven development is your own ability to explain away doubts. Watch for these patterns:

### Rationalization Table

| Rationalization | Correct Response |
|---|---|
| "The test covers the important cases" | List the unimportant cases. Now doubt that they're unimportant. |
| "This code path is rarely hit" | Rare paths break rarely, and when they break, they break spectacularly. Verify it. |
| "I've done this a hundred times" | Then you've done it wrong in ways you've normalized. Check the last one. |
| "The code review will catch it" | You are the first reviewer of your own code. Don't outsource your doubt. |
| "It's documented so it's fine" | Documentation is not validation. Verify the docs match reality. |
| "We can revert if it breaks" | Revert has costs. Find the bug before it finds you. |
| "The deadline is today" | Shipping broken code costs more time than shipping one day late. |

### Red Flags Specific to Doubt-Driven Development

These patterns indicate you're performing doubt theater rather than practicing doubt-driven development:

- **Doubt without investigation** — You notice uncertainty but keep going anyway. Doubt without action is anxiety, not discipline.
- **Investigation without decision** — You gather evidence but then ignore it because it's inconvenient. Evidence without decision is procrastination.
- **Decision without documentation** — You resolved a doubt but didn't record what you found. The next person will re-doubt the same thing.
- **Doubt only on trivial things** — You doubt formatting choices but not architectural assumptions. Doubt the things that can hurt you.
- **Performative doubt** — You list doubts to look thorough but don't actually investigate them. Doubt is not a checklist; it's a commitment to truth.

## Quick Reference

Before declaring work done, ask:

1. What did I assume without verifying?
2. What would I doubt if someone else wrote this?
3. What evidence do I have that this is correct?
4. What would I need to see to be confident?
5. Have I documented my reasoning?
