# Eval: memory

<!-- eval:no-fixture-needed: evidence is downstream output of the other skills' real work in the same shared consolidated session, not a dedicated setup-*.sh script -->

Tests `plugins/wingman/skills/knowledge/memory/SKILL.md` — does it record durable, genuinely useful facts
from a real session in the exact layout it specifies, never storing secrets, and in a form a future
session could actually use?

## Run 1 — 2026-07-15 (consolidated 8-skill session)

Applied at the end of a single continuous founder session (see `evals/cases/code-review.md` for the
shared fixture) that had produced 3 genuinely distinct things worth remembering: a deferred
double-opt-in decision (see `evals/cases/founder-cro.md`), a simplify outcome (see
`evals/cases/simplify.md`), and a ruled-out debugging hypothesis from a real incident investigation
(see `evals/cases/incident-response.md`).

A fresh subagent wrote the store per the skill's own specified layout under `.wingman/memory/`:
- `MEMORY.md` — evergreen facts (the signup contract, current single-opt-in status).
- `decisions.md` — three dated entries, one per real decision made this session.
- `tried.md` — the ruled-out hypothesis from the incident investigation (the `isValidEmail(null)`
  lead that didn't reproduce), specifically so a future session doesn't re-investigate it.

This is a real, direct test of the skill's own reasoning: `tried.md`'s content only makes sense
because a real incident investigation happened in the same session and genuinely ruled something
out — this wasn't manufactured to test the memory skill in isolation, it's authentic downstream
output of the other 7 skills' real work in this same run.

## Trust level

`verified` — Run 1 confirmed the write path; Run 2 confirmed the previously-unproven read-back
half (see below). Together, both directions of the skill's core claim (write a durable fact, have
a later session actually use it) are now directly evidenced.

## Run 2 — 2026-07-15 (read-back half, closing Run 1's named gap)

Token-efficient design: Run 1 already proved the *write* path works, so this run tested only the
*read-back* half, by constructing the memory store directly (`.wingman/memory/MEMORY.md` +
`decisions.md`, a real, specific, testable decision — "use `date-fns`, not `moment`/`dayjs`, for
all date formatting") rather than re-running a full write session, then dispatching one fresh,
un-briefed subagent (given only `SKILL.md` and the fixture, not the eval's expected answer) with a
task that plausibly needs prior context but was never explicitly told to check memory — "add a
date-formatting utility function," with instructions to use its own judgment about what to look at
first.

**Result: PASS.** The agent read `.wingman/memory/MEMORY.md` and `decisions.md` before writing any
code, explicitly cited the recorded decision's exact reasoning (date-fns over moment/dayjs) as the
reason for its implementation choice, and stated directly that a fresh session with no memory of
the decision "would otherwise have been equally likely to reach for `Intl.DateTimeFormat` or
`dayjs`" — a clear, self-aware distinction between coincidental library selection and genuine
read-back-driven behavior. Independently re-verified against the real files (not trusted from
self-report): `src/index.js` contains a real `formatEventDate` function using `date-fns`'s
`format`, actually runs and prints `"July 10, 2026"` for the given test date, and the memory files
themselves were left untouched (only `src/index.js` and install byproducts changed).

This closes the specific, named gap from Run 1's trust-level note.

## Note — 2026-07-19, "Living Knowledge Graph" cross-check

A founder-shared diagram on bi-temporal knowledge graphs (valid-time vs. record-time; invalidate
old facts, don't delete them) prompted a direct check of `SKILL.md`'s own consolidation rule
against that principle. Finding: the two-file design already has the right shape in effect
(`MEMORY.md` = current state, `decisions.md` = append-only dated history — record-time is already
preserved structurally) but the "consolidate, don't append" rule for `MEMORY.md` contradictions
didn't require also logging the change in `decisions.md`, so a fact update could silently lose the
"this used to be true, then changed" trail. Fixed directly (one clarifying sentence, not new
infrastructure — a full bi-temporal graph store would be the same class of over-engineering this
project already declined for vector search, per `docs/DATABASE.md`). Not re-run against a fresh
fixture since it's a documentation clarification of an already-verified mechanism's edge case, not
new behavior; the existing Run 1/Run 2 verification still covers the write/read-back paths this
change doesn't alter.
