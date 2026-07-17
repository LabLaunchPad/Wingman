# Eval: memory

<!-- eval:no-fixture-needed: evidence is downstream output of the other skills' real work in the same shared consolidated session, not a dedicated setup-*.sh script -->

Tests `plugins/wingman/skills/memory/SKILL.md` — does it record durable, genuinely useful facts
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

`provisional` — one real run, all 3 files written in the specified layout with genuinely useful,
non-fabricated content. Not yet `verified`: needs a second, differently-shaped scenario — a later
session actually reading this memory store back and confirming it changes that session's behavior
correctly (e.g. not re-investigating the ruled-out `isValidEmail(null)` hypothesis).
