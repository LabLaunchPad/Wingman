---
description: Design the user-facing flow, screens, and states for a project with a user-facing surface — skipped when there isn't one.
argument-hint: "[optional: focus area, e.g. a specific screen or flow]"
---

# Wingman: UX Flow

The fourth of Wingman's 5 planning stages. Named `uxflow`, not `design`, to stay distinct from the bundled `design-taste` skill's own scope (which applies at build time to whatever gets built here). This stage is skipped entirely for projects with no user-facing surface (e.g. a pure backend service or CLI) — say so plainly and hand off to `/wingman:implementation-planning` rather than manufacturing screens that don't need to exist.

$ARGUMENTS

## Confirm the Design department is active

Use the `department-lead-activation` skill to check the Design activation signal: if this project has (or will have, per the Architecture stage's decisions) any user-facing surface, create `dept-design` if it doesn't exist yet, then delegate the flow-design portion of this step to it. If there's no user-facing surface, skip this step entirely and say so in one plain sentence.

Immediately after (only if `dept-design` is active), use the `management-board-activation` skill to check whether this project has crossed the 3+ conditionally-activated-department-lead complexity threshold (Design/Data/Legal-Security/DevOps/Growth only — never counting the always-active Product/Engineering/QA) — if so, check every currently-missing manager whose department lead is active, not just `mgr-design`.

## Design the flow

For each `ARCH-*` decision that touches a user-facing surface, sketch the screens/states/transitions a user actually moves through — not visual polish (that's `design-taste`'s job at build time), just the shape of the experience: what a user sees, in what order, and what each state lets them do next. Tag each with the `UX-` traceability prefix, pointing back to the `ARCH-*`/`DEF-*` chain it satisfies.

Append this section to a scratch UX-flow doc (`docs/wingman/uxflow/<short-slug>.md` in the
founder's project, creating the directory if needed — same slug as the earlier stages' files,
same convention):

```markdown
## UX flow

| ID | Screen/state | User can... | Satisfies |
|---|---|---|---|
| UX-001 | <screen or state name> | <the actions available here> | ARCH-001 |
```

## Show the flow, not just the table

Immediately after the table, use `skills/output/visual-founder-output` to render the same rows as an
actual flow diagram — detect the session's rendering tier first, then follow
`references/visual-output-templates.md`'s UX-flow template (Tier B: a Mermaid flowchart appended to
the same `docs/wingman/uxflow/<short-slug>.md` file; Tier A: a low-fidelity HTML wireframe per key
screen, published as an Artifact). The table stays exactly as written above — it's what
`check-traceability.mjs` parses — the diagram is generated from the same rows, added alongside it,
never instead of it.

Hand off directly to `/wingman:implementation-planning` — this stage doesn't run its own Boardroom checkpoint; it feeds the bundled Planning Milestone checkpoint at the end of the 5-stage planning sequence.

## References

- `skills/governance/traceability-linking` — the `UX-*` ID convention.
- `skills/output/design-taste` — the quality bar this flow gets built against later, at `/wingman:build` time.
- `skills/output/visual-founder-output` + `references/visual-output-templates.md` — how to render the flow
  diagram above; consult before choosing a rendering tier.
