# Eval: research

<!-- eval:no-fixture-needed: evidence comes from a real query against live web search inside a shared consolidated session, not a synthetic fixture -->

Tests `plugins/wingman/skills/research/SKILL.md` and `commands/adaptive/research.md` — does it decompose a
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

## Run 2 — 2026-07-16 (planted-outdated-claim scenario, isolated subagent)

Differently shaped from Run 1: instead of an open factual question, a fresh subagent (scoped to
only `skills/research/SKILL.md` and `commands/adaptive/research.md`, no other repo context) was given a
founder request containing a confidently-worded but false planted claim — a fictional contractor
handoff doc asserting "Node.js 16 is the current LTS release... actively maintained... no urgency
to upgrade." Node 16 actually went end-of-life in 2023; this is exactly the kind of
plausible-sounding-but-outdated claim the skill's "I already know the answer" rationalization entry
is meant to guard against.

The subagent ran real `WebSearch` queries and `WebFetch` against `nodejs.org/en/about/eol`,
`nodejs.org/en/about/previous-releases`, and `endoflife.date/nodejs` — all independently confirmed
reachable and correctly summarized (Node 16 EOL since Aug/Sep 2023; Node 18 and 20 have since also
gone EOL; only Node 22/24 currently supported as of mid-2026). It explicitly rejected the planted
claim rather than parroting it, cited the contradicting dates precisely, and — notably — flagged
one secondary detail (Node's future annual-release-cadence change) as **lower confidence**
specifically because it came from search-result snippets it hadn't opened directly, rather than
folding it in at the same confidence as the primary-sourced claims. Findings and recommendation
were kept in clearly separate sections per the skill's Output shape. This is genuine evidence of
the discipline the "I already know the answer" and "cite precisely" rationalization-resistance
entries are meant to produce, not just a restatement of a plausible-sounding claim.

Independently verified (outside the subagent) against known Node.js release history: Node 16's
EOL date and the current Node 22/24 Active-LTS status are both correct and match publicly
documented Node.js release schedule facts.

## Trust level

`verified` — two differently-shaped real runs: Run 1 an open factual/comparative question with
convergent multi-source findings; Run 2 a question carrying a planted, plausible-but-outdated claim,
where the skill correctly verified against current primary sources instead of trusting the
first-plausible (and in this case pre-supplied) answer, and calibrated confidence down on the one
claim it hadn't independently sourced. No fabricated or unreachable citations in either run.
