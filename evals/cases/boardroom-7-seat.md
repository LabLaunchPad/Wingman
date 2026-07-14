# Eval: boardroom-7-seat

Tests `plugins/wingman/commands/boardroom.md`'s 7-seat dispatch and consolidation logic — the MVP1 hard cutover from 5 seats (founder/engineer/security/design/cost) to 7 (CEO/CPO/CMO/CTO/CISO/CFO/Research/Design). This case is deliberately narrow, mirroring `boardroom-gate-rule.md`'s approach: it uses synthetic seat verdicts rather than deriving them from a real review, so it tests the mechanical dispatch-count, grouped-summary formatting, and gate-rule reduction — not the quality of independent seat judgment (each seat's own review discipline is covered by reading its agent file, not by this eval).

## Fixture

`evals/fixtures/setup-boardroom-gate-fixture.sh <target-dir>` — reused from `boardroom-gate-rule.md`: a trivial one-file project with a single uncommitted one-line diff. Content is unimportant; it exists only so `git diff` has something to point at.

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with `commands/boardroom.md`, all 8 `agents/boardroom-*.md` files, and `docs/ARCHITECTURE.md` §4 — but no other eval case, so it isn't told the expected answer.
3. Give it 2 synthetic seat-verdict sets to format and gate:
   - **Run A (all-GO)**: all 8 seats (`ceo`, `cpo`, `cmo`, `cto`, `ciso`, `cfo`, `research`, `design`) return `GO`, with `cmo` and `research` explicitly `N/A — no material input on this checkpoint` (the documented fast-path).
   - **Run B (mixed)**: `cto` returns `GO_WITH_CONCERNS` ("no test plan for the webhook retry path"), `ciso` returns `NO_GO` ("hardcoded API key in the diff"), the rest `GO`.
4. Ask it to produce the consolidated grouped summary for both runs, and to actually perform the real checkpoint file-write (`.wingman/checkpoints.jsonl` + `state.json`) for Run B only, since a fresh `.wingman/` in this fixture also exercises the "create `state.json` from scratch" path with the new `active_managers: []` field.
5. Independently verify the real file write against the filesystem — do not trust the subagent's self-report alone.

## Expectations

| Check | Expected |
|---|---|
| Seat count dispatched | 8 (7 Boardroom C-suite-style seats + Design), not 5 |
| Grouped summary headers | Business (CEO/CPO/CMO), Technical (CTO/CISO), Finance (CFO), Research (Research) — plus Design shown separately or folded in per `boardroom.md`'s actual grouping; **not** a flat unlabeled list of 8 bullets |
| N/A fast-path (Run A) | CMO and Research's `N/A` verdicts render as `GO`-equivalent (don't count as a missing/blocking seat) and are visually distinguishable as "no material input" rather than a substantive review |
| Bottom line (Run A) | `GO` |
| Bottom line (Run B) | `DO NOT SHIP` — the rule is still a pure `any(NO_GO)` predicate regardless of seat count (5 → 8 seats doesn't change the gate-rule shape) |
| Checkpoint file (Run B) | `.wingman/checkpoints.jsonl` has one valid JSON line, `"schema_version": 2`, all 8 `seats[]` entries present with correct `seat` names (`ceo`/`cpo`/`cmo`/`cto`/`ciso`/`cfo`/`research`/`design`), `ciso`'s `NO_GO` summary preserved verbatim, `bottom_line: "DO NOT SHIP"`, `next_stage` pinned to the same stage reviewed (not advanced past the gate) |
| `state.json` (Run B) | Created fresh with `active_department_leads: []`, `active_managers: []`, `active_specialists: []` — the new `active_managers` field present and empty, not omitted |
| Old seat names absent | No `founder`/`engineer`/`security`/`cost` seat names appear anywhere in the new checkpoint's `seats[]` |

## Trust level

`provisional` — passed one run covering both the all-GO and mixed-`DO NOT SHIP` shapes, with real file-write verification of the mixed case. Needs a second, differently-shaped scenario (e.g. a unanimous-`NO_GO` 8-seat run, mirroring `boardroom-gate-rule.md`'s Run 2) before promotion to `verified`.

## Run log

### Run 1 — 2026-07-14

**Result: PASS on every expectation, with one nuance and two flagged judgment calls.** A fresh subagent, given only `boardroom.md`, the 8 agent files, and `docs/ARCHITECTURE.md` §4 (not this eval document), correctly:
- Dispatched and accounted for all 8 seats in both runs, never silently dropping the 2 new seats (CPO, CMO) or the renamed `research` seat.
- Rendered Run A's consolidated summary under grouped Business/Technical/Finance/Research headers, with CMO and Research shown as `N/A` in a visually distinct way from a substantive `GO`, and computed `GO` as Run A's bottom line.
- Computed `DO NOT SHIP` for Run B from a single `NO_GO` (`ciso`) among otherwise-clean seats, confirming the gate rule is unchanged in shape at 8 seats. Initially dropped the Research row from Run B's summary for brevity, caught its own inconsistency against Run A, and self-corrected before reporting — a real (if minor) formatting-consistency slip worth noting since it's exactly the kind of drift a founder-facing checkpoint shouldn't have.
- Wrote a real, valid `checkpoints.jsonl` line for Run B — **independently re-parsed and confirmed valid JSON** (`python3 -c "json.load(...)"`) rather than trusting the subagent's self-report — with `schema_version: 2`, 7 of 8 seats present under their new names (`design` correctly omitted per the schema's own "omitted when N/A" rule), `ciso`'s rejection reason preserved verbatim, and `next_stage` pinned to the same value as `stage` (not advanced past the gate).
- Created `state.json` fresh with all three roster arrays empty, including the new `active_managers: []` — confirming the Management Board schema addition doesn't break the existing fresh-state-create path.
- Independently verified via direct file inspection (not the subagent's self-report): `git status --porcelain -- plugins/wingman/` in the Wingman repo showed only this session's own in-progress MVP1 changes (no eval-run leakage into the plugin directory), and the fixture's `.wingman/checkpoints.jsonl`/`state.json` matched every expectation above exactly on re-read.

No old seat names (`founder`/`engineer`/`security`/`cost`) appeared anywhere in the output. Two judgment calls worth recording rather than treating as failures: (1) since this was a standalone ad-hoc `/wingman:boardroom` invocation rather than one embedded in `plan`/`build`/`secure`/`ship`, the subagent used `"ad-hoc"` for both `stage` and `next_stage` (no named pipeline stage to pin to) — a reasonable reading, but `boardroom.md` doesn't explicitly address the ad-hoc case for this field, worth tightening in a future pass; (2) `founder_decision` was set to `"still_reviewing"` since no real founder was available to answer `AskUserQuestion` in this synthetic test, which is the documented fallback, not a fabricated decision.

One promotion criterion remains open: a second, differently-shaped run (e.g. unanimous-`NO_GO` across all 8 seats, or a run exercising an already-populated `state.json` rather than a fresh one) before this case can move to `verified`, following the same two-scenario bar every other case in this suite met.
