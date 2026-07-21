# Eval: ponytail-debt-harvesting

Tests `plugins/wingman/skills/response/ponytail-debt-harvesting/SKILL.md` — its debt harvesting pattern, `// minimal:` comment format, and DEBT.md ledger — against a fixture with intentional debt patterns.

## Scenario 1 — Code with deliberate shortcuts (positive case)

A small Node.js project with intentional shortcuts:
- A global lock with `// minimal: global lock, per-account locks if throughput matters`
- An O(n²) scan with `// minimal: O(n²) scan, switch to index if >1000 users`
- A naive heuristic with `// minimal: naive heuristic, replace with ML model if accuracy matters`

## Expectations

| Check | Expected |
|---|---|
| Correctly identifies `// minimal:` format | Yes — ceiling and upgrade path extracted |
| Correctly identifies ceiling hits | Yes — when current >= ceiling |
| Correctly identifies approaching ceiling | Yes — when current >= 80% of ceiling |
| Correctly creates DEBT.md entries | Yes — with all required fields |
| Correctly applies debt decay rules | Yes — flags stale comments |

## Fixture

`evals/fixtures/setup-ponytail-debt-harvesting-fixture.sh <target-dir>` — "shortcut-app," a
Node.js project with 3 fresh `// minimal:` comments (all newly-marked, none at/near ceiling or
stale) and deliberately no pre-existing `DEBT.md`, so the harvest step has something real to
create.

## Trust level

`provisional` — passed the format-extraction and DEBT.md-creation checks (see Run log); ceiling-hit,
approaching-ceiling, and debt-decay/staleness checks weren't exercised (this fixture's 3 shortcuts
are all fresh, by design, to test the create-from-nothing path specifically), and no negative case
has been run. Corrected 2026-07-20 from `authored, pending first run`.

## Run log

### Run 1 — 2026-07-20 — positive case, create-DEBT.md-from-nothing path

Ran `evals/fixtures/setup-ponytail-debt-harvesting-fixture.sh` into a scratch dir (confirmed no
pre-existing `DEBT.md`), then spawned a fresh un-briefed subagent with only
`skills/response/ponytail-debt-harvesting/SKILL.md` and the fixture path, instructed to run the harvest
process. Independently verified by reading the file the subagent wrote.

| Check | Result |
|---|---|
| Correctly identifies `// minimal:` format | **Pass** — extracted ceiling + upgrade path from all 3 comments correctly |
| Correctly identifies ceiling hits | Not exercised — fixture's shortcuts are all fresh, none at ceiling |
| Correctly identifies approaching ceiling | Not exercised — same reason |
| Correctly creates DEBT.md entries | **Pass** — wrote a real `DEBT.md` with the documented `ID/Location/Ceiling/Upgrade Path/Date Marked/Hit Date/Status` schema, all 3 entries correctly populated (Date Marked derived from `git log`, Status `OPEN` for all 3) — independently confirmed by reading the written file directly |
| Correctly applies debt decay rules | Not exercised — same reason; correctly noted all 3 are within the review window, no stale-flag needed |

2 of 5 checks exercised, both passed. This run specifically covers the "harvest with no existing
DEBT.md" path; the ceiling-hit/approaching/stale paths need a differently-shaped fixture (like
`debt-ledger.md`'s, which does have those states) for a future run — logged as an open gap, not
silently claimed.
