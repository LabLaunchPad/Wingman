# Eval: architecture

Tests `plugins/wingman/commands/architecture.md` behaviorally, distinct from `seven-stage-pipeline-e2e.md` (which already covers the architecture stage as part of a whole-pipeline run). The distinctive behaviors under test: does the command (a) make technical decisions (data model, file boundaries) without escalating to the founder, (b) tag each decision with an `ARCH-*` ID chained back to the `DEF-*` requirement it satisfies, and (c) check for related existing code before proposing something new (reuse-over-reinvention)?

## Fixture

`evals/fixtures/setup-architecture-fixture.sh <target-dir>` — the base waitlist app with pre-seeded discovery and define artifacts (DEF-001..003).

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with `commands/architecture.md` and the pre-seeded DEF-* requirements.
3. Independently verify the output against the expectations below.

## Expectations

| Check | Expected |
|---|---|
| ARCH-* minted chained to DEF-* | Each `ARCH-*` row has a non-empty `Satisfies` column naming its `DEF-*` ID(s) |
| No founder-level technical escalation | No framework, data-model, or file-layout question posed to the founder |
| Reuse consideration | At least one decision notes what existing code was extended rather than creating something new from scratch |
| Hand-off to uxflow | The output ends by directing to `/wingman:uxflow`, not stopping for approval |

## Trust level

`verified` — the architecture-stage behavior is exercised within `seven-stage-pipeline-e2e.md`'s two runs (Run 1 confirmed `ARCH-001..003` with `Satisfies` → `DEF-*` chain, Run 2 confirmed same with a different feature), and Run 3 (2026-07-18) closed the reuse-temptation gap: a dedicated dispatch against a requirement deliberately satisfiable by reusing existing code rather than reinventing it.

## Run log

Covered by `seven-stage-pipeline-e2e.md` Run 1 (2026-07-14) and Run 2 (2026-07-14) for the baseline `Satisfies`-chain behavior.

### Run 3 — 2026-07-18 (reuse-over-reinvention temptation, dedicated dispatch)

**Setup:** `setup-architecture-fixture.sh`'s base fixture with one hand-added `DEF-004` ("an operator can see the total current count of active waitlist entries") — deliberately satisfiable by calling the existing `listWaitlist()` and taking its length, but also naively satisfiable by inventing a new counter/index maintained alongside the existing `entries` Map. Neither prior run's `DEF-*` set ever posed this fork.

**Dispatch (fresh `general-purpose` subagent, given only `commands/architecture.md` + the real `DEF-*` requirements + told to read the real `src/waitlist.js`/`src/server.js` itself):** produced `ARCH-004` — a `GET /waitlist/count` route that calls the existing `listWaitlist()` and returns its length — with an explicit reuse note naming *why* a separate counter was rejected (sync-drift risk against the Map on every add/unsubscribe). All 4 `ARCH-*` IDs chained correctly to real `DEF-*` IDs (`ARCH-001`→`DEF-001` … `ARCH-004`→`DEF-004`), no framework/data-model/file-layout question escalated to the founder, and the doc ended by directing to `/wingman:uxflow` without stopping for approval.

**Independently verified** (real filesystem, not the subagent's self-report): `cat docs/wingman/architecture/waitlist-unsubscribe.md` — `ARCH-004`'s row explicitly says "No new counter, no new storage"; `grep -iE "new (counter|index)|separate (count|counter)"` matched only inside that same rejection-reasoning text, confirming no actual new counter mechanism was proposed elsewhere in the doc; `grep -c listWaitlist` returned 6, confirming genuine, repeated reuse of the real existing function rather than a one-off mention.

**No bugs found this run** — the reuse-over-reinvention discipline held under a genuine temptation, with the rejected alternative and its reasoning stated explicitly rather than reuse happening to occur by coincidence. Promoted to `verified`.
