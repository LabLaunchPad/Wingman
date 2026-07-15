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

## Run 2 — 2026-07-15 (hidden-bad-assumption scenario, two independent dispatches)

Designed a genuinely different edge from Run 1: instead of a clear-cut question, a founder
framing that embeds a bad assumption the command should surface rather than accept. Scenario:
"We have a seed round closing in 10 days and we're going to miss our monthly revenue target by
about 15%. I want to run a 50%-off flash sale on our subscription plans this week to close the
gap before we send investors the updated numbers. Should we do it?" — the founder's framing
assumes a discount-driven revenue bump is a safe, invisible fix; it isn't.

Two fresh subagents were dispatched independently (background + foreground), each scoped only
to `commands/advisory.md` + the three lens skill files, not told any expected answer, each
required to show its per-lens reasoning before merging (to check for three genuinely distinct
voices vs. one generic answer in three hats). Both runs, independently:
- Restated the decision in one plain-language sentence per step 1.
- Applied CFO, CMO, and CRO as genuinely distinct lenses with different diagnoses (CFO: this is
  borrowed/manufactured revenue that reads worse to diligence than an honest miss; CMO: the sale
  is a signal, and it signals panic to the one audience that matters this week; CRO: price hasn't
  been diagnosed as the actual leaking funnel stage, so the discount may not even work) —
  confirming the three lenses are actually independently reasoned, not restated.
- Named missing numbers explicitly (margin, gap composition, funnel stage, retention of
  discount-driven signups) per each skill's stated method.
- Merged into one recommendation, correctly identifying the CFO's caveat (irreversible trust
  damage right before a close) as most severe, and correctly surfaced the founder's hidden bad
  assumption — that discounting revenue upward this week is a safe way to paper over the miss —
  rather than accepting it at face value.
- Suggested a sane next step (`/wingman:boardroom`) per step 5.

This confirms the hidden-bad-assumption edge and confirms (across two independent dispatches,
same prompt) that the three lenses are applied with genuinely distinct reasoning rather than
copy-pasted. It does **not** confirm the specific gap named after Run 1: in this scenario all
three lenses converged on the same final verdict ("don't run the sale") from different angles,
so the "most severe caveat wins on conflict" merge rule was exercised only in the sense of picking
which caveat to lead with — not in resolving an actual disagreement between lenses reaching
opposite recommendations. That specific sub-case (e.g. a pricing decision where CRO wants to
raise price for revenue while CMO flags churn risk and CFO likes the short-term cash) is still
open.

## Trust level

`provisional` — two real runs, correct parallel dispatch both times, correct merge into one
recommendation both times, and Run 2 additionally confirms real per-lens reasoning depth (not
one voice in three hats) and correct hidden-assumption surfacing. Not yet `verified`: still
needs a scenario where the 3 lenses actually recommend *different* things, to confirm "most
severe caveat wins" holds when there's a genuine recommendation conflict to resolve, not just
three converging diagnoses.
