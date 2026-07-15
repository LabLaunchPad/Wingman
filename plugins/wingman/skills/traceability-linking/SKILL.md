---
name: traceability-linking
description: Use when minting or referencing a requirement ID during /wingman:define, /wingman:architecture, /wingman:uxflow, /wingman:implementation-planning, or /wingman:build — teaches the wingman:req marker convention that lets every task, commit, and source-code change trace back to the requirement it satisfies.
---

# Traceability Linking

## Overview

Wingman's 7-stage pipeline produces a chain of artifacts — a requirement, a design decision, a UX state, a plan task, a code change — that all need to trace back to each other so a founder (or the `dod-structural-gate.mjs` hook) can answer "why does this code exist" without re-deriving it. This skill is the shared marker convention every stage after Discovery uses to mint and reference IDs.

**Core principle:** every downstream artifact names the ID(s) it satisfies; nothing gets built, designed, or coded "just because" with no traceable origin.

## When To Use

Whenever `/wingman:define`, `/wingman:architecture`, `/wingman:uxflow`, or `/wingman:implementation-planning` mints a new requirement/decision/flow/task ID, or whenever `/wingman:build` writes a task's corresponding source-code change.

## Core Workflow

**1. Mint an ID only at the stage that owns its namespace prefix:**

| Prefix | Minted by | What it identifies |
|---|---|---|
| `DEF-` | `/wingman:define` | A requirement |
| `ARCH-` | `/wingman:architecture` | A technical design decision |
| `UX-` | `/wingman:uxflow` | A user-facing screen/state |
| `IP-` | `/wingman:implementation-planning` | A plan task |

**2. Track the next available number per prefix in `.wingman/traceability.json`** (create it if it doesn't exist: `{"next_id": {"DISC": 1, "DEF": 1, "ARCH": 1, "UX": 1, "IP": 1}}`) — read it, use the current value, increment, write it back. This is what prevents two sessions from minting the same ID for two different things.

**3. Every downstream reference uses the marker `<!-- wingman:req <ID> -->`** — an HTML comment in Markdown (requirement tables, plan files), or the equivalent comment-token variant in source code (`// wingman:req DEF-001` for JS/TS, `# wingman:req DEF-001` for Python, etc.). A task or code change may reference more than one ID if it genuinely satisfies more than one requirement — do not merge two distinct requirements into a single ID to save a marker.

**4. Never invent an ID reference to something that doesn't exist.** A marker referencing `DEF-004` when only `DEF-001`–`DEF-003` exist is a broken link, not a shortcut — `scripts/check-traceability.mjs` treats this as an error, not a warning.

**5. Verify with `${CLAUDE_PLUGIN_ROOT}/scripts/check-traceability.mjs` before treating a stage as done** — it confirms every requirement has at least one downstream marker and every marker resolves to a real ID (see script for full behavior).

## Constraints

**MUST:**
- Mint new IDs only from the stage that owns the prefix.
- Give every plan task and code change at least one `wingman:req` marker, or an explicit `<!-- wingman:no-test-needed: <reason> -->`-style logged exception where a marker genuinely doesn't apply.
- Keep `.wingman/traceability.json` as the single source of truth for the next available ID per prefix.

**MUST NOT:**
- Reuse an ID for two unrelated requirements/decisions.
- Reference an ID that was never minted.
- Silently skip a marker because "the connection is obvious" — obviousness to the person writing the code isn't traceability for anyone reading it later.

## Rationalizations

| Excuse | Reality |
|---|---|
| "The code obviously matches the plan, no marker needed" | Obvious to the author now is not traceable to anyone else later — including the founder, a future session, or `dod-structural-gate.mjs`, none of which can infer intent from code alone. |
| "This task touches two requirements, I'll just pick the main one" | Mark both. A single marker undercounts what a piece of work actually covers and breaks the reverse lookup ("what code satisfies DEF-002") for whichever ID got dropped. |
| "I'll add the marker later, once the code settles" | "Later" is how markers get forgotten entirely — mint and mark in the same pass the ID gets used. |

## Red Flags — Stop and Reconsider

- A build task with zero `wingman:req` markers anywhere in its scope, and no logged no-marker-needed exception.
- A marker referencing an ID that doesn't appear in any earlier stage's requirement/decision/flow table.
- Two different requirements sharing the same minted ID.

## Verification

Run `${CLAUDE_PLUGIN_ROOT}/scripts/check-traceability.mjs` — it must report zero orphaned markers (references to IDs that don't exist) and zero unlinked requirements (a `DEF-*`/`ARCH-*`/`UX-*` ID with no downstream marker anywhere).

**Expected, non-blocking exception**: `IP-*` (Implementation Planning) IDs — and any ID whose only
downstream coverage is several hops away rather than a direct marker — will routinely show as
"unlinked," because nothing is ever expected to reference the terminal stage's own ID, and the
checker isn't transitive (a `DEF-*` covered only via an intermediate `ARCH-*` marker several links
downstream still shows unlinked unless something also references it directly). This is a real,
known design limitation of the current checker, not a sign the pipeline actually has an orphaned
requirement — don't chase it as if it were a genuine gap. Found and logged during this project's
own first real dogfooding pass (see `docs/wingman/retros.md`, 2026-07-14); documented here rather
than fixed, since it's a warning, not a blocking error, and making the checker transitive is a
real but separate future improvement, not something to speculatively build now.

## Output

No founder-facing template — this is an internal linking convention. The founder never needs to see raw IDs; they surface only if `dod-structural-gate.mjs` denies a checkpoint and needs to name the specific missing link.

## Anti-Rationalization Defense

### Common Rationalizations

| Excuse | Reality |
|---|---|
| "The code obviously matches the plan, no marker needed" | Obviousness isn't traceability — see Rationalizations above. |
| "I'll batch all the markers in at the end" | The same "do it later" failure mode `verification-before-completion` already warns against — a marker added after the fact is easy to get subtly wrong (wrong ID, wrong file) versus one added in the same pass as the change it describes. |

### Red Flags

- A build task with zero markers and no logged exception.
- A marker pointing at a nonexistent ID.
- Two distinct requirements sharing one ID.
