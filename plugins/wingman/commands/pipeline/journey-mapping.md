---
description: Map the full user journey from first thought to success — friction points, emotions, decision points, and drop-off risks, for each persona's job-to-be-done.
argument-hint: "[optional: which persona/job to map first]"
---

# Wingman: Journey Mapping

The fourth of Wingman's 14 pipeline stages, and the first stage of **Phase 2: Logic & Functional Mapping** (with `define.md`) — that phase's goal is translating the idea into a blueprint an AI coding agent can actually build from. Personas & Jobs defined *who* and *why* — this stage maps the actual path they walk, end to end, from the moment they first realize they have the problem through to genuinely succeeding at their desired progress. Include the shortest path from first entry to core value as an explicit input->process->display step list.

$ARGUMENTS

Use `skills/context-assembly` to read the project's unified state before anything else in this stage (see `references/pipeline-stage-boilerplate.md`'s Context Assembly section) — stop and surface a blocking verdict or a state/checkpoint mismatch to the founder before continuing.

## Journey Mapping.1: Confirm the Design department is active

Use the `department-lead-activation` skill to check the Design activation signal: if this project has (or will have, per later stages' decisions) any user-facing surface, create `dept-design` if it doesn't exist yet, then delegate the journey-mapping portion of this step to it. If there's no user-facing surface, skip this step entirely and say so in one plain sentence — a journey worth mapping still exists for most projects (even a CLI or API has a first-use and a success moment), so only skip if the project genuinely has no journey a user walks at all.

Immediately after (only if `dept-design` is active), use the `management-board-activation` skill to check whether this project has crossed the 3+ conditionally-activated-department-lead complexity threshold (Design/Data/Legal-Security/DevOps/Growth only — never counting the always-active Product/Engineering/QA) — if so, check every currently-missing manager whose department lead is active, not just `mgr-design`.

## Journey Mapping.2: Map the journey

For each `PJ-*` persona/job in scope, walk the full journey from first thought to success: the stages they pass through, the friction points and emotions at each stage, the decision points where they could go a different direction, and the drop-off risks where they might abandon the journey entirely. Tag each with the `JM-` traceability prefix, pointing back to the `PJ-*` persona/job it maps.

Append this section to a scratch journey-mapping doc (`docs/wingman/journey-mapping/<short-slug>.md` in the founder's project, creating the directory if needed — same slug as earlier stages' files, same convention):

```markdown
## Journey map

| ID | Stage | Friction/emotion | Decision point | Drop-off risk | Satisfies |
|---|---|---|---|---|---|
| JM-001 | <journey stage, e.g. "first search"> | <what's hard, how they feel> | <where they could branch> | <what makes them abandon here, if anything> | PJ-001 |
```

## Journey Mapping.3: Show the journey, not just the table

Immediately after the table, use `skills/visual-founder-output` to render the same rows as an
actual journey diagram — detect the session's rendering tier first (Tier B: a Mermaid flowchart
appended to the same `docs/wingman/journey-mapping/<short-slug>.md` file; Tier A: a low-fidelity
horizontal journey-map Artifact). The table stays exactly as written above — it's what
`check-traceability.mjs` parses — the diagram is generated from the same rows, added alongside it,
never instead of it.

## Journey Mapping.4: Where you are

Use `skills/visual-founder-output` to add the pipeline-status tree (per
`references/visual-output-templates.md` §2) after the table/diagram above.

## Journey Mapping.5: Gate checklist

Before the checkpoint below, run the adaptive gap-finding loop and the 8-part output format from
`references/pipeline-gate-checklist.md`, then confirm this stage's own gate:

- **Must include:** first thought, trigger, decision points, friction points, emotional shifts,
  drop-off risks.
- **Must decide:** where to reduce friction first.
- **Gate passes only if** the full journey is mapped, end to end.

## Journey Mapping.6: Journey Mapping checkpoint

Run `/wingman:boardroom` with scope set to this stage's own journey map above. The checkpoint checks
the gate checklist above, not just the map in general: it confirms every Must-include item is
present and every Must-decide question is answered. The founder approves or sends back changes
through this one plain-language checkpoint before the pipeline moves on.

If the gate does not pass, the checkpoint blocks here and names the specific missing item(s) to the
founder — never a generic "needs work." Only once the checkpoint returns a "ship it" decision should
you hand off to `/wingman:define`.

## References

- `skills/traceability-linking` — the `JM-*` ID convention and how it chains back to `PJ-*`.
- `references/pipeline-gate-checklist.md` — the shared adaptive gap-finding loop, self-critique
  questions, gap register, and 8-part output format every stage runs before its own checkpoint.
- `skills/visual-founder-output` + `references/visual-output-templates.md` — how to render the
  journey diagram above; consult before choosing a rendering tier.
- `commands/adaptive/boardroom.md` — the checkpoint this stage records, per `docs/status/ARCHITECTURE.md` §4d.
