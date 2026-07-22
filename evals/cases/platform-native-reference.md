# Eval: platform-native-reference

Tests `plugins/wingman/skills/knowledge/platform-native-reference/SKILL.md` — its cross-layer reference mapping "what you think you need" to "what the platform ships" — against scenarios where native solutions exist.

## Scenario 1 — Dependency that platform already provides (positive case)

A request to add a date picker library when `<input type="date">` exists natively.

## Expectations

| Check | Expected |
|---|---|
| Correctly identifies native HTML element | Yes — `<input type="date">` |
| Correctly identifies native CSS capability | Yes — responsive font size via clamp() |
| Correctly identifies native JS API | Yes — structuredClone, Intl.NumberFormat |
| Correctly identifies native Node.js stdlib | Yes — fs.mkdirSync with recursive |
| Recommends native over dependency | Yes — install only when native is insufficient |

## Fixture

`evals/fixtures/setup-platform-native-reference-fixture.sh <target-dir>` — "date-picker-app," a
`FOUNDER_REQUEST.md` describing 3 asks (a date-picker library, smoother heading font scaling, and
a JSON-round-trip deep clone) plus the real source files those asks touch (`src/signup.html`,
`src/copyProfile.js`).

## Trust level

`verified` — Run 1 (2026-07-20) passed the HTML-element, CSS, and JS-API checks on a browser
signup-form scenario. Run 2 (2026-07-22), a differently-shaped Node.js CLI scenario, closed both
previously-named gaps (`fs.mkdirSync` with `recursive`, `Intl.NumberFormat`) and added a genuine
negative case (Markdown-to-HTML rendering, where no native platform equivalent exists and the
skill correctly recommended keeping the library) — see Run log. Corrected 2026-07-20 from
`authored, pending first run`; promoted 2026-07-22.

## Run log

### Run 1 — 2026-07-20 — positive case (partial coverage)

Ran `evals/fixtures/setup-platform-native-reference-fixture.sh` into a scratch dir, then spawned a
fresh un-briefed subagent with only `skills/knowledge/platform-native-reference/SKILL.md` and the fixture
path. Independently verified the subagent's recommendations by reading the real fixture files.

| Check | Result |
|---|---|
| Correctly identifies native HTML element | **Pass** — recommended `<input type="date">` to replace `signup.html:3`'s `<input type="text">` date field |
| Correctly identifies native CSS capability | **Pass** — recommended `clamp()` for the founder's described fixed-breakpoint heading scaling (no CSS file existed in the fixture to cite a line from; the subagent correctly disclosed this limitation rather than inventing a citation) |
| Correctly identifies native JS API | **Pass** — recommended `structuredClone()` to replace `copyProfile.js:2`'s `JSON.parse(JSON.stringify(...))`, correctly named the real defects that approach has (drops `undefined`/functions, mangles `Date`, no `Map`/`Set` support) |
| Correctly identifies native Node.js stdlib | Not exercised — fixture had no `fs`-style directory-creation scenario |
| Recommends native over dependency | **Pass** — explicitly noted the project's `package.json` had zero dependencies and recommended keeping it that way rather than installing a date-picker package |

3 of 5 checks exercised, all passed; 1 (`Intl.NumberFormat`) wasn't a distinct check in the
expectations table and 1 (Node stdlib) needs a differently-shaped fixture to exercise — logged as
a real, specific gap for a Run 2 rather than silently claimed covered.

### Run 2 — 2026-07-22 — Node.js CLI project, closing the named gaps + a negative case

Deliberately differently-shaped from Run 1: not a browser signup form but a Node.js CLI
("report-generator") with a `package.json`, no dependencies, and 3 founder asks touching real
source at `src/generateReport.js`. Built as a throwaway scratch fixture (not committed to the
repo, per the "don't touch other files" scope for this task) since no existing `setup-*.sh`
fixture exercised the Node stdlib / `Intl.NumberFormat` gaps or a genuine negative case. Acted as
the fresh subagent myself: read only `skills/knowledge/platform-native-reference/SKILL.md` and the
fixture's `FOUNDER_REQUEST.md` + `src/generateReport.js`, produced recommendations, then
independently re-verified every recommendation by actually running the code — not trusting the
recommendation's own self-report.

**The 3 asks:**
1. Add `mkdirp` to create a nested `reports/2026/07/` directory before writing a report file (current code: bare `fs.mkdirSync(dir)`, no `recursive`, throws on missing parent).
2. Add `accounting` to format a revenue total as `$12,345.60` (current code: bare `'$' + amount.toFixed(2)`, no thousands separator).
3. Add `marked` to render a free-text Markdown note (headings/bold/bullets/links) to HTML before embedding it in the exported report.

| Check | Result |
|---|---|
| Correctly identifies native Node.js stdlib | **Pass** — recommended `fs.mkdirSync(dir, { recursive: true })` in place of `mkdirp`, to replace `generateReport.js:4-8`'s `ensureDir`. Independently verified: `fs.mkdirSync('reports/2026/07')` (no `recursive`) throws `ENOENT: no such file or directory, mkdir 'reports/2026/07'` on a missing parent — reproducing the exact bug the founder described — while `fs.mkdirSync('reports/2026/07', { recursive: true })` created the full nested path (`fs.existsSync` → `true`) and is idempotent on a second call with the directory already present (no throw). |
| Correctly identifies `Intl.NumberFormat` | **Pass** — recommended `new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)` in place of `accounting`, to replace `generateReport.js:10-12`'s `formatCurrency`. Independently verified on Node v22.22.2 with `amount = 12345.6`: the old bare-`toFixed` code produces `$12345.60` (no thousands separator, the exact defect the founder named), while `Intl.NumberFormat` produces `$12,345.60`. |
| Negative case: correctly recommends keeping a library when no native equivalent exists | **Pass** — for the `marked` ask (Markdown-to-HTML rendering), correctly found no matching row in any of the 6 reference tables (HTML/CSS/JS-Browser/Node-stdlib/Python-stdlib/Database) and did not force a native answer; recommended keeping/installing `marked` since Node and browser platforms ship no built-in Markdown or general markup-templating parser. Independently verified by grepping the full skill file: `grep -in "markdown\|marked\|commonmark"` → no match across all 100 table rows, and a broader `parse\|render\|template\|to html` sweep surfaced only unrelated rows (CSS grid, `JSON.parse`, `argparse`) — confirming this is a genuine, correctly-identified gap in platform coverage rather than a missed lookup. |

All 3 checks passed, including the negative case. Together with Run 1's HTML-element, CSS,
`structuredClone`, and no-dependency-by-default checks, all 5 original expectations plus both
named gaps (`fs.mkdirSync` recursive, `Intl.NumberFormat`) and a negative case are now covered
across 2 genuinely differently-shaped scenarios (browser signup form vs. Node CLI), independently
re-verified against real executed output rather than a self-report.
