# Eval: incident-response

<!-- eval:no-fixture-needed: shares code-review.md's inline fixture description, not a dedicated setup-*.sh script -->

Tests `plugins/wingman/skills/incident-response/SKILL.md` and `commands/adaptive/incident.md` — does the
calm, ordered runbook (triage → diagnose before touching code → smallest safe fix) hold up against
a real bug, and does it correctly diagnose the *actual* root cause rather than accepting a plausible
but wrong hint?

## Run 1 — 2026-07-15 (consolidated 8-skill session)

Part of a single continuous founder session (see `evals/cases/code-review.md` for the shared
fixture). The scenario handed to the subagent was: "production reports show `signup()` is throwing
an unhandled error for some emails — investigate," with an internal (not told to the subagent)
planted hint suggesting `isValidEmail(null)` was the cause.

**The most important result of this run: the hinted cause did not reproduce, and the subagent
found the real one instead of accepting the plausible-sounding lead.** It tested
`isValidEmail(null)`/`isValidEmail(undefined)` directly and confirmed both return `false` safely
(`RegExp.test()` coerces to string, no throw) — then kept investigating edge cases per the runbook's
own "diagnose before fixing" discipline, and found the actual reproducible crash:
`signup(email, null)` throws `Cannot read properties of null (reading 'includes')`, because JS
default parameters only trigger on `undefined`, not an explicit `null`. Fixed with
`Array.isArray(existingEmails) ? existingEmails : []`, added a regression test, confirmed 4/4
passing after. Logged the ruled-out hypothesis in the memory store (see `evals/cases/memory.md`) so
a future session doesn't re-chase the same wrong lead.

This is genuine evidence the runbook's sequencing (triage → diagnose, never guess-and-patch) works
as designed — a less disciplined process could easily have "fixed" the hinted (non-existent) null
regex issue, declared victory, and left the real crash live.

## Run 2 — 2026-07-16 (correlation-vs-causation, fresh subagent)

Differently-shaped from Run 1: instead of a planted-but-wrong *hint* about the mechanism, this run
tested a genuine **misleading correlation** — a real, unrelated change that happened to land at the
same timestamp as the incident, which the incident report itself (mimicking on-call's own leading
theory) named as the prime suspect.

Fixture built at
`/tmp/claude-0/-home-user-Wingman/ce30667c-52f4-5242-baf9-f99967a6a993/scratchpad/eval-incident-response-run2/`:
a small Node "order-service" with `src/gateway.js` (mock payment gateway), `src/charge.js`
(`chargeCustomer`, with a genuine pre-existing bug), and `src/analytics.js` (an event logger bumped
from 2.3.1 → 2.4.0 in the same deploy, purely cosmetic — adds a `source` tag to logged events, no
control-flow interaction with charging at all). `deploy-log.txt` records only that one-line version
bump at 14:00 UTC. `incident-report.md` describes customers being double-charged since shortly after
that deploy and states on-call's working theory that the analytics-logger bump is the cause "since
the timing lines up almost exactly." `repro.js` reproduces the real bug independently of any of
that: `chargeCustomer` retries on `gateway.TimeoutError` without checking whether the gateway had
already recorded the charge before the ack was lost (a real "charge succeeded, ack timed out"
scenario) — so a flaky ack always produced a second real charge. Confirmed the repro reproduced
(2 charge records, exit code 1) before handing anything to the subagent.

A fresh subagent was spawned with access to only the skill file, the fixture directory, and the
incident report (no knowledge of this framing) and asked to diagnose and fix per the runbook.
**Result: it correctly identified the actual root cause and did not touch the correlated-but-innocent
analytics-logger change.** It traced the real data flow through `gateway.js`/`charge.js`, explicitly
reasoned that `analytics.js`'s `logEvent` calls are one-way side effects consumed by nothing in the
charge path and have no control-flow interaction with the gateway call, and named the timing overlap
with the 14:00 UTC deploy as coincidental rather than causal. It fixed `chargeCustomer` to check
`gateway.getCharges(orderId)` before retrying and only retry if no charge was already recorded,
verified with `node repro.js` before (2 charges, bug reproduced) and after (1 charge, no duplicate),
and proposed keeping `repro.js` as a permanent regression test. Independently re-verified outside the
subagent: read the diff, confirmed `analytics.js` was left untouched, and re-ran `node repro.js`
myself — 1 charge, exit code 0.

This is genuine evidence the runbook holds up against a *different* failure mode than Run 1: not
just resisting a wrong hint about mechanism, but resisting a real, temporally-correlated but causally
unrelated change dressed up as the leading theory in the incident report itself.

## Trust level

`verified` — two real runs, each testing a differently-shaped edge. Run 1: a planted-but-wrong
mechanistic hint (the runbook kept investigating past a hypothesis that didn't reproduce and found
the actual crash). Run 2: a genuine correlation-vs-causation trap (an unrelated change that landed at
the same time as the incident and was explicitly named as on-call's leading theory; the runbook
traced actual data flow instead, correctly ruled the correlated change out, and fixed the real,
independently-reproducible bug). Both runs show the "diagnose before fixing" discipline holding
under different kinds of pressure to fix the first plausible-looking thing.
