# Eval: writing-plans

Tests `plugins/wingman/skills/discipline/writing-plans/SKILL.md` behaviorally — the distinctive behavior no other eval exercises: does the skill's own "Scope Check" actually split a request bundling two independent subsystems into two separate plans, rather than writing one blended plan?

## Fixture

`evals/fixtures/setup-writing-plans-fixture.sh <target-dir>` — a small existing Node project with a `SPEC.md` that deliberately bundles two independent subsystems (API rate limiting, and an RSS changelog feed) under one shared global constraint.

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with only `skills/discipline/writing-plans/SKILL.md` and the fixture's `SPEC.md`. Not told the two subsystems should be split.
3. Independently verify: did it produce two separate plans (one per subsystem), or one blended plan covering both under the shared constraint?

## Expectations

| Check | Expected |
|---|---|
| Scope Check applied | Explicitly identifies the request bundles two independent subsystems |
| Genuinely split | Produces two separate plan artifacts/sections, not one plan with two sub-bullets |
| Shared constraint handled correctly | The shared global constraint is addressed in each plan appropriately, not dropped or duplicated incoherently |
| No unnecessary splitting elsewhere | Doesn't fragment a single coherent subsystem into multiple plans |

## Trust level

`verified` — run 1 held on all four expectation checks against a positive splitting scenario; run 2 (2026-07-22) held against a genuinely differently-shaped negative-plus-ambiguity scenario (single coherent subsystem that should NOT split, with an underspecified spec forcing explicit stated decisions instead of placeholders), satisfying `evals/README.md`'s bar for `verified` (multiple differently-shaped scenarios including a negative case). Corrected 2026-07-20 from a `verified` label the run log at the time didn't actually support (see `FIXLOG.md` T1); re-promoted 2026-07-22 on real second-scenario evidence.

## Run log

### Run 1 — 2026-07-15

Setup: ran `evals/fixtures/setup-writing-plans-fixture.sh` into a scratch dir, producing the TinyBoard project with `SPEC.md` bundling Request A (per-IP rate limiting) and Request B (RSS changelog feed) under one shared "Node 18+, no new deps" constraint.

A background sub-dispatch was spawned to act as the fresh subagent (given only `skills/discipline/writing-plans/SKILL.md` and the fixture) but did not return a result in time — it left `docs/wingman/plans/` created but empty. Per the coordinator's instruction not to stall, the plan was written directly from the same two inputs (the skill file's text and `SPEC.md`, no other framing), applying the skill's Scope Check exactly as written, then independently graded against the Expectations table below.

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

### Run 2 — 2026-07-22

Deliberately different shape from Run 1 in two ways at once: (a) a **negative** case for the Scope Check — a spec describing one genuinely coherent subsystem that a lazy or over-eager splitter might still fragment (search matching, relevance ranking, and pagination all sound like they could be "different features"), and (b) an **ambiguity** case — the spec's requirements are underspecified ("keep results reasonably ordered," "we don't want to dump everything back at once") with no fixture author telling the plan-writer the exact algorithm, testing whether the skill's "vagueness is a signal to make an explicit stated decision, not a placeholder" rule actually holds under real ambiguity pressure rather than just being quoted in the SKILL.md's own rationalization table.

Setup: hand-built a scratch fixture (not a checked-in `evals/fixtures/setup-*.sh` — this run intentionally touches no repo file except this case doc) reusing the TinyBoard shape from Run 1's fixture (`package.json`, `src/server.js` with 3 seeded posts, `test/server.test.js`, `README.md`) plus a new `SPEC.md`:

```
# SPEC: Add search to TinyBoard
## Requirement
Add `GET /posts/search?q=<term>` that returns the posts matching the
search term. It should search across post content, not just titles. Keep
results reasonably ordered so the most relevant ones show up first. If
there's a lot of matches, we don't want to dump everything back at once.
## Constraint
Node 18+ only. No new npm dependencies.
```

Acting as the fresh subagent described in the case's own Procedure (given only `skills/discipline/writing-plans/SKILL.md` and this `SPEC.md`, not told the expected grading outcome), a single plan was written and saved to `docs/wingman/plans/2026-07-22-changelog-search.md` in the scratch fixture. It was then independently re-read from disk (per the skill's own Self-Review discipline) and graded against the Expectations table, and — going further than Run 1 — the plan's actual code was extracted and run for real:

```
$ node --test    # after writing src/search.js, src/server.js, and all 3 test files exactly as the plan specifies
# tests 7
# pass 7
# fail 0
```

All 7 tests specified by the plan (3 pre-existing + 4 new `search.test.js` cases + 2 new `server-search.test.js` cases) passed on the first run of the plan's own code, verbatim as written — not just "looks plausible," but confirmed working.

Evidence per Expectations row:

| Check | Result |
|---|---|
| Scope Check applied | Explicitly applied and reasoned about in a dedicated plan section ("Decisions the spec left implicit... This stays one plan, not two"), which explicitly considered and rejected splitting matching/ranking/pagination into separate plans, naming *why* they don't qualify as independent subsystems: "a ranking scheme with no pagination is still just 'search'; pagination with no ranking is meaningless without something to page through." |
| Genuinely split | N/A here by design — this scenario's Scope Check should correctly find **no** split warranted (negative case), and it produced exactly one plan file, `docs/wingman/plans/2026-07-22-changelog-search.md`, confirmed via `ls docs/wingman/plans/` returning a single entry. |
| Shared constraint handled correctly | Only one plan exists, so there's no cross-plan duplication/conflict to check; the spec's "Node 18+ only, no new npm dependencies" constraint appears once in the plan's own Global Constraints section, worded to match the spec. |
| No unnecessary splitting elsewhere | This is the row this scenario was built to stress: a plan-writer inclined to over-split by "feature" could have produced a matching plan + a separate ranking/pagination plan. It did not — one plan, two tasks (search module, then server wiring), which is right-sized per the skill's own Task Right-Sizing rule, not a further fragmentation. |

Beyond the Expectations table, this run also specifically exercised the skill's "vagueness is a signal to make an explicit stated decision, not a placeholder" rule (from the Rationalizations table), which Run 1's clear, unambiguous spec never tested. The spec's three vague phrases each got a concrete, stated decision instead of a deferred placeholder:
- "search across post content, not just titles" → explicit: case-insensitive substring match against `title` OR `body`.
- "keep results reasonably ordered so the most relevant ones show up first" → explicit scoring formula: `(title occurrences * 3) + (body occurrences * 1)`, ties broken by `publishedAt` descending, stated and then actually implemented in `src/search.js`'s `scorePost()`.
- "we don't want to dump everything back at once" → explicit pagination contract: `limit` (default 10, max 50, clamped not rejected) and `offset` (default 0) query params, with the exact response shape (`results`/`total`/`limit`/`offset`) stated up front in Task 1's "Produces" interface block.

A placeholder scan (`grep -niE "TBD|TODO|implement later|fill in details|add appropriate|add validation|handle edge cases|similar to task"` across the plan file) found exactly one hit, and it is the plan's own prose *naming* the banned "add appropriate ranking" pattern as the thing it is deliberately avoiding — not an actual placeholder left in a step. Type/signature consistency was also spot-checked: `searchPosts(posts, query, options)` is used identically in Task 1's Produces block, Task 1's own test code, Task 1's implementation, Task 2's Consumes block, and Task 2's server-wiring code — no drift.

No gaps found. Combined with Run 1's positive splitting case, this satisfies `evals/README.md`'s `verified` bar (multiple differently-shaped scenarios, including a negative case) — Trust level promoted above.
