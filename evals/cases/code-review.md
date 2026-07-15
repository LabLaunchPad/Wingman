# Eval: code-review

<!-- eval:no-fixture-needed: fixture is a plain inline project description shared with several other cases in the same consolidated session, not a dedicated setup-*.sh script -->

Tests `plugins/wingman/skills/code-review/SKILL.md` — does it find a real, genuine quality issue
and report it in plain language, without ever editing the code itself?

## Fixture (shared across this consolidated session's 8 skills)

A tiny real "newsletter signup" Node.js project: `src/signup.js` (email validation + a signup
function), `test/signup.test.js` (3 passing tests). `src/signup.js` deliberately contains a real,
findable quality issue: a generic `ValidationPipeline` step-runner class wrapping exactly two
boolean checks with no reuse anywhere else — unnecessary indirection a real reviewer should catch.

## Run 1 — 2026-07-15 (consolidated 8-skill session)

A fresh subagent, given only this skill's `SKILL.md`, reviewed `src/signup.js` as it existed at the
time (before any simplification). It correctly flagged `ValidationPipeline` as unnecessary
indirection under a "Simplicity" category — a genuine, specific finding, not a generic "looks fine"
pass. Bottom line rendered: "Almost there — one simplification worth doing before ship." Confirmed
the pass made **zero edits** to the code, matching the skill's explicit "never edit code yourself"
constraint — the finding fed directly into a real `simplify` pass afterward (see
`evals/cases/simplify.md`), the two skills working together exactly as designed (review finds it,
simplify fixes it, code-review itself never touches code).

## Trust level

`provisional` — one real run, found a genuine issue, correctly report-only. Not yet `verified`:
needs a second, differently-shaped scenario — e.g. a change with no real issues, to confirm the
skill doesn't manufacture a finding just to have something to say.
