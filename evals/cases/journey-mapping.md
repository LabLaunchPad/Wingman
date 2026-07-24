# Eval: journey-mapping

Tests `plugins/wingman/commands/pipeline/journey-mapping.md` behaviorally — the fourth of Wingman's
14 pipeline stages. The distinctive behavior under test: does the command produce a `JM-*`-tagged
journey table (first thought, trigger, decision points, friction points, emotional shifts, drop-off
risks) that traces back to a real `PJ-*` persona/job, genuinely identify friction/drop-off points
specific to that persona rather than generic boilerplate, decide where to reduce friction first, and
record its own solo Boardroom checkpoint against its stage-specific gate (full journey mapped)?

## Fixture

`evals/fixtures/setup-journey-mapping-fixture.sh <target-dir>` — the base waitlist app with a
pre-seeded `docs/wingman/discovery/waitlist-unsubscribe.md`,
`docs/wingman/research-synthesis/waitlist-unsubscribe.md`, and
`docs/wingman/personas-jobs/waitlist-unsubscribe.md` carrying one fleshed-out persona (Dana, the
overwhelmed early subscriber — `PJ-001`, wants to unsubscribe in one click from the email itself,
won't create an account or remember a password).

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with `commands/pipeline/journey-mapping.md` (and its referenced
   `pipeline-gate-checklist.md` / `visual-founder-output` skill) and the pre-seeded discovery +
   research-synthesis + personas-jobs docs, not told the expected answer.
3. Independently verify the output against the expectations below by reading the real files the
   subagent produced, not its self-report.

## Expectations

| Check | Expected |
|---|---|
| `JM-*` table produced | `docs/wingman/journey-mapping/<slug>.md` contains a `JM-*` table covering first thought through resolution |
| Real evidence citation | Every row's `Satisfies` column cites `PJ-001`, the real ID in the fixture — no fabricated IDs |
| Specific, not generic | Journey stages describe Dana's actual situation (mobile, mid-task, no account) rather than a generic funnel |
| Drop-off risks identified | At least one genuine, specific drop-off risk is named per a friction point (not just "user might leave") |
| Must-decide answered | The Decisions section states which friction point to reduce first, with a reason |
| 8-part gate output | Phase summary, decisions, open issues, risks, gate check (pass/fail per item), gap register updates, carry-forward items, go/no-go status all present |
| Checkpoint recorded | `.wingman/checkpoints.jsonl` has an entry with `"stage": "journey-mapping"` and a bottom-line verdict |

## Trust level

`provisional` — single real run.

## Run log

### Run 1 — 2026-07-24 (dedicated journey-mapping-only dispatch)

**Setup:** `setup-journey-mapping-fixture.sh`'s base fixture (waitlist app + discovery +
research-synthesis + personas-jobs with Dana/PJ-001).

**Dispatch** (fresh `general-purpose` subagent, given only `commands/pipeline/journey-mapping.md` +
its referenced `pipeline-gate-checklist.md` and `visual-founder-output`, not told the answer):
produced `docs/wingman/journey-mapping/waitlist-unsubscribe.md` with a 5-row `JM-001..JM-005` table,
all citing `PJ-001`: JM-001 (first thought — opens weekly email, annoyed), JM-002 (clicks unsubscribe
link — drop-off risk: a login/password wall, which would directly contradict Dana's stated constraint
of not wanting to create an account), JM-003 (removal processed — drop-off risk: a silent error with
no feedback), JM-004 (confirmation shown — drop-off risk: an unclear confirmation, tying back to a
real research-synthesis finding about users not trusting removal worked), JM-005 (later re-signup
attempt — drop-off risk: a silent no-op, tying back to another real research-synthesis finding about
a confused re-signup attempt). Also produced a Mermaid flow diagram (Tier B), the ASCII
pipeline-status tree, and the full 8-part gate output. Recorded a checkpoint into
`.wingman/checkpoints.jsonl` and a fresh `.wingman/state.json`/`.wingman/traceability.json`, since no
real invokable `/wingman:boardroom` exists inside a subagent dispatch — disclosed this synthesis
explicitly rather than faking a live multi-seat review. The synthesized 8-seat verdict was
`GO_WITH_CHANGES`: CTO and CISO both flagged the same underlying finding from two angles — an
unsigned/unauthenticated unsubscribe link would let anyone unsubscribe anyone else's email — correctly
carried into the doc's Risks section and the carry-forward items rather than silently dropped.

**Independently verified** (real filesystem, not the subagent's self-report):
`docs/wingman/journey-mapping/waitlist-unsubscribe.md` — confirmed all 5 `Satisfies` citations
resolve to the real `PJ-001` ID; confirmed the drop-off risks are specific to Dana's actual
constraints (the login-wall risk directly references her stated "won't create an account" limitation
from the fixture, not a generic funnel-drop-off line); confirmed the Decisions section answers the
Must-decide item ("where to reduce friction first") by naming the login/password wall as the top
priority, with a stated reason (it directly blocks the persona's core constraint). Ran
`node plugins/wingman/scripts/check-traceability.mjs` against the fixture afterward: **PASS**, only
expected non-blocking "unlinked requirement" warnings (JM-001..005 and PJ-001 have no downstream
marker yet, since no later stage has run against this fixture to reference them) — zero errors.
`.wingman/checkpoints.jsonl` confirmed a real entry with `"stage": "journey-mapping"`,
`bottom_line: "GO_WITH_CHANGES"`, `next_stage: "define"`.

**No bugs found in `journey-mapping.md` itself this run** — the persona-specific friction mapping,
the Must-decide answer with a real stated reason, the unauthenticated-unsubscribe-link risk correctly
surfacing from a mundane fixture (not planted), and the gate-checklist output all behaved exactly as
the command spec requires on first try. `provisional` pending a second, differently-shaped scenario
(e.g. a persona/job with no meaningful friction, to confirm the stage doesn't manufacture drop-off
risks that aren't really there).
