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

Use `skills/visual-founder-output` to add the pipeline-status tree (per
`references/visual-output-templates.md` §2) after the Requirements table above.

## Define checkpoint

Run `/wingman:boardroom` with scope set to this stage's own Requirements table above. The founder
approves or sends back changes through this one plain-language checkpoint before the pipeline moves
on.

Only once the checkpoint returns a "ship it" decision should you hand off to `/wingman:information-architecture`.

## References

- `skills/traceability-linking` — the `DEF-*` ID convention minted here, and the marker format every later stage/task/commit uses to point back to a requirement.
- `skills/visual-founder-output` + `references/visual-output-templates.md` §2 — the pipeline-status
  tree shown above.
- `commands/adaptive/boardroom.md` — the checkpoint this stage now records on its own, per
  `docs/ARCHITECTURE.md` §4d.
