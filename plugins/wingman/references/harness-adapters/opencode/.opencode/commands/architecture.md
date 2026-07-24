---
description: Design the technical shape of a Defined set of requirements — data model, module boundaries, and reuse-over-new-abstraction decisions.
argument-hint: "[optional: focus area, e.g. a specific requirement ID to design first]"
---

# Wingman: Architecture

The eleventh of Wingman's 14 pipeline stages. This is where technical decisions get made *for* the founder, not asked of them — frameworks, data models, and file layout are Wingman's job, never a founder decision, unless a choice is genuinely a business tradeoff.

$ARGUMENTS

## Confirm the Engineering department is active

Use the `department-lead-activation` skill to ensure `dept-engineering` exists for this project (its activation signal is always true) — create it if it doesn't exist yet, then delegate the technical-design portion of this step to it.

Immediately after, use the `management-board-activation` skill to check the Management Board activation threshold (see `references/pipeline-stage-boilerplate.md`'s Activation Checks section for the shared criteria) — if crossed, check every currently-missing manager whose department lead is active, not just `mgr-engineering`.

## Design the technical shape

Before proposing anything new, look at the existing codebase for related functionality, existing utilities, and established patterns — a small addition to something that exists beats a parallel new system. This is the same reuse-over-reinvention discipline `build.md` applies at implementation time, applied one stage earlier, at design time, so the plan itself doesn't propose something that duplicates existing code.

For each `DEF-*` requirement in scope, decide: what data model changes are needed, what module/file boundaries this touches, and whether an existing abstraction can be extended instead of a new one introduced. Tag each design decision with the `ARCH-` traceability prefix (via the `traceability-linking` skill) pointing back to the `DEF-*` requirement(s) it satisfies.

Append this section to a scratch architecture doc (`docs/wingman/architecture/<short-slug>.md` in
the founder's project, creating the directory if needed — same slug as Discovery/Define's files,
same convention):

```markdown
## Architecture decisions

| ID | Decision | Satisfies | Reuse note |
|---|---|---|---|
| ARCH-001 | <the technical decision, concretely> | DEF-001 | <what existing code this extends, or why nothing existing fits> |
```

## Show the requirement-to-decision mapping

Immediately after the table, use `skills/visual-founder-output` to render the same `ARCH-*` rows as
a DEF→ARCH traceability graph (per `references/visual-output-templates.md` §4, appended to the same
scratch architecture doc) — detect the session's rendering tier first. The table stays exactly as
written above; the graph is generated from the same rows, added alongside it, never instead of it.
This mapping (which decisions satisfy which requirements, including cases where one satisfies
several or several satisfy one) is genuinely graph-shaped in a way `discovery.md`'s problem
statement or `define.md`'s independent requirement rows are not — that's why only this planning
stage gets a dedicated diagram beyond the generic pipeline-status tree below.

## Where you are

See `references/pipeline-stage-boilerplate.md`'s Where You Are section. Use `skills/visual-founder-output` to add the pipeline-status tree.

## Gate checklist

Before the checkpoint below, run the adaptive gap-finding loop and the 8-part output format from
`references/pipeline-gate-checklist.md`, then confirm this stage's own gate:

- **Must include:** stack choices, system boundaries, data model direction, integration plan,
  tradeoff notes, rollback/recovery thinking.
- **Must decide:** the boring default stack, and the complexity being deliberately rejected.
- **Gate passes only if** the architecture is simple and fit for the requirements it satisfies.

## Architecture checkpoint

Run `/wingman:boardroom` with scope set to this stage's own Architecture decisions above (and the
DEF→ARCH graph). The checkpoint checks the gate checklist above, not just the decisions in general:
it confirms every Must-include item is present and every Must-decide question is answered. The
founder approves or sends back changes through this one plain-language checkpoint before the
pipeline moves on.

If the gate does not pass, the checkpoint blocks here and names the specific missing item(s) to the
founder — never a generic "needs work." Only once the checkpoint returns a "ship it" decision should
you hand off to `/wingman:implementation-planning`.

## References

- `skills/traceability-linking` — the `ARCH-*` ID convention and how it chains back to `DEF-*`.
- `references/pipeline-gate-checklist.md` — the shared adaptive gap-finding loop, self-critique
  questions, gap register, and 8-part output format every stage runs before its own checkpoint.
- `skills/engineering-minimalism` — applies here as much as at build time: don't design in complexity the requirements don't call for.
- `skills/visual-founder-output` + `references/visual-output-templates.md` §4 — the DEF→ARCH
  traceability graph; §2 — the pipeline-status tree.
- `commands/adaptive/boardroom.md` — the checkpoint this stage now records on its own, per
  `docs/ARCHITECTURE.md` §4d.
