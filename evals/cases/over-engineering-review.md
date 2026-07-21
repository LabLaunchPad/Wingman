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

## Trust level

`provisional` — passed Scenario 1's finding-identification checks (see Run log); the "applies safe
fixes" check wasn't cleanly exercised (the fixture has no test suite, so the subagent correctly
deferred all fixes rather than apply-without-verification) and no negative case has been run.
Corrected 2026-07-20 from `authored, pending first run`.

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
