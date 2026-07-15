# Eval: advisory

<!-- eval:no-fixture-needed: an orchestrating command with no code of its own to set up as a fixture; evidence comes from a real dispatch inside a shared consolidated session -->

Tests `plugins/wingman/commands/advisory.md` — does it fan out to `founder-cfo`/`founder-cmo`/
`founder-cro` in parallel and merge their verdicts into one consolidated, actionable
recommendation, per its own parallel-fan-out-then-merge design?

## Run 1 — 2026-07-15 (consolidated 8-skill session)

Part of a single continuous founder session (see `evals/cases/code-review.md` for the shared
fixture). The founder asked whether to add double opt-in to a newsletter signup flow. A fresh
subagent dispatched all 3 lenses for real (see `evals/cases/founder-cfo.md`,
`founder-cmo.md`, `founder-cro.md` for each lens's own individual verdict) and merged them into one
consolidated recommendation: defer double opt-in for the MVP, revisit once real bounce/spam
evidence or an EU-market requirement exists. The three lenses' verdicts converged rather than
conflicted in this run, so the "most severe caveat wins on conflict" merge rule (per this command's
own design) was not directly exercised — worth a second scenario specifically constructed so the
three lenses disagree.

## Trust level

`provisional` — one real run, correct parallel dispatch, correct merge into one recommendation.
Not yet `verified`: needs a second, differently-shaped scenario where the 3 lenses genuinely
conflict, to confirm the "most severe caveat wins" merge rule actually holds under real
disagreement rather than just averaging or picking one arbitrarily.
