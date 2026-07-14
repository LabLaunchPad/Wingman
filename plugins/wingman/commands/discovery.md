---
description: Clarify a founder's raw idea into a clear problem statement, target user, and success signal before any requirements or design work starts.
argument-hint: "<what you want built, in your own words>"
---

# Wingman: Discovery

The first of Wingman's 7 planning stages. Before anything gets scoped into requirements, make sure the underlying problem is actually understood — a well-built solution to the wrong problem is still a wasted build.

$ARGUMENTS

## Step 1: Understand the ask

If the request is vague or could mean several different things, ask a small number of plain-language clarifying questions — focus on business outcomes ("who uses this and what do they do with it", "what happens today without this", "what would make this a failure") rather than technical specifics.

Do not ask the founder to make technical decisions (frameworks, data models, file layout) — that's `architecture.md`'s job, several stages from now. Only escalate a question here if it's a business/product tradeoff or a one-way door.

## Step 2: Confirm the Product department is active

Use the `department-lead-activation` skill to ensure `dept-product` exists for this project (its activation signal is always true) — create it in the founder's `.claude/agents/` if it doesn't exist yet, then delegate the requirements-analysis portion of this step to it.

Immediately after, use the `management-board-activation` skill to check whether this project has crossed the 3+ conditionally-activated-department-lead complexity threshold (Design/Data/Legal-Security/DevOps/Growth only — never counting the always-active Product/Engineering/QA) — if so, `mgr-product` (and `mgr-research`, which activates alongside Product) may need creating.

## Step 3: Write the Discovery output

Produce a short artifact — no plan file yet, no Boardroom checkpoint at this stage (that happens once, at the end of `implementation-planning.md`, reviewing all 5 planning stages together). Append this section to a scratch discovery doc (`docs/wingman/discovery/<short-slug>.md` in the founder's project, creating the directory if needed):

```markdown
## Discovery output

**Problem statement:** <the concrete problem, with any evidence available — not a vibe>
**Target user:** <who actually uses this and in what situation>
**Success signal:** <how we'll know this actually solved the problem, in observable terms>
**Open questions:** <anything genuinely unresolved that the founder should weigh in on later, if anything>
```

Hand off directly to `/wingman:define` — do not stop and wait for approval here; this stage feeds the bundled Planning Milestone checkpoint at the end of the sequence, not its own gate.
