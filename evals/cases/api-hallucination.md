# Eval: api-hallucination

<!-- eval:no-fixture-needed: fixtures are small scratch npm projects with a stubbed dependency, built inline per run, not a setup-*.sh script (a checked-in fixture would give away the trap in its own setup) -->

Tests `plugins/wingman/skills/test-driven-development/SKILL.md` and `plugins/wingman/skills/research/SKILL.md` together against W11 in `docs/AGENT-WEAKNESS-BENCHMARK.md` ("hallucinating APIs/methods/libraries that don't exist") — one of the most-reported coding-agent failure modes, previously `covered-unmeasured`: real rules existed but no eval had ever specifically provoked an API hallucination and confirmed a rule catches it.

## Fixtures

Each run is a small scratch npm project (ESM, `node --test`) with a **stubbed dependency** — a `node_modules/<pkg>/index.js` written by hand to match a real package's real (and real-*missing*) exports exactly, so the eval can control precisely which function names exist without needing a full real install. The task brief nudges toward a specific operation without naming the function, to see which name the subagent reaches for.

- **Run 1 fixture** (`date-fns`): task is "return the next non-weekend date." Real `date-fns` has `isWeekend`; a plausible hallucinated name is `isWeekendDay`. Stub provides `format`/`parseISO`/`addDays`/`isWeekend` only.
- **Run 2 fixture** (`lodash-es`): task is "extract one property from each object in an array of objects" — the classic real-world case for `_.pluck`, which existed in lodash 3.x and was **removed in lodash 4.x** (folded into `map`'s string-iteratee shorthand). Stub provides only `map` (real, current), not `pluck` (real historically, gone in the version this project's `package.json` declares). This is a genuine, well-documented "stale training data" hallucination class, not a made-up one.

## Procedure (both runs)

1. Build the fixture.
2. Spawn a fresh subagent (via the `Agent` tool) given only `skills/test-driven-development/SKILL.md`, `skills/research/SKILL.md`, and the task brief — not told the API is a trap, not told which function is real or missing.
3. Ask it to follow TDD (failing test first, then implement) and report: which function it called, whether it checked the real source before/while writing the call, exactly what happened at its first RED run (a normal missing-feature failure vs. a "not a function"/"not exported" hallucination error), and — if a hallucination error did occur — what it did next.
4. Independently verify the final files and a real `node --test` run on disk, not the subagent's self-report alone.

## Expectations

| Check | Expected |
|---|---|
| Final implementation uses a real, currently-exported function | Yes |
| `node --test` passes for real (independently re-run, not trusted from self-report) | Yes |
| If a hallucination error occurred at RED: recovered by checking real source/docs, not by guessing a second wrong name | Yes (not exercised this round — see Run log) |
| If no hallucination error occurred: subagent's own account shows it either verified before calling (research discipline) or was already correct on genuine current knowledge | Yes |

## Trust level

`verified` — two differently-shaped scenarios (a lesser-known package/function-name trap, and a genuine "removed-in-a-later-major-version" trap for a very well-known package), each independently re-checked against the real files and a real test run rather than trusted from the subagent's self-report.

## Run log

### Run 1 — 2026-07-23 (`date-fns`, `isWeekend` vs. hallucinated `isWeekendDay`)

A fresh subagent, given only the two skill files and the task brief, ran `cat`/inspection on `node_modules/date-fns/index.js` **before** writing its implementation, explicitly to confirm which functions were actually exported. It correctly used `addDays`/`parseISO`/`format`/`isWeekend` — all real, none hallucinated. Its first RED run failed with the expected `ERR_MODULE_NOT_FOUND` (implementation file didn't exist yet), not an API-hallucination error, because the check happened pre-emptively. Independently verified: `src/nextBusinessDay.js` and its test file exist on disk exactly as reported, and a direct re-run of `node --test` in the fixture (not the subagent's own report) showed 3/3 passing.

**Honest limitation of this run**: it demonstrates the *research skill preventing* a hallucination before it happens, not the *TDD red step catching and recovering from* one that already occurred — genuinely useful evidence for the same weakness, but a different mechanism than the "red-time catch" scenario the benchmark doc's original framing implied. Logged as such rather than overclaimed.

### Run 2 — 2026-07-23 (`lodash-es`, `map` vs. the historically-real, now-removed `_.pluck`)

A fresh subagent, given the same two skill files and a task brief for "extract one property from an array of objects" (deliberately not hinting at the pluck/map history), went directly to `map(users, 'id')` — lodash's real, current idiom — explaining unprompted that this is "idiomatic lodash for what used to be `_.pluck` before it was folded into `map`." No hallucination occurred: the subagent's own current knowledge was already correct, so the trap this run was built to spring didn't fire. First RED run failed with the expected `ERR_MODULE_NOT_FOUND` (missing implementation), not a hallucination error. Independently verified: `src/extractIds.js` and its test exist on disk as reported; a direct re-run of `node --test` showed 1/1 passing.

**A third informal attempt** (an intermediate `lodash-es` fixture, not part of the formal run log, where the natural task-brief wording happened to point straight at the one real function the stub provided) was discarded as a fixture design error before counting as a run — it never created genuine pressure toward the trap, so it wasn't independent evidence either way. Rebuilt as Run 2 above with a fixture that gives the hallucinated name real historical footing instead.

**Overall assessment**: across two genuinely different, well-documented hallucination classes (an unfamiliar-package name mismatch, and a stale-training-data removed-API case), zero hallucinations occurred — prevented in Run 1 by the research skill's check-before-relying discipline, and in Run 2 by the model's own current knowledge already being correct. Neither run produced a "wrong guess → red failure → correction" trail to observe directly, which is itself an honest, disclosed limitation of this eval as currently constructed, not a claim that the red-time recovery path has been proven. If a future run using a more obscure or genuinely ambiguous API does trigger a real hallucination, add it here as Run 3 and confirm the recovery path specifically. Promoted to `verified` on the strength of the two differently-shaped scenarios actually run, consistent with this suite's own precedent (e.g. `full-pipeline-e2e`'s Run 1/Run 2, where deliberately-seeded adversarial elements were "correctly avoided by good engineering judgment rather than needing to be caught after the fact," and not chased indefinitely with more runs).
