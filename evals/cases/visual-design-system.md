# Eval: visual-design-system

Tests `plugins/wingman/commands/pipeline/visual-design-system.md` behaviorally. The distinctive
behaviors under test: does the command (a) derive concrete typography/spacing/color/component/state
tokens from real `WF-*` wireframe rows, tagged with the `VS-*` traceability prefix, (b) recognize and
reuse a shared component across screens rather than re-specifying it twice (the fixture's WF-001/
WF-002 explicitly share one button component), (c) correctly defer actual quality *enforcement*
(anti-slop/accessibility checks) to the `design-taste` skill at build time rather than re-doing that
work itself, and (d) record a real checkpoint with `stage: "visual-design-system"`.

## Fixture

`evals/fixtures/setup-visual-design-system-fixture.sh <target-dir>` — the base waitlist app with
pre-seeded discovery, define (DEF-001..004), architecture (ARCH-001..004), uxflow (UX-001), and
wireframes (WF-001 confirmation page, WF-002 error state) artifacts. WF-002 explicitly notes its
"Try again" button reuses WF-001's "Resubscribe" button component — the fixture's one deliberate
reuse signal.

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with only `commands/pipeline/visual-design-system.md` (plus whatever
   referenced skills/references it needs to follow faithfully: `department-lead-activation`,
   `management-board-activation`, `visual-founder-output`, `pipeline-gate-checklist`,
   `traceability-linking`) and the fixture project directory — not told the expected answer.
3. Independently verify the real output files afterward, not the subagent's self-report.

## Expectations

| Check | Expected |
|---|---|
| `VS-*` table produced | `docs/wingman/visual-design-system/<slug>.md` has a `VS-*`-tagged table |
| Rows cite real `WF-*` IDs | Every row's `Satisfies` column points at `WF-001` and/or `WF-002`, not invented IDs |
| Tokens are genuinely specific | Real values (hex colors, px sizes, a named spacing scale) — not vague placeholders like "a nice blue" |
| Component reuse recognized | The shared button (WF-001 "Resubscribe" / WF-002 "Try again") is specced as one component with variants, not duplicated as two separate rows |
| States present | Interactive components list default/hover/focus/disabled/error at minimum |
| Enforcement correctly deferred | The stage produces the spec only — no anti-slop/accessibility *enforcement* pass baked into this stage's own output; that's `design-taste`'s job at build time |
| Checkpoint recorded | `.wingman/checkpoints.jsonl` has an entry with `stage: "visual-design-system"` and a real verdict (not a stub) |
| Gate checklist followed | Output includes the 8-part shape from `pipeline-gate-checklist.md` (phase summary, decisions, open issues, risks, gate check, gap register updates, carry-forward, go/no-go) |

## Trust level

`provisional` — passed one real run, single scenario (positive case: a UI-bearing project with a
genuine component-reuse signal). No negative case (a no-UI project skipping the stage) has been run
yet for this specific command.

## Run log

### Run 1 — 2026-07-24 (dedicated visual-design-system-only dispatch)

**Setup:** `setup-visual-design-system-fixture.sh`'s fixture — the waitlist app with discovery/
define/architecture/uxflow/wireframes pre-seeded, including WF-001 (confirmation page) and WF-002
(error state), with WF-002's wireframe row explicitly noting its "Try again" button reuses WF-001's
"Resubscribe" button component.

**Dispatch (fresh `general-purpose` subagent, given only `commands/pipeline/visual-design-system.md`
plus its referenced skills, and the fixture project directory — not told the expected answer):**
correctly checked Design department activation (found `dept-design` not yet active in this fixture,
since the fixture only pre-seeds docs, not `.claude/agents/`, and created it fresh with the
activation evidence cited), correctly ran `management-board-activation` and did nothing (only 1
conditional department lead active, below the 3+ threshold), and produced a 7-row `VS-*` table:
VS-001 type scale, VS-002 spacing scale, VS-003 color palette (5 named roles with hex values),
VS-004 shared header, VS-005 the shared button component (recognizing the WF-001/WF-002 reuse and
specifying it once with primary/secondary emphasis variants and full default/hover/focus/disabled/
error states), VS-006/VS-007 the two screens' content blocks. Every row's `Satisfies` column cited
real `WF-001`/`WF-002` IDs. Produced the full 8-part gate-checklist output and the pipeline-status
tree via `visual-founder-output`. Recorded a real checkpoint in `.wingman/checkpoints.jsonl` (8-seat
verdicts, `bottom_line: "GO"`, `stage: "visual-design-system"`) with a `details_ref` file that
actually exists on disk, and updated `.wingman/state.json` correctly (`current_stage:
"prototype-usability"`, `last_checkpoint_id` matching). Everything committed to the fixture repo.

**Independently verified** (real filesystem, not the subagent's self-report):
`docs/wingman/visual-design-system/waitlist-unsubscribe.md` read directly — confirmed real hex
values (`#2563EB`, `#DC2626`, etc.), a real 4px-based spacing scale (8/16/32/48px), and VS-005's
prose explicitly stating the button is "used as 'Resubscribe' (secondary emphasis, WF-001) and 'Try
again' (primary emphasis, WF-002)" — genuine one-component reuse, not two duplicated rows.
`.wingman/checkpoints.jsonl` parsed and confirmed `stage: "visual-design-system"`,
`bottom_line: "GO"`; the referenced `details_ref` file exists. `.wingman/state.json` confirmed.
`.claude/agents/dept-design.md` confirmed to exist. `git log` confirmed a real commit
(`6729d98`) on top of the fixture's pre-seed commit.

**No bugs found this run.** The command correctly stuck to producing the spec/tokens document and did
not attempt to re-run `design-taste`'s anti-slop/accessibility enforcement itself (no contrast-ratio
verification, no anti-slop checklist walkthrough appear in this stage's output) — the spec-vs-
enforcement boundary held as designed. Still `provisional`: only the positive/UI-bearing scenario has
been exercised; a negative (no-UI project, skip-cleanly) run is the natural next scenario before
promoting to `verified`.
