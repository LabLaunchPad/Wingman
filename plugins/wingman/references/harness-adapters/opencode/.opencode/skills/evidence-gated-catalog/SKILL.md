---
name: evidence-gated-catalog
description: Use when proposing a new skill, command, or pattern for Wingman's catalog — require evidence it actually works before it enters; no untested patterns allowed.
---

<!--
Adapted from addyosmani/agent-skills (Evidence Gating for New Skills).
Core insight preserved, structure aligned to Wingman skill conventions.
-->

# Evidence-Gated Catalog

## Overview

A skill that has never been tested in the real world is a hypothesis, not a capability. Adding untested patterns to Wingman's catalog creates false confidence — the agent trusts the skill, the skill was never validated, and failures are blamed on the user or the codebase instead of the skill.

**Core principle:** no pattern enters the catalog without evidence it works. No pattern stays in the catalog without evidence it still works.

## When To Use

- Adding a new skill to Wingman's catalog
- Adding a new command or workflow pattern
- Promoting a draft pattern to a higher tier
- Reviewing whether an existing pattern should be demoted or removed
- Any decision about what belongs in the catalog

## Evidence Requirements

Every pattern must pass all three gates before entering the catalog:

### Gate 1: Real-World Test Case

At least one documented instance where the pattern was applied to a real problem and produced the intended outcome.

- Must include: the problem, the pattern applied, and the result
- Must be from an actual session, not a hypothetical
- Must include enough context to reproduce the test

### Gate 2: Negative Test

At least one documented instance of what the pattern should NOT do or should NOT be used for.

- Must include: a scenario that looks like a match but isn't
- Must explain why the pattern fails or misleads in that scenario
- This prevents over-triggering and scope creep

### Gate 3: Measurable Outcome

A concrete metric that improves when this pattern is used vs. when it isn't.

- Must be measurable (not "feels better")
- Examples: fewer round-trips to resolve a bug, reduced code churn on affected files, faster time-to-implementation for tasks that use the pattern
- Must be stated before the test, not rationalized after

## Catalog Entry Template

Every new catalog entry must include:

```markdown
---
name: [pattern-name]
description: [one-liner]
status: [draft | tested | proven | standard]
---

# [Pattern Name]

## Purpose
[What problem does this solve?]

## When to Use
[Specific triggers — what situations invoke this pattern?]

## When NOT to Use
[Specific anti-triggers — what situations look similar but aren't?]

## Evidence

### Test Case 1
- Problem: [description]
- Pattern applied: [what was done]
- Result: [what happened]
- Measured outcome: [metric before vs. after]

### Negative Test 1
- Scenario: [what looked like a match]
- Why it fails: [why the pattern doesn't apply here]

### Measurable Outcome
- Metric: [what improved]
- Baseline: [what it was before]
- After: [what it is now]
- Confidence: [how many data points, how reliable]
```

## Graduated Promotion

Patterns move through tiers based on accumulated evidence:

| Tier | Requirements | Privileges |
|---|---|---|
| **Draft** | Entry template complete, no real-world test yet | Listed in catalog but marked as experimental. Triggers a warning when invoked. |
| **Tested** | Gate 1 passed (at least 1 real-world test case) | Usable in sessions. Not referenced by other skills yet. |
| **Proven** | Gates 1-3 passed (real-world test + negative test + measurable outcome) | Can be referenced by other skills. Can be used in pipeline commands. |
| **Standard** | Proven across 3+ independent projects/contexts with consistent outcomes | Default-on. Referenced by pipeline commands. Can be promoted to department lead activation signal. |

### Promotion Process

1. Author completes the catalog entry template with evidence for all three gates.
2. Run `/wingman:evolve` — it checks evidence completeness and promotes if gates pass.
3. If evidence is incomplete, `/wingman:evolve` returns the entry to draft with a list of missing gates.

### Demotion Process

1. During `/wingman:audit` or `/wingman:harness`, if a pattern's evidence is stale or contradicted by new data, flag it.
2. Stale patterns (no verified test case in 6 months or 3+ project contexts) are demoted one tier.
3. Patterns that fail their own measurable outcome are returned to draft.

## Verification

Before trusting a catalog entry's evidence:

1. Check the test case descriptions are specific enough to reproduce.
2. Check the negative test covers a realistic failure scenario, not a straw man.
3. Check the measurable outcome has a stated baseline and a stated after — vague "improvement" is not evidence.
4. If the pattern references other patterns, verify those references have their own evidence.

## Anti-Rationalization Defense

### Common Rationalizations

| Excuse | Reality |
|---|---|
| "This pattern clearly works, I've seen it work" | "Seeing it work" is an anecdote, not evidence. Document the test case. If you can't reproduce it, you can't prove it works. |
| "The negative test is obvious, everyone knows when not to use it" | If it's obvious, writing it down costs nothing. If it's not obvious to a future user, skipping it costs them a wrong application. |
| "Measurable outcomes are too much overhead for a simple pattern" | Then it's a simple pattern that's easy to measure. No overhead excuse. If you can't measure it, you can't prove it works, and it shouldn't be in the catalog. |
| "I'll add the evidence later" | Later never comes. If the evidence doesn't exist now, the pattern stays in draft. No exceptions. |
| "This pattern is just common sense" | Common sense patterns still need evidence they trigger correctly and don't over-apply. "Obvious" patterns cause the most over-confidence failures. |
| "The catalog is too small, we need more patterns" | A catalog of 10 patterns with evidence beats a catalog of 100 patterns without evidence. Quantity without quality is noise. |
| "Other projects use this pattern successfully" | Then document those projects as evidence. "Other projects" without specifics is an appeal to invisible authority. |

### Red Flags

- A pattern has no test case — only a description of what it should do.
- The negative test is a trivial edge case that doesn't represent real misuse.
- The measurable outcome is stated after the fact, not before the test.
- Evidence references "generally observed" or "widely known" without specifics.
- A pattern is being promoted to bypass the evidence gates ("it's obviously good").
- An existing pattern's evidence hasn't been refreshed in 6+ months.

### Anti-Pattern Callouts

- **Evidence-as-afterthought:** Writing the evidence section after promoting the pattern. Evidence must exist before promotion, not be rationalized after.
- **Straw-man negatives:** Writing a negative test that no reasonable person would trigger. The negative test must cover a realistic misuse scenario.
- **Vague outcomes:** "This pattern improves code quality" without a measurable metric. Quality is not measurable unless you define what you're measuring.
- **Catalog-bloat:** Adding patterns to make the catalog look impressive. Every pattern without evidence is a liability, not an asset.
- **Testimonial-as-evidence:** "Someone said this worked for them" without documentation. Testimonials are not reproducible.

## Referenced by

- `commands/adaptive/evolve.md`
