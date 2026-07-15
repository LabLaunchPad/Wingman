# Eval: founder-cro

<!-- eval:no-fixture-needed: a verdict-rendering skill with no code to set up as a fixture; evidence comes from a real dispatch inside a shared consolidated session -->

Tests `plugins/wingman/skills/founder-cro/SKILL.md` — does it render a plain-language conversion/
revenue-lens verdict without touching code, as one of 3 lenses `commands/advisory.md` dispatches
in parallel?

## Run 1 — 2026-07-15 (consolidated 8-skill session)

Part of a single continuous founder session (see `evals/cases/code-review.md` for the shared
fixture). Same double-opt-in decision as `evals/cases/founder-cfo.md` and
`evals/cases/founder-cmo.md`.

The CRO lens produced a real, grounded verdict: single opt-in maximizes top-of-funnel signup
completion right now; double opt-in's payoff is conditional (real spam/deliverability problems, or
a GDPR-grade proof-of-consent need), neither of which exists yet at this project's stage — a
genuinely reasoned "not yet" rather than a reflexive "more friction is always bad." This, combined
with the CFO and CMO lenses, produced `advisory.md`'s consolidated recommendation: defer double
opt-in for the MVP, revisit once real bounce/spam evidence or an EU-market requirement exists.
Confirmed the seat stayed verdict-only — no code touched.

## Trust level

`provisional` — one real run, correctly scoped to conversion/revenue reasoning, correctly non-
code-editing. Not yet `verified`: needs a second, differently-shaped scenario — e.g. a pricing or
funnel-step decision where the CRO lens is the clearly dominant consideration, not one of three
converging opinions.
