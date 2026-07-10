# Eval: drift

Tests `plugins/wingman/commands/drift.md` (v8, see `docs/ARCHITECTURE.md` §12) — does it correctly distinguish already-covered asks from genuinely new scope, route genuinely new scope through a real, mechanically-enforced checkpoint gate, and fail safe (write zero code) when a real decision can't be obtained in-turn? Three scenarios, because the headless-fallback path is a real code path introduced in v8, not just a documented claim.

## Fixtures

- **Interactive/positive + negative**: `evals/fixtures/setup-drift-fixture.sh <target-dir>` — "waitlist-app," an already-approved plan (`docs/wingman/plans/2026-07-05-waitlist-signup.md`, already `ship it`) with a specific, bounded scope (a name+email signup form with email validation, explicitly "no admin UI in this pass"). Its precise scope makes both directions testable: a request already covered (email validation — already an explicit design line) and a request genuinely new (CSV export — explicitly deferred by the plan's own "no admin UI" line).
- **Headless fallback**: `evals/fixtures/setup-drift-headless-fixture.sh <target-dir>` — "invoice-app," an already-approved, draft-only plan (`docs/wingman/plans/2026-07-08-invoice-drafts.md`) that explicitly states "No emailing... in this pass." Used with a request that directly contradicts that stated scope (auto-emailing invoices), in a simulated headless session.

## Procedure

1. **Scenario 1 (positive/interactive) — detection + amendment write** (subagent, `setup-drift-fixture.sh`): given a request not covered by the plan, verify Step 1 correctly detects it as new scope with real evidence, and that `plan.md`'s amendment mode correctly appends a `## Amendment: <date>` section to the end of the file leaving every prior line byte-for-byte untouched.
2. **Scenario 1 (positive/interactive) — the mechanical gate itself**, tested directly against the real `boardroom-checkpoint.mjs` hook via piped simulated `ExitPlanMode` input (the same method `boardroom-gate-rule.md` and the original safety-gate hardening pass already use), independent of any subagent's self-report:
   a. Plan file with the amendment appended but no fresh checkpoint yet → confirm the hook denies.
   b. Same file with a fresh `## Wingman Boardroom Checkpoint` (ship it) appended after the amendment → confirm the hook allows.
3. **Scenario 2 (negative)** (subagent, fresh copy of `setup-drift-fixture.sh`): given a request already covered by the plan, verify Step 1 says so with specific evidence and stops — no amendment written, no plan-file modification at all, confirmed via `git status`/checksum.
4. **Scenario 3 (headless fallback)** (subagent, `setup-drift-headless-fixture.sh`, session simulated as headless): given genuinely new scope, verify the command appends the amendment, records `still_reviewing` in `.wingman/checkpoints.jsonl` with the exact field shape drift.md specifies for this case, appends a `LEARNINGS.md` entry, and writes zero code for the drifted scope — confirmed via checksum of the untouched source file.
5. Independently verify every claim against the real filesystem, not any subagent's self-report.

## Expectations

| Check | Expected |
|---|---|
| Scenario 1 detection | Genuinely new scope correctly identified, with a specific quote from the plan as evidence (not a vague "seems new") |
| Scenario 1 amendment append | `## Amendment: <date>` section at the true end of file; every prior byte unchanged (checksum-verified on the original content's byte range) |
| Scenario 1 hook — before fresh checkpoint | `boardroom-checkpoint.mjs` denies `ExitPlanMode` |
| Scenario 1 hook — after fresh checkpoint | `boardroom-checkpoint.mjs` allows `ExitPlanMode` |
| Scenario 2 detection | Already-covered correctly identified with a specific quote from the plan as evidence |
| Scenario 2 side effects | Zero — no amendment, no plan-file modification of any kind, no re-review triggered |
| Scenario 3 detection | Genuinely new scope correctly identified (request directly contradicts an explicit plan line) |
| Scenario 3 checkpoint record | `still_reviewing`, `seats: []`, `bottom_line: ""`, `rounds: 0` — per drift.md's explicit field convention for this no-dispatch case |
| Scenario 3 code writes | Zero — the pre-existing source file's checksum is unchanged after the test |
| Scenario 3 learning capture | A `LEARNINGS.md` entry in `learn.md`'s format, describing the drift and its still-reviewing outcome |

## Trust level

`verified` — all three scenarios passed with real evidence, independently checked against the filesystem/real hook execution, not self-report. Two genuine gaps were found (not just hypothesized) via this eval and fixed before promotion — see Run log.

## Run log

### Run 1 — 2026-07-10

**Scenario 1, detection + amendment**: subagent correctly identified the CSV-export request as new scope, quoting the plan's own "No admin UI in this pass — the team will query the store directly if they need a list" line as evidence that this was explicitly deferred, not silently omitted. Amendment append verified byte-for-byte: md5sum of the original file's first 35 lines matched the corresponding slice of the edited 39-line file exactly, and the diff showed only additions after line 35.

**Scenario 1, the mechanical gate — real bug found and fixed.** Testing the hook directly (not trusting a subagent's account of what it "would" do) surfaced a genuine gap: after appending the amendment to a plan file that already had an approved "ship it" checkpoint from before the amendment, `boardroom-checkpoint.mjs` **incorrectly allowed** `ExitPlanMode` — the stale pre-amendment approval was still physically present in the file, and the hook's marker-scan logic didn't check whether anything had been appended *after* it. This directly contradicted `drift.md`'s own stated guarantee ("nothing proceeds on undecided scope, in either case") for the exact case the founder's own round-1 Boardroom review had specifically pushed to deepen. Root cause: the hook evaluated "does the source contain an approved checkpoint text anywhere" rather than "is the source's *most recent* content actually a checkpoint, with nothing unreviewed following it."

Fixed `boardroom-checkpoint.mjs`: a checkpoint is now only treated as "current" if nothing but its own 3 fields (`Bottom line`/`Founder decision`/`Timestamp`) follows the marker — genuinely the last thing in the file, not just the last *marker*. Re-verified directly:
- Amendment appended, no new checkpoint yet → **deny** (`"this plan has changed since its last Boardroom checkpoint"`) — confirmed fixed.
- Fresh `ship it` checkpoint appended after the amendment → **allow** — confirmed the re-arm mechanism genuinely works end to end.
- Re-ran the full original regression suite from the prior safety-gate hardening pass (no-marker-file→deny, inline-ship-it→allow, file-ship-it+inline-empty→allow, file-DO-NOT-SHIP→deny, file-still-reviewing→deny, unmarked-file→deny, adversarial cross-source cases→correct, non-`ExitPlanMode`→pass-through, malformed-stdin→fail-closed-deny) — **all still pass**, confirming the fix didn't regress any previously-verified path.
- Added one new regression case this bug specifically motivates: a plan rejected once (`DO NOT SHIP`), amended, and re-approved via a fresh checkpoint → **allow**, confirming a stale rejection doesn't veto forever once superseded by a real, current re-approval (the fix is scoped to "latest," not "first" or "any").

**Scenario 2 (negative)**: subagent correctly identified the email-validation request as already covered, quoting the plan's own `submitSignup(name, email)` validation line as evidence. Confirmed via direct filesystem inspection: `git status` clean, plan file checksum unchanged, no amendment section present — zero side effects, exactly as Step 1 prescribes.

**Scenario 3 (headless fallback) — a second real gap found and fixed.** The subagent correctly detected new scope (auto-email contradicts the plan's explicit "No emailing... in this pass" line), correctly appended the amendment, correctly wrote zero code (source file checksum unchanged, confirmed independently), and correctly appended a `LEARNINGS.md` entry. But it flagged, honestly and correctly, that `drift.md`'s text didn't actually specify what to put in `checkpoints.jsonl`'s `seats`/`bottom_line`/`rounds` fields for this case — `boardroom.md`'s own `still_reviewing` fallback (which `drift.md`'s text pointed to as "the exact fallback value") only ever fires *after* all five seats have already run, which doesn't apply here since no dispatch happens at all in the headless-fallback branch. The subagent made a reasonable ad-hoc judgment call (empty/zero placeholders plus an explanatory `founder_notes`), but a second subagent given the same scenario could plausibly have made a different one — inconsistent schema output across runs, not a design flaw in the gate itself.

Fixed `drift.md`'s headless-session branch to specify the exact convention: `"seats": []`, `"bottom_line": ""` (empty string, deliberately outside the normal `GO`/`GO_WITH_CHANGES`/`DO NOT SHIP` enum — an honest "no review ran" rather than a fabricated pass), `"rounds": 0`, `next_stage` set to the interrupted stage. Documented the one-time enum exception in `docs/DATABASE.md`'s field notes so a future reader of `checkpoints.jsonl` doesn't mistake an empty `bottom_line` for a parsing error. Re-ran `validate-structure.mjs`/`check-repo-consistency.mjs` — both still PASS.

Both fixes were caught by actually running the mechanism (a real hook execution, a real subagent hitting genuine ambiguity) rather than by inspection of the design alone — consistent with this project's established `verification-before-completion` discipline. Promoted to `verified`: all three scenarios pass with real evidence, and the two gaps this run surfaced are now closed and re-verified, not just logged.
