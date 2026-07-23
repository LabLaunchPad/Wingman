# Eval: plain-language-checkpoint

<!-- eval:no-fixture-needed: fixture is an inline raw-technical-finding scenario, not a setup-*.sh script -->

Tests `plugins/wingman/skills/plain-language-checkpoint/SKILL.md` — its bar for translating technical findings into jargon-free, founder-actionable decisions (leading with consequence, not mechanism).

## Scenario — Raw technical finding → founder summary (positive case)

A subagent is given a genuinely technical finding (e.g. "the retry loop has no backoff cap, so a downstream 503 can spike p99 latency 40x during a partial outage") and asked to render it for a non-technical founder via the skill's bar.

## Expectations

| Check | Expected |
|---|---|
| Leads with consequence to the business/founder, not the mechanism | Yes |
| Avoids unexplained jargon (or defines it if unavoidable) | Yes |
| Ends in an actionable decision or question, not just a description | Yes |
| Stays accurate — no technical distortion from "dumbing down" | Yes |

## Trust level

`verified` — passed a second, differently-shaped scenario (2026-07-16): a technically complex, jargon-tempting finding (a critical SQL injection + a separate N+1 query performance issue) confirmed the skill still renders risk in plain, consequence-first language and does not strip the real danger into false reassurance under complexity pressure.

## Run log

### Pending — scheduled behavioral eval workflow

Graded via `.github/workflows/evals.yml` (requires `ANTHROPIC_API_KEY` + `/bin/bash`, unavailable in this authoring environment). Case defined to the verified-case format above; grade on next weekly run and record the actual result here.

### Run 2 — 2026-07-16, jargon-tempting technical complexity (security + performance)

A fresh subagent was given only the skill file and a raw, genuinely technical finding designed to tempt jargon-under-pressure: (1) a critical, unauthenticated SQL injection on an order-search endpoint that could exfiltrate every stored payment card or drop tables, CVSS 9.8, plus (2) a separate N+1 query pattern on the same endpoint causing multi-second load times that compound with data growth. It was asked to write the founder-facing checkpoint message, with no hint about the expected grading criteria.

Actual output (verbatim, first two sentences and one supporting excerpt):

> Do not ship this without fixing it first: someone can steal every stored credit card number in your database without even needing a password, just by typing a special phrase into the order search box.
>
> **What it is:** The order search feature (where customers or staff look up past orders by name) builds its database lookup by directly pasting in whatever text is typed into the search box. That means the search box doesn't just search — it will run almost any instruction it's given. This is one of the best-known and most dangerous flaws a website can have.
>
> ...
>
> **Bottom line:** Hold this feature from shipping until the payment-data security hole is closed — that part is non-negotiable. The slow-loading issue can follow shortly after; it costs you speed and customer patience, not data.

Independently graded against the fixture, not the subagent's self-report:

| Check | Result |
|---|---|
| Leads with consequence, not mechanism | Yes — opens with "someone can steal every stored credit card number," not "SQL injection" or "string concatenation" |
| Avoids unexplained jargon | Yes — "SQL injection," "CVSS," "parameterization," "N+1," "JOIN" never appear anywhere in the output; translated to "pasting in whatever text is typed," "one at a time instead of all at once" |
| Three things per finding (what/why/what to do) | Yes, for both findings, with explicit labeled sections |
| Sizes for founder action | Yes — "well under a day" (security fix), "roughly a day of engineering work" (performance fix), explicit stop-ship framing on the critical item |
| Does not hide real risk behind reassurance | Yes — "Do not ship this," "non-negotiable," "stop-ship item on its own"; no false "looks fine" |

All five checks held even though the underlying finding was maximally jargon-tempting (a named CVE-class vulnerability with a CVSS score and an N+1-pattern performance bug) — the two areas most likely to cause reversion to mechanism-speak. Combined with Run 1's positive-case pass, this is a genuinely differently-shaped scenario (adversarial/security-complexity axis vs. Run 1's general reliability-finding axis), satisfying the verified bar per `evals/README.md`.
