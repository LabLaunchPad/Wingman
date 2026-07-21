---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code. Triggers whenever /wingman:implementation-planning is about to write an implementation plan.
---

<!--
Adapted from obra/superpowers (skills/discipline/writing-plans), MIT License,
Copyright (c) 2025 Jesse Vincent. See /ATTRIBUTIONS.md for details.
Adjustments from upstream: references to superpowers' own execution skills
(subagent-driven-development, executing-plans, using-git-worktrees) are
replaced with Wingman's own /wingman:build command; the plan save path is
changed to this project's convention; a Plain-Language Summary requirement
is added so every plan stays checkpoint-ready for a non-technical founder.
-->

# Writing Plans

## Overview

Write comprehensive implementation plans assuming the engineer has zero context for our codebase and questionable taste. Document everything they need to know: which files to touch for each task, code, testing, docs they might need to check, how to test it. Give them the whole plan as bite-sized tasks. DRY. YAGNI. TDD. Frequent commits.

Assume they are a skilled developer, but know almost nothing about our toolset or problem domain. Assume they don't know good test design very well.

**Save plans to:** `docs/wingman/plans/YYYY-MM-DD-<feature-name>.md`

## Scope Check

If the spec covers multiple independent subsystems, it should be broken into separate plans — one per subsystem. Each plan should produce working, testable software on its own.

## File Structure

Before defining tasks, map out which files will be created or modified and what each one is responsible for. This is where decomposition decisions get locked in.

- Design units with clear boundaries and well-defined interfaces. Each file should have one clear responsibility.
- Prefer smaller, focused files over large ones that do too much.
- Files that change together should live together. Split by responsibility, not by technical layer.
- In existing codebases, follow established patterns. If a file you're modifying has grown unwieldy, including a split in the plan is reasonable — but don't unilaterally restructure code the plan doesn't need to touch.

## Task Right-Sizing

A task is the smallest unit that carries its own test cycle and is worth a fresh reviewer's gate. Fold setup, configuration, scaffolding, and documentation steps into the task whose deliverable needs them; split only where a reviewer could meaningfully reject one task while approving its neighbor. Each task ends with an independently testable deliverable.

## Bite-Sized Task Granularity

**Each step is one action (2-5 minutes):**
- "Write the failing test" — step
- "Run it to make sure it fails" — step
- "Implement the minimal code to make the test pass" — step
- "Run the tests and make sure they pass" — step
- "Commit" — step

## Plan Document Header

**Every plan MUST start with this header:**

```markdown
# [Feature Name] Implementation Plan

> **For agentic workers:** Execute this plan task-by-task using /wingman:build. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

## Global Constraints

[The spec's project-wide requirements — version floors, dependency limits,
naming and copy rules, platform requirements — one line each, with exact
values copied verbatim from the spec. Every task's requirements implicitly
include this section.]

---
```

## Task Structure

````markdown
### Task N: [Component Name]

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

**Interfaces:**
- Consumes: [what this task uses from earlier tasks — exact signatures]
- Produces: [what later tasks rely on — exact function names, parameter
  and return types. A task's implementer sees only their own task; this
  block is how they learn the names and types neighboring tasks use.]

- [ ] **Step 1: Write the failing test**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/path/test.py::test_name -v`
Expected: FAIL with "function not defined"

- [ ] **Step 3: Write minimal implementation**

```python
def function(input):
    return expected
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/path/test.py::test_name -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
```
````

## No Placeholders

Every step must contain the actual content an engineer needs. These are **plan failures** — never write them:
- "TBD", "TODO", "implement later", "fill in details"
- "Add appropriate error handling" / "add validation" / "handle edge cases"
- "Write tests for the above" (without actual test code)
- "Similar to Task N" (repeat the code — the engineer may be reading tasks out of order)
- Steps that describe what to do without showing how (code blocks required for code steps)
- References to types, functions, or methods not defined in any task

## Constraints

**MUST:**
- End every plan with the Plain-Language Summary section — this is what `/wingman:boardroom` builds the founder-facing checkpoint from, and the plan document itself is never shown to the founder.
- Give every step real, complete content — exact file paths, full code, exact commands with expected output.
- Break a spec covering multiple independent subsystems into separate plans, one per subsystem.
- Run the full Self-Review pass (spec coverage, placeholder scan, type consistency) before presenting the plan as done.

**MUST NOT:**
- Ship any of the "No Placeholders" patterns above (TBD/TODO, "add appropriate error handling," "similar to Task N," code-free step descriptions, references to undefined types/functions).
- Present a plan as finished without having actually re-read it from disk after writing it — a plan that only exists in a prior turn's draft state doesn't count as saved.

## Rationalizations

| Excuse | Reality |
|---|---|
| "The engineer can figure out the error handling themselves" | This is exactly what "add appropriate error handling" as a placeholder is banned for — specify the actual handling, or the plan has silently deferred a design decision to whoever executes it. |
| "This task is basically the same as Task 3, I'll just reference it" | "Similar to Task N" is an explicit banned pattern — the engineer may read tasks out of order and never see Task 3's code. Repeat it in full. |
| "The spec is vague here, I'll leave it flexible for the engineer to decide" | Vagueness in the spec is a signal to make an explicit, stated decision in the plan (or flag it for the founder) — not to defer it downstream as an implicit placeholder. |
| "This is a small plan, the Plain-Language Summary feels like overkill" | Every plan feeds the same Boardroom checkpoint mechanism regardless of size — skipping it breaks the founder-facing gate this plan needs to pass through. |

## Red Flags — Stop and Reconsider

- You're about to write "TODO," "TBD," "handle edge cases," or any equivalent hedge instead of the actual content.
- You're about to write "Similar to Task N" instead of repeating the real code.
- You're using a function, type, or property name in a later task that no earlier task's "Produces" list actually defines.
- You're about to hand off the plan without running the Self-Review pass.
- You're finishing a plan with no Plain-Language Summary section.

## Plain-Language Summary (required — Wingman-specific)

Every plan must end with a section written for a non-technical founder, per the `plain-language-checkpoint` skill's writing bar:

```markdown
## Plain-Language Summary

**What this builds:** [1-2 sentences, no jargon]
**What changes for your users/business:** [1-2 sentences]
**What could go wrong:** [the single biggest risk, in plain terms]
**Rough size:** [small / medium / large]
```

This is what `/wingman:boardroom` uses to build the founder-facing checkpoint — the plan document itself is never shown to the founder directly.

## Remember
- Exact file paths always
- Complete code in every step — if a step changes code, show the code
- Exact commands with expected output
- DRY, YAGNI, TDD, frequent commits

## Verification (Self-Review)

Before considering the plan done, re-read it from disk (not from memory of having just written it — per the `verification-before-completion` skill) and check it against the spec with fresh eyes.

**1. Spec coverage:** Skim each section/requirement in the spec. Can you point to a task that implements it? List any gaps.

**2. Placeholder scan:** Search your plan for red flags — any of the patterns from the "No Placeholders" section above. Fix them.

**3. Type consistency:** Do the types, method signatures, and property names you used in later tasks match what you defined in earlier tasks? A function called `clearLayers()` in Task 3 but `clearFullLayers()` in Task 7 is a bug.

If you find issues, fix them inline. No need to re-review — just fix and move on. If you find a spec requirement with no task, add the task.

## Continuous Execution

See `references/continuous-execution.md` — maintain momentum through a workflow once started; don't pause to narrate or summarize mid-flight.


## Anti-Rationalization Defense

### Common Rationalizations

| Excuse | Reality |
|---|---|
| "The engineer can figure out the error handling themselves" | This is exactly what "add appropriate error handling" as a placeholder is banned for — specify the actual handling, or the plan has silently deferred a design decision to whoever executes it. |
| "This task is basically the same as Task 3, I'll just reference it" | "Similar to Task N" is a banned pattern — the engineer may read tasks out of order and never see Task 3's code. Repeat it in full. |
| "The spec is vague here, I'll leave it flexible" | Vagueness in the spec is a signal to make an explicit, stated decision in the plan (or flag it for the founder) — not to defer it downstream as an implicit placeholder. |
| "This is a small plan, the Plain-Language Summary feels like overkill" | Every plan feeds the same Boardroom checkpoint mechanism regardless of size — skipping it breaks the founder-facing gate. |
| "I'll add the test code later in the step" | A step without the actual test code is a plan failure. Write it now or acknowledge you've deferred a design decision. |
| "The type signatures are obvious from context" | If a later task uses a function, the "Produces" block of an earlier task must define its exact signature. Obvious-to-you is not obvious-to-the-engineer reading tasks out of order. |

### Red Flags

- You're about to write "TODO," "TBD," "handle edge cases," or any equivalent hedge instead of actual content.
- You're about to write "Similar to Task N" instead of repeating the real code.
- You're using a function, type, or property name in a later task that no earlier task's "Produces" list defines.
- You're about to hand off the plan without running the Self-Review pass.
- You're finishing a plan with no Plain-Language Summary section.
- You're writing a step that describes what to do without showing how (code blocks required for code steps).
- You're referencing types, functions, or methods not defined in any task.

### Anti-Pattern Callouts

- **Deferred design decisions:** Every "handle appropriately" or "add validation" is a design decision you've silently pushed to the executor. The plan is where design decisions get made, not where they get deferred.
- **Reference-itis:** "Similar to Task N" assumes sequential reading. Engineers read tasks in dependency order, not plan order. Code must be self-contained per task.
- **Phantom interfaces:** A function signature used in Task 7 that isn't defined in any earlier task's "Produces" block is a bug waiting to happen.

## Referenced by

- `commands/pipeline/implementation-planning.md`
