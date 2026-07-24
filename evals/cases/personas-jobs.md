# Eval: personas-jobs

Tests `plugins/wingman/commands/pipeline/personas-jobs.md` behaviorally — the third of Wingman's 14
pipeline stages. The distinctive behavior under test: does the command produce a `PJ-*`-tagged
persona/jobs-to-be-done table where every row genuinely traces back to a real `RS-*` theme/finding
from Research Synthesis (evidence-based, not decorative, per the command's own wording), correctly
distinguish primary from secondary personas, flag thin evidence honestly rather than papering over
it, and record its own solo Boardroom checkpoint against its stage-specific gate (primary user and
main job to support both clear)?

## Fixture

`evals/fixtures/setup-personas-jobs-fixture.sh <target-dir>` — the base waitlist app with a
pre-seeded `docs/wingman/discovery/waitlist-unsubscribe.md` and
`docs/wingman/research-synthesis/waitlist-unsubscribe.md` carrying 3 distinct `RS-*` rows: RS-001
(known — no self-serve unsubscribe, users email support), RS-002 (known — founder hand-edits the
store, doesn't scale), RS-003 (assumed — untested whether users expect a confirmation).

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with `commands/pipeline/personas-jobs.md` (and its referenced
   `pipeline-gate-checklist.md` / `visual-founder-output` skill) and the pre-seeded discovery +
   research-synthesis docs, not told the expected answer.
3. Independently verify the output against the expectations below by reading the real files the
   subagent produced, not its self-report.

## Expectations

| Check | Expected |
|---|---|
| `PJ-*` table produced | `docs/wingman/personas-jobs/<slug>.md` contains a `PJ-*` table with Trigger/Pain/Workaround/Desired progress columns |
| Real evidence citation | Every row's `Satisfies` column cites an `RS-*` ID that actually exists in the fixture's research-synthesis doc — no fabricated IDs |
| Thin evidence flagged, not hidden | The `RS-003` ("Assumed") theme, if used, is carried as a secondary persona/job explicitly marked as thin evidence, not presented as a settled fact |
| Primary/secondary decided | The Decisions section states which persona is primary and which job the project supports first (the stage's own Must-decide items) |
| 8-part gate output | Phase summary, decisions, open issues, risks, gate check (pass/fail per Must-include/Must-decide item), gap register updates, carry-forward items, go/no-go status all present |
| Checkpoint recorded | `.wingman/checkpoints.jsonl` has an entry with `"stage": "personas-jobs"` and a bottom-line verdict |

## Trust level

`verified` — two genuinely differently-shaped real runs: Run 1 (3 distinct, well-evidenced `RS-*`
rows, confirming the stage produces a real multi-persona table with honest primary/secondary
distinction) and Run 2 (a single, thin/`Assumed` `RS-*` row, confirming the stage correctly refuses
to invent additional personas and lets its own gate fail rather than rubber-stamping unclear
evidence). Both independently checked against the real files.

## Run log

### Run 1 — 2026-07-24 (dedicated personas-jobs-only dispatch)

**Setup:** `setup-personas-jobs-fixture.sh`'s base fixture (waitlist app + discovery +
research-synthesis with RS-001/RS-002 known, RS-003 assumed).

**Dispatch** (fresh `general-purpose` subagent, given only `commands/pipeline/personas-jobs.md` +
its referenced `pipeline-gate-checklist.md` and `visual-founder-output`, not told the answer):
produced `docs/wingman/personas-jobs/waitlist-unsubscribe.md` with 3 rows — PJ-001 (primary,
waitlisted user wanting out, citing RS-001), PJ-002 (primary, founder absorbing support load, citing
RS-002), PJ-003 (secondary, post-unsubscribe confirmation uncertainty, citing RS-003, explicitly
flagged as thin evidence in both the table's Desired-progress cell and the Decisions section). Wrote
the full 8-part gate output below the table, then synthesized a Boardroom checkpoint into
`.wingman/checkpoints.jsonl` and a fresh `.wingman/state.json`, since no real invokable
`/wingman:boardroom` command exists inside a subagent dispatch — it disclosed this synthesis
explicitly (both in its own final report and in a `checkpoint_source` field inside the JSONL entry
itself) rather than silently faking a live checkpoint.

**Independently verified** (real filesystem, not the subagent's self-report):
`docs/wingman/personas-jobs/waitlist-unsubscribe.md` — confirmed all 3 `Satisfies` citations
(RS-001, RS-002, RS-003) exist verbatim in the fixture's research-synthesis doc, none fabricated;
confirmed RS-003's "Assumed" status is carried through honestly (PJ-003 marked secondary, its
Desired-progress cell says "exact form still open — see gate check," not stated as settled); gate
check section marks all 8 Must-include/Must-decide items pass individually, not just an overall
verdict; Decisions section explicitly names PJ-001 and PJ-002 as co-primary and states the priority
job. `.wingman/checkpoints.jsonl` — confirmed a real entry with `"stage": "personas-jobs"`,
per-item `gate_check` breakdown, 8 seat verdicts (7 `GO` + Design `N/A`, correctly — no design
surface at this stage), `bottom_line: "GO"`, and `next_stage: "journey-mapping"`.

**No bugs found in `personas-jobs.md` itself this run** — the evidence-citation discipline, the
primary/secondary judgment call, the honest-thin-evidence handling, and the gate-checklist output
all behaved exactly as the command spec requires on first try. The one notable environment
limitation (no live `/wingman:boardroom` invocable from inside a subagent dispatch) is the same
constraint every other eval case's run log already notes for solo-stage dispatches, not a defect in
this command.

### Run 2 — 2026-07-24 (thin/zero-evidence scenario)

**Setup:** new fixture `evals/fixtures/setup-personas-jobs-thin-evidence-fixture.sh` — a
research-synthesis doc with exactly **one** row (`RS-001`), itself marked `Assumed` (not `Known`),
with the phase summary explicitly stating no theme reached a firm evidence bar. Deliberate inverse
of Run 1's 3-row, 2-`Known`-plus-1-`Assumed` fixture — tests whether the stage manufactures extra
personas/confidence from a single thin data point.

**Dispatch** (fresh subagent, given only `personas-jobs.md` plus referenced skills, not told the
expected answer): produced exactly **one** row, `PJ-001`, explicitly labeled
`SPECULATIVE, not a confirmed persona` in its own Desired-progress cell — quoting the command's own
"do not invent facts" instruction as the reason no second/third persona was invented from the single
input theme. Gate check: **FAIL** — "Gate passes only if the target user and the job to be done are
both clear: FAIL. Both are explicitly marked Assumed/Unclear upstream and remain so here, neither is
clear." Bottom line: **NO-GO / blocked** — explicitly does not hand off to `/wingman:journey-mapping`
until real evidence resolves the logged gap or the founder explicitly accepts the risk. Synthesized
checkpoint disclosed via an explicit `checkpoint_source: "synthesized"` field (not a live dispatch),
CPO and Research seats `NO_GO`, `bottom_line: "DO NOT SHIP"`.

**Independently verified** (real files, not the subagent's self-report): confirmed
`docs/wingman/personas-jobs/waitlist-referrals.md` contains exactly one `PJ-*` row, its
evidence-confidence language matches the quoted text above verbatim, and the gate-check section
marks the Must-decide item as failed rather than passed-with-caveats. Confirmed
`.wingman/checkpoints.jsonl` and `.wingman/state.json` both parse as valid JSON
(`current_stage_status: "blocked"`), and the checkpoint-detail file's opening line honestly
discloses the synthesized (non-live) source.

**No bugs found** — the stage correctly resisted inventing a second persona or confidence it didn't
have, and let its own gate legitimately fail rather than rubber-stamping thin evidence. Promoted
trust level from `provisional` to `verified`.
