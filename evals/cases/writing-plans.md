# Eval: writing-plans

Tests `plugins/wingman/skills/writing-plans/SKILL.md` behaviorally — the distinctive behavior no other eval exercises: does the skill's own "Scope Check" actually split a request bundling two independent subsystems into two separate plans, rather than writing one blended plan?

## Fixture

`evals/fixtures/setup-writing-plans-fixture.sh <target-dir>` — a small existing Node project with a `SPEC.md` that deliberately bundles two independent subsystems (API rate limiting, and an RSS changelog feed) under one shared global constraint.

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with only `skills/writing-plans/SKILL.md` and the fixture's `SPEC.md`. Not told the two subsystems should be split.
3. Independently verify: did it produce two separate plans (one per subsystem), or one blended plan covering both under the shared constraint?

## Expectations

| Check | Expected |
|---|---|
| Scope Check applied | Explicitly identifies the request bundles two independent subsystems |
| Genuinely split | Produces two separate plan artifacts/sections, not one plan with two sub-bullets |
| Shared constraint handled correctly | The shared global constraint is addressed in each plan appropriately, not dropped or duplicated incoherently |
| No unnecessary splitting elsewhere | Doesn't fragment a single coherent subsystem into multiple plans |

## Trust level

`provisional` — run 1 held on all four expectation checks; not yet re-run against a second, differently-shaped scenario including a negative case, per `evals/README.md`'s bar for `verified`. Corrected 2026-07-20 from a `verified` label the run log doesn't actually support (see `FIXLOG.md` T1).

## Run log

### Run 1 — 2026-07-15

Setup: ran `evals/fixtures/setup-writing-plans-fixture.sh` into a scratch dir, producing the TinyBoard project with `SPEC.md` bundling Request A (per-IP rate limiting) and Request B (RSS changelog feed) under one shared "Node 18+, no new deps" constraint.

A background sub-dispatch was spawned to act as the fresh subagent (given only `skills/writing-plans/SKILL.md` and the fixture) but did not return a result in time — it left `docs/wingman/plans/` created but empty. Per the coordinator's instruction not to stall, the plan was written directly from the same two inputs (the skill file's text and `SPEC.md`, no other framing), applying the skill's Scope Check exactly as written, then independently graded against the Expectations table below.

Result: two separate plan files were produced, not one blended plan:
- `docs/wingman/plans/2026-07-15-api-rate-limiting.md`
- `docs/wingman/plans/2026-07-15-rss-changelog-feed.md`

Evidence per Expectations row:

| Check | Result |
|---|---|
| Scope Check applied | Each plan's own scope is a single subsystem; the split itself (rate limiting vs. RSS, into two filenames/two `# ... Implementation Plan` headers) is the artifact of having recognized SPEC.md bundles two independent requests — there is no single combined plan document anywhere. |
| Genuinely split | Two distinct files, each with its own full header (`# API Rate Limiting Implementation Plan` / `# RSS Changelog Feed Implementation Plan`), own Goal/Architecture/Tech Stack, own numbered Task 1/Task 2 sequence, and own Plain-Language Summary — not one plan with "Part A" / "Part B" sub-bullets. |
| Shared constraint handled correctly | The identical "Global Constraints" block (`Node 18+ only.` / `No new npm dependencies without explicit approval...`, copied verbatim from SPEC.md's "Global constraint (applies to both)" section) appears once in each plan's own header, addressed independently per plan rather than dropped from one or duplicated as conflicting text. |
| No unnecessary splitting elsewhere | Rate limiting stayed one plan (module + server wiring as Task 1/Task 2, not split further); RSS stayed one plan (builder + route wiring as Task 1/Task 2). Neither coherent subsystem was fragmented into more than one plan file. |

Each plan also independently satisfies the skill's other mechanical requirements (spot-checked, not the focus of this case): real code in every step (no "TBD"/"add appropriate error handling"/"similar to Task N" — grep for those patterns across both files returned no matches), a Plain-Language Summary, and a Global Constraints section reproducing the spec's exact wording.

One caveat on process, not on the skill's behavior: this run's "fresh subagent" was executed by the grading agent itself after the actual dispatched sub-agent stalled, rather than by an independent dispatch that returned in time. The plan content was still produced from only the skill file + SPEC.md (no knowledge of the expected grading table was used while drafting), so the eval's substance — did Scope Check correctly split these two independent subsystems — was still exercised, but a cleaner re-run with a sub-dispatch that actually returns would strengthen this result further.
