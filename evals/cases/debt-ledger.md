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

`provisional` — passed the `status` command's checks (see Run log); `harvest` and `add` were not
exercised this run, so this case doesn't yet cover the full command surface, and no negative case
has been run. Corrected 2026-07-20 from `authored, pending first run`.

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
