---
description: Define primary/secondary personas and jobs-to-be-done (trigger, pain, workaround, desired progress) — evidence-based, not decorative.
argument-hint: "[optional: path to the Research Synthesis output, defaults to the most recent one]"
---

# Wingman: Personas & Jobs

The third of Wingman's 14 pipeline stages, and the last stage of **Phase 1: Problem Definition & Market Validation**. A persona document that nobody built anything from is decoration, not design input — every persona and job-to-be-done here must trace back to real evidence from Research Synthesis, never invented to fill out a template. Distill each job-to-be-done to a single sentence: "My user needs to do X, but currently struggles with Y, so this product will provide Z."

$ARGUMENTS

Use `skills/context-assembly` to read the project's unified state before anything else in this stage (see `references/pipeline-stage-boilerplate.md`'s Context Assembly section) — stop and surface a blocking verdict or a state/checkpoint mismatch to the founder before continuing.

## Personas & Jobs.1: Confirm the Product department is active

`dept-product` is already active from `/wingman:discovery`; this stage doesn't introduce a new department signal, so no activation check is needed here.

## Personas & Jobs.2: Define personas and jobs

Read the Research Synthesis output (from `/wingman:research-synthesis`, or the path given in `$ARGUMENTS`). For each theme with enough evidence behind it, define:

- **Persona (primary or secondary):** who they are, in the situation this product actually finds them in — not a demographic sketch (age/hobbies) that adds no design signal.
- **Job-to-be-done:** the **trigger** that makes them look for a solution, the **pain** they're actually feeling, the **workaround** they use today in its absence, and the **desired progress** — what "better" looks like to them, in their own terms.

Mark a persona/job as unsupported plainly rather than inventing evidence for it — a thin evidence base is a real finding to flag, not something to paper over with a confident-sounding paragraph.

Tag each row with the `PJ-` traceability prefix (via the `traceability-linking` skill), pointing back to the `RS-*` theme(s) it's built from.

Append this section to a scratch personas-jobs doc (`docs/wingman/personas-jobs/<short-slug>.md` in the founder's project, creating the directory if needed — same slug as earlier stages' files, same convention):

```markdown
## Personas & jobs

| ID | Persona (primary/secondary) | Trigger | Pain | Workaround today | Desired progress | Satisfies |
|---|---|---|---|---|---|---|
| PJ-001 | <persona name/role> | <what makes them look for a solution> | <the actual pain, not a symptom> | <what they do today instead> | <what "better" looks like to them> | RS-001 |
```

## Personas & Jobs.3: Where you are

Use `skills/visual-founder-output` to add the pipeline-status tree (per
`references/visual-output-templates.md` §2) after the table above.

## Personas & Jobs.4: Gate checklist

Before the checkpoint below, run the adaptive gap-finding loop and the 8-part output format from
`references/pipeline-gate-checklist.md`, then confirm this stage's own gate:

- **Must include:** primary persona, secondary persona if needed, goals, frustrations, context,
  jobs to be done.
- **Must decide:** which user takes priority as the primary persona, and which job this project
  supports first.
- **Gate passes only if** the target user and the job to be done are both clear.

## Personas & Jobs.5: Personas & Jobs checkpoint

Run `/wingman:boardroom` with scope set to this stage's own personas/jobs table above. The checkpoint
checks the gate checklist above, not just the table in general: it confirms every Must-include item
is present and every Must-decide question is answered. The founder approves or sends back changes
through this one plain-language checkpoint before the pipeline moves on.

If the gate does not pass, the checkpoint blocks here and names the specific missing item(s) to the
founder — never a generic "needs work." Only once the checkpoint returns a "ship it" decision should
you hand off to `/wingman:journey-mapping`.

## References

- `skills/traceability-linking` — the `PJ-*` ID convention and how it chains back to `RS-*`.
- `references/pipeline-gate-checklist.md` — the shared adaptive gap-finding loop, self-critique
  questions, gap register, and 8-part output format every stage runs before its own checkpoint.
- `skills/visual-founder-output` + `references/visual-output-templates.md` §2 — the pipeline-status
  tree shown above.
- `commands/adaptive/boardroom.md` — the checkpoint this stage records, per `docs/status/ARCHITECTURE.md` §4d.
