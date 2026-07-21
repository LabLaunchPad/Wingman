---
name: doc-index
description: Use when adding, promoting, or auditing Wingman documentation or reference material — keep a discoverable documentation index so every doc/reference is cross-linked from an owning command/skill/agent and nothing becomes an orphaned "dead doc." Adapted from wshobson/agents' doc-index discipline.
---

<!--
Discipline adapted from `wshobson/agents` (MIT, Seth Hobson) — its "doc-index
discipline" (maintain a discoverable index of artifacts so they stay findable
and don't rot). Restated in Wingman's own words; the concrete trigger for this
skill is the v10 finding that all 9 `references/*.md` files were uncited by any
command/skill/agent until they were deliberately wired in. Attribution in
/ATTRIBUTIONS.md.
-->

# Doc-Index

## Overview

A reference doc that nothing cites is a dead doc — it exists, it's correct, and nobody ever reads it. The doc-index discipline keeps Wingman's documentation *discoverable*: every doc or reference has an owning command/skill/agent that cites it, and the set of docs is small enough to hold in one index. This is governance, not housekeeping — an un-wired checklist is the same as no checklist.

## When To Use

- When you create or promote a `references/*.md` (or any doc).
- When you add a skill, command, or agent that *should* consult an existing reference.
- During `/wingman:evolve` or a harness/audit pass, as a documentation-health check.

## Core Workflow

1. **Own it.** Every new or promoted reference gets exactly one owner among the existing commands/skills/agents (the one whose job it serves) that cites it by path (e.g. `references/threat-register.md`).
2. **Cross-link.** The owner references the doc in a `## References` section (the convention established in v10), with a one-line note on *when* to consult it — not just a bare filename.
3. **Index it.** Keep the doc set enumerable: the canonical inventory is `references/` itself plus the docs in `docs/` (`ARCHITECTURE.md`, `AGENT-ROSTER.md`, `DATABASE.md`). If a reader would need to "know it exists," it belongs in the index or doesn't belong.
4. **Audit for orphans.** Grep the plugin tree for each `references/*.md` basename/key term. Any file with zero citations is a dead doc — either wire it in or delete it. (This is the exact check that, in v10, found all 9 references uncited.)
5. **Attribute it.** Any doc derived from a vendor pattern gets a matching entry in `/ATTRIBUTIONS.md`.

## Rationalizations

| Excuse | Reality |
|---|---|
| "The doc is obvious, people will find it" | Obvious-to-you isn't obvious-to-the-next-runner. Uncited = unread = doesn't exist in practice. |
| "I'll link it later" | Later never comes; the v10 audit proved every reference shipped unlinked. Wire it now. |
| "It's just a reference, low stakes" | A reference that isn't consulted is the same as no reference — the discipline it encodes is lost. |
| "Deleting a dead doc loses information" | Move the durable part into the owning skill/command, or keep it only if something cites it. |

## Red Flags — Stop and Reconsider

- A `references/*.md` with zero citations anywhere in `skills/`, `commands/`, `agents/`.
- A new skill/command that should consult an existing reference but doesn't cite it.
- Documentation described in prose but not actually present or linked.
- An attribution claim with no matching `/ATTRIBUTIONS.md` entry.

## Verification

The discipline is itself verifiable: `grep` each `references/*.md` for citations and confirm a non-zero count; confirm every promoted/derived doc has an `/ATTRIBUTIONS.md` entry. See `verification-before-completion` — evidence (a citation that exists), not the claim that one "should" be there.

## Referenced by

- `commands/adaptive/evolve.md`

See `docs/ARCHITECTURE.md` for this skill's place in Wingman's overall architecture.
