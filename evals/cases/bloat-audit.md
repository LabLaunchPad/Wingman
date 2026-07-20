# Eval: bloat-audit

Tests `plugins/wingman/commands/bloat-audit.md` — its whole-repo scan, complexity ranking, and 5-tag classification — against a fixture with intentional bloat patterns.

## Scenario 1 — Codebase with bloat patterns (positive case)

A small Node.js project with intentional bloat:
- A 250-line monolith file (should be split)
- A 60-line function (should be decomposed)
- Deeply nested code (4+ levels)
- Copy-paste patterns (repeated code)
- Large imports (importing entire lodash for one function)

## Expectations

| Check | Expected |
|---|---|
| Correctly identifies files >200 lines | Yes — flags monolith |
| Correctly identifies functions >50 lines | Yes — flags complex function |
| Correctly identifies deep nesting | Yes — flags >3 levels |
| Correctly identifies repeated patterns | Yes — flags copy-paste |
| Correctly identifies large imports | Yes — flags lodash |
| Ranks by simplification impact | Yes — high/medium/low |
| Applies 5-tag taxonomy | Yes — #delete, #stdlib, #native, #yagni, #shrink |
| Report matches exact format | Yes — files scanned, findings, summary by tag |

## Fixture

`evals/fixtures/setup-bloat-audit-fixture.sh <target-dir>` — "bloaty-app," a Node.js project with
a single 286-line `src/monolith.js` containing: a 65-line `processOrder` function with 4 levels
of nesting plus 50 unused padding fields, a byte-for-byte duplicate `processOrderDuplicate`, a
200-line comment-padding block, and a full lodash import used for one single-key `pick`.

## Trust level

`provisional` — passed Scenario 1 (see Run log). Not yet re-run against a second, differently-shaped
scenario including a negative case (a clean codebase that should produce zero/minimal findings),
per `evals/README.md`'s bar for `verified`.

## Run log

### Run 1 — 2026-07-20 — positive case

Ran `evals/fixtures/setup-bloat-audit-fixture.sh` into a scratch dir, then spawned a fresh
un-briefed subagent with only `commands/bloat-audit.md` (not this case file) and the fixture path,
instructed to run the bloat-audit process. Independently verified the subagent's report against
the real fixture (`wc -l src/monolith.js` confirmed 286 lines, matching the report's claim).

| Check | Result |
|---|---|
| Correctly identifies files >200 lines | **Pass** — flagged `monolith.js` at 286 lines |
| Correctly identifies functions >50 lines | **Pass** — flagged `processOrder` (65 lines) |
| Correctly identifies deep nesting | **Pass** — cited the 4-level `if(order)→if(items)→if(length)→for→if(active)` chain |
| Correctly identifies repeated patterns | **Pass** — flagged `processOrderDuplicate` as a byte-for-byte copy of `processOrder` |
| Correctly identifies large imports | **Pass** — flagged the full lodash import for a 1-line `pick1` helper, recommended dropping the dependency |
| Ranks by simplification impact | **Pass** — ranked High/Medium/Low with line-count impact estimates per finding |
| Applies 5-tag taxonomy | **Pass** — used `#delete` (2), `#stdlib` (1), `#yagni` (1), `#shrink` (1); `#native` correctly unused (no native-platform-replaces-this case in this fixture) |
| Report matches exact format | **Pass** — files scanned, findings with file:line, summary-by-tag section, plain-language founder translation |

All 8 expectations passed on first run. No false positives (the 3 non-bloated files — `package.json`,
`README.md` — correctly not flagged).
