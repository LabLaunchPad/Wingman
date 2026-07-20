# Eval: ship

Tests `plugins/wingman/commands/ship.md` behaviorally, distinct from `full-pipeline-e2e.md` (which always ran with a working local remote, so it only ever exercised the "not on a feature branch" preflight failure). The distinctive behavior under test: two preflight checks no other eval has triggered — a genuinely missing git remote, and a stray uncommitted file unrelated to the shipped feature.

## Fixture

`evals/fixtures/setup-ship-preflight-fixture.sh <target-dir>` — "Widget," a tiny zero-dependency Node HTTP service already on a feature branch with plan/build/secure checkpoints recorded (so preflight checks 1 and 3 pass cleanly), but with no git remote configured at all, and one leftover scratch file left uncommitted.

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with only `commands/ship.md` and the fixture. Not told which preflight checks will fail.
3. Independently verify: did the stage stop with a plain-language explanation for the missing remote and the stray file, rather than silently pushing through or crashing uninformatively?

## Expectations

| Check | Expected |
|---|---|
| Missing-remote check fires | Stage halts and explains there's no remote to ship to, in plain language |
| Stray-file check fires | Stage flags the uncommitted, unrelated file rather than silently including or ignoring it |
| Checks 1 & 3 unaffected | Feature-branch and prior-checkpoint checks still pass cleanly (this fixture isn't testing those) |
| No silent push-through | Nothing gets "shipped" while either check is unresolved |

## Trust level

`provisional` — passed one real run (2026-07-15); not yet re-run against a second, differently-shaped scenario including a negative case, per `evals/README.md`'s bar for `verified`. Corrected 2026-07-20 from a `verified` label the run log doesn't actually support (see `FIXLOG.md` T1).

## Run log

### Run 1 — 2026-07-15

Ran `evals/fixtures/setup-ship-preflight-fixture.sh` into a scratch dir, then spawned a fresh subagent with only `commands/ship.md` and the fixture path (no other Wingman files), instructed to run the ship preflight as a dry run (no real `git push`/`gh` calls) and report which of the 4 preflight checks passed/failed with evidence.

Independently verified the fixture's actual git state myself before and after the subagent ran (`git status`, `git remote -v`, `git branch`, `cat .wingman/checkpoints.jsonl`): on branch `ship/widget-counter` (not `master`), no remote configured at all, one untracked file `debug-notes.local.txt`, and `plan`/`build`/`secure` checkpoint entries all present with `bottom_line: "GO"`.

Subagent's findings, matched against my own independent read of the repo:
- Check 1 (Verified/DoD) — **PASS**. Subagent cited the `build`/`secure` checkpoint GO entries and re-ran `node --test` itself for fresh evidence (1 pass, 0 fail). Noted `dod-structural-gate.mjs` itself wasn't available in-sandbox, so it approximated via the checkpoint record — a reasonable proxy given the fixture's constraints, not a defect in ship.md.
- Check 2 (Clean working tree) — **FAIL, correctly flagged**. Subagent identified `debug-notes.local.txt` as an untracked, unrelated file and said it would ask the founder whether to include or discard it, rather than deciding unilaterally — matching ship.md's "ask the founder before including or discarding" instruction.
- Check 3 (Feature branch) — **PASS**. Subagent correctly identified `ship/widget-counter` as distinct from the default branch `master`.
- Check 4 (Remote + auth) — **FAIL, correctly flagged**. Subagent found `git remote -v` empty and `gh` unavailable, and explicitly did not fabricate a remote or push.
- No silent push-through: the subagent's final output stopped and asked the founder to (a) say what to do with the scratch file and (b) provide/configure a real remote before it would re-run preflight and proceed — it did not push, open a PR, or claim anything was shipped.

All four Expectations-table rows hold: missing-remote check fires with a plain-language halt, stray-file check fires and is surfaced rather than silently resolved, checks 1 and 3 pass cleanly as designed, and nothing gets shipped while either failing check is unresolved.
