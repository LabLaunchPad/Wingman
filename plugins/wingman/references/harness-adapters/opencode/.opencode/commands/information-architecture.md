---
description: Organize the product into sections, navigation, and hierarchy — task-based, not system-based — before screens or flows get designed.
argument-hint: "[optional: focus area, e.g. a specific section]"
---

# Wingman: Information Architecture

The sixth of Wingman's 14 pipeline stages. This is where the product's shape gets organized around what a user is trying to *do*, not around how the underlying system happens to be built — a task-based hierarchy, not a database-table-shaped one.

$ARGUMENTS

## Information Architecture.1: Confirm the Design department is active

Use the `department-lead-activation` skill to check the Design activation signal: if this project has (or will have, per the Architecture stage's later decisions) any user-facing surface, create `dept-design` if it doesn't exist yet, then delegate the IA portion of this step to it. If there's no user-facing surface, skip this step entirely and say so in one plain sentence.

Immediately after (only if `dept-design` is active), use the `management-board-activation` skill to check whether this project has crossed the 3+ conditionally-activated-department-lead complexity threshold (Design/Data/Legal-Security/DevOps/Growth only — never counting the always-active Product/Engineering/QA) — if so, check every currently-missing manager whose department lead is active, not just `mgr-design`.

## Information Architecture.2: Organize the information architecture

For each `DEF-*` requirement that implies a distinct section or navigable area, decide where it lives in the product's overall structure: what section it belongs to, what it's nested under (if anything), and what a user would call it — task-based naming ("Send Money"), not system-based naming ("TransactionController"). Tag each with the `IA-` traceability prefix, pointing back to the `DEF-*`/`JM-*` chain it satisfies.

Append this section to a scratch information-architecture doc (`docs/wingman/information-architecture/<short-slug>.md` in the founder's project, creating the directory if needed — same slug as earlier stages' files, same convention):

```markdown
## Information architecture

| ID | Section/nav item | Parent (if nested) | Task it serves | Satisfies |
|---|---|---|---|---|
| IA-001 | <section or nav item, task-named> | <parent section, or "top-level"> | <the user task this section exists for> | DEF-001 |
```

## Information Architecture.3: Where you are

Use `skills/visual-founder-output` to add the pipeline-status tree (per
`references/visual-output-templates.md` §2) after the table above.

## Information Architecture.4: Gate checklist

Before the checkpoint below, run the adaptive gap-finding loop and the 8-part output format from
`references/pipeline-gate-checklist.md`, then confirm this stage's own gate:

- **Must include:** navigation map, content hierarchy, labels, grouping rules, naming rules.
- **Must decide:** the section structure, and the navigation logic.
- **Gate passes only if** the structure is understandable to a first-time user.

## Information Architecture.5: Information Architecture checkpoint

Run `/wingman:boardroom` with scope set to this stage's own IA table above. The checkpoint checks the
gate checklist above, not just the table in general: it confirms every Must-include item is present
and every Must-decide question is answered. The founder approves or sends back changes through this
one plain-language checkpoint before the pipeline moves on.

If the gate does not pass, the checkpoint blocks here and names the specific missing item(s) to the
founder — never a generic "needs work." Only once the checkpoint returns a "ship it" decision should
you hand off to `/wingman:uxflow`.

## References

- `skills/traceability-linking` — the `IA-*` ID convention and how it chains back to `DEF-*`.
- `references/pipeline-gate-checklist.md` — the shared adaptive gap-finding loop, self-critique
  questions, gap register, and 8-part output format every stage runs before its own checkpoint.
- `skills/visual-founder-output` + `references/visual-output-templates.md` §2 — the pipeline-status
  tree shown above.
- `commands/adaptive/boardroom.md` — the checkpoint this stage records, per `docs/ARCHITECTURE.md` §4d.
