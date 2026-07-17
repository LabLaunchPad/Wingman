---
name: visual-founder-output
description: Use whenever producing founder-facing output that has real shape to it — a flow of screens/states, a multi-stage pipeline position, a multi-seat verdict grid — where a diagram or tree would let a founder grasp it faster than prose. Extends plain-language-checkpoint with a visual layer; never a substitute for it. Triggers on "add a diagram", "make this visual", "mermaid", "show me the flow", or any Wingman output where the underlying content is structurally a flow, tree, or grid rather than a list of facts.
---

# Visual Founder Output

## Overview

`plain-language-checkpoint` sets the writing bar for every founder-facing message — jargon
translation, consequence-first, one bottom line. It says nothing about layout, and today nothing in
Wingman does: every command's report template (verified directly against the actual files) is a
flat `**Label:** value` list or a plain markdown pipe-table, even for content that is structurally a
flow (`uxflow.md`'s screens-and-transitions) or a status (which of 7 pipeline stages a founder has
actually completed — nowhere shown anywhere). This skill is the visual layer on top of
`plain-language-checkpoint`'s prose layer: same audience, same "does this actually help a
non-technical founder" bar, applied to *shape* instead of *words*.

**Core principle:** detect what the current session can actually render before choosing a format,
never assume — the same "detect first, choose second, fall back silently" discipline this project
already uses for tool availability (`skills/package-manager-selection`, `skills/git-pr-workflow`),
applied here to rendering medium instead of a CLI.

## When To Use

Whenever the content being reported is structurally a flow, a tree/hierarchy, a status-across-stages,
or a multi-party verdict grid — not for content that's genuinely just a fact or a short list, which
prose already handles fine. Concretely, in this pass: `commands/uxflow.md`'s screen/transition
output, and `commands/boardroom.md`'s consolidated report (both seat verdicts and pipeline
position). Don't reach for this skill to decorate content that has no real shape — a diagram of
three unrelated bullet points is noise, not clarity.

## Core Workflow

**1. Detect the rendering tier for this session, before formatting anything.** Check whether an
Artifact-publishing tool is actually present in this session's tool surface right now (the same kind
of concrete check `git-pr-workflow` does with `command -v gh` — a real check, not an assumption from
context or from what a *previous* session had). Two tiers result:

   - **Tier A — Artifact-capable.** An Artifact-publishing tool is genuinely available. Produce a
     real rendered visual: a low-fidelity HTML wireframe per key screen for a UX flow (boxes and
     labels only — no CSS framework, no real styling decisions, this is a shape-of-the-experience
     sketch, not `design-taste`'s job), or a rendered status dashboard for a boardroom checkpoint.
   - **Tier B — universal fallback.** No Artifact capability detected, or genuinely unsure which
     this session has. Use Mermaid fenced code blocks plus ASCII/box-drawing trees, following the
     concrete templates in `references/visual-output-templates.md`. This degrades to readable,
     well-structured plain text in an environment with no diagram renderer at all (a terminal), and
     renders as an actual diagram anywhere that does support Mermaid (GitHub's web UI, an
     Artifact-capable session) — it is never worse than the flat table it's supplementing.

   **When genuinely unsure, choose Tier B.** An unrendered ASCII tree is still readable; a broken or
   silently-failed Artifact call is not — the fallback direction only ever goes toward "definitely
   works," never the reverse.

**2. The plain-English bottom line always leads, in both tiers.** Whatever `plain-language-checkpoint`
already requires as the lead sentence stays the lead sentence — the diagram or mockup is additive
context placed after it, never a replacement for it and never the first thing a founder has to parse.

**3. Layer the detail, ebook-style.** Structure non-trivial output as: headline (the bottom line) →
one visual (the diagram/tree/grid) → expandable detail sections, surfaced only if the founder asks
or the situation genuinely needs it. This is the same "one bottom-line sentence first, details after,
only if asked" instinct `plain-language-checkpoint`'s anti-patterns table already names — made
structurally explicit once a visual is involved, since a diagram invites over-explaining it right
next to itself.

**4. Never let the visual replace or contradict the machine-readable source it illustrates.**
`uxflow.md`'s `UX-*` table stays exactly as it is — `check-traceability.mjs` and `check-fixtures.mjs`
depend on those IDs existing in table form. A flow diagram is added *alongside* the table, generated
from the same data, never in place of it. Same rule for `.wingman/state.json`/`checkpoints.jsonl`
underneath a pipeline-status view: the visual is a fresh rendering of state Wingman already tracks,
not a new source of truth.

## Constraints

**MUST:**
- Detect the actual rendering tier available in this session before choosing a format — never assume
  Tier A because a previous session or a different surface had it.
- Keep the plain-English bottom line as the lead, in both tiers.
- Generate any visual from the same underlying data as the table/state file it illustrates — never a
  parallel, hand-authored version that could drift from the source.
- Default to Tier B when genuinely unsure which tier applies.

**MUST NOT:**
- Replace a traceability-bearing table (`uxflow.md`'s `UX-*` table) with a diagram — add alongside,
  never instead of.
- Add a diagram to content that has no real shape (a short fact, a single-item list) just because a
  visual is available — see Red Flags.
- Let the visual layer relax `plain-language-checkpoint`'s jargon/consequence-first bar — a
  beautifully rendered diagram full of unexplained technical terms is still a failing checkpoint.
- Invent new persistent state to power a visual — render fresh from `.wingman/state.json` /
  `checkpoints.jsonl`, which already exist; this project's architecture is deliberately flat-files,
  no server (see `docs/ARCHITECTURE.md`).

## Rationalizations

| Excuse | Reality |
|---|---|
| "This session probably has Artifacts, most do" | "Probably" is exactly the assumption step 1 exists to remove — check the actual tool surface, every time, or default to Tier B. |
| "A Mermaid block will render fine everywhere" | It renders on GitHub's web UI and in an Artifact-capable session; in a plain terminal it's inert text. Tier B's templates are written to still be readable as plain text, not just as a diagram source. |
| "I'll skip the table now that there's a nicer diagram" | The table is what `check-traceability.mjs` and `check-fixtures.mjs` actually parse — removing it breaks CI, not just aesthetics. |
| "Every report could use a diagram, more visual is always better" | Content with no real shape doesn't get clearer from a diagram — it gets noisier. Reserve this for genuinely flow/tree/grid-shaped content. |

## Red Flags — Stop and Reconsider

- About to emit a Mermaid block without having checked whether this session can actually render it.
- About to remove or replace a `UX-*`/traceability table with a diagram instead of adding alongside it.
- About to diagram a single fact or a short flat list that prose already conveys clearly.
- The diagram is the first thing in the output, ahead of the plain-English bottom line.
- About to hand-author a pipeline-status view instead of rendering it from `.wingman/state.json`.

## Verification

Before shipping a new visual: confirm the rendering-tier check was a real tool-surface check, not an
assumption (re-read the actual detection step you ran). After producing Tier A output, confirm the
Artifact call actually succeeded (real confirmation, not assumed) — on any failure, fall back to
Tier B immediately rather than leaving broken or half-rendered output. For both tiers, re-read the
final output against `plain-language-checkpoint`'s bar: does the bottom line still lead, and is the
diagram additive rather than a replacement for the underlying table/state.

## Output

No new founder-facing template of its own — this skill governs *how* `uxflow.md` and `boardroom.md`
render the visual layer of their existing templates (see those commands and
`references/visual-output-templates.md` for the concrete shapes).

## References

- `references/visual-output-templates.md` — the actual copy-paste Mermaid/ASCII templates for UX
  flow, pipeline status, and the boardroom seat-verdict grid, plus Tier-A wireframe guidance.
- `skills/plain-language-checkpoint` — the prose bar this skill extends; consult it for anything
  about wording, not layout.
