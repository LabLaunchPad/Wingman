# Eval: seven-stage-pipeline-e2e

Tests the core structural claim of MVP2's pipeline redesign: going from 4 named stages to 7 (`discovery`/`define`/`architecture`/`uxflow`/`implementation-planning`/`build`/`ship`) while *reducing* founder-visible Boardroom checkpoints from 4 to 3, via bundling the 5 planning stages into one "Planning Milestone." Extends (doesn't replace) `full-pipeline-e2e.md`'s whole-SDLC coverage, which still exercises the old 4-stage shape's behavioral quality; this case is specifically about the new bundling mechanics and the traceability chain that spans all 7 stages.

## Fixture

`evals/fixtures/setup-waitlist-app.sh <target-dir>` — a small real Node.js waitlist-signup app, reused from other evals in this suite.

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with only the 7 stage command files (`discovery.md` through `ship.md`) plus `boardroom.md`'s checkpoint-schema comments. Ask it to actually build a real small feature (a waitlist "unsubscribe" capability) end to end through all 7 stages, minting real `wingman:req` markers and writing real code/tests — not just describing what each stage would do. Simulate Boardroom checkpoints by writing the resulting JSON directly into `.wingman/checkpoints.jsonl` (a clean all-GO outcome) rather than dispatching all 8 seat subagents for real, since the seats' own review quality is covered elsewhere (`boardroom-7-seat.md`).
3. Independently verify: the checkpoint count and shape, the traceability chain, and — critically — whether the code actually works, by re-running the fixture's real test suite rather than trusting the subagent's own "done" claim.

## Expectations

| Check | Expected |
|---|---|
| Checkpoint count | Exactly 3 lines in `checkpoints.jsonl`, not 7 and not 4 |
| Planning Milestone shape | One entry with `"bundle": "planning-milestone"` and `stage` as an array of all 5 planning-stage names |
| Build/Ship shape | Two entries, each with a scalar `stage` and `bundle` matching its own name |
| No checkpoint from the 4 non-bundling planning stages | `discovery`/`define`/`architecture`/`uxflow` never write their own line |
| Traceability chain | `DEF-*` → `ARCH-*` → (→ `UX-*` if applicable) → plan tasks → source/test markers, all resolvable |
| Real, working code | The fixture's own test suite actually passes when re-run independently — not just claimed by the subagent |

## Trust level

`provisional` — the core structural claim (3 checkpoints, correct bundle/stage shape, a real cross-stage traceability chain) was independently confirmed true on the first run. This run is **not** promoted to `verified` on its own merits and is flagged with an honest caveat: a sandbox tooling outage during Build caused the subagent to write its second task's code/tests without a final verification run, and independent re-verification found that code genuinely broken (2 of 9 tests fail). This is a real finding about what can go wrong when `verification-before-completion` is bypassed by an environment failure, not a flaw in the 7-stage/3-checkpoint design itself — but it means this run doesn't meet the bar for a clean pass on its own, and a second run (without a mid-Build tooling outage) is still needed before this specific case is promoted.

**Update, same day**: the defect this run found is no longer able to slip through silently — see `evals/cases/dod-structural-gate.md`'s Run 2, which closed the exact gap by adding a real test-execution check (not just test-file presence) to `dod-structural-gate.mjs`, verified directly against this run's own broken fixture (the hook now denies the `git push` on this exact code with the exact real test failure output). So the underlying risk this run surfaced is permanently fixed at the mechanical-enforcement layer regardless of which agent or session hits it next; this case stays `provisional` because *this specific run's* Build output was still genuinely broken when produced, which is the honest record to keep, not because the risk remains open today.

## Run log

### Run 1 — 2026-07-14

**Structural claims: PASS**, independently confirmed against the real fixture filesystem (not the subagent's self-report):
- `.wingman/checkpoints.jsonl` has exactly 3 lines: `["discovery","define","architecture","uxflow","implementation-planning"]` / `"planning-milestone"`; `"build"` / `"build"`; `"ship"` / `"ship"`.
- `.wingman/state.json`: `active_department_leads: [dept-product, dept-engineering, dept-qa]`, `active_managers: [mgr-engineering, mgr-qa]` (Management Board correctly activated once the department-lead count crossed 3), `current_stage: "post-ship"`.
- The traceability chain resolved correctly end to end: `DEF-001..003` → `ARCH-001..003` (each `ARCH` row's `Satisfies` column names its `DEF` ID) → plan tasks (each carrying `wingman:req` markers) → `src/waitlist.js`/`src/server.js` and both test files, all with matching markers. No `UX-*` layer exists in this chain, which is itself a correct outcome: the fixture is a pure JSON API with no user-facing screens, so `uxflow.md`'s own skip logic correctly fired and no `UX-*` IDs were minted — confirming the chain degrades gracefully (`DEF`→`ARCH`→plan/code directly) when a planning stage is legitimately skipped, rather than the 5-stage bundle silently requiring all 5 to produce content.
- Git history in the fixture confirmed: 3 real commits — the seeded initial commit, a "Planning Milestone" commit bundling all 5 planning-stage artifacts, and a Task 1 commit (`removeFromWaitlist`) that was genuinely test-driven (subagent reported watching it fail for the right reason, then pass 6/6).

**Real defect found, not hidden**: partway through Task 2 (`DELETE /waitlist` route + its test file), the sandbox environment hit a sustained tool-execution outage (Bash commands failing) that made `npm test`/`git commit` unusable. The subagent wrote Task 2's code and test file to mirror Task 1's already-verified pattern, but explicitly and honestly reported it could not get a final verification run or commit before finishing, flagging this as an open item rather than silently claiming success. Independent re-verification confirmed the honesty of that caveat was warranted: re-running `npm test` in the fixture today shows **7 of 9 passing, 2 of 9 failing** — both `DELETE /waitlist` tests fail with `400 !== 200`, meaning the route handler has a real bug the subagent never actually caught (Task 2's code and test file are present on disk but were never committed, matching the subagent's own account). The Build/Ship checkpoints in `checkpoints.jsonl` still record a clean `GO`, which is now known-inaccurate for Task 2 specifically.

**What this run establishes vs. what it doesn't**: the 7-stage/3-checkpoint bundling mechanism itself — the actual subject of this eval — worked exactly as designed and is independently confirmed. What it doesn't establish is a fully clean example of the whole pipeline producing working code, because of an environment failure outside the pipeline design's control. Kept at `provisional` rather than `verified` specifically because of this, and rather than quietly upgrading trust on a run with a known, real defect in it. A second run, ideally without a tooling outage mid-Build, is needed to confirm the same structural result holds when nothing goes wrong in the sandbox, before this is promoted.
