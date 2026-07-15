# Eval: research

<!-- eval:no-fixture-needed: evidence comes from a real query against live web search inside a shared consolidated session, not a synthetic fixture -->

Tests `plugins/wingman/skills/research/SKILL.md` and `commands/research.md` — does it decompose a
real founder question, run real searches, and produce a sourced brief with an honest confidence
note, never fabricated citations?

## Run 1 — 2026-07-15 (consolidated 8-skill session)

Part of a single continuous, realistic founder session (see `evals/cases/code-review.md` for the
shared fixture description — a tiny "newsletter signup" project). The founder asked: "what do
similar newsletter signup flows usually do about double opt-in / email confirmation — is that
something we're missing?"

A fresh subagent ran 2 real `WebSearch` queries and produced a brief citing real, reachable
sources (Oracle Marketing Cloud, Customer.io, Mailjet, Omnisend, OptinMonster, Litmus, Higher
Logic) — every citation traced to an actual search hit, none invented. Findings: double opt-in
cuts invalid addresses roughly 40%, cuts spam complaints 50-70%, is legally required in
Germany/Austria, not GDPR-mandated but strengthens consent evidence; the tradeoff is signup
drop-off during confirmation. Confidence rated medium-high (multiple independent vendor/industry
sources converge, not a single-source claim) — the skill's decompose → search → synthesize →
separate-finding-from-recommendation method was followed exactly, and the finding fed directly into
a real `founder-cfo`/`founder-cmo`/`founder-cro` advisory dispatch afterward (see
`evals/cases/founder-cro.md`).

## Trust level

`provisional` — one real run, correctly sourced, no fabrication, feeding a real downstream
decision. Not yet `verified`: needs a second, differently-shaped scenario — e.g. a question where
live web access genuinely returns nothing useful, to confirm the skill honestly reports that rather
than inventing a plausible-sounding answer.
