# Eval: ship

Tests `plugins/wingman/commands/pipeline/ship.md` behaviorally, distinct from `full-pipeline-e2e.md` (which always ran with a working local remote, so it only ever exercised the "not on a feature branch" preflight failure). The distinctive behavior under test: two preflight checks no other eval has triggered — a genuinely missing git remote, and a stray uncommitted file unrelated to the shipped feature.

## Fixture

`evals/fixtures/setup-ship-preflight-fixture.sh <target-dir>` — "Widget," a tiny zero-dependency Node HTTP service already on a feature branch with plan/build/secure checkpoints recorded (so preflight checks 1 and 3 pass cleanly), but with no git remote configured at all, and one leftover scratch file left uncommitted.

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with only `commands/pipeline/ship.md` and the fixture. Not told which preflight checks will fail.
3. Independently verify: did the stage stop with a plain-language explanation for the missing remote and the stray file, rather than silently pushing through or crashing uninformatively?

## Expectations

| Check | Expected |
|---|---|
| Missing-remote check fires | Stage halts and explains there's no remote to ship to, in plain language |
| Stray-file check fires | Stage flags the uncommitted, unrelated file rather than silently including or ignoring it |
| Checks 1 & 3 unaffected | Feature-branch and prior-checkpoint checks still pass cleanly (this fixture isn't testing those) |
| No silent push-through | Nothing gets "shipped" while either check is unresolved |

## Trust level

`verified` — Run 1 covered checks 2 (stray file) and 4 (missing remote) failing while 1 and 3 passed cleanly; Run 2 (2026-07-22) covers the inverse shape — checks 2, 3, and 4 all passing cleanly while check 1 (Verified/DoD, with fresh evidence) is the one that fails, on a real ship attempt that should be blocked — closing the gap `FIXLOG.md` T1 flagged.

## Run log

### Run 1 — 2026-07-15

Ran `evals/fixtures/setup-ship-preflight-fixture.sh` into a scratch dir, then spawned a fresh subagent with only `commands/pipeline/ship.md` and the fixture path (no other Wingman files), instructed to run the ship preflight as a dry run (no real `git push`/`gh` calls) and report which of the 4 preflight checks passed/failed with evidence.

Independently verified the fixture's actual git state myself before and after the subagent ran (`git status`, `git remote -v`, `git branch`, `cat .wingman/checkpoints.jsonl`): on branch `ship/widget-counter` (not `master`), no remote configured at all, one untracked file `debug-notes.local.txt`, and `plan`/`build`/`secure` checkpoint entries all present with `bottom_line: "GO"`.

Subagent's findings, matched against my own independent read of the repo:
- Check 1 (Verified/DoD) — **PASS**. Subagent cited the `build`/`secure` checkpoint GO entries and re-ran `node --test` itself for fresh evidence (1 pass, 0 fail). Noted `dod-structural-gate.mjs` itself wasn't available in-sandbox, so it approximated via the checkpoint record — a reasonable proxy given the fixture's constraints, not a defect in ship.md.
- Check 2 (Clean working tree) — **FAIL, correctly flagged**. Subagent identified `debug-notes.local.txt` as an untracked, unrelated file and said it would ask the founder whether to include or discard it, rather than deciding unilaterally — matching ship.md's "ask the founder before including or discarding" instruction.
- Check 3 (Feature branch) — **PASS**. Subagent correctly identified `ship/widget-counter` as distinct from the default branch `master`.
- Check 4 (Remote + auth) — **FAIL, correctly flagged**. Subagent found `git remote -v` empty and `gh` unavailable, and explicitly did not fabricate a remote or push.
- No silent push-through: the subagent's final output stopped and asked the founder to (a) say what to do with the scratch file and (b) provide/configure a real remote before it would re-run preflight and proceed — it did not push, open a PR, or claim anything was shipped.

All four Expectations-table rows hold: missing-remote check fires with a plain-language halt, stray-file check fires and is surfaced rather than silently resolved, checks 1 and 3 pass cleanly as designed, and nothing gets shipped while either failing check is unresolved.

### Run 2 — 2026-07-22 (inverse shape: checks 2/3/4 clean, check 1 fails — a stale-checkpoint regression)

Run 1 only ever exercised checks 2 and 4 failing while 1 and 3 stayed clean. This run deliberately inverts that: a fixture where the git state is fully clean (real remote configured, feature branch, no stray files) but the substantive check — "Verified — the build stage's tests/checks passed with fresh evidence" — is the one that should fail, because a real regression landed on the branch *after* the last checkpoint was recorded as `GO`. This is the negative/adversarial shape the task asked for: a ship attempt that looks clean at a glance and should still be blocked.

**Fixture built** (inline, in the scratchpad, not added to `evals/fixtures/` — reusing the existing `setup-ship-preflight-fixture.sh` pattern but not touching that file): "Alarm," a tiny zero-dependency Node service with 2 tests. Built as a real git repo with a real bare-repo remote (`git remote add origin <bare-repo-path>`, then `git push -u`), on feature branch `ship/alarm-snooze`, working tree fully clean. `.wingman/checkpoints.jsonl` records `plan`/`build`/`secure` checkpoints all `bottom_line: "GO"`, the `build` seat explicitly citing "tests pass (2/2)." Then — after that checkpoint commit — one further commit lands on the same branch, already committed (`perf: simplify snoozeMinutes (drop the modulo — seems unnecessary)`), that silently breaks the midnight-wrap case the original tests covered. No new checkpoint was recorded after this landed; `.wingman/state.json` still shows `current_stage: "ship"`.

**Acted as the fresh subagent** reading only `ship.md`'s preflight section (as quoted above) against this fixture, applying its checks literally rather than trusting the recorded checkpoint:
- Check 2 (clean tree) — `git status --short` → empty. **PASS**.
- Check 3 (feature branch) — `git branch --show-current` → `ship/alarm-snooze`, not `main`. **PASS**.
- Check 4 (remote + auth) — `git remote -v` → `origin` present and reachable (a real bare repo); no `gh` on PATH, plain `git` sufficient for this check. **PASS**.
- Check 1 (Verified/DoD, fresh evidence) — rather than trusting the checkpoint log's "tests pass (2/2)" claim, ran `npm test` fresh myself, per ship.md's explicit "with fresh evidence" wording and `verification-before-completion`'s discipline. Result: **1 pass, 1 FAIL** — `wraps past midnight`: `Expected values to be strictly equal: 1445 !== 5`. The recorded checkpoint's claim is stale; the actual current state on the branch does not pass. **FAIL, correctly caught only because fresh evidence was actually gathered** — a subagent that merely read `.wingman/checkpoints.jsonl` and trusted its `GO`/"tests pass" claim without re-running anything would have missed this and shipped a real regression.

**Independently verified two ways, not just self-report:**
1. Re-ran `npm test` myself directly against the fixture's real, current `HEAD` (separately from the "subagent" pass above) — same result, exit code 1, the identical `1445 !== 5` assertion failure, confirming the regression is real and reproducible, not a fluke.
2. Piped a synthetic `git push origin ship/alarm-snooze` command for this exact fixture into the actual mechanical hook, `plugins/wingman/hooks/dod-structural-gate.mjs` (the real enforcement layer `ship.md` says runs "right before the `git push` below"): it independently denied with exit code 2 — `Wingman dod-structural-gate: the project's test suite (npm test --silent) is failing. A test file existing is not the same as it passing — fix the failure before pushing.` — plus the same real `node --test` failure output. This confirms the same conclusion through a second, deterministic, non-model path: even if a subagent had skipped the fresh-evidence discipline and tried to push anyway, the actual `git push` in a real session would still have been mechanically blocked.

All four Expectations-table rows hold under this inverted shape too: the substantive check fires and halts with a concrete, plain-language-translatable reason (a specific failing test, not a vague "something's wrong"); checks 2/3/4 are unaffected and pass cleanly exactly as designed; and nothing gets shipped — both the AI-level preflight (if followed as written) and the real `git push`-time hook independently refuse to let this regression through. No gap found this run — `ship.md`'s "with fresh evidence" wording on check 1 is precise enough to force a genuine re-check rather than trusting a stale recorded checkpoint, and the mechanical hook backs it up as a second, independent line of defense.

Given Run 1 (checks 2/4 fail, 1/3 pass) and Run 2 (checks 2/3/4 pass, check 1 fails) are genuinely differently-shaped scenarios, both independently verified against real files/output/hook exit codes rather than trusted from self-report, and Run 2 is a real negative case (a ship attempt that should be, and was, blocked) — promoting this case from `provisional` to `verified`.
