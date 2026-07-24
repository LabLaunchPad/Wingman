# Pipeline gate checklist — cross-stage reference

Shared mechanics for all 14 pipeline stages (`discovery.md` through `ship.md`). Every stage's own
Must-include / Must-decide / Gate-passes-only-if checklist is stage-specific and lives in that
stage's own file — this reference holds the parts that are identical across all 14, so they are
written once instead of 14 times. Cited from every pipeline command's own checkpoint section and
`references/pipeline-stage-boilerplate.md`.

## Design decision: one shared doc per stage, not 9 new files

The founder-facing "required global artifacts" this reference implements (phase summary, decision
log, open issues, risks, acceptance criteria, handoff notes, gate checklist, gap register,
carry-forward items) are **sections inside the same per-stage doc each stage already writes**
(`docs/wingman/<stage>/<slug>.md`), not 9 separate files per stage. 14 stages times 9 files would be
up to 126 new files in a solo founder's project directory for content that is, in practice, a few
short paragraphs per stage — that's ceremony, not signal, and it would fight the same
engineering-minimalism instinct this repo already applies everywhere else. The one exception is the
**gap register**, which is explicitly a cross-pipeline artifact (see below) and lives in one shared
file, not per-stage.

So, concretely:

- **Per-stage sections** (phase summary, decisions, open issues, risks, acceptance criteria,
  handoff notes, gate checklist) — appended to the bottom of the same
  `docs/wingman/<stage>/<slug>.md` file the stage's own table/output already lives in, using the
  headings in "Output format" below. These are not new files.
- **Gap register** — one shared file for the whole pipeline: `docs/wingman/gap-register.md` in the
  founder's project (create it on first use, in `/wingman:discovery`, if it doesn't exist yet).
  Every stage appends or updates rows in this same file; it is never split per stage, because a gap
  found in one stage is frequently only resolved in a later one, and a single register is what makes
  that traceable.
- **Carry-forward items** — tracked as a section in the gap register file (see below), since a
  carry-forward item and a deferred gap are the same kind of thing in practice (a valid finding that
  isn't blocking right now).

## The adaptive gap-finding loop

Run this loop for every stage, before finalizing that stage's output — not just once at the end of
the whole pipeline:

1. Draft the stage's output (the table/content the stage's own file already specifies).
2. Compare the draft against this stage's own Must-include / Must-decide checklist (in the stage's
   own file).
3. Look for missing artifacts, missing decisions, missing risks, missing approvals, missing edge
   cases, missing accessibility items, missing QA items, and missing handoff details — use the
   self-critique questions below to find them.
4. Add every valid missing item to the draft.
5. Re-check the draft against the checklist.
6. If anything critical is still missing after that, mark the stage **blocked** — do not finalize a
   stage with a known critical gap silently patched over.
7. Repeat steps 2-6 until the stage passes, or until you can clearly and specifically explain the
   blocker to the founder.

## Self-critique questions

Ask these before finalizing any stage's output:

- What did I forget?
- What decision is implied but not stated explicitly?
- What evidence is missing?
- What edge case is missing?
- What failure state is missing?
- What risk is missing?
- What accessibility or content issue is missing?
- What QA check is missing?
- What handoff detail is missing?
- What would an enterprise reviewer ask that this output does not already answer?
- What would a solo founder need, to avoid confusion or rework later?

## Gap register

Maintain one gap register for the full pipeline, at `docs/wingman/gap-register.md` in the founder's
project. Every gap entry needs these columns:

| Gap ID | Phase | Description | Why it matters | Impact | Priority | Suggested fix | Owner | Status |
|---|---|---|---|---|---|---|---|---|
| GAP-001 | <stage name> | <the gap, concretely> | <why it matters, not just that it does> | <what breaks or gets worse if unaddressed> | <blocking / high / medium / low> | <a concrete fix, not "investigate more"> | <who owns closing this> | <open / deferred / resolved> |

Rules:

- If a gap blocks progress, its stage is marked **blocked** and the gap's Status is `open` with
  Priority `blocking`.
- If a gap matters but isn't blocking, mark it `deferred` and state the reason in the Suggested fix
  column (why it's safe to defer, not just that it was deferred).
- If a gap is resolved, mark it `resolved` and say how, in the same row — do not delete resolved
  rows; the register is a running history, not a live-only list.
- Hide internal traceability IDs (`DEF-001`, `ARCH-001`, etc.) from the founder-facing summary
  unless the founder is actually looking at the register itself or asks for traceability detail —
  per `skills/traceability-linking`'s existing convention of keeping IDs out of prose.

## Output format for every stage

Every stage's finalized output follows this 8-part shape, appended to the stage's own
`docs/wingman/<stage>/<slug>.md` file below its existing table:

1. **Phase summary** — one short paragraph, plain language, what this stage produced and why it
   matters.
2. **Decisions** — the concrete decisions this stage made (often the same rows as the stage's own
   table, referenced by ID).
3. **Open issues** — anything unresolved that isn't yet a registered gap.
4. **Risks** — anything that could go wrong because of what this stage decided.
5. **Gate check** — the stage's own Must-include / Must-decide checklist, explicitly marked
   pass/fail per item, not just an overall verdict.
6. **Gap register updates** — any `GAP-*` rows added, updated, or resolved by this stage.
7. **Carry-forward items** — anything genuinely deferred to a later stage, named specifically (which
   stage, and why then and not now).
8. **Go/no-go status** — the stage's own bottom-line verdict, before the Boardroom checkpoint runs.

This 8-part shape is what the stage hands to its own Boardroom checkpoint (see "Gate enforcement"
below) — the checkpoint reviews this shape directly, it does not re-derive it.

## Gate enforcement

Every stage's checkpoint section must do more than review the output in general. It must explicitly
check that the stage's own Must-include and Must-decide items (from that stage's own file) are
present in the 8-part output above, and only a passing gate check hands off to the next stage. A
gate that does not pass:

- **Stops the pipeline** at this stage — the next stage does not start.
- **Surfaces the specific missing item(s)** to the founder by name (e.g. "the Must-decide item
  'whether the idea is too large' was never answered"), never a generic "needs work."
- Gets logged as an `open` or `blocking` row in the gap register if it isn't fixed immediately.

## Global rules

Most of these are this repo's existing philosophy, already enforced elsewhere — cited here, not
restated:

- **Speak in plain English first, hide internal IDs unless needed for traceability** —
  `skills/plain-language-checkpoint` and `skills/traceability-linking`.
- **Prefer boring, battle-tested defaults** — `skills/engineering-minimalism`.
- **Do not invent facts** — every stage's own file already says "flag genuinely unresolved items
  plainly rather than inventing evidence" in some form; this is a pipeline-wide restatement of the
  same rule, not a new one.
- **Do not advance to the next stage until the gate passes** — see "Gate enforcement" above.
- **If the scope is too large for one solo founder, say so directly and reduce it** — this is new:
  any stage that finds scope exceeding what a solo founder can realistically ship must say so in
  the Phase summary and propose a smaller cut, rather than silently carrying an oversized scope
  forward.
- **Explain what the stage means in simple terms** — every stage's Phase summary (part 1 of the
  output format above) exists specifically for this.
- **Treat each stage as a governed handoff** — the 8-part output format and the gate-enforcement
  rule above are what make this concrete rather than aspirational.
- **If a better rule is missing, add it** — if a stage repeatedly hits a gap this reference doesn't
  cover, that's a `wingman:log` entry per `docs/PROJECT.md`'s decisions log, not a silent one-off
  workaround.

## Writing standard

Apply this to every stage's output (already largely how this repo writes; stated explicitly here so
it's checkable):

- Active voice, present tense.
- Short sentences; one idea per sentence where reasonable.
- Sentence-case headings.
- Numbered lists for procedures (steps done in order); bullets for non-sequential items.
- Put conditions before instructions (e.g. "If there's no user-facing surface, skip this step" —
  not "Skip this step if there's no user-facing surface").
- Concise, direct, copy-paste-ready output — no filler.

## Referenced by

All 14 pipeline commands (`discovery.md`, `research-synthesis.md`, `personas-jobs.md`,
`journey-mapping.md`, `define.md`, `information-architecture.md`, `uxflow.md`, `wireframes.md`,
`visual-design-system.md`, `prototype-usability.md`, `architecture.md`,
`implementation-planning.md`, `build.md`, `ship.md`) and `references/pipeline-stage-boilerplate.md`.
