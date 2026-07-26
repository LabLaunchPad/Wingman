---
description: Turn Discovery's raw notes into themes, risks, opportunities, and open questions — separating what's known, unknown, and merely assumed before requirements get scoped.
argument-hint: "[optional: path to the Discovery output, defaults to the most recent one]"
---

# Wingman: Research Synthesis

The second of Wingman's 14 pipeline stages. Discovery captured the raw problem statement and any evidence gathered while doing so — this stage steps back and actually synthesizes it: what themes keep showing up, what's genuinely known versus assumed, what risks and opportunities the raw notes imply, and what's still an open question a later stage needs to resolve.

$ARGUMENTS

## Research Synthesis.1: Confirm the Product department is active

`dept-product` is already active from `/wingman:discovery`; this stage doesn't introduce a new department signal, so no activation check is needed here.

## Research Synthesis.2: Synthesize the research

Read the Discovery output (from `/wingman:discovery`, or the path given in `$ARGUMENTS`). Do not just restate it — actively separate the signal from the noise:

- **Themes:** patterns that recur across whatever evidence Discovery gathered (multiple mentions of the same friction, the same workaround, the same complaint).
- **Known / Unknown / Assumed:** for each theme, is this something the evidence actually shows, something nobody has checked yet, or something the team is quietly assuming without evidence? Do not let an assumption masquerade as a known fact — that's exactly the gap this stage exists to close before Personas & Jobs and Journey Mapping build on top of it.
- **Risks and opportunities:** what could make this go wrong, and what upside is the raw research hinting at that Discovery's problem statement alone didn't capture?
- **Open questions:** anything genuinely unresolved that a later stage (or the founder directly) needs to answer.

Tag each row with the `RS-` traceability prefix (via the `traceability-linking` skill), pointing back to the `DISC-*` finding(s) it synthesizes.

Append this section to a scratch research-synthesis doc (`docs/wingman/research-synthesis/<short-slug>.md` in the founder's project, creating the directory if needed — same slug as Discovery's own file, same convention):

```markdown
## Research synthesis

| ID | Theme/risk/opportunity/question | Known/Unknown/Assumed | Satisfies |
|---|---|---|---|
| RS-001 | <one concrete theme, risk, opportunity, or open question> | <known / unknown / assumed> | DISC-001 |
```

## Research Synthesis.3: Where you are

Use `skills/visual-founder-output` to add the pipeline-status tree (per
`references/visual-output-templates.md` §2) after the table above.

## Research Synthesis.4: Gate checklist

Before the checkpoint below, run the adaptive gap-finding loop and the 8-part output format from
`references/pipeline-gate-checklist.md`, then confirm this stage's own gate:

- **Must include:** themes, evidence summary, contradictions, assumptions, open questions, source
  confidence.
- **Must decide:** what the evidence actually supports, and what remains unknown.
- **Gate passes only if** the findings are grounded — every theme is tagged known/unknown/assumed,
  and no assumption is presented as a known fact.

## Research Synthesis.5: Research Synthesis checkpoint

Run `/wingman:boardroom` with scope set to this stage's own synthesis table above. The checkpoint
checks the gate checklist above, not just the table in general: it confirms every Must-include item
is present and every Must-decide question is answered. The founder approves or sends back changes
through this one plain-language checkpoint before the pipeline moves on.

If the gate does not pass, the checkpoint blocks here and names the specific missing item(s) to the
founder — never a generic "needs work." Only once the checkpoint returns a "ship it" decision should
you hand off to `/wingman:personas-jobs`.

## References

- `skills/traceability-linking` — the `RS-*` ID convention and how it chains back to `DISC-*`.
- `references/pipeline-gate-checklist.md` — the shared adaptive gap-finding loop, self-critique
  questions, gap register, and 8-part output format every stage runs before its own checkpoint.
- `skills/visual-founder-output` + `references/visual-output-templates.md` §2 — the pipeline-status
  tree shown above.
- `commands/adaptive/boardroom.md` — the checkpoint this stage records, per `docs/ARCHITECTURE.md` §4d.
