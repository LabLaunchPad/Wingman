# Wingman — State Store Specification

Wingman has no database in the traditional sense, and per `docs/SRS.md` NFR-1/NFR-2, it never will in the sense of a hosted service the founder has to run. This document specifies the flat-file state store that exists today, and the optional MCP server interface over it that's planned but not yet justified — see "Why no server yet" below.

## What actually exists (v1, flat files)

All Wingman state lives under `.wingman/` at the root of the founder's project (git-committed, human-readable, no binary formats):

```
.wingman/
├── checkpoints.jsonl   # append-only log of every Boardroom checkpoint
└── state.json          # current project-level state (small, overwritten in place)
```

### `checkpoints.jsonl`

One JSON object per line, appended by `/wingman:boardroom` every time it runs (never rewritten or reordered — this is an audit log, not a mutable table).

```json
{
  "schema_version": 2,
  "checkpoint_id": "2026-07-07T14-32-00Z-plan",
  "stage": "plan",
  "scope_ref": "docs/wingman/plans/2026-07-07-billing-integration.md",
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
  "next_stage": "build"
}
```

**Field notes:**
- `schema_version`: `2` for the 7-seat Boardroom schema (this document); absent/unmarked entries written before this change are implicitly `schema_version: 1` (the 5-seat schema) — see the migration note below.
- `checkpoint_id`: `<ISO-8601-timestamp-with-dashes>-<stage>`, unique per line.
- `stage`: one of `plan`, `build`, `secure`, `ship`, or a free-text label for an ad-hoc `/wingman:boardroom` invocation.
- `scope_ref`: path to the plan file reviewed, or `"diff"` if the scope was a git diff rather than a plan file.
- `seats[].seat`: one of `ceo`, `cpo`, `cmo`, `cto`, `ciso`, `cfo`, `research`, `design` (the `design` entry is omitted when Design was N/A for the checkpoint) — see migration note below for the pre-rename names.
- `seats[].verdict`: one of `GO`, `GO_WITH_CONCERNS`, `NO_GO` — matches each Boardroom agent's own output contract.
- `bottom_line`: one of `GO`, `GO_WITH_CHANGES`, `DO NOT SHIP` — the consolidated result, per the gate rule in `docs/ARCHITECTURE.md` §4.
- `founder_decision`: one of `ship_it`, `fix_concerns_first`, `still_reviewing`.

This is deliberately **not cryptographically signed** — see `docs/ARCHITECTURE.md` §4 for why: Wingman has one trust root (the founder), not multiple mutually-distrusting parties, so signing would add complexity without a real threat it defends against.

**Migration note — 7-seat Boardroom rename (schema_version 1 → 2, 2026):** the Boardroom expanded from 5 seats to 7 as part of a deliberate rearchitecture (see `docs/ARCHITECTURE.md` §4/§4a). Seat names changed:

| Old (`schema_version: 1`, unmarked) | New (`schema_version: 2`) |
|---|---|
| `founder` | split into `ceo` (vision/strategy/arbitration), `cpo` (user value/feature fit), `cmo` (go-to-market/positioning) |
| `engineer` | `cto` |
| `security` | `ciso` |
| `cost` | `cfo` |
| `design` | `design` (unchanged) |
| *(none)* | `research` (new — evidence grounding/competitive awareness; named "Research" not "CRO" to avoid colliding with the `founder-cro` skill, which means Chief *Revenue* Officer) |

This is an **append-only audit log, never rewritten** — existing entries keep their old seat names permanently; do not migrate or rewrite historical entries. Any consumer reading this file (e.g. `evolve-promotion`'s clustering logic) iterates `seats[]` generically without assuming a fixed count or fixed names, so `schema_version: 1` and `schema_version: 2` entries coexist safely in the same file.

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

## Who writes/reads this

Any Wingman command can read or write these files directly with the `Read`/`Write`/`Bash` tools it already has — no special access layer is required. `/wingman:boardroom` appends to `checkpoints.jsonl` and updates `state.json` after every run; `/wingman:plan`'s session-start step reads the latest entries to recover context after a compaction or a new session, the same way `LEARNINGS.md` is read (see `commands/learn.md`).

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
