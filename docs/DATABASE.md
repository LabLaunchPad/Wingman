# Wingman — State Store Specification

Wingman has no database in the traditional sense, and per `docs/SRS.md` NFR-1/NFR-2, it never will in the sense of a hosted service the founder has to run. This document specifies the flat-file state store that exists today, and the optional MCP server interface over it that's planned but not yet justified — see "Why no server yet" below.

## What actually exists (v1, flat files)

All Wingman state lives under `.wingman/` at the root of the founder's project (git-committed, human-readable, no binary formats):

```
.wingman/
├── checkpoints.jsonl     # append-only log of every Boardroom checkpoint
├── checkpoint-details/   # one file per checkpoint: full, unabridged seat verdicts
│   └── <checkpoint_id>.md
├── state.json            # current project-level state (small, overwritten in place)
├── traceability.json     # next-available-ID counter per requirement/decision/flow prefix
└── memory/
    ├── MEMORY.md         # evergreen facts: project name, stack, constraints, preferences
    ├── decisions.md      # dated decision log (what was decided, why, by whom)
    └── tried.md          # approaches already attempted and their outcome
```

(This file tree previously omitted `traceability.json` and `memory/` — an audit,
`docs/wingman/architecture-audit-2026-07-15.md`, found both were real files real skills already
write, with no corresponding entry here. Documented below.)

### `checkpoints.jsonl`

One JSON object per line, appended by `/wingman:boardroom` every time it runs (never rewritten or reordered — this is an audit log, not a mutable table).

```json
{
  "schema_version": 4,
  "checkpoint_id": "2026-07-14T14-32-00Z-implementation-planning",
  "stage": ["discovery", "define", "architecture", "uxflow", "implementation-planning"],
  "bundle": "planning-milestone",
  "scope_ref": "docs/wingman/plans/2026-07-14-billing-integration.md",
  "seats": [
    { "seat": "ceo",      "verdict": "GO",              "summary": "Solves the stated problem, scope is right-sized." },
    { "seat": "cpo",      "verdict": "GO",              "summary": "Real user need, right-sized slice." },
    { "seat": "cmo",      "verdict": "GO",              "summary": "N/A — no material input on this checkpoint." },
    { "seat": "cto",      "verdict": "GO_WITH_CONCERNS", "summary": "No test plan for the webhook retry path yet." },
    { "seat": "ciso",     "verdict": "GO",              "summary": "No new data exposure identified." },
    { "seat": "cfo",      "verdict": "GO",              "summary": "No new paid services introduced." },
    { "seat": "research", "verdict": "GO",              "summary": "N/A — no material input on this checkpoint." }
  ],
  "bottom_line": "GO_WITH_CHANGES",
  "founder_decision": "fix_concerns_first",
  "founder_notes": "",
  "next_stage": "build",
  "details_ref": ".wingman/checkpoint-details/2026-07-14T14-32-00Z-implementation-planning.md"
}
```

**Field notes:**
- `schema_version`: `4` adds `details_ref` (see migration note below); `3` for the 7-stage pipeline schema; `2` marks the 7-seat-Boardroom-but-still-4-stage schema; absent/unmarked entries are implicitly `schema_version: 1` (5-seat, 4-stage) — see the migration notes below.
- `details_ref`: path to the companion file (`checkpoint-details/<checkpoint_id>.md`) holding every seat's full, unabridged verdict text — see migration note below. Absent on `schema_version: 3` and earlier entries, and on any `schema_version: 4`+ entry whose companion-file write itself failed; treat its absence as "no full detail available for this one," never an error.
- `checkpoint_id`: `<ISO-8601-timestamp-with-dashes>-<stage-or-bundle-name>`, unique per line.
- `stage`: one of `discovery`, `define`, `architecture`, `uxflow`, `implementation-planning`, `build`, `ship`, or a free-text label for an ad-hoc `/wingman:boardroom` invocation — **or an array** of stage names when `bundle` is `"planning-milestone"` (the only case where multiple stages share one checkpoint). Consumers must check whether `stage` is an array before iterating; don't assume scalar.
- `bundle`: `"planning-milestone"`, `"build"`, or `"ship"` — every `schema_version: 3` checkpoint belongs to exactly one of a project's 3 total bundles. Absent on `schema_version: 2` and earlier entries; treat its absence as "not applicable," never an error.
- `scope_ref`: path to the plan file reviewed, or `"diff"` if the scope was a git diff rather than a plan file.
- `seats[].seat`: one of `ceo`, `cpo`, `cmo`, `cto`, `ciso`, `cfo`, `research`, `design` (the `design` entry is omitted when Design was N/A for the checkpoint) — see migration note below for the pre-rename names.
- `seats[].verdict`: one of `GO`, `GO_WITH_CONCERNS`, `NO_GO` — matches each Boardroom agent's own output contract.
- `bottom_line`: one of `GO`, `GO_WITH_CHANGES`, `DO NOT SHIP` — the consolidated result, per the gate rule in `docs/ARCHITECTURE.md` §4.
- `founder_decision`: one of `ship_it`, `fix_concerns_first`, `still_reviewing`.
- `founder_notes`: free-text, founder-authored context on the decision above; often empty (`""`).
- `next_stage`: the pipeline stage `state.json`'s `current_stage` should advance to once this checkpoint is acted on — pinned to the *same* stage (not advanced) whenever `bottom_line` is `"DO NOT SHIP"`, per `commands/adaptive/boardroom.md`'s consolidation step. `plugins/wingman/scripts/query-founder-knowledge.mjs`'s `summary()` (added 2026-07-21, see `docs/PROJECT.md`'s decisions log) reads this field back and compares it against `state.json`'s real `current_stage`, surfacing a `state_stage_mismatch` diagnostic when they disagree — the mechanical drift-detector for "a session wrote a checkpoint but forgot to update `state.json` afterward." Absent on checkpoints written before that field was added; treat its absence as "no mismatch check possible for this entry," never an error.

This is deliberately **not cryptographically signed** — see `docs/ARCHITECTURE.md` §4 for why: Wingman has one trust root (the founder), not multiple mutually-distrusting parties, so signing would add complexity without a real threat it defends against.

**Migration note — 7-stage pipeline (schema_version 2 → 3, 2026):** the pipeline expanded from 4 stages to 7 as part of MVP2 (see `docs/ARCHITECTURE.md` §4b/§10 v14), while *reducing* founder-visible checkpoints from 4 to 3 via bundling. Stage names changed:

| Old (`schema_version: 2`, scalar `stage`) | New (`schema_version: 3`) |
|---|---|
| `plan` | split into 5 stages (`discovery`, `define`, `architecture`, `uxflow`, `implementation-planning`), bundled into one checkpoint recorded only by `implementation-planning.md`, with `"bundle": "planning-milestone"` and `stage` as an array of all 5 |
| `build` | `build` (unchanged name; now also runs the folded-in Definition-of-Done gate — see below) |
| `secure` | retired as a stage — its threat-register discipline moved into `build`'s own Definition-of-Done gate; no `schema_version: 3` checkpoint will ever have `stage: "secure"` |
| `ship` | `ship` (unchanged) |

This is an **append-only audit log, never rewritten** — existing `schema_version: 2` (and earlier) entries keep their old scalar `stage` values and no `bundle` field, permanently; do not migrate or rewrite historical entries. Any consumer reading this file (e.g. `evolve-promotion`'s clustering logic) iterates `seats[]` generically and must not assume `stage` is always a scalar, so `schema_version: 1`, `2`, and `3` entries coexist safely in the same file.

**Migration note — reversible compression (schema_version 3 → 4, 2026):** `/wingman:boardroom` reviews always produced a full, unabridged verdict per seat before condensing it into the one-line `seats[].summary` this file stores — but until now, that full text was never persisted anywhere; once the session ended, only the one-liner survived (see `skills/output/plain-language-checkpoint`'s reversible-compression rule, added the same round). `schema_version: 4` closes that gap without changing the shape of anything already here:

| `schema_version: 3` (and earlier) | `schema_version: 4` |
|---|---|
| `seats[].summary` is the only surviving record of a seat's reasoning | `seats[].summary` unchanged, plus a companion file at `checkpoint-details/<checkpoint_id>.md` holds every seat's full `## <SEAT> VERDICT` text, unabridged |
| No way to recover a seat's full reasoning once the session ends | `/wingman:boardroom expand <checkpoint_id> [seat]` reads `details_ref` and reprints the original, unabridged |

No existing field changed meaning or shape — this is a purely additive field on new entries. This is an **append-only audit log, never rewritten** — existing `schema_version: 3` (and earlier) entries keep having no `details_ref` field, permanently; do not backfill companion files for historical entries. Any consumer reading this file (e.g. `evolve-promotion`'s clustering logic) iterates `seats[]` generically and never assumed a `details_ref` field existed, so `schema_version: 1` through `4` entries coexist safely in the same file.

**Migration note — 7-seat Boardroom rename (schema_version 1 → 2, 2026):** the Boardroom expanded from 5 seats to 7 as part of a deliberate rearchitecture (see `docs/ARCHITECTURE.md` §4/§5a). Seat names changed:

| Old (`schema_version: 1`, unmarked) | New (`schema_version: 2`+) |
|---|---|
| `founder` | split into `ceo` (vision/strategy/arbitration), `cpo` (user value/feature fit), `cmo` (go-to-market/positioning) |
| `engineer` | `cto` |
| `security` | `ciso` |
| `cost` | `cfo` |
| `design` | `design` (unchanged) |
| *(none)* | `research` (new — evidence grounding/competitive awareness; named "Research" not "CRO" to avoid colliding with the `founder-cro` skill, which means Chief *Revenue* Officer) |

This is an **append-only audit log, never rewritten** — existing entries keep their old seat names permanently; do not migrate or rewrite historical entries. Any consumer reading this file (e.g. `evolve-promotion`'s clustering logic) iterates `seats[]` generically without assuming a fixed count or fixed names, so `schema_version: 1` and later entries coexist safely in the same file.

### `state.json`

Small, overwritten in place (not append-only). Tracks what a fresh Claude Code session needs to pick up where the last one left off, what department leads (once they exist, per `docs/ARCHITECTURE.md` §5) are active for this project, what Management Board managers (per §5a, once the project crosses the 3+ department-lead complexity threshold) are active, and what specialists (per §6) have been promoted.

```json
{
  "current_stage": "build",
  "active_department_leads": [],
  "active_managers": [],
  "active_specialists": [],
  "last_checkpoint_id": "2026-07-07T14-32-00Z-plan",
  "updated_at": "2026-07-07T14-32-05Z"
}
```

`active_managers` is new alongside the Management Board addition — a `state.json` written before this change has no `active_managers` key; treat its absence as an empty array (`[]`), same forward-compatible handling as any other array field, rather than an error.

### `traceability.json`

Small, overwritten in place. Written by `skills/governance/traceability-linking`, which mints
`<!-- wingman:req ID -->`-style markers per pipeline stage — this file is the single source of
truth for the next available ID per prefix, so two sessions never mint the same ID for two
different things.

```json
{ "next_id": { "DISC": 1, "DEF": 1, "ARCH": 1, "UX": 1, "IP": 1 } }
```

Created on first use if it doesn't exist yet; a project that hasn't run any pipeline stage with
traceability markers has no `traceability.json` at all — that's expected, not an error.

### `memory/`

Three separate Markdown files (not JSON/JSONL, unlike everything else under `.wingman/`), written
and read by `skills/knowledge/memory` per the founder's own explicit "remember"/"note that" instructions or
when a session is about to lose important context:

- `MEMORY.md` — evergreen facts (project name, stack, constraints, preferences).
- `decisions.md` — a dated decision log (what was decided, why, by whom).
- `tried.md` — approaches already attempted and their outcome, so they aren't retried blind.

Unlike `checkpoints.jsonl` (whose inline record is a one-line seat summary — full seat rationale is
recoverable, but only via the `details_ref` companion file and only for Boardroom checkpoints
specifically, see `schema_version: 4` above) and `state.json` (current-stage pointers only), this
is the one place a project's own decision *rationale* — Boardroom-driven or not — is meant to live
directly in prose, inline, without an extra retrieval step — though as of `evals/cases/memory.md`'s Run 1, this remains
`provisional`: no run yet demonstrates a later session actually reading this store back and
changing its behavior as a result, only that the write path works. Treat it as write-verified,
not yet read-loop-verified.

**No single file or view here unifies `checkpoints.jsonl`, `state.json`, `traceability.json`, and
`memory/*.md` into one "what has this project decided and why" surface** — reconstructing that
today means reading all four separately, in three different formats. This is a known, named gap
(`docs/wingman/architecture-audit-2026-07-15.md`'s central finding), not an oversight to silently
work around; any future unification work should be evidence-gated (a real dogfooding prototype),
not spun up speculatively.

## Who writes/reads this

Any Wingman command can read or write these files directly with the `Read`/`Write`/`Bash` tools it already has — no special access layer is required. `/wingman:boardroom` appends to `checkpoints.jsonl` and updates `state.json` after every run; `/wingman:discovery`'s session-start step reads the latest entries to recover context after a compaction or a new session, the same way `LEARNINGS.md` is read (see `commands/adaptive/learn.md`).

## Why no server yet

`docs/ARCHITECTURE.md` §2 and this project's own `engineering-minimalism` skill both say the same thing: don't build infrastructure a simpler mechanism already covers. Every command that needs this state already has `Read`/`Write`/`Bash` — a plain JSONL file satisfies "queryable, persistent, cross-session state" without a server, a protocol handshake, or a dependency Claude Code doesn't already guarantee.

## Planned: an MCP server, once there's real evidence it's needed

If department leads (v2) end up needing structured cross-session coordination that's genuinely awkward via `grep`/`Read` on flat files — for example, several department leads needing to query "what's the current state" concurrently with validation logic beyond what a shell one-liner can express cleanly — a small local MCP server (stdio transport, Node.js, no external dependencies, following `gsd-plugin`'s proven pattern researched in `docs/ARCHITECTURE.md` §9) would expose:

**Resources (read-only):**
- `wingman://checkpoints` — the full `checkpoints.jsonl` history, or a filtered slice
- `wingman://state` — the current `state.json`

**Tools (mutations):**
- `wingman_record_checkpoint` — append a validated checkpoint entry (schema-checked, rejecting malformed `verdict`/`bottom_line` values that a hand-written `Write` call could silently get wrong)
- `wingman_update_state` — update `state.json` fields

This is intentionally not built yet. Building it now, before any project has generated the friction that would justify it, is exactly the speculative-infrastructure pattern `engineering-minimalism` and `docs/ARCHITECTURE.md`'s lazy-growth philosophy both argue against. Track the decision to build it (or not) in `docs/PROJECT.md`'s decisions log when it actually comes up.
