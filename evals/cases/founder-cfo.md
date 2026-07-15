# Eval: founder-cfo

<!-- eval:no-fixture-needed: a verdict-rendering skill with no code to set up as a fixture; evidence comes from a real dispatch inside a shared consolidated session -->

Tests `plugins/wingman/skills/founder-cfo/SKILL.md` — does it render a plain-language cost/effort
verdict without touching code, as one of 3 lenses `commands/advisory.md` dispatches in parallel?

## Run 1 — 2026-07-15 (consolidated 8-skill session)

Part of a single continuous founder session (see `evals/cases/code-review.md` for the shared
fixture). The founder asked whether to add double opt-in to a newsletter signup flow, informed by
a real `research` brief (see `evals/cases/research.md`) surfaced just before this dispatch.

The CFO lens produced a real, grounded verdict: roughly 1 dev-day of implementation plus a new
transactional-email dependency — negligible cash cost at MVP scale, but not zero effort. This fed
into `advisory.md`'s consolidated recommendation (defer double opt-in for the MVP, revisit once
real bounce/spam evidence or an EU-market requirement exists) alongside the CMO and CRO lenses.
Confirmed the seat stayed verdict-only — no code was touched during this pass, consistent with
`advisory.md`'s explicit guardrail that all three lenses only render verdicts.

## Trust level

`provisional` — one real run, correctly scoped to cost/effort, correctly non-code-editing. Not yet
`verified`: needs a second, differently-shaped scenario (e.g. a decision where the CFO lens should
clearly dominate the recommendation, to confirm it isn't just deferring to the other two seats).
