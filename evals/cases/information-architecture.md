# Eval: information-architecture

Tests `plugins/wingman/commands/pipeline/information-architecture.md` behaviorally. The distinctive
behaviors under test: does the stage (a) produce an `IA-*`-tagged table where each row cites the
real `DEF-*` requirement it organizes, (b) use task-based naming ("Join the waitlist") rather than
system-based naming ("SignupController"), (c) genuinely split requirements that belong in different
areas of the product into different sections rather than lumping everything into one flat list, and
(d) record its own solo Boardroom checkpoint in `.wingman/checkpoints.jsonl` with
`stage: "information-architecture"`.

## Fixture

`evals/fixtures/setup-information-architecture-fixture.sh <target-dir>` — the base waitlist app with
pre-seeded discovery (`docs/wingman/discovery/waitlist-admin.md`) and define
(`docs/wingman/define/waitlist-admin.md`, `DEF-001`..`DEF-006`) artifacts. The define doc
deliberately spans two logically distinct areas with different audiences and auth boundaries: a
public waitlist-signup surface (`DEF-001` join, `DEF-002` check position) and a private
founder-facing admin surface (`DEF-003` admin login, `DEF-004` search/filter, `DEF-005` invite,
`DEF-006` remove spam) — real signal for an IA pass to organize into genuinely distinct sections,
not one trivial list.

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with only `commands/pipeline/information-architecture.md` (plus its
   referenced skills/references) and the fixture directory — not told the expected answer.
3. Independently verify the output against the expectations below by reading the real files.

## Expectations

| Check | Expected |
|---|---|
| `IA-*` table produced | `docs/wingman/information-architecture/waitlist-admin.md` exists with an IA table |
| Every row cites a real `DEF-*` | No row references a `DEF-*` ID that doesn't exist in the define doc |
| Task-based naming | Labels read as user/founder tasks ("Join the waitlist," "Invite a signup"), never system-shaped names |
| Genuine section split | Public-facing (`DEF-001`/`002`) and admin-facing (`DEF-003`-`006`) requirements land in structurally separate sections, not one flat lumped list |
| Design department activation | `department-lead-activation` correctly triggers (`dept-design` created) since the project will have a user-facing surface, even though the current codebase is JSON-API only |
| 8-part gate output present | Phase summary, decisions, open issues, risks, gate check (Must-include/Must-decide marked individually), gap register updates, carry-forward items, go/no-go status |
| Boardroom checkpoint recorded | `.wingman/checkpoints.jsonl` has an entry with `stage: "information-architecture"`, all 8 seats present, `details_ref` file actually exists on disk |
| Hand-off | Only a passing gate hands off to `/wingman:uxflow`; a real `next_stage` is set |

## Trust level

`provisional` — single real run, single scenario. No adversarial or negative scenario (e.g. a
define doc small enough that IA collapses to one section, or a gate that should legitimately block)
has been run yet.

## Run log

### Run 1 — 2026-07-24 (initial real dispatch)

**Setup:** `setup-information-architecture-fixture.sh`'s fixture — waitlist app with `DEF-001`..
`DEF-006` spanning public signup (`DEF-001`/`002`) and admin console (`DEF-003`-`006`).

**Dispatch (fresh `general-purpose` subagent, given only `information-architecture.md` plus its
referenced skills, not told the answer, and asked to record the Boardroom checkpoint itself since
`/wingman:boardroom` isn't invocable from inside a subagent):** produced `IA-001` through `IA-007`
in `docs/wingman/information-architecture/waitlist-admin.md`, activated `dept-design` (correctly
reasoning the project "will have" a user-facing surface per the define doc even though today's
codebase is JSON-only), and wrote a full 8-part gate output plus a Boardroom checkpoint with 8
synthesized seat verdicts.

**Independently verified** (real filesystem, not the subagent's self-report):
- `docs/wingman/information-architecture/waitlist-admin.md` — real IA table, 7 rows, every
  `Satisfies` column value (`DEF-001` through `DEF-006`) matches an ID that actually exists in the
  fixture's define doc; no invented IDs.
- Genuine section split confirmed: `IA-001`/`IA-002` (Join the waitlist / Check my position) sit at
  top-level with no parent, structurally separate from `IA-003` (Admin console) and its three
  children (`IA-004` Sign in, `IA-005` Manage signups, `IA-006`/`IA-007` nested under Manage
  signups) — the public and admin areas share no parent node, matching `DEF-003`'s explicit
  "separate auth boundary" requirement. Not a flat lumped list.
- Naming is task-based throughout ("Join the waitlist," "Check my position," "Invite a signup," —
  no system/table/endpoint-shaped names anywhere in the table).
- `.claude/agents/dept-design.md` exists — Design department lead genuinely activated.
- `.wingman/checkpoints.jsonl` — one real entry, `stage: "information-architecture"`,
  `schema_version: 5`, 8 seats present (CMO/CFO/Research correctly took the documented N/A
  fast-path), `bottom_line: "GO"`, `next_stage: "uxflow"`. `details_ref` points at
  `.wingman/checkpoint-details/2026-07-24T00-00-00Z-information-architecture.md`, which exists on
  disk with full unabridged per-seat verdict blocks — not a dangling reference.
- `.wingman/traceability.json` and `.wingman/state.json` both created with correct-looking content
  (`IA` next-id advanced to 8 for 7 minted IDs, `active_department_leads: ["dept-design"]`,
  `current_stage: "uxflow"`).

**One real gap found, not a bug in the command file itself:** the subagent never ran `git add`/
`git commit` for its own output (`docs/wingman/information-architecture/`, `.claude/`, `.wingman/`
all sit untracked in the fixture repo after the run). `information-architecture.md` doesn't
explicitly instruct committing its output, unlike `boardroom.md`'s "both files should be committed
to the project's own git repo" line for `state.json`/`checkpoints.jsonl` specifically — the doc/`IA`
table and `dept-design.md` agent file are left uncovered by that instruction. This is a process gap
worth tracking, not fixed here since it's cross-cutting (every pipeline stage's own doc output has
the same gap, not something specific to this one file) — logging it rather than papering over it
with a narrow, stage-specific fix.

**No bugs found in `information-architecture.md`'s own instructions** — the department-activation
call, the IA table shape, the task-based-naming requirement, the gate checklist, and the checkpoint
hand-off all behaved exactly as specified on first try.
