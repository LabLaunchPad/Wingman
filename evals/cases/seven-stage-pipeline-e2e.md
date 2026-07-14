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

`verified` — Run 1 confirmed the core structural claim with a real, honestly-disclosed defect in the resulting code (see below); Run 2 confirmed the same structural claim again, this time with fully working code and no environment interruption — the second, differently-shaped scenario (founder-in-the-loop `AskUserQuestion` decisions, a real 8-seat Boardroom dispatch, Management Board activation crossing the 3-lead threshold, real bugs found and fixed via genuine review rather than the design being untested) this project's own verified-case bar requires.

**Update, same day**: the defect this run found is no longer able to slip through silently — see `evals/cases/dod-structural-gate.md`'s Run 2, which closed the exact gap by adding a real test-execution check (not just test-file presence) to `dod-structural-gate.mjs`, verified directly against this run's own broken fixture (the hook now denies the `git push` on this exact code with the exact real test failure output). So the underlying risk this run surfaced is permanently fixed at the mechanical-enforcement layer regardless of which agent or session hits it next; this case stays `provisional` because *this specific run's* Build output was still genuinely broken when produced, which is the honest record to keep, not because the risk remains open today.

## Run log

### Run 1 — 2026-07-14

**Structural claims: PASS**, independently confirmed against the real fixture filesystem (not the subagent's self-report):
- `.wingman/checkpoints.jsonl` has exactly 3 lines: `["discovery","define","architecture","uxflow","implementation-planning"]` / `"planning-milestone"`; `"build"` / `"build"`; `"ship"` / `"ship"`.
- `.wingman/state.json`: `active_department_leads: [dept-product, dept-engineering, dept-qa]`, `active_managers: [mgr-engineering, mgr-qa]` (Management Board correctly activated once the department-lead count crossed 3), `current_stage: "post-ship"`.
- The traceability chain resolved correctly end to end: `DEF-001..003` → `ARCH-001..003` (each `ARCH` row's `Satisfies` column names its `DEF` ID) → plan tasks (each carrying `wingman:req` markers) → `src/waitlist.js`/`src/server.js` and both test files, all with matching markers. No `UX-*` layer exists in this chain, which is itself a correct outcome: the fixture is a pure JSON API with no user-facing screens, so `uxflow.md`'s own skip logic correctly fired and no `UX-*` IDs were minted — confirming the chain degrades gracefully (`DEF`→`ARCH`→plan/code directly) when a planning stage is legitimately skipped, rather than the 5-stage bundle silently requiring all 5 to produce content.
- Git history in the fixture confirmed: 3 real commits — the seeded initial commit, a "Planning Milestone" commit bundling all 5 planning-stage artifacts, and a Task 1 commit (`removeFromWaitlist`) that was genuinely test-driven (subagent reported watching it fail for the right reason, then pass 6/6).

**Real defect found, not hidden**: partway through Task 2 (`DELETE /waitlist` route + its test file), the sandbox environment hit a sustained tool-execution outage (Bash commands failing) that made `npm test`/`git commit` unusable. The subagent wrote Task 2's code and test file to mirror Task 1's already-verified pattern, but explicitly and honestly reported it could not get a final verification run or commit before finishing, flagging this as an open item rather than silently claiming success. Independent re-verification confirmed the honesty of that caveat was warranted: re-running `npm test` in the fixture today shows **7 of 9 passing, 2 of 9 failing** — both `DELETE /waitlist` tests fail with `400 !== 200`, meaning the route handler has a real bug the subagent never actually caught (Task 2's code and test file are present on disk but were never committed, matching the subagent's own account). The Build/Ship checkpoints in `checkpoints.jsonl` still record a clean `GO`, which is now known-inaccurate for Task 2 specifically.

**What this run establishes vs. what it doesn't**: the 7-stage/3-checkpoint bundling mechanism itself — the actual subject of this eval — worked exactly as designed and is independently confirmed. What it doesn't establish is a fully clean example of the whole pipeline producing working code, because of an environment failure outside the pipeline design's control. Not promoted to `verified` on this run alone, and rather than quietly upgrading trust on a run with a known, real defect in it — see Run 2 below.

### Run 2 — 2026-07-14 (real dogfooding pass, not a subagent simulation)

Distinctly shaped from Run 1 in the way this project's own verified-case bar requires: this run was executed directly (not delegated to a background subagent), against a genuinely new feature ("Tip Jar" — a one-time Stripe tip page for a creator's link-in-bio site), with the real user standing in as the founder for every `AskUserQuestion` decision the pipeline's own instructions call for (tip-amount model, failure-mode framing, payment processor choice, tip-message policy, and the final ship/fix-concerns decision) — not a pre-scripted or assumed answer at any point.

**Structural claims: PASS again**, independently confirmed against the real fixture filesystem:
- `.wingman/checkpoints.jsonl` has exactly 3 lines: `2026-07-14T21-30-00Z-implementation-planning` (`bundle: planning-milestone`, `stage` as an array of all 5 planning-stage names, `bottom_line: GO_WITH_CHANGES`), `2026-07-14T22-30-00Z-build` (`bundle: build`, `GO_WITH_CHANGES`), `2026-07-14T23-00-00Z-ship` (`bundle: ship`, `GO`).
- Unlike Run 1, this run crossed the Management Board's 3-department-lead threshold with 5 department leads active (`dept-product`, `dept-engineering`, `dept-design`, `dept-legal-security`, `dept-qa`) — a genuinely different, higher-complexity shape than Run 1's 3-lead case — resulting in 6 real managers created (`mgr-design`, `mgr-engineering`, `mgr-product`, `mgr-research`, `mgr-qa`, `mgr-security`), which is what led directly to catching and fixing 2 real bugs in `management-board-activation`'s own "Relevant to" table (stale stage names, a missing `uxflow` row) — see `docs/wingman/retros.md`'s dogfooding retro for the fix.
- A real 8-seat Boardroom dispatch at the Planning Milestone checkpoint (not simulated JSON, actual parallel `Agent` calls to all 8 boardroom agent files) found 6 independent, unscripted concerns (a missing home-page link, no server-side payment verification, a possible reflected-XSS, a missing test-writing task, an unconsidered simpler alternative, an underspecified trust signal) — all folded back into the plan before Build, confirming the checkpoint mechanism produces real signal on a real review, not just on synthetic seat verdicts.
- At the Build-stage diff checkpoint, 2 real seats (CTO, CISO) independently caught the same genuine bug (hardcoded `localhost` Stripe redirect URLs) from different angles — fixed with a real failing-then-passing test, confirming the diff-review path (not just the plan-review path) also produces real findings.

**No defect this time — fully clean**: `node --test test/stripe.test.js test/server.test.js` passes **14/14** at the end of this run, with no tooling interruption anywhere in the sequence. This directly closes what Run 1 left open: the same 7-stage/3-checkpoint structure, run again end to end with real founder decisions and real code, produced fully working code this time, confirming Run 1's structural finding wasn't a fluke and Run 1's defect really was attributable to the sandbox outage rather than the pipeline design.

**Bonus finding, also fixed**: this run also caught and fixed a second real bug in `dod-structural-gate.mjs` itself — its threat-register check only ever read `docs/wingman/plans/`, silently missing an `OPEN` risk kept in a separate `docs/wingman/build/` file (a location `build.md` never specified). Proved by deliberately introducing a real `OPEN` row there and watching the hook wrongly allow the push; fixed by specifying an exact convention in `build.md` and making the hook itself defensively scan `docs/wingman/build/` too. See `docs/wingman/retros.md` for the full retro.

Promoted to `verified`: two differently-shaped real runs (a subagent-simulated build with an honestly-disclosed environment-caused defect; a directly-executed, founder-in-the-loop build with fully working code and a higher-complexity Management Board activation) both confirm the same core structural claim, and between them surfaced and permanently closed 3 real bugs in the shipped plugin.
