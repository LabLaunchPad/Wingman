# Eval: boardroom-gate-rule

Tests `plugins/wingman/commands/boardroom.md`'s consolidation logic (the "Bottom line rule") directly — specifically the `DO NOT SHIP` path, which no prior eval in this project had ever exercised: every real or simulated Boardroom run so far (across `department-lead-activation`, `evolve-promotion`, and all four stages of `full-pipeline-e2e`) stayed at `GO` or `GO WITH CHANGES`. This case is deliberately narrow: it tests the mechanical rule application and checkpoint file-writing, not the quality of independent seat judgment (already covered by other evals), so it uses synthetic seat verdicts rather than deriving them from a real review.

## Fixture

`evals/fixtures/setup-boardroom-gate-fixture.sh <target-dir>` — a trivial one-file project with a single uncommitted one-line diff. The content is intentionally unimportant; it exists only so `git diff` has something to point at.

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with `boardroom.md` and `docs/ARCHITECTURE.md` §4, and 4 synthetic seat-verdict sets (all-`GO`; mixed with `GO_WITH_CONCERNS` but no `NO_GO`; two `NO_GO` among otherwise-clean seats; all-`NO_GO`). Ask it to compute and format the consolidated summary for all 4 textually, and to actually perform the real checkpoint file-write for the "two `NO_GO`" case only (the most realistic shape of the untested path), since a fresh `.wingman/` in this fixture also exercises the "create `state.json` from scratch" path.
3. Independently verify the real file writes against the filesystem.

## Expectations

| Case | Seats | Expected bottom line |
|---|---|---|
| A | All `GO` | `GO` |
| B | Mixed `GO`/`GO_WITH_CONCERNS`, no `NO_GO` | `GO WITH CHANGES` |
| C | 2 `NO_GO` (engineer, security), rest `GO` | `DO NOT SHIP` |
| D | All `NO_GO` | `DO NOT SHIP` |

Additional checks: Case C's checkpoint file write is valid JSON, preserves both `NO_GO` summaries verbatim, and — since `boardroom.md` sets `state.json`'s `current_stage` from `next_stage` unconditionally — does **not** advance `next_stage` to a following pipeline stage (which would silently let a blocked project advance past the gate). `state.json` should be created fresh with empty `active_department_leads`/`active_specialists` arrays, matching this fixture having no prior state.

## Trust level

`provisional` — passed one run testing all 4 points on the GO/GO_WITH_CHANGES/DO NOT SHIP spectrum, with a real file-write check on one of the two DO-NOT-SHIP shapes (mixed) but not the other (unanimous rejection, Case D) — that distinction is unlikely to matter mechanically (the rule is a simple "any NO_GO" predicate) but hasn't been separately confirmed against real file output.

## Run log

### Run 1 — 2026-07-07

**Result: PASS on all 4 cases.** The rule was confirmed to be a pure `any(NO_GO)` predicate — Case C (2 of 5 seats `NO_GO`) and Case D (5 of 5) produced an identical bottom line (`DO NOT SHIP`) and identical consolidated framing, differing only in which seats' summaries appeared. No ambiguity found in the rule text itself.

**Real finding surfaced and fixed**: `boardroom.md` never specified what `next_stage` should be on a `DO NOT SHIP` outcome. Since `state.json`'s `current_stage` is set from `next_stage` unconditionally, a caller following the schema's other examples (which show `next_stage` as "the following pipeline stage") could plausibly have pointed a `DO NOT SHIP` checkpoint's `next_stage` at the next stage too — silently advancing the project past a blocked gate. The subagent reasoned through this correctly on its own and pinned `next_stage` to the *same* stage that was reviewed; `boardroom.md` now states this explicitly as the rule, rather than leaving each future caller to reason it out independently (or not).

**Independent verification** (real filesystem, Case C): `.wingman/checkpoints.jsonl` created with one valid JSON line, `bottom_line: "DO NOT SHIP"`, both `NO_GO` summaries preserved verbatim, `next_stage: "build"` (same as `stage: "build"` — correctly pinned, not advanced). `.wingman/state.json` created fresh with `current_stage: "build"`, `active_department_leads: []`, `active_specialists: []` — matching the fixture having no prior state.

Kept at `provisional` pending a real file-write check on the unanimous-rejection shape (Case D) too (see above).
