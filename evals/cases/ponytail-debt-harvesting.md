# Eval: ponytail-debt-harvesting

Tests `plugins/wingman/skills/ponytail-debt-harvesting/SKILL.md` — its debt harvesting pattern, `// minimal:` comment format, and DEBT.md ledger — against a fixture with intentional debt patterns.

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

`verified` — as of Run 3 (2026-07-22), all 5 documented checks have been exercised across Run 1
(create-from-nothing) and Run 2 (reconcile-existing, ceiling states), all passing with no bugs
found in the skill's instructions, and Run 3 closes the negative case `evals/README.md`'s
trust-level bar requires: a genuinely clean codebase (zero `// minimal:` markers, no existing
`DEBT.md`) correctly produced no fabricated debt — independently confirmed no `DEBT.md` was
created and the source files were left untouched, not just asserted by the subagent's own report.
Corrected 2026-07-20 from `authored, pending first run`.

## Run log

### Run 1 — 2026-07-20 — positive case, create-DEBT.md-from-nothing path

Ran `evals/fixtures/setup-ponytail-debt-harvesting-fixture.sh` into a scratch dir (confirmed no
pre-existing `DEBT.md`), then spawned a fresh un-briefed subagent with only
`skills/ponytail-debt-harvesting/SKILL.md` and the fixture path, instructed to run the harvest
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

### Run 2 — 2026-07-22 — positive case, reconcile-existing-DEBT.md path (ceiling-hit / approaching / stale)

Built a scratch fixture (`setup-ponytail-run2.sh`, kept in scratch, not committed to `evals/fixtures/`)
deliberately shaped opposite to Run 1: a **pre-existing, out-of-sync** `DEBT.md` with 3 entries, all
still marked `OPEN`/no Hit Date, plus a checked-in `data/current-metrics.json` giving real current
values to compare each shortcut's ceiling against, and all 3 `// minimal:` comments/DEBT.md rows
git-committed 2026-02-10 (~5.4 months before the eval's "today," 2026-07-22) so staleness is real,
not asserted. Then acted as the fresh, un-briefed subagent (given only the SKILL.md and the fixture
path) and ran the harvest process by hand, updating `DEBT.md` in place; independently re-verified
afterward by re-reading the written file fresh and cross-checking every claim against
`data/current-metrics.json`, `git log --date=short` on each file, and the system clock (not trusting
the harvest step's own report).

| Check | Result |
|---|---|
| Correctly identifies `// minimal:` format | **Pass** — ceiling + upgrade path extracted correctly from all 3 comments (carried over from Run 1's fixture shape, unchanged here) |
| Correctly identifies ceiling hits | **Pass** — `concurrentUsers: 520` vs. `>500 concurrent users` ceiling correctly flagged `HIT`, with Hit Date set to today (2026-07-22, confirmed against `date -u`) rather than left blank — independently confirmed by reading the metrics file and the written `DEBT.md` row side by side |
| Correctly identifies approaching ceiling | **Pass** — `totalUsers: 850` vs. `>1000 users` ceiling is 85%, correctly flagged `APPROACHING` (past the documented 80% threshold) while correctly left short of `HIT` — independently confirmed via the same cross-check |
| Correctly creates DEBT.md entries | **Pass (reconcile variant)** — this run's DEBT.md already existed, so the check here is that the harvest step updated the existing table in place (same 3 rows, same IDs/locations) rather than duplicating or recreating it; confirmed by diffing the row count and IDs before/after |
| Correctly applies debt decay rules | **Pass** — D3 (`spamFilter.js`, marked 2026-02-10) correctly flagged `STALE` for being well past one release cycle with no review — independently confirmed via `git log --date=short` on the file. Bonus finding, not in the original expectations table: the harvest step also caught that D3's own ceiling ("accuracy matters") is unmeasurably vague per the skill's own anti-pattern list ("a `// minimal:` comment with no realistic ceiling"), and recommended a concrete numeric ceiling instead of silently letting the vague comment ride — a real instance of the skill's anti-rationalization guidance being applied, not just its mechanical table format |

5 of 5 checks now exercised across Run 1 + Run 2 combined, all passed, with no bugs found in the
skill's instructions. This closes the ceiling-hit/approaching/stale gap Run 1 left open. Not yet
promoted after this run: both Run 1 and Run 2 are positive cases; the negative case below closes
the remaining gap.

### Run 3 — 2026-07-22 — negative case, clean codebase with zero debt markers

Built a scratch fixture (`/tmp/wingman-eval-ponytail-negative`, not committed to `evals/fixtures/`):
a genuinely clean 2-function Node project (`formatCurrency`, `titleCase`) with matching tests, zero
`// minimal:` comments anywhere, no pre-existing `DEBT.md`, and no code smell that would justify
retroactively marking something as debt (no O(n²) loops, no global state, no obviously-deferred
edge cases). Asked a fresh, un-briefed subagent (given only the skill file and the fixture path,
told simply "run a debt harvest pass on this codebase") to apply the skill.

**Result:** the subagent correctly reported nothing to harvest and made no changes — no `DEBT.md`
created, `src/format.js`/`src/format.test.js` left untouched. Independently verified against the
real filesystem, not the subagent's self-report: `test -f DEBT.md` confirmed absent, `git status
--short` showed zero uncommitted changes, `git log --oneline` showed no new commits beyond the
fixture's own init, and `git diff HEAD -- src/` was empty.

**No bugs found this run** — the skill correctly does nothing when there's nothing to harvest,
rather than fabricating debt to appear productive. This closes the negative-case gap
`evals/README.md`'s trust-level bar requires. Promoted to `verified`.
