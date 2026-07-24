---
description: Clarify a founder's raw idea into a clear problem statement, target user, and success signal before any requirements or design work starts.
argument-hint: "<what you want built, in your own words>"
---

# Wingman: Discovery

The first of Wingman's 14 pipeline stages. Before anything gets scoped into requirements, make sure the underlying problem is actually understood — a well-built solution to the wrong problem is still a wasted build.

$ARGUMENTS

## Step 1: Understand the ask

If the request is vague or could mean several different things, ask a small number of plain-language clarifying questions — focus on business outcomes ("who uses this and what do they do with it", "what happens today without this", "what would make this a failure") rather than technical specifics.

Do not ask the founder to make technical decisions (frameworks, data models, file layout) — that's `architecture.md`'s job, several stages from now. Only escalate a question here if it's a business/product tradeoff or a one-way door.

If the project's shape clearly matches one of `references/org-template/project-types/catalog.md`'s 7 types, consult that type's short playbook for what typically changes in later stages — never force a fit; most projects are close to one type but not exact, and this conversation always takes precedence over a category label.

## Step 2: Confirm the Product department is active

Use the `department-lead-activation` skill to ensure `dept-product` exists for this project (its activation signal is always true) — create it in the founder's `.claude/agents/` if it doesn't exist yet, then delegate the requirements-analysis portion of this step to it.

Immediately after, use the `management-board-activation` skill to check whether this project has crossed the 3+ conditionally-activated-department-lead complexity threshold (Design/Data/Legal-Security/DevOps/Growth only — never counting the always-active Product/Engineering/QA) — if so, `mgr-product` (and `mgr-research`, which activates alongside Product) may need creating.

## Step 3: Write the Discovery output

Produce a short artifact. Append this section to a scratch discovery doc (`docs/wingman/discovery/<short-slug>.md` in the founder's project, creating the directory if needed):

```markdown
## Discovery output

**Problem statement:** <the concrete problem, with any evidence available — not a vibe>
**Target user:** <who actually uses this and in what situation>
**Success signal:** <how we'll know this actually solved the problem, in observable terms>
**Open questions:** <anything genuinely unresolved that the founder should weigh in on later, if anything>
```

## Where you are

Use `skills/visual-founder-output` to add the pipeline-status tree (per
`references/visual-output-templates.md` §2) after the Discovery output above — detect the session's
rendering tier first, never assume.

## Gate checklist

Before the checkpoint below, run the adaptive gap-finding loop and the 8-part output format from
`references/pipeline-gate-checklist.md`, then confirm this stage's own gate:

- **Must include:** problem statement, user statement, jobs-to-be-done notes, trigger/why-now,
  constraints, success criteria, scope boundary, solo-founder realism check.
- **Must decide:** what problem is being solved, who the primary user is, and whether the idea is
  too large for one solo founder to build.
- **Gate passes only if** the problem, the user, and the scope are all clear. If the idea is too
  large, say so directly in the Discovery output and propose a smaller cut before the gate can pass.

## Discovery checkpoint

Run `/wingman:boardroom` with scope set to this stage's own Discovery output above — not a bundle,
not a preview of later stages. The checkpoint checks the gate checklist above, not just the output
in general: it confirms every Must-include item is present and every Must-decide question is
answered. The founder approves or sends back changes through this one plain-language checkpoint
before the pipeline moves on.

If the gate does not pass, the checkpoint blocks here and names the specific missing item(s) to the
founder — never a generic "needs work." Only once the checkpoint returns a "ship it" decision should
you hand off to `/wingman:research-synthesis`.

## References

- `references/org-template/README.md` — the project-type catalog consulted in Step 1, and the two
  other founder-context guides (`founder-preferences.md`, `capability-map.md`) `skills/memory`
  draws on.
- `references/pipeline-gate-checklist.md` — the shared adaptive gap-finding loop, self-critique
  questions, gap register, and 8-part output format every stage runs before its own checkpoint.
- `skills/visual-founder-output` + `references/visual-output-templates.md` §2 — the pipeline-status
  tree shown above.
- `commands/adaptive/boardroom.md` — the checkpoint this stage now records on its own, per
  `docs/ARCHITECTURE.md` §4d.
