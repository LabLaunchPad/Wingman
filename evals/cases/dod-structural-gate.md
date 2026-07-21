# Eval: dod-structural-gate

Tests `plugins/wingman/hooks/dod-structural-gate.mjs` — the new deterministic hook that mechanically enforces artifact *presence* (traceability, tests, a clean threat register) before a real `git push`, closing the gap that 5 discipline skills were previously enforced only by prose. This is the highest-risk piece of MVP2's design: the plan explicitly flagged that the test-presence heuristic is the likeliest source of a false-positive over-block (the same failure shape `boardroom-checkpoint.mjs`'s own v12.1 fix had to correct once), so this case exists specifically to prove that risk does *not* materialize.

Like `traceability-validator.md`, this is deterministic — the hook's logic has no model-judgment component — so it's verified by feeding real JSON stdin to the actual hook script and checking its exit code/output, not by grading a subagent.

## Fixtures (inline git repos, not `setup-*.sh` scripts)

Five small real git repos, each with a `.wingman/checkpoints.jsonl` recording a prior Build-stage checkpoint (`"bundle": "build"`) so the hook's git-push registration actually engages:

1. **Compliant**: a `wingman:req`-marked source file with a matching `.test.js` file that actually passes, a `plan.md` with a `CLOSED`-only threat register. Expected: allow.
2. **Missing test**: the same marked source file, no test file anywhere, no escape-hatch marker. Expected: deny, naming the exact file.
3. **Escape hatch**: a source file with no test file, but an explicit `<!-- wingman:no-test-needed: pure config, no logic to test -->` marker. Expected: allow — this is the case that specifically proves the false-positive-over-block risk doesn't materialize for a legitimately test-free change.
4. **Open threat**: a compliant test setup, but `plan.md`'s threat register has an `OPEN` row. Expected: deny.
5. **No prior checkpoint**: an ordinary git repo with no `.wingman/` state at all. Expected: allow — the hook must never block ordinary git usage in a project not using Wingman's pipeline.
6. **Test file present but actually failing** (added in Run 2, see below): a marked source file with a real, executable test file that exists (satisfying check #2) but genuinely fails when run. Expected: deny — this is the fixture that directly re-creates the real bug `seven-stage-pipeline-e2e.md`'s Run 1 found, where a test file's mere *existence* wasn't enough to catch a genuinely broken implementation.
7. **Recorded a blocking Boardroom verdict** (added in Run 3, see below): a Build checkpoint whose `bottom_line` is `"DO NOT SHIP"` (and, as a defense-in-depth variant, one where only a single seat recorded `NO_GO` while `bottom_line` stayed non-blocking) — otherwise identical to the Compliant fixture (traceability/tests/threat-register all clean). Expected: deny — this is the fixture from `docs/wingman/architecture-audit-2026-07-15.md`'s Proven finding #2: a checkpoint entry *existing* is not the same as it having actually *passed*, and the gate previously never read the verdict fields at all.
8. **Threat register status typo/deviation** (added in Run 4, see below): a threat register row whose Status column reads `PENDING` (or any word other than the literal substring `OPEN`) for a risk that is not actually resolved. Expected: deny — the old check only pattern-matched the literal substring `OPEN`, so this row silently passed despite being genuinely unresolved.
9. **Behavior-split test suite** (added in Run 4, see below): a source file (`src/server.js`) with real, passing test coverage split across several behavior-named test files (`test/shorten.test.js`, `test/redirect.test.js`, etc.), none of which match the source file's own basename. Expected: allow — the old check only recognized a test file named after the source file's basename, so this legitimately-covered file was wrongly flagged as missing a test.

A sixth check (not a fixture): `ExitPlanMode` with plan text that doesn't contain the `## Planning Milestone checkpoint` heading must be ignored entirely (allow), proving the ExitPlanMode registration is correctly scoped and won't fire on unrelated plan-mode exits — including this project's own dev-planning sessions, which have zero `wingman:req` markers by design and would otherwise have been wrongly blocked by an unscoped check.

## Procedure

1. Build each fixture as a real git repo (git init, a commit, the files above).
2. Pipe a synthetic `PreToolUse`/`Bash` tool-call JSON (`{"tool_name":"Bash","cwd":"<fixture>","tool_input":{"command":"git push origin main"}}`) into `node plugins/wingman/hooks/dod-structural-gate.mjs` for fixtures 1-5.
3. Pipe a synthetic `PreToolUse`/`ExitPlanMode` JSON with an unrelated plan for the 6th check.
4. Check the exit code (0 = allow, 2 = deny) and the exact deny message.

## Expectations

| Fixture | Expected | What it proves |
|---|---|---|
| 1. Compliant | Exit 0, allow | The happy path doesn't get needlessly blocked |
| 2. Missing test | Exit 2, deny naming the specific file | The gate actually catches a real gap |
| 3. Escape hatch | Exit 0, allow | The named false-positive risk does NOT materialize for a legitimate test-free change |
| 4. Open threat | Exit 2, deny | The folded-in threat register (from the former `secure.md`) still blocks |
| 5. No prior checkpoint | Exit 0, allow | Never blocks ordinary git usage outside Wingman's pipeline |
| 6. Test file present but failing | Exit 2, deny naming the failing test command and tail output | Presence alone is not correctness — the gate runs the suite for real, not just checks the file exists |
| 7. Recorded blocking Boardroom verdict | Exit 2, deny naming which field blocked (`bottom_line` or the specific seat) | A checkpoint existing is not the same as it having actually passed — closes the audit-found governance gap |
| 8. Threat register status typo/deviation | Exit 2 (or `checkThreatRegisterClean(...).ok === false`), deny | A real founder-decision-driven dogfood run found this exact bypass live — the gate must catch any non-CLOSED status, not just the literal word OPEN |
| 9. Behavior-split test suite | Allow, `checkTestPresence(...)` returns `[]` | A real dogfood run found this exact false-positive-over-block — a legitimately, fully-tested file must not be flagged just because no test file shares its basename |
| 10. Unrelated ExitPlanMode | Exit 0, allow | The ExitPlanMode registration is narrowly scoped, doesn't touch unrelated plan-mode exits |

## Trust level

`verified` — all 10 scenarios ran and were independently checked against actual exit codes and exact output text, covering both directions of the risk this hook was built to manage (catches a real gap; doesn't over-block a legitimate case) plus the scope-narrowing design decision for its ExitPlanMode registration, plus (Run 3) the audit-found Boardroom-verdict governance gap, plus (Run 4) two real bugs a genuine interactive dogfood run found and fixed.

## Run log

### Run 1 — 2026-07-14

**Result: PASS on all 6 scenarios**, plus one real bug caught and fixed: the git-push registration's `getChangedFiles` fell back to `HEAD~20` when no commit SHA was recorded on the checkpoint, but in any fixture with fewer than 20 commits `git diff HEAD~20..HEAD` fails outright — the original code caught that failure and silently returned an empty file list, meaning the test-presence check would run against **zero files** and always pass, a silent false-negative in exactly the direction this hook exists to prevent. Fixed by trying a sequence of fallback base refs (the repository's actual first commit via `git rev-list --max-parents=0 HEAD`, then git's canonical empty-tree hash as a last resort) before giving up, so a diff range is always resolvable in a real repo regardless of commit count.

After the fix, direct verification of all 6:
1. **Compliant** — `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow"}}`, exit 0.
2. **Missing test** — `Wingman dod-structural-gate: no test file found for: src/reset.js. Add a test, or mark the change with <!-- wingman:no-test-needed: <reason> --> if it genuinely doesn't need one (e.g. docs/config-only).`, exit 2.
3. **Escape hatch** — allow, exit 0 (confirmed the `<!-- wingman:no-test-needed: ... -->` marker is honored, not just documented).
4. **Open threat** — `Wingman dod-structural-gate: the threat register still has an OPEN row. Close it or get explicit founder acceptance (see build.md's Definition-of-Done gate) before pushing.`, exit 2.
5. **No prior checkpoint** — allow, exit 0.
6. **Unrelated ExitPlanMode** — allow, exit 0 (confirmed via a separate direct test earlier in this session, using plan text without the `## Planning Milestone checkpoint` heading).

Also confirmed separately: piping malformed/unrelated `Bash` input (a plain `ls -la` command) allows immediately without attempting any check, and importing the hook's pure functions (`checkPlanningMilestoneTraceability`, `checkTestPresence`, `checkThreatRegisterClean`) as an ES module does not trigger the CLI's stdin-reading/`process.exit` path, since the CLI body is now correctly guarded behind the same `process.argv[1] === fileURLToPath(import.meta.url)` check `secret-guard.mjs` already uses (an actual bug in the first draft of this hook, caught and fixed before this eval ran).

Promoted directly to `verified` given all 6 differently-shaped scenarios — spanning both directions of the central risk (real catch vs. false-positive avoidance) — passed together on the same run.

### Run 2 — 2026-07-14 (closing a real gap this eval's own sibling case found)

`seven-stage-pipeline-e2e.md`'s Run 1 caught a genuine bug this hook, as originally built, would **not** have caught: a test file existed (satisfying check #2 above) but the implementation it tested was actually broken (2 of 9 tests failed on independent re-run) — presence was never the same as correctness, and the gate as designed didn't distinguish the two. Closed by adding a 4th check: `runTestSuite()` actually executes the project's own declared test command (detected generically — `package.json`'s `test` script, `pytest.ini`/`pyproject.toml`, `go.mod`, `Cargo.toml`, `Gemfile` — not assuming Node.js, since Wingman builds arbitrary founder projects) and denies if it exits non-zero, with a 2-minute timeout so a hung suite can't hang the gate indefinitely.

**Verification, directly against the real broken fixture from `seven-stage-pipeline-e2e.md`'s Run 1** (not a synthetic re-creation): piping a `git push` call for that exact fixture into the updated hook now denies with `Wingman dod-structural-gate: the project's test suite (npm test --silent) is failing. A test file existing is not the same as it passing — fix the failure before pushing.` followed by the real `node --test` failure output (both `DELETE /waitlist` assertions, `400 !== 200`) — confirming the new check would have caught this exact real-world defect before it reached `git push`, not just a contrived example.

**A second real gap surfaced and fixed in the same pass**: adding this check first tripped the *existing* test-presence check (#2) instead, incorrectly reporting `src/waitlist.js` as missing a test — because that fixture's tests live under a top-level `test/` directory, a convention `checkTestPresence`'s candidate list never included (it only checked same-directory and `__tests__/`-subdirectory variants). Fixed by adding `test/<name>.test.<ext>` and `tests/<name>.test.<ext>` (plus `.spec.` and `test_` variants) to the candidate list. Re-verified all 5 original scenarios plus the new failing-suite scenario together after both fixes — all 6 pass exactly as expected (see Expectations table above), with no regression on the escape-hatch or no-checkpoint allow paths.

This run is the direct, load-bearing link between a real defect found in one eval (`seven-stage-pipeline-e2e.md`) and a permanent, deterministic fix in this project's mechanical enforcement layer — the kind of fix that holds regardless of which agent or session builds the next feature, not a one-off correction to that specific run's output.

### Run 3 — 2026-07-15 (closing the audit-found Boardroom-verdict governance gap)

`docs/wingman/architecture-audit-2026-07-15.md` (Proven finding #2) found that `findLatestBuildCheckpoint` only checked that a Build-stage checkpoint *entry existed* — it never read the entry's `bottom_line` or `seats[].verdict` fields, so a recorded `NO_GO`/`DO NOT SHIP` that somehow survived past the `ExitPlanMode` gate would not be re-checked at `git push` time. Closed by adding a new exported pure function, `checkBoardroomVerdictClean(checkpoint)`, wired in as the first check in the `git push` branch (before traceability/test-presence/test-suite/threat-register), reusing the Boardroom's own consolidation rule ("any `NO_GO` anywhere overrides any approval elsewhere," per `evals/cases/boardroom-gate-rule.md`) as defense-in-depth: it checks both the top-level `bottom_line` string and every individual seat's `verdict`, not just one or the other.

**Verification, both unit and integration**, added to `tests/hooks-integration/hooks-integration.test.mjs`'s new "DoD Gate — Boardroom Verdict Check" describe block:
- Direct unit tests of `checkBoardroomVerdictClean`: no checkpoint → allow; clean `GO` bottom_line with all-`GO`/`GO_WITH_CONCERNS` seats → allow; `bottom_line: "DO NOT SHIP"` → deny naming "bottom line"; a single seat recording `NO_GO` while `bottom_line` stayed non-blocking → deny naming that exact seat (the defense-in-depth case, confirming consolidation-didn't-propagate is still caught).
- One full-hook integration test (`spawnSync`, real temp git repo + a real `.wingman/checkpoints.jsonl`): a Build checkpoint with `bottom_line: "DO NOT SHIP"` correctly blocks `git push` with exit 2 and a message naming the blocking verdict.
- Manually re-verified by hand outside the test suite (not just via the automated tests) that a clean `GO` checkpoint still falls through and allows the push in a minimal real git repo — confirming the new check adds no false-positive block on the legitimate path.

All 71 tests in `hooks-integration.test.mjs` pass (5 new, 66 pre-existing, zero regressions). This closes the exact gap the audit named — a checkpoint existing is no longer treated as equivalent to it having actually passed.

### Run 4 — 2026-07-21 (closing two real gaps a genuine interactive dogfood run found)

A real, interactive dogfood run of the full plan→build→ship pipeline (a throwaway URL-shortener project, built with a real human standing in as the founder via `AskUserQuestion`, not a headless `claude -p` run) exercised this hook's real `git push` gate for the first time against genuine project state, rather than a synthetic fixture. It found two real bugs:

**Bug A — the threat register check only matched the literal substring `OPEN`.** `OPEN_ROW = /\|\s*OPEN\s*\|/i` meant any other status word — including an honest mistake like `PENDING`, which the dogfooding agent used for a risk it had correctly identified as not-yet-resolved — silently passed the gate. Confirmed empirically: writing a real Build checkpoint and piping a real `git push` call into the hook returned `allow` even with an admittedly-unresolved risk recorded, because its Status cell read `PENDING` rather than `OPEN`. Per `build.md`'s own documented convention (a strict CLOSED/OPEN status, where an accepted risk is recorded as CLOSED with the acceptance noted in the Disposition column, not a third status word), the correct behavior is: anything other than `CLOSED` in the Threat Register's own Status column is unresolved. Fixed by replacing the blind substring match with `extractThreatRegisterSection()` (scopes to the actual `## ... Threat Register` heading, so it doesn't misfire on unrelated tables like the Planning stage's own `## Risks` table, which uses a different column order) and `findUnresolvedThreatRows()` (locates the Status column dynamically from the header row, then flags any row whose value isn't exactly `CLOSED`, case-insensitive).

**Bug B — `checkTestPresence`'s heuristic only recognized a test file matching the source file's own basename.** The same dogfood project's `src/server.js` had full, real, passing test coverage split across six behavior-named files (`test/shorten.test.js`, `test/redirect.test.js`, `test/rate-limit.test.js`, etc.) — a common, legitimate convention — but none matched `server.test.js`, so the gate denied the push claiming no test existed for a file that in fact had 11 real tests exercising it. Fixed by adding `anyTestFileReferencesSource()`: when no basename-matching candidate exists, it scans every file under `test/`, `tests/`, or `__tests__/` for one that actually imports/requires the source module by name (`import ... from`, `require(...)`, or Python's `import`/`from ... import`), and counts that as coverage.

**Verification:**
- Both fixes were first confirmed against the real dogfood project itself (re-running the actual hook against the real, live-edited `docs/wingman/plans/shortlink-plan.md` and `src/server.js`/`test/*.test.js` on disk) — not just a synthetic recreation — before being generalized.
- New unit tests added to `tests/hooks-integration/hooks-integration.test.mjs`: a "DoD Gate — Threat Register Status Parsing" describe block (5 tests: clean register passes, literal `OPEN` still caught, `PENDING` now caught, an unrelated `## Risks` table with a different column order is correctly ignored, and `checkThreatRegisterCleanAcrossArtifacts` fails if any one artifact has an unresolved row) and a "DoD Gate — Test Presence for Behavior-Split Suites" describe block (2 tests: a behavior-named test file that imports the source is recognized as coverage; a genuinely untested file is still flagged).
- Full suite re-run: 78 tests pass (7 new, 71 pre-existing, zero regressions). All 4 repo validators (`validate-structure.mjs`, `check-repo-consistency.mjs`, `check-fixtures.mjs`, `check-traceability.mjs`) still pass.

A third thing this same dogfood run initially suspected as a Wingman template bug — `implementation-planning.md`'s boilerplate unconditionally referencing a `UX-*` ID even when UX Flow was skipped — did **not** hold up on direct inspection of the real `implementation-planning.md` and `traceability-linking/SKILL.md` source: neither contains any such boilerplate example. The orphaned `UX-001` marker in the dogfood project's own plan file was the dogfooding agent's own authoring mistake (copying a two-ID marker pattern out of habit), not a defect in the shipped template. Recorded here rather than silently dropped, since an honestly-disclosed non-bug is worth exactly as much as a real one for calibrating how much to trust this kind of finding going forward.
