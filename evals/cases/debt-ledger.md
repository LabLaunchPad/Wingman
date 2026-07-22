# Eval: debt-ledger

Tests `plugins/wingman/commands/adaptive/debt-ledger.md` — its status/harvest/add commands and `// minimal:` comment format — against a fixture with intentional debt patterns.

## Scenario 1 — Codebase with debt patterns (positive case)

A small Node.js project with intentional debt:
- 3 `// minimal:` comments with valid ceiling and upgrade path
- 1 `// minimal:` comment that has hit its ceiling
- 1 `// minimal:` comment that is approaching ceiling (within 20%)
- 1 stale `// minimal:` comment (>2 cycles old)
- A DEBT.md file with corresponding entries

## Expectations

| Check | Expected |
|---|---|
| `status` command lists all shortcuts | Yes — 5 total |
| `status` command flags ceiling hits | Yes — 1 hit |
| `status` command flags approaching ceiling | Yes — 1 approaching |
| `status` command flags stale comments | Yes — 1 stale |
| `harvest` command proposes upgrades | Yes — based on upgrade path |
| `add` command creates valid comment | Yes — `// minimal: <ceiling>, <upgrade path>` |
| `add` command creates DEBT.md entry | Yes — with all required fields |
| Report matches exact format | Yes — ID, File:Line, Ceiling, Upgrade Path, Age, Status |

## Fixture

`evals/fixtures/setup-debt-ledger-fixture.sh <target-dir>` — "debty-app," a Node.js project with
5 `// minimal:` comments in `src/service.js`, one per documented state (valid/open, at-ceiling,
approaching-ceiling, stale, and a fifth open item), plus a pre-existing `DEBT.md` with matching rows.

## Trust level

`provisional` — Run 1 passed the `status` command's checks; Run 2 exercised `harvest` and found a
real gap in the command's own instructions (see Run log), so this case still does not promote to
`verified`. `add` remains unexercised.

## Run log

### Run 1 — 2026-07-20 — positive case, `status` only

Ran `evals/fixtures/setup-debt-ledger-fixture.sh` into a scratch dir, then spawned a fresh
un-briefed subagent with only `commands/adaptive/debt-ledger.md` and the fixture path, instructed to run
the `status` command. Independently verified the subagent's report by reading the real fixture
files directly (`src/service.js`, `DEBT.md`).

| Check | Result |
|---|---|
| `status` lists all shortcuts | **Pass** — all 5 listed |
| `status` flags ceiling hits | **Pass** — D2 (cache, cycle 3 of 3) correctly flagged HIT |
| `status` flags approaching ceiling | **Pass** — D3 (single-region deploy, 4/5 complaints = 80%) correctly flagged |
| `status` flags stale comments | **Pass** — D4 (USD-only pricing, cycle 5 of a 2-cycle max) correctly flagged STALE with the exact overrun (3 cycles) |
| `harvest` proposes upgrades | Not exercised this run |
| `add` creates a valid comment | Not exercised this run |
| `add` creates a DEBT.md entry | Not exercised this run |
| Report matches exact format | **Partial** — the run itself surfaced a real, previously-unnoticed drift: the fixture's own `DEBT.md` header (`id/description/ceiling/cycle/status`) doesn't match `debt-ledger.md`'s documented schema (`ID/Location/Ceiling/Upgrade Path/Date Marked/Hit Date/Status`); the subagent correctly flagged this as a hygiene note rather than silently reformatting or ignoring it |

4/4 `status`-command checks passed. The command-format mismatch is a genuine finding from this
run (fixture built to an earlier/looser schema assumption) — logged here rather than silently
fixed, since correcting it belongs to whoever runs `harvest`/`add` next, not to this status-only
run.

### Run 2 — 2026-07-22 — `harvest`, real code + real tests, plus a judgment check

Structurally different from Run 1 in three ways: (1) it exercises `harvest`, not `status` — a
mutating command, not a read-only report; (2) the scratch fixture (built fresh for this run, not
`setup-debt-ledger-fixture.sh`, since that fixture has no runnable test suite for `harvest`'s
"verify with tests" step to exercise) has real `node --test` tests so "verify with tests" means
something concrete, not a description; (3) it includes a second debt item deliberately *not* at
its ceiling, to check whether `harvest` shows real judgment (touching only what qualifies) rather
than upgrading everything it finds.

Fixture (scratch, not committed to `evals/fixtures/`): a tiny Node project with
`src/cache.js` (array-based cache, `// minimal:` ceiling >5 entries, **cycle 3 of 3, currently 7
entries — AT CEILING**, upgrade path "LRU eviction via bounded Map"), `src/retry.js` (fixed
backoff, cycle 1 of 4, nowhere near its 1%-timeout-rate ceiling), 3 real `node:test` cases against
the cache module, and a `DEBT.md` with matching D1 (HIT) / D2 (OPEN) rows. Baseline `node --test`
confirmed 3/3 passing before touching anything.

Acted as the fresh subagent, given only `commands/adaptive/debt-ledger.md` and the fixture, told to
run `harvest`. Followed the doc's 4 literal steps for the one item that qualified (D1): showed the
existing code + comment, proposed the Map-based LRU upgrade from the comment's own upgrade path,
applied it (removing the stale `// minimal:` comment since the shortcut was resolved), and reran
`node --test`.

| Check | Result |
|---|---|
| Identifies which item(s) qualify for harvest | **Pass** — D1 (at ceiling) correctly selected; D2 (cycle 1 of 4, not near ceiling) correctly left untouched — confirmed via `git diff --stat src/retry.js` showing no change and the `// minimal:` comment still present verbatim in `src/retry.js` |
| Proposes an upgrade based on the comment's own upgrade path | **Pass** — implemented an LRU (Map-based, evicts oldest key at capacity) exactly matching "add LRU eviction if entry count exceeds 5" |
| Applies the upgrade | **Pass** — `src/cache.js` rewritten, old array implementation and its `// minimal:` comment removed |
| Verifies with tests | **Pass** — `node --test` ran 3/3 green both before (baseline) and after the change, independently re-run and confirmed, not taken on the subagent's word |

**Gap found (real, not fixed — case file only):** the doc's `harvest` section (4 steps: show,
propose, apply, verify) never says to reconcile `DEBT.md` afterward. Following it literally left
`DEBT.md` still showing `D1 | ... | HIT` after the code was upgraded — independently confirmed by
`cat DEBT.md` post-harvest, unchanged from before. That means a literal `harvest` run leaves the
ledger's own source of truth silently out of sync with the code the moment it succeeds, which
undercuts the ledger's whole purpose (a founder or the next `status` run would still see D1 as an
unresolved ceiling hit). This is a genuine instruction gap in `commands/adaptive/debt-ledger.md`
itself, not a fixture artifact — left unfixed per this run's scope (case file only, no other file
edits), and it is why Trust level stays `provisional` rather than promoting to `verified`.

4/4 tabled checks pass, including the judgment check (leaving D2 alone), but the DEBT.md-
reconciliation gap is a real behavioral defect surfaced by actually running the command outside
what the table above checks, so this run does not promote the case.
