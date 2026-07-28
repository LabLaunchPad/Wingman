# Eval: test

Tests `plugins/wingman/commands/adaptive/test.md` — does a fresh agent, given only this command,
correctly detect the project's real test runner, actually execute it, and report the genuine
pass/fail/no-suite result rather than a guess? The command's own added value beyond
`dod-structural-gate.mjs`'s existing hook-level test coverage is that it runs on demand, outside a
`git push`, and must handle all three real outcomes: pass, fail, and no runner detected at all.

## Fixtures

- **Pass case**: `evals/fixtures/setup-testing-patterns-fixture.sh <target-dir>` — a real Node
  project ("Ledger") whose `npm test` genuinely passes (3/3).
- **Fail case**: run the same fixture script, then break one assertion
  (`sed -i 's/expectApproved(ledger, 1700);/expectApproved(ledger, 9999);/' test/ledger.test.js`) to
  force a real, deterministic 1-of-3 failure — no new fixture script needed.
- **No-runner case**: `evals/fixtures/setup-minimal-cli.sh <target-dir>` — a real Node project
  (`linecount`) whose `package.json` has no `scripts` block at all, and none of the other recognized
  manifests (`pytest.ini`, `pyproject.toml`, `setup.py`, `go.mod`, `Cargo.toml`, `Gemfile`).

## Procedure

1. Run each fixture setup script (and the `sed` edit for the fail case) against a throwaway
   directory.
2. Spawn a fresh subagent with **only** `commands/adaptive/test.md` (not this eval doc), instructed
   to act as `/wingman:test` against the real fixture directory, with no argument (full suite).
3. Require the subagent to actually execute the real test command via a real shell call — not guess
   at the outcome — and report the exact command run and its real exit code alongside the command's
   specified Markdown report format.
4. Independently verify: re-run the same command in the fixture directory and confirm the reported
   exit code and pass/fail counts match reality.

## Expectations — Pass case (Ledger, unmodified)

| Check | Expected |
|---|---|
| Runner detected | `npm test` (→ `node --test`) |
| Result reported | PASS |
| Real exit code | 0 |
| Detail | Names the actual 3 passing tests or a correct pass count, not a generic "looks good" |

## Expectations — Fail case (Ledger, one assertion broken)

| Check | Expected |
|---|---|
| Runner detected | `npm test` (→ `node --test`) |
| Result reported | FAIL |
| Real exit code | 1 |
| Detail | Names the actual failing test and the real expected-vs-actual values (1700 vs 9999), tail only — not the full raw log, not fabricated |

## Expectations — No-runner case (linecount)

| Check | Expected |
|---|---|
| Runner detected | None — explicitly checks `package.json`'s `scripts`, then `pytest.ini`/`pyproject.toml`/`setup.py`, `go.mod`, `Cargo.toml`, `Gemfile`, finds none |
| Result reported | "no suite found" — stated plainly as useful information, never fabricated as PASS or FAIL |

## Trust level

`verified` — all 3 real outcomes (pass, fail, no runner) each run for real against a fresh,
independently-dispatched subagent, every claimed exit code and result independently re-verified
against the actual fixture directory rather than trusted from self-report.

## Run log

### Run 1 — 2026-07-28 (all 3 cases)

Three fresh subagents dispatched in parallel, each given only `commands/adaptive/test.md` and one
real fixture directory, instructed to actually run the suite (not guess) and report the exact
command and exit code alongside the specified report format.

**Pass case: PASS.** Ran `npm test` for real, reported exit code `0`, correctly named all 3 passing
tests (`addExpense records a positive amount`, `summarizeToday totals expenses added today`,
`summarizeToday returns 0 for an empty ledger`), 94.8ms duration. Coverage note correctly omitted
(no coverage flag was used, matching the report format's "omit if not visible" instruction).
Independently re-ran `npm test` in the fixture directory: confirmed 3/3 pass, exit code 0, matching
the subagent's report exactly.

**Fail case: PASS.** Ran `npm test` for real (not the tee-piped variant, which the subagent
correctly distinguished from the real exit code), reported exit code `1`, correctly identified the
one failing test (`summarizeToday totals expenses added today`) with the real assertion detail —
`1700 !== 9999` at `test/ledger.test.js:19` — tail-only, not the full raw log. Independently
re-verified: `npm test` in the modified fixture directory reproduces exactly 1 fail / 2 pass, exit
code 1.

**No-runner case: PASS.** Correctly inspected `package.json` (found no `scripts` block at all, not
just a missing `test` key) and confirmed none of the other recognized manifests exist in the
project, quoting the real file content rather than asserting from assumption. Reported "no suite
found" plainly, with a specific, checkable reason — not a fabricated PASS or FAIL. Independently
re-verified: `linecount/package.json` genuinely has no `scripts` field, and `ls` confirms no
`pytest.ini`/`pyproject.toml`/`setup.py`/`go.mod`/`Cargo.toml`/`Gemfile` present.

All three real outcomes confirmed against actual command output, not self-report. Promoted directly
to `verified` — no second differently-shaped run needed, since all 3 documented scenarios (the
command's entire outcome space: pass/fail/no-runner) were each independently verified in this run.
