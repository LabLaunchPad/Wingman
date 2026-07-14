---
description: Turn Discovery's problem statement into scoped, ID-tagged requirements that later stages and tasks can trace back to.
argument-hint: "[optional: path to the Discovery output, defaults to the most recent one]"
---

# Wingman: Define

The second of Wingman's 7 planning stages. Discovery established *why* — this stage scopes *what*, as a small set of concrete, individually-traceable requirements.

$ARGUMENTS

## Turn the problem into requirements

Read the Discovery output (from `/wingman:discovery`, or the path given in `$ARGUMENTS`). Break the problem down into a short list of concrete requirements — not an exhaustive spec, just enough that "what are we actually building" is unambiguous. Each requirement gets its own row and its own ID, minted via the `traceability-linking` skill (prefix `DEF-`, e.g. `DEF-001`) so later stages, tasks, and code changes can point back to exactly which requirement they satisfy.

```markdown
## Requirements

| ID | Requirement | Rationale | Source |
|---|---|---|---|
| DEF-001 | <one concrete, testable requirement> | <why this, tied to Discovery's problem statement> | Discovery |
```

Do not over-scope: a requirement that isn't traceable to Discovery's stated problem or success signal shouldn't be here — flag it back to the founder as a possible scope-creep item instead of quietly including it.

`dept-product` is already active from `/wingman:discovery`; this stage doesn't introduce a new department signal, so no activation check is needed here.

Hand off directly to `/wingman:architecture` — this stage doesn't run its own Boardroom checkpoint; it feeds the bundled Planning Milestone checkpoint at the end of the 5-stage planning sequence.

## References

- `skills/traceability-linking` — the `DEF-*` ID convention minted here, and the marker format every later stage/task/commit uses to point back to a requirement.
