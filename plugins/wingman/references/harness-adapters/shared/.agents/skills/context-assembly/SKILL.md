---
name: context-assembly
description: Use at the start of any pipeline stage or ad-hoc task that touches a founder's existing project — reads the unified project state (vision, requirements, decisions, memory, last verdict) before work starts, so nothing gets re-litigated or missed. Triggers at the "Before starting" step of every pipeline stage command and at the start of /wingman:hotfix, /wingman:incident, and /wingman:evolve.
effort: low
---

# Context Assembly

## Overview

Wingman's non-negotiable rule is state-centric, not prompt-centric: every decision reads from the
project's real accumulated state, not from what one session happens to remember. Before this skill,
that state existed but nothing assembled it — a session had to know to separately check
`.wingman/checkpoints.jsonl`, `state.json`, `traceability.json`, and three memory files, in four
different formats, or silently work from partial context.

This skill is the assembly step: read `scripts/query-founder-knowledge.mjs`'s unified view once, at
the start of the work, and treat what it returns as the ground truth for "what does this project
already know."

**Core principle:** a fresh session reading this skill's output should behave exactly as a session
that had been present for every prior decision — never re-ask a settled question, never miss a
blocking verdict, never proceed past a `DO NOT SHIP` it should have stopped on.

## Inputs

The founder's project directory. Nothing else — this skill reads state that already exists, it does
not accept parameters to shape what it returns.

## Escalation

If `summary()`'s `state_stage_mismatch` field is non-null, or `last_checkpoint.bottom_line` is
`DO NOT SHIP` or `GO_WITH_CHANGES` with unresolved founder concerns, stop and surface it to the
founder in plain language before continuing the stage's own work — this is exactly the situation
`references/constitution.md` rule 6 (human approval for high-risk actions) exists for.

## When To Use

- At every pipeline stage's "Before starting" or gather step (`discovery.md` through `ship.md`),
  before reading any stage-specific artifact.
- At the start of `/wingman:hotfix` and `/wingman:incident` — a production issue is exactly when a
  stale assumption about current state is most costly.
- At the start of `/wingman:evolve`, alongside its own three signal sources (this skill covers the
  structured `.wingman/` state; `evolve-promotion` separately reads `LEARNINGS.md`/
  `docs/history/retros.md` prose).

## Core Workflow

**1. Run the unified query, once, before anything else:**

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/query-founder-knowledge.mjs" <project-dir> --summary
```

If `.wingman/` doesn't exist yet (`has_wingman_state: false`), this is a genuinely new project —
proceed with no prior context to assemble, and say so rather than treating an empty result as an
error.

**2. Check the two things that can block work outright, before reading anything else in the
output:**

- `state_stage_mismatch` — a real drift signal (a prior session wrote a checkpoint but didn't
  update `state.json` after). Surface it; don't silently trust `current_stage` at face value.
- `last_checkpoint.bottom_line` — if `DO NOT SHIP`, stop. Query for the specific blocker
  (`--verdict "DO NOT SHIP"` or filter on `founder_notes`) before proceeding with anything the
  checkpoint blocked.

**3. Pull the specific slice this task actually needs, not everything.** A stage working on UX
doesn't need every past architecture decision loaded — query with `--source`, `--stage`, or
`--since` to get the relevant slice. Loading the full unfiltered history into every task violates
`references/constitution.md` rule 4 (clarity before complexity) and `skills/token-economy` for no
benefit.

**4. Cross-reference `recent_decisions` before proposing anything that might re-litigate one.** If a
decision was already made with a stated revisit condition (e.g. "SQLite over Postgres, revisit if
scale exceeds X"), a fresh session must not silently reopen it without that condition being true.

**5. This is a read step, never a write step.** `query-founder-knowledge.mjs` is read-only by
design. Recording a new decision happens through the normal channels (`skills/memory`,
`commands/adaptive/boardroom.md`'s checkpoint write) after the work this context informs is done.

## Constraints

**MUST:**
- Run the unified query before reading any stage-specific file, not after.
- Check `state_stage_mismatch` and `last_checkpoint.bottom_line` before anything else in the output.
- Stop and surface a `DO NOT SHIP` verdict rather than proceeding past it.
- Query only the slice a task needs, not the full history by default.

**MUST NOT:**
- Re-litigate a decision in `recent_decisions` whose stated revisit condition hasn't occurred.
- Treat `has_wingman_state: false` as an error — it means "new project," not "broken."
- Use this skill as a write path — it has none.
- Load the full unfiltered history into a task that only needs a narrow slice of it.

## Rationalizations

| Excuse | Reality |
|---|---|
| "I'll just read the checkpoint file directly, it's faster" | That's exactly the four-format fragmentation this skill exists to remove — `.wingman/checkpoints.jsonl` alone misses `state.json` drift, `traceability.json`, and memory decisions. |
| "This is a small task, I don't need full context" | The query call is one line and returns instantly; skipping it to save a step is how a session misses a `DO NOT SHIP` that was sitting right there. |
| "The state mismatch is probably nothing" | It is a real, previously-caught drift class (`docs/status/PROJECT.md`'s dogfood run) — a session forgot to update `state.json`. Confirm before assuming. |
| "I remember what was decided from earlier in this conversation" | A fresh session — or this conversation after compaction — has no such memory. State-centric means reading the state, not trusting recall. |

## Red Flags — Stop and Reconsider

- About to start stage work without having run the `--summary` query first.
- About to proceed with `state_stage_mismatch` non-null and unexplained.
- About to proceed past a `DO NOT SHIP` `last_checkpoint`.
- About to re-decide something already recorded in `recent_decisions`.
- About to write through this skill — it has no write path; use `skills/memory` or the checkpoint
  write in `commands/adaptive/boardroom.md`.

## Verification

Before treating assembled context as complete: confirm the query actually ran (real command output,
not assumed), confirm `state_stage_mismatch` and `last_checkpoint.bottom_line` were both checked
explicitly, and confirm any `recent_decisions` entry relevant to the current task was read, not
skipped.

## Output

No founder-facing template — this is an internal step whose result feeds the calling stage's own
work. If a blocker is found (mismatch or `DO NOT SHIP`), surface it to the founder per
`skills/plain-language-checkpoint`'s bar before continuing.

## Anti-Rationalization Defense

### Common Rationalizations

| Excuse | Reality |
|---|---|
| "I'll check state later if something seems off" | By then a decision may already have been re-litigated or a blocker missed — check first, not reactively. |
| "The mismatch check is probably a false positive" | It was built specifically because a real dogfood run found the exact drift it detects — treat a hit as real until checked, not dismissed. |

### Red Flags

- Skipping the `--summary` call because the task "obviously" doesn't need prior context.
- Reading `last_checkpoint` but not its `bottom_line` field specifically.

### Anti-Pattern Callouts

- **Assumed-fresh-project**: treating `has_wingman_state: false` as a reason to skip this skill
  entirely, rather than as the (valid) answer this skill itself returns.
- **Full-history-every-time**: pulling the unfiltered `query()` result for every task regardless of
  scope, defeating the point of the `--source`/`--stage`/`--since` filters.

## Referenced by

- `references/pipeline-stage-boilerplate.md` — wired in once, inherited by all 14 pipeline stages.
- `references/constitution.md` — rule 1 (grounding truth before generation).

See `docs/status/ARCHITECTURE.md` for this skill's place in Wingman's overall architecture.
