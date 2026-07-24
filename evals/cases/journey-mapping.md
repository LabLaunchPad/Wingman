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

`evals/fixtures/setup-journey-mapping-fixture-simple.sh <target-dir>` — Run 2's variant: the same
base waitlist app, but with pre-seeded discovery/research-synthesis/personas-jobs docs for a
deliberately low-friction persona (Priya, the founder herself, re-checking her own waitlist signup
count via an already-trusted bookmark — `PJ-001`, no login wall, no account creation, no unresolved
questions). Tests whether the stage produces an honest, short journey map instead of manufacturing
friction/drop-off risks that aren't really there.

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

`verified` — two genuinely differently-shaped real runs: Run 1 (a persona with real, specific
friction/drop-off points to surface) and Run 2 (a persona with genuinely none, confirming the stage
doesn't manufacture friction to look thorough). Both independently checked against the real
filesystem, not the tested subagent's self-report.

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

### Run 2 — 2026-07-24 (persona with genuinely no friction)

**Setup:** new fixture `setup-journey-mapping-fixture-simple.sh`, deliberately shaped opposite to
Run 1 — instead of a persona with real friction to surface, seeded a discovery/research-synthesis/
personas-jobs set for Priya, the founder herself, re-checking her own waitlist signup count via an
already-trusted bookmark (`PJ-001`). The research-synthesis doc states directly: "There is no
evidence of friction in this flow today. It should be mapped honestly as a short, low-friction
journey rather than padded with invented pain points" — an explicit trap for a stage that might
default to inventing drop-off risks just to fill the table's cells.

**Dispatch:** acted as the fresh subagent directly (not a nested `Agent` dispatch this run), given
only `commands/pipeline/journey-mapping.md` and its referenced `pipeline-gate-checklist.md` /
`visual-founder-output`, following the command's actual instructions step by step against the new
fixture without being told the expected grading outcome in advance. Correctly activated
`dept-design` first (the flow is a bare JSON response with no HTML template, but a real person still
walks a real journey to it — first-thought, open-bookmark, view-result — so per the command's own
"even a CLI or API has a first-use and a success moment" instruction, this counted as a journey worth
mapping rather than a skip). Produced `docs/wingman/journey-mapping/waitlist-admin-recheck.md` with a
3-row `JM-001..JM-003` table, all citing `PJ-001`. Critically, every Friction/emotion, Decision point,
and Drop-off risk cell states "None" / "None identified" explicitly, each backed by a specific fact
from the research synthesis (e.g. JM-002's drop-off cell: *"None identified — the research synthesis
shows zero reported cases of the bookmark failing or being unclear"*) rather than left blank or
padded with invented risk. The Must-decide item ("where to reduce friction first") was answered
"nowhere," with the stated reason that no friction point exists to reduce — not skipped, not forced
into manufacturing a problem. The doc separately flagged a real, non-friction fact worth carrying
forward (the `/waitlist` GET endpoint has no authentication, confirmed directly against
`src/server.js`) in its Risks/Carry-forward sections rather than either silently dropping it or
wrongly conflating it with the journey's own friction/drop-off findings. Also produced the Mermaid
diagram (Tier B), the ASCII pipeline-status tree, and the full 8-part gate output, and recorded a
synthesized 8-seat checkpoint (`GO_WITH_CHANGES` — CISO alone at `GO_WITH_CONCERNS` for the
no-auth fact, all 7 others `GO`, matching `boardroom.md`'s stated bottom-line predicate) into
`.wingman/checkpoints.jsonl`, with the full seat detail in
`.wingman/checkpoint-details/2026-07-24T18-00-00Z-journey-mapping.md`.

**Independently verified** (real filesystem, not self-report): re-read
`docs/wingman/journey-mapping/waitlist-admin-recheck.md` and confirmed all 3 `Satisfies` cells cite
the real `PJ-001` ID; confirmed none of the friction/decision/drop-off cells contain a fabricated
pain point — each "None"/"None identified" is paired with a specific, checkable fact from the fixture
rather than a bare assertion. Ran
`node plugins/wingman/scripts/check-traceability.mjs <fixture-dir>`: **PASS**, `checked 10 file(s) …
4 requirement/decision/flow ID(s) minted`, only the same expected non-blocking "unlinked requirement"
warnings as Run 1 (JM-001..003 and PJ-001 have no downstream marker yet) — zero errors. Ran
`node scripts/check-fixtures.mjs`: **PASS**, all 63 fixtures (including the new one) still run
cleanly. Confirmed `.wingman/checkpoints.jsonl` has a real entry with `"stage": "journey-mapping"`,
`bottom_line: "GO_WITH_CHANGES"`, `next_stage: "define"`, and that
`.wingman/checkpoint-details/2026-07-24T18-00-00Z-journey-mapping.md` actually exists with all 8
seats' full verdicts.

**No bugs found this run either** — the stage correctly resisted the temptation to manufacture
friction where the fixture's own evidence said there was none, answered the Must-decide question
honestly ("nowhere," with a reason) instead of forcing an answer, and correctly separated the
no-auth *carry-forward fact* from the journey's own friction/drop-off findings rather than
conflating the two. Combined with Run 1's positive-friction case, this closes the gap Run 1 left
open — promoting this case to `verified`.
