# Eval: bloat-audit

Tests `plugins/wingman/commands/adaptive/bloat-audit.md` — its whole-repo scan, complexity ranking, and 5-tag classification — against a fixture with intentional bloat patterns.

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

## Scenario 2 — Lean, well-maintained codebase (negative case)

A small Express service with no planted bloat: 4 files, largest is 17 lines, no function over
50 lines, no nesting beyond 1 level, no duplicated logic, and a single dependency (`express`)
genuinely used for routing + JSON middleware rather than a whole-library import for one helper.

## Expectations (Scenario 2)

| Check | Expected |
|---|---|
| Does not flag any file as a monolith | Yes — none exceed 200 lines |
| Does not flag any function as too long | Yes — none exceed 50 lines |
| Does not flag nesting | Yes — no >3-level nesting exists |
| Does not invent duplicate/copy-paste findings | Yes — no duplication exists |
| Does not flag the single real dependency as bloat | Yes — `express` is genuinely used, not a shim |
| Reports zero/near-zero findings rather than manufacturing some | Yes — report should say "no significant bloat" |
| Report still matches exact format even with 0 findings | Yes — files scanned, findings (0), summary by tag (all 0) |

## Fixture

`evals/fixtures/setup-bloat-audit-fixture.sh <target-dir>` — "bloaty-app," a Node.js project with
a single 286-line `src/monolith.js` containing: a 65-line `processOrder` function with 4 levels
of nesting plus 50 unused padding fields, a byte-for-byte duplicate `processOrderDuplicate`, a
200-line comment-padding block, and a full lodash import used for one single-key `pick`.

Scenario 2 used a scratch-only fixture (not checked in as a `setup-*.sh` script): a 4-file
"lean-app" Express project, built directly in the scratchpad for this run only, deliberately with
no planted bloat.

## Trust level

`verified` — passed Scenario 1 (positive case, all 8 checks) and Scenario 2 (negative case, all 7
checks), a genuinely differently-shaped scenario per `evals/README.md`'s bar for `verified`: the
command correctly reported zero findings on a clean codebase instead of manufacturing bloat to
seem useful.

## Run log

### Run 1 — 2026-07-20 — positive case

Ran `evals/fixtures/setup-bloat-audit-fixture.sh` into a scratch dir, then spawned a fresh
un-briefed subagent with only `commands/adaptive/bloat-audit.md` (not this case file) and the fixture path,
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

### Run 2 — 2026-07-22 — negative case

Built a scratch "lean-app" fixture (4 files: `src/index.js` 17 lines, `src/orders.js` 8 lines,
`src/format.js` 3 lines, `test/orders.test.js` 11 lines; single dependency `express` used for
real routing + JSON middleware) directly in the scratchpad, not as a checked-in `setup-*.sh`
script. Independently verified ground truth first via direct inspection (`wc -l`, grep for
imports/nesting/duplication) before running the audit process, then applied the command's own
Scan → Rank → Classify → Report steps against the fixture.

| Check | Result |
|---|---|
| Does not flag any file as a monolith | **Pass** — largest file is 17 lines, nothing near the 200-line threshold |
| Does not flag any function as too long | **Pass** — longest function body is 3 lines |
| Does not flag nesting | **Pass** — max nesting is 1 level (a `.filter().reduce()` chain, no if/for pyramids) |
| Does not invent duplicate/copy-paste findings | **Pass** — `orders.js` and `format.js` are genuinely distinct, no manufactured "duplication" |
| Does not flag the single real dependency as bloat | **Pass** — `express` correctly recognized as used for its real purpose (`app.use`, `app.post`, `app.listen`), not a wholesale import for one helper |
| Reports zero/near-zero findings rather than manufacturing some | **Pass** — report stated "0 findings... no significant bloat to trim right now," no invented issues |
| Report still matches exact format even with 0 findings | **Pass** — kept files-scanned/findings/summary-by-tag structure with all tag counts at 0 |

All 7 expectations passed. This closes the false-positive risk named in `evals/README.md`'s
`verified` bar: the command did not manufacture findings to appear useful when there was
genuinely nothing to trim. Promoted Trust level from `provisional` to `verified`.
