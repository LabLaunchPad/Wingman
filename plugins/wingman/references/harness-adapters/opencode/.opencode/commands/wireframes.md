---
description: Produce low-fidelity screen layouts for the core flows — structure only, no visual polish.
argument-hint: "[optional: focus area, e.g. a specific screen]"
---

# Wingman: Wireframes

The eighth of Wingman's 14 pipeline stages. Skipped entirely for projects with no user-facing surface, same as `uxflow.md`. This stage produces low-fidelity screen layouts — where things sit and what's on each screen — deliberately before any visual polish; that's `visual-design-system.md`'s job, one stage later.

$ARGUMENTS

## Wireframes.1: Confirm the Design department is active

Use the `department-lead-activation` skill to check the Design activation signal: `dept-design` should already be active from `/wingman:uxflow` if this project has a user-facing surface. If there's no user-facing surface, skip this step (and the rest of this stage) entirely and say so in one plain sentence.

Immediately after (only if `dept-design` is active), use the `management-board-activation` skill to check whether this project has crossed the 3+ conditionally-activated-department-lead complexity threshold (Design/Data/Legal-Security/DevOps/Growth only — never counting the always-active Product/Engineering/QA) — if so, check every currently-missing manager whose department lead is active, not just `mgr-design`.

## Wireframes.2: Sketch the wireframes

For each `UX-*` screen/state in scope, sketch its low-fidelity layout: what regions exist on the screen (header/nav, primary content, primary action, secondary actions), what's in each region, and how they're arranged — structure and hierarchy, never colors, fonts, or spacing values (that's `visual-design-system.md`). Tag each with the `WF-` traceability prefix, pointing back to the `UX-*`/`IA-*` chain it satisfies.

Append this section to a scratch wireframes doc (`docs/wingman/wireframes/<short-slug>.md` in the
founder's project, creating the directory if needed — same slug as earlier stages' files, same
convention):

```markdown
## Wireframes

| ID | Screen | Regions (top to bottom) | Satisfies |
|---|---|---|---|
| WF-001 | <screen name, matches a UX-* state> | <header/nav, primary content, primary action, ...> | UX-001 |
```

## Wireframes.3: Show the layout, not just the table

Immediately after the table, use `skills/visual-founder-output` to render each row as an actual
low-fidelity layout — Tier A (Artifact-capable): a bordered-box HTML sketch per screen, no color
system or real CSS framework, published as an Artifact; Tier B (universal fallback): an ASCII box
diagram of the same regions, inline in the same `docs/wingman/wireframes/<short-slug>.md` file. The
table stays exactly as written above — the diagram is generated from the same rows, added alongside
it, never instead of it.

## Wireframes.4: Where you are

Use `skills/visual-founder-output` to add the pipeline-status tree (per
`references/visual-output-templates.md` §2) after the table/diagram above.

## Wireframes.5: Gate checklist

Before the checkpoint below, run the adaptive gap-finding loop and the 8-part output format from
`references/pipeline-gate-checklist.md`, then confirm this stage's own gate:

- **Must include:** low-fidelity screen layouts, annotations, state coverage, responsive notes.
- **Must decide:** the layout structure, and the screen order.
- **Gate passes only if** the layout is clear and usable.

## Wireframes.6: Wireframes checkpoint

Run `/wingman:boardroom` with scope set to this stage's own wireframes above. The checkpoint checks
the gate checklist above, not just the wireframes in general: it confirms every Must-include item is
present and every Must-decide question is answered. The founder approves or sends back changes
through this one plain-language checkpoint before the pipeline moves on.

If the gate does not pass, the checkpoint blocks here and names the specific missing item(s) to the
founder — never a generic "needs work." Only once the checkpoint returns a "ship it" decision should
you hand off to `/wingman:visual-design-system`.

## References

- `skills/traceability-linking` — the `WF-*` ID convention and how it chains back to `UX-*`/`IA-*`.
- `references/pipeline-gate-checklist.md` — the shared adaptive gap-finding loop, self-critique
  questions, gap register, and 8-part output format every stage runs before its own checkpoint.
- `skills/visual-founder-output` + `references/visual-output-templates.md` — how to render the
  layout sketches above; consult before choosing a rendering tier.
- `commands/adaptive/boardroom.md` — the checkpoint this stage records, per `docs/ARCHITECTURE.md` §4d.
