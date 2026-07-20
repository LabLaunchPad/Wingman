# Eval: platform-native-reference

Tests `plugins/wingman/skills/platform-native-reference/SKILL.md` — its cross-layer reference mapping "what you think you need" to "what the platform ships" — against scenarios where native solutions exist.

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

`provisional` — passed the HTML-element, CSS, and JS-API checks (see Run log); the Node.js
stdlib check (`fs.mkdirSync` with `recursive`) and `Intl.NumberFormat` specifically weren't
exercised by this fixture, and no negative case has been run. Corrected 2026-07-20 from
`authored, pending first run`.

## Run log

### Run 1 — 2026-07-20 — positive case (partial coverage)

Ran `evals/fixtures/setup-platform-native-reference-fixture.sh` into a scratch dir, then spawned a
fresh un-briefed subagent with only `skills/platform-native-reference/SKILL.md` and the fixture
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
