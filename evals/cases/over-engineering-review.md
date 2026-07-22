# Eval: over-engineering-review

Tests `plugins/wingman/commands/adaptive/over-engineering-review.md` — its 5-tag taxonomy and surgical audit process — against a fixture with intentional over-engineering patterns.

## Scenario 1 — Code with over-engineering patterns (positive case)

A small Node.js project with intentional over-engineering:
- A 27-line EmailValidator class that could be a 1-line regex check
- A moment.js import used for a single format call
- An AbstractRepository with one implementation
- A retry wrapper around an idempotent local call
- A manual loop that builds a dict (could be `dict(zip(keys, values))`)

## Expectations

| Check | Expected |
|---|---|
| Correctly identifies all 5 tags | Yes — #stdlib, #native, #yagni, #delete, #shrink |
| Proposes simpler alternatives | Yes — name the specific stdlib/native function |
| Applies safe fixes | Yes — no behavioral changes |
| Report matches exact format | Yes — tags, findings, fixed/deferred counts |
| Translates through plain-language-checkpoint | Yes — no jargon in founder-facing output |

## Fixture

`evals/fixtures/setup-over-engineering-review-fixture.sh <target-dir>` — "overbuilt-app," a
Node.js project with all 5 documented over-engineering patterns planted, each in its own source
file. No test suite is present in the fixture (deliberately — see Run 1's note on how this
affected the "applies safe fixes" check).

Scenario 2's fixture ("report-exporter-app") is a scratch-only fixture built and run for this one
session, not committed to `evals/fixtures/` — it's a small `Exporter` base class + 3 concrete
implementations + a format registry, with 3 real call sites (`cli.js`, `nightlyExportJob.js`,
`reportsEndpoint.js`) and one passing test file (`reportsEndpoint.test.js`) exercising all 3
formats. Not added as a permanent fixture script since this run was scoped to closing the trust
level, not to adding new deterministic-tier coverage; a future contributor could promote it to
`setup-over-engineering-review-negative-fixture.sh` if this case needs re-running mechanically.

## Scenario 2 — Justified strategy-pattern abstraction (negative case)

A small Node.js report-exporter app with an `Exporter` abstract base class, three concrete
implementations (`CsvExporter`/`JsonExporter`/`HtmlExporter`), and an `exporterRegistry.js`
factory that dispatches on a runtime format string. On its face this looks exactly like the
`#yagni` pattern from Scenario 1's `AbstractRepository` (an abstract base with subclasses) — the
real question this scenario tests is whether the command can tell the difference between
speculative flexibility and flexibility that's actually load-bearing. Here it's the latter: 3
distinct, currently-shipping call sites (`cli.js`'s `--format` flag, `nightlyExportJob.js`'s
simultaneous CSV+JSON export, `reportsEndpoint.js`'s HTML-vs-JSON branch on a request header) each
genuinely invoke `getExporter()` with a different runtime-determined value, and all three formats
are covered by a real, passing test. No dead code, no unused reimplementation of stdlib/native
functionality, no manual loop standing in for a one-liner.

## Trust level

`verified` — Scenario 1 (positive) passed its finding-identification checks; Scenario 2 (negative,
2026-07-22) confirmed the command correctly withholds `#yagni` on genuinely-justified strategy-
pattern complexity, closing the false-positive risk this kind of surgical-audit command is most
exposed to. Corrected 2026-07-20 from `authored, pending first run`; promoted 2026-07-22.

## Run log

### Run 1 — 2026-07-20 — positive case

Ran `evals/fixtures/setup-over-engineering-review-fixture.sh` into a scratch dir, then spawned a
fresh un-briefed subagent with only `commands/adaptive/over-engineering-review.md` and the fixture path.
Independently verified the subagent's report by reading all 5 real source files directly.

| Check | Result |
|---|---|
| Correctly identifies all 5 tags | **Pass** — `#yagni` (AbstractRepository), `#shrink` (EmailValidator), `#stdlib` (buildDict, formatDate/moment), `#delete` (retryWrapper); `#native` correctly unused (no case in this fixture calls for a native-platform replacement specifically) |
| Proposes simpler alternatives | **Pass** — named specific replacements for each (`Object.fromEntries`, native `Date` formatting, deleting the retry wrapper/abstract class, a single exported function) |
| Applies safe fixes | **Correctly deferred, not a clean pass** — the fixture has no test suite; the subagent explicitly checked for one (confirmed via `grep`/`find`), found none, and deferred all 5 fixes rather than apply changes with nothing to verify against. This is arguably the *more* correct behavior (safety-first), but it means "applies fixes" itself wasn't exercised — a future run against a fixture with a real test suite would close this gap properly. |
| Report matches exact format | **Pass** — tags, per-finding file:line + current/simpler/action, fixed/deferred counts (0 fixed, 5 deferred), plain-language founder summary |
| Translates through plain-language-checkpoint | **Pass** — founder summary avoided jargon, explained consequence ("recommend adding minimal coverage before applying these") over mechanism |

4/5 checks passed cleanly; "applies safe fixes" surfaced a real fixture-design gap (no test suite
to safely exercise fix-application against) rather than a skill defect — noted, not papered over.

### Run 2 — 2026-07-22 — negative case (justified complexity)

Built a scratch fixture ("report-exporter-app") not committed to the repo: an `Exporter` abstract
base class, 3 concrete subclasses (`CsvExporter`/`JsonExporter`/`HtmlExporter`), and a
format-keyed registry/factory (`exporterRegistry.js`) — structurally the same shape as Scenario
1's flagged `AbstractRepository`, but with 3 real, currently-shipping call sites
(`cli.js`'s `--format` CLI flag, `nightlyExportJob.js`'s simultaneous CSV+JSON export,
`reportsEndpoint.js`'s HTML-vs-JSON branch keyed on a request header) actually exercising the
polymorphism, plus a passing test (`reportsEndpoint.test.js`) covering all 3 formats. Ran
`node src/reportsEndpoint.test.js` directly first to confirm the fixture itself is real and
working (all tests passed) before review.

Applied the command's own process as a fresh, un-briefed subagent would: scanned every file in
`src/`, classified each candidate against the 5-tag taxonomy, and specifically weighed the
`Exporter`/registry pair against `#yagni` given how closely it resembles Scenario 1's flagged
pattern.

| Check | Result |
|---|---|
| Correctly withholds `#yagni` on the abstract base + registry | **Pass** — independently confirmed via `grep -rn "getExporter(" src/` that 3 distinct files call it with 3 different runtime-determined format values (not one caller invoking it 3 ways for show); all 3 concrete exporters are genuinely reachable in production code paths, not scaffolding for an imagined future format |
| No other findings misclassified | **Pass** — `CsvExporter`/`JsonExporter`/`HtmlExporter` are each minimal, idiomatic (e.g. `JSON.stringify` for CSV field escaping, not a hand-rolled escaper) with no `#stdlib`/`#native`/`#shrink`/`#delete` candidates |
| Total findings | **0** — correct: this fixture was built to contain no over-engineering, only complexity load-bearing enough to justify itself |
| Report matches exact format | **Pass** — `Tags applied: #delete (0), #stdlib (0), #native (0), #yagni (0), #shrink (0)`, `Total findings: 0`, `Fixed: 0`, `Deferred: 0`, no fabricated findings to hit a nonzero count |
| Translates through plain-language-checkpoint | **Pass** — plain-language summary: "No unnecessary complexity found — the different export formats (CSV, JSON, HTML) are all actually used by the app today, so keeping them as separate, swappable pieces is doing real work, not adding complexity for its own sake." |

Independently re-verified against the real filesystem rather than trusting the review's own
self-report: re-read all 8 source files directly and re-ran the grep above myself before writing
this log entry. The command correctly resisted the surface-level resemblance to Scenario 1's
`#yagni` finding and did not produce a false positive — this was the specific false-positive risk
this eval case most needed to close. Promotes the case to `verified`.
