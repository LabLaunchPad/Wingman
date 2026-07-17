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

## Run 2 — 2026-07-15

A fresh subagent, given only `code-review/SKILL.md`, reviewed a differently-shaped diff: a
deliberately well-built "cart-utils" discount-code feature (`src/discount.js` + `test/discount.test.js`,
6 scenarios — happy path, case-insensitivity, floor-rounding, unknown code, no code, both invalid-input
error paths, all passing) alongside one incidental, easy-to-miss change: `package.json`'s test script
switched from `"node --test test/"` to `"node --test test/*.js"`.

Independently verified against the real code before trusting the review: this is a genuine,
non-manufactured finding, not a frivolous one — Node's test runner already recurses a bare directory
argument and discovers `*.test.js` files on its own, so the glob change is functionally redundant
today, but `test/*.js` is a shell glob that only expands under a POSIX shell; under plain `cmd.exe`
(no Git Bash/WSL) npm passes the literal unexpanded string through and `node --test` finds no
matching files — a real cross-platform regression risk, correctly calibrated as "Should-fix," not
inflated to a blocker. The other two findings (`DISCOUNT_CODES` exported mutably; discount codes not
`.trim()`-ed before comparison) were correctly labeled "Nit" — real but genuinely low-severity,
not artificially escalated to pad the review. Bottom line rendered: "Almost there — fix one
Should-fix... rest is clean and ready to ship" — not a rubber-stamp "looks fine," and not inventing
issues with the actually-clean 6-test discount-logic implementation itself. Zero code edits made,
matching the skill's report-only constraint.

This is the differently-shaped scenario the Run 1 gap called for: a genuinely solid, well-tested
feature diff rather than one with an obvious flaw, and the skill neither missed the one real subtle
issue present nor manufactured noise around the parts that were actually fine.

## Trust level

`verified` — Run 1 found a genuine, obvious issue (unnecessary indirection) in a change with a clear
flaw; Run 2 found one genuine, subtle issue (a non-portable test-script glob) in an otherwise
well-built, well-tested feature, correctly calibrating severity (Should-fix vs. Nit) rather than
either rubber-stamping or manufacturing findings. Both runs confirmed zero code edits, matching the
skill's report-only constraint.
