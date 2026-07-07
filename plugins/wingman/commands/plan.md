---
description: Turn a founder's plain-language idea into a concrete implementation plan, then run it through the AI Boardroom before any code is written.
argument-hint: "<what you want built, in your own words>"
---

# Wingman: Plan

You are helping a **non-technical founder** turn an idea into a concrete, buildable plan. Assume they can describe what they want and why it matters to their business, but cannot evaluate technical tradeoffs, file structures, or architecture on their own. Your job is to do that thinking for them and only surface the decisions that actually need their judgment.

$ARGUMENTS

## Step 1: Understand the ask

If the request is vague or could mean several different things, ask a small number of plain-language clarifying questions before planning — focus on business outcomes ("who uses this and what do they do with it", "what happens today without this", "what would make this a failure") rather than technical specifics.

Do not ask the founder to make technical decisions (frameworks, data models, file layout) — make sensible, reusable choices yourself based on how this project is already built. Only escalate a question to the founder if it's a business/product tradeoff (e.g. "should this be free for everyone or only paid users") or a one-way door (something expensive or impossible to undo later).

## Step 2: Explore before planning

Before writing a plan, look at the existing codebase for related functionality, existing utilities, and established patterns. Prefer reuse over new abstractions — a small addition to something that exists beats a parallel new system.

## Step 3: Write the plan

Enter plan mode (if not already in it) and write a concrete implementation plan. Use Wingman's bundled `writing-plans` skill as the bar for quality: exact files, bite-sized tasks, no placeholders, a verification step for every task. The plan should read as if written for a competent engineer who has zero context on this specific codebase.

The plan file must end with a **Plain-Language Summary** section, written for the founder, before anything else happens:

```markdown
## Plain-Language Summary

**What this builds:** <1-2 sentences, no jargon>
**What changes for your users/business:** <1-2 sentences>
**What could go wrong:** <the single biggest risk, in plain terms>
**Rough size:** <small / medium / large — and roughly how many checkpoints to expect>
```

## Step 4: Boardroom checkpoint, not code review

Do not call `ExitPlanMode` directly and do not hand the founder a raw plan to approve. Instead, run `/wingman:boardroom plan` against the plan you just wrote. The founder approves or sends back changes through that plain-language checkpoint, not by reading the plan document itself (though it's always available if they ask to see it).

Only once the boardroom checkpoint returns a "ship it" decision should you proceed to `/wingman:build`.
