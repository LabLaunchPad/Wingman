# WKOS document template

The metadata block and section order every WKOS document follows, where applicable. Locked so an
agent (or a founder) can find the same information in the same place across ~130 possible documents.

## Metadata block

Every document opens with this block, immediately after its title:

```markdown
# <Document Title>

## Metadata

- **Owner:** <the stage, skill, or role responsible for keeping this current>
- **Status:** draft | active | superseded
- **Version:** <bumped when content materially changes, not on typo fixes>
- **Last Updated:** <ISO date>
- **Review Date:** <ISO date, or "on next stage re-run" for a pipeline-produced doc>
- **Related Documents:** <other WKOS docs this cites or is cited by>
- **Parent Documents:** <what this descends from — usually an upstream traceability ID>
- **Child Documents:** <what descends from this>
- **Dependencies:** <what must exist before this is trustworthy>
- **Risk Level:** <Level 0-4, per references/permission-model.md>
- **Approval Status:** <not required | pending | approved — per the permission level above>
- **Tags:** <free-text, for grep — not a taxonomy to maintain>
```

**Parents/Children reuse the real traceability graph, never a second one.** For any document tied
to a `DISC-*`…`IP-*` chain, Parent/Child here are exactly the IDs `scripts/check-traceability.mjs`
already resolves — copy them, don't re-derive them. For a document with no ID (most of
`00-governance`, `10-engineering`), name the real file it depends on instead.

## Standard sections, in order where applicable

Not every document needs every section — a one-page `ADR` doesn't need `Non Goals`. Skip what
doesn't apply; do not renumber around a skip, and do not invent sections beyond this list.

1. Purpose
2. Background
3. Scope
4. Goals
5. Non Goals
6. Definitions
7. Assumptions
8. Constraints
9. Requirements
10. Decisions
11. Alternatives Considered
12. Risks
13. Trade-offs
14. Acceptance Criteria
15. Validation
16. Traceability
17. Open Questions
18. Future Improvements
19. References
20. Change History

## The Golden Rule check

Before a document is treated as finished, it must answer three questions — this is what
`scripts/validate-wkos.mjs`'s Golden Rule check looks for, one match per question, not a rigid
heading:

- **Why does this exist?** — answered by `Purpose` or `Background`, and (where an ID chain applies)
  the `Parent Documents` field.
- **How does it connect?** — answered by `Traceability` or `Related Documents`, or the ID chain.
- **How do we know it's correct?** — answered by `Acceptance Criteria` or `Validation`.

A document missing all three markers for a question is flagged, not blocked — the same
warning-not-error severity `validate-structure.mjs`'s 6-field skill contract already uses, since a
real document legitimately uses an equivalent heading (`ADR`'s `Consequences` instead of `Risks`,
for instance).

## Referenced by

- `references/wkos/README.md`
- `scripts/validate-wkos.mjs` (the Golden Rule check)
- `templates/*.md` — every template in this directory follows this shape
