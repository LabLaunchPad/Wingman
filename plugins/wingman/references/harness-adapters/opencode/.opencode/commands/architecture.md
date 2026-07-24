---
description: Design the technical shape of a Defined set of requirements — data model, module boundaries, and reuse-over-new-abstraction decisions.
argument-hint: "[optional: focus area, e.g. a specific requirement ID to design first]"
---

# Wingman: Architecture

The third of Wingman's 5 planning stages. This is where technical decisions get made *for* the founder, not asked of them — frameworks, data models, and file layout are Wingman's job, never a founder decision, unless a choice is genuinely a business tradeoff.

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

Hand off directly to `/wingman:uxflow` — this stage doesn't run its own Boardroom checkpoint; it feeds the bundled Planning Milestone checkpoint at the end of the 5-stage planning sequence.

## References

- `skills/traceability-linking` — the `ARCH-*` ID convention and how it chains back to `DEF-*`.
- `skills/engineering-minimalism` — applies here as much as at build time: don't design in complexity the requirements don't call for.
- `skills/visual-founder-output` + `references/visual-output-templates.md` §4 — the DEF→ARCH
  traceability graph; §2 — the pipeline-status tree.
