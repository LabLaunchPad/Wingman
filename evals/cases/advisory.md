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

### Run 3 — 2026-07-16 (genuine three-way disagreement scenario)

Designed specifically to force the lenses apart rather than converge: "We're thinking about
raising our subscription price from $29/mo to $39/mo (35%) for all existing customers next
month, no grandfathering, partly to hit our revenue target before we close a fundraise. Should
we do it?" — a pricing raise with a real cash upside, a real reputation downside, and an
undiagnosed funnel risk, engineered so CFO, CMO, and CRO have grounds to land on different
actions rather than different phrasings of one answer. Run executed as a single continuous
transcript scoped only to `commands/advisory.md` and the three lens skill files, following its
5 steps in order, with each lens's reasoning shown before the merge (per this file's own
methodology for checking distinct-voice vs. copy-paste).

Per-lens verdicts, independently reasoned:
- **CFO**: ran explicit unit math (500 customers x $29 = $14,500 MRR; even at 10% churn from
  the raise, 450 x $39 = $17,550, still +21% MRR) and concluded the near-term cash case is
  strong up to roughly a 25% churn breakeven. Recommended path: **raise the price now,
  including existing customers** — the runway extension before the fundraise is real. Caveat:
  post-increase churn rate is an unstated assumption diligence will scrutinize.
- **CMO**: identified the audience as existing customers under an implicit $29 deal, and named
  the positioning risk of an unannounced blanket raise timed right before a fundraise as reading
  like "juicing the numbers for investors" to the one audience that matters most this week.
  Recommended path: **do not raise the price on existing customers** without grandfathering or
  notice; new price for new signups only. Caveat: reputation/trust damage from a perceived
  money-grab is largely irreversible once it lands.
- **CRO**: named the funnel stage in question (renewal) as undiagnosed — it's unclear whether
  the revenue miss is an underpricing problem or a weaker trial-conversion problem that a price
  hike would make worse. Recommended path: **don't apply broadly yet** — A/B the new price on
  new-cohort signups only and measure trial conversion/early retention before touching the
  existing base. Caveat: applying the change to everyone at once conflates two funnel stages and
  could mask or worsen a real leak.

These are three genuinely different recommended actions (raise broadly now / never raise for
existing customers / hold and test first), not one answer in three voices — confirming the gap
scenario actually produced disagreement instead of converging like Runs 1-2.

Merge (per the command's "most severe caveat wins" rule): CMO's caveat — irreversible trust
damage, compounded by fundraise-timing optics — was correctly identified as most severe, because
unlike CFO's churn risk or CRO's untested assumption (both measurable and correctable after the
fact), broken trust with an existing customer base can't be undone. The merge used that caveat as
the binding constraint rather than discarding the other two lenses: grandfather all existing
customers (resolves CMO), apply the new price immediately to new signups only (preserves CFO's
cash motive without the reputation exposure), and run CRO's conversion/retention test on that new
cohort to get real data before ever revisiting existing-customer pricing. This is a genuine
conflict resolution — it does not average the three positions, silently pick one lens and drop
the other two, or restate all three verdicts side by side without reconciling them into one
recommended path. Step 4/5 were also followed: led with consequence ("this either extends your
runway or costs you the trust of customers you already have — not both, if you do it wrong"),
stayed in plain language, never touched code, and suggested `/wingman:boardroom` given the
fundraise stakes.

## Trust level

`verified` — three real runs. Runs 1-2 confirmed correct parallel dispatch, correct merge into
one recommendation, genuine per-lens reasoning depth (not one voice in three hats), and correct
hidden-assumption surfacing, but both happened to converge on one final verdict, leaving the
"most severe caveat wins on conflict" rule untested against an actual disagreement. Run 3 closes
that gap: a scenario engineered so CFO, CMO, and CRO reached three different recommended actions,
and the merge correctly identified the most severe (irreversible) caveat and used it as a binding
constraint while still integrating the other two lenses' substance into one coherent
recommendation, rather than averaging, ignoring two of three lenses, or leaving the conflict
unresolved.
