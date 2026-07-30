# Engine: Code Intelligence

**Status:** built
**Purpose:** reads a project's existing structure, detects established patterns, and inventories
reusable components before generating new code — citing what it will reuse rather than inventing a
parallel pattern.

## Inputs

The project's existing source tree and the plan's current task (from the Planning Engine).

## Output artifacts

A one-line citation of the existing pattern reused (or an honest note that none applied), surfaced in
the Build stage's founder-facing summary.

## Members

- `skills/codebase-comprehension/SKILL.md`

## State read + written

Reads: the project's existing source files relevant to the current task. Writes: nothing directly —
the citation flows into the Engineering Engine's Build summary.

## Escalation

A plan step that would introduce a second, parallel way of doing something the project already does
one way is a Should-ask — propose reuse, surface the alternative, let the founder/department lead
decide if divergence is genuinely justified.

## Permitted tool tiers

Read-only (`references/permission-model.md` Level 0) — this engine reads and cites, it never writes
code itself (that's the Engineering Engine, immediately after).
