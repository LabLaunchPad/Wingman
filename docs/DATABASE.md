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
  "checkpoint_id": "2026-07-07T14-32-00Z-plan",
  "stage": "plan",
  "scope_ref": "docs/wingman/plans/2026-07-07-billing-integration.md",
  "seats": [
    { "seat": "founder",  "verdict": "GO",              "summary": "Solves the stated problem, scope is right-sized." },
    { "seat": "engineer", "verdict": "GO_WITH_CONCERNS", "summary": "No test plan for the webhook retry path yet." },
    { "seat": "security", "verdict": "GO",              "summary": "No new data exposure identified." },
    { "seat": "design",   "verdict": "GO",              "summary": "N/A — no user-facing surface in this stage." },
    { "seat": "cost",     "verdict": "GO",              "summary": "No new paid services introduced." }
  ],
  "bottom_line": "GO_WITH_CHANGES",
  "founder_decision": "fix_concerns_first",
  "founder_notes": "",
  "next_stage": "build"
}
```

**Field notes:**
- `checkpoint_id`: `<ISO-8601-timestamp-with-dashes>-<stage>`, unique per line.
- `stage`: one of `plan`, `build`, `secure`, `ship`, or a free-text label for an ad-hoc `/wingman:boardroom` invocation.
- `scope_ref`: path to the plan file reviewed, or `"diff"` if the scope was a git diff rather than a plan file.
- `seats[].verdict`: one of `GO`, `GO_WITH_CONCERNS`, `NO_GO` — matches each Boardroom agent's own output contract.
- `bottom_line`: one of `GO`, `GO_WITH_CHANGES`, `DO NOT SHIP` — the consolidated result, per the gate rule in `docs/ARCHITECTURE.md` §4.
- `founder_decision`: one of `ship_it`, `fix_concerns_first`, `still_reviewing`.

This is deliberately **not cryptographically signed** — see `docs/ARCHITECTURE.md` §4 for why: Wingman has one trust root (the founder), not multiple mutually-distrusting parties, so signing would add complexity without a real threat it defends against.

### `state.json`

Small, overwritten in place (not append-only). Tracks what a fresh Claude Code session needs to pick up where the last one left off, and what department leads (once they exist, per `docs/ARCHITECTURE.md` §5) are active for this project.

```json
{
  "current_stage": "build",
  "active_department_leads": [],
  "last_checkpoint_id": "2026-07-07T14-32-00Z-plan",
  "updated_at": "2026-07-07T14-32-05Z"
}
```

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
