---
description: Turn Discovery's problem statement into scoped, ID-tagged requirements that later stages and tasks can trace back to.
argument-hint: "[optional: path to the Discovery output, defaults to the most recent one]"
---

# Wingman: Define

The fifth of Wingman's 14 pipeline stages. Discovery established *why* — this stage scopes *what*, as a small set of concrete, individually-traceable requirements.

$ARGUMENTS

## Turn the problem into requirements

Read the Discovery output (from `/wingman:discovery`, or the path given in `$ARGUMENTS`). Break the problem down into a short list of concrete requirements — not an exhaustive spec, just enough that "what are we actually building" is unambiguous. Each requirement gets its own row and its own ID, minted via the `traceability-linking` skill (prefix `DEF-`, e.g. `DEF-001`) so later stages, tasks, and code changes can point back to exactly which requirement they satisfy.

Append this section to a scratch define doc (`docs/wingman/define/<short-slug>.md` in the
founder's project, creating the directory if needed — same slug as Discovery's own file, same
convention):

```markdown
## Requirements

| ID | Requirement | Rationale | Source |
|---|---|---|---|
| DEF-001 | <one concrete, testable requirement> | <why this, tied to Discovery's problem statement> | Discovery |
```

Do not over-scope: a requirement that isn't traceable to Discovery's stated problem or success signal shouldn't be here — flag it back to the founder as a possible scope-creep item instead of quietly including it.

`dept-product` is already active from `/wingman:discovery`; this stage doesn't introduce a new department signal, so no activation check is needed here.

## Where you are

See `references/pipeline-stage-boilerplate.md`'s Where You Are section. Use `skills/visual-founder-output` to add the pipeline-status tree after the Requirements table above.

## Gate checklist

Before the checkpoint below, run the adaptive gap-finding loop and the 8-part output format from
`references/pipeline-gate-checklist.md`, then confirm this stage's own gate:

- **Must include:** a plain-language requirements table, must-have items, should-have items,
  optional items, non-goals, acceptance criteria.
- **Must decide:** the locked MVP scope, and what is explicitly excluded.
- **Gate passes only if** the scope is clear and realistic for a solo founder to build.

## Define checkpoint

Run `/wingman:boardroom` with scope set to this stage's own Requirements table above. The checkpoint
checks the gate checklist above, not just the table in general: it confirms every Must-include item
is present and every Must-decide question is answered. The founder approves or sends back changes
through this one plain-language checkpoint before the pipeline moves on.

If the gate does not pass, the checkpoint blocks here and names the specific missing item(s) to the
founder — never a generic "needs work." Only once the checkpoint returns a "ship it" decision should
you hand off to `/wingman:information-architecture`.

## References

- `skills/traceability-linking` — the `DEF-*` ID convention minted here, and the marker format every later stage/task/commit uses to point back to a requirement.
- `references/pipeline-gate-checklist.md` — the shared adaptive gap-finding loop, self-critique
  questions, gap register, and 8-part output format every stage runs before its own checkpoint.
- `skills/visual-founder-output` + `references/visual-output-templates.md` §2 — the pipeline-status
  tree shown above.
- `commands/adaptive/boardroom.md` — the checkpoint this stage now records on its own, per
  `docs/ARCHITECTURE.md` §4d.
