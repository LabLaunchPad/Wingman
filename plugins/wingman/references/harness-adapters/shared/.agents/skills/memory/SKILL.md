---
name: memory
description: Use when the founder's instruction implies remembering, recalling, or carrying context forward across sessions (decisions, preferences, "what we already tried"), or when a session should persist a durable fact for later.
---

# Memory

Gives Wingman durable, cross-session memory for a founder's project without
relying on the model's implicit context window. Wingman reads and writes a small
structured store so future sessions start where the last one ended.

## Inputs

The fact, decision, or prior-attempt outcome about to be lost at session end, or a task that touches context a prior session already established.

## Output

An appended/updated entry in the relevant store file (`MEMORY.md`/`decisions.md`/`tried.md`) — one or two lines, dated where relevant, never a secret.

## Escalation

Anything that looks like a secret (key, token, password) — stop and refuse to store it, per the Red Flags below; there's no founder approval path for this, it's a hard block.

## When to use
- The founder says "remember", "note that", "don't forget", "we decided".
- You are about to lose important context at the end of a session.
- A later session needs a decision, preference, or prior attempt.

## Store layout

The default, and by far the most common, case is the **Project tier**:
- `.wingman/memory/MEMORY.md` — evergreen facts: project name, stack, constraints, preferences.
- `.wingman/memory/decisions.md` — dated decision log (what was decided, why, by whom).
- `.wingman/memory/tried.md` — approaches already attempted and their outcome (avoid repeats).

**Seven tiers exist** (`scripts/memory-tiers.mjs`), each holding the same 3 files, for the rare
case where a fact genuinely belongs at a narrower or wider scope than the whole project:

| Tier | Lives at | Scope |
|---|---|---|
| Global | `~/.wingman/global/` (outside any repo) | Facts true across every project this founder works on |
| Org | `~/.wingman/org/<org-slug>/` (outside any repo) | Facts shared across a company's multiple projects |
| Product | `.wingman/memory/` — **same store as Project** | See note below |
| Project | `.wingman/memory/` | The default — almost everything belongs here |
| Feature | `.wingman/memory/feature/<slug>/` | A fact scoped to one feature, not the whole project |
| Task | `.wingman/memory/task/<id>/` | A fact scoped to one in-flight task |
| User | `.wingman/memory/user/<id>/` | A fact about one specific user of a multi-user project |

**Product and Project are the same store, deliberately.** Wingman has no multi-product-per-project
concept anywhere in its real architecture — a solo founder's project *is* the product. Two
identically-scoped tiers would be inventing structure with no consumer, which
`references/constitution.md` rule 3 forbids; documenting the collapse here is more honest than
pretending they differ.

**Default to Project. Only reach for a narrower or wider tier when the fact genuinely doesn't
belong at project scope** — most facts do. Global/Org in particular are a rare case: a preference
truly true across every project ("this founder always wants pnpm"), not a convenient place to
avoid re-stating something project-specific.

## Operating rules
1. Read the store at the start of any task that touches prior context — `skills/context-assembly`
   does this via `query-founder-knowledge.mjs`'s `unify()` (project tier) or `unifyTiers()` (all
   applicable tiers) rather than reading files directly.
2. Write only verified, non-secret facts. Never store API keys, tokens, or credentials —
   `scripts/memory-tiers.mjs`'s `writeTierEntry()` enforces this mechanically at every tier,
   reusing `hooks/secret-guard.mjs`'s exact secret patterns rather than a separate copy.
3. Keep entries one or two lines; date decisions.
4. On SessionStart, surface a one-line recall of the most relevant memory —
   `hooks/session-start.mjs` does this mechanically today for the Project tier.
5. **Promotion between tiers is never automatic.** Lifting a project fact to Global/Org requires
   an explicit `AskUserQuestion` approval from the founder first — `writeTierEntry()` mechanically
   throws on a Global/Org write with no `{ approved: true }` flag, so this can't be skipped by
   accident. Never write to a narrower tier from a founder confirmation intended for a wider one,
   or vice versa.
6. **A fact that contradicts an entry from a different tier is surfaced, never silently
   resolved.** `readAllTiers()`/`unifyTiers()` return every applicable tier's entries, narrowest
   first, without merging or discarding — if a Project-tier fact conflicts with a Global-tier one,
   both are visible and the reading session must notice and flag it to the founder, not silently
   prefer one.

## Rationalizations
- "The model will just remember it." — No; context dies at session end. Write it.
- "It's too small to bother storing." — Small facts are exactly what get re-asked.
- "I'll add it later." — Later never comes; store at the moment of decision.

## Red Flags
- Storing anything that looks like a secret (key, token, password) — stop and refuse.
- Writing opinions as facts — label speculation explicitly.
- Duplicate or contradictory entries — consolidate, don't append. When an evergreen fact in
  `MEMORY.md` is overwritten because reality changed (not because it was wrong), add a one-line
  entry to `decisions.md` naming what changed and why. `MEMORY.md` only ever holds the current
  state on purpose — without this, the fact that something *used to be* true (and when it stopped
  being true) is silently lost, and a later session has no way to tell "we never used Postgres"
  apart from "we used Postgres until the March migration."

## Verification
After any write, re-read the relevant file and confirm the new entry is present,
correctly dated, and contains no secret material. Before relying on a recalled
fact, confirm it matches the current session's reality.

See `docs/status/ARCHITECTURE.md` for this skill's place in Wingman's overall architecture.

## References

- `references/org-template/founder-preferences.md` — what's worth learning about a founder's
  working/approval style and where it lands in `MEMORY.md`; guidance, not a second store.
- `references/org-template/capability-map.md` — what's worth noticing about a founder's own
  technical background, for the same reason.


---

## Harness note: OpenCode (auto-generated by `generate-harness-adapters.mjs` -- do not hand-edit)

This file is a generated copy of the canonical Claude Code source. It references the following Claude-Code-specific mechanism(s); here is the real OpenCode equivalent:

- **AskUserQuestion**: OpenCode has no structured multi-choice question UI reachable in non-interactive mode (`permission.ask` confirmed to hang indefinitely in `opencode run`/`opencode serve`). Ask the same question as plain conversational text, listing the options in prose, and take the reply as free-form text.


---

## Harness note: Codex CLI (auto-generated by `generate-harness-adapters.mjs` -- do not hand-edit)

This file is a generated copy of the canonical Claude Code source. It references the following Claude-Code-specific mechanism(s); here is the real Codex CLI equivalent:

- **AskUserQuestion**: Codex CLI has no structured multi-choice question UI. Ask the same question as plain conversational text, listing the options in prose, and take the reply as free-form text.


---

## Harness note: Cline (auto-generated by `generate-harness-adapters.mjs` -- do not hand-edit)

This file is a generated copy of the canonical Claude Code source. It references the following Claude-Code-specific mechanism(s); here is the real Cline equivalent:

- **AskUserQuestion**: Cline has a real question tool, `ask_followup_question` (single-select, not Claude Code's up-to-4-option multi-select) -- use it in place of `AskUserQuestion`, adapting a multi-option ask into Cline's single-select shape (e.g. present options as a numbered list, or ask one option at a time).


---

## Harness note: Cursor (auto-generated by `generate-harness-adapters.mjs` -- do not hand-edit)

This file is a generated copy of the canonical Claude Code source. It references the following Claude-Code-specific mechanism(s); here is the real Cursor equivalent:

- **AskUserQuestion**: Cursor has no structured multi-choice question UI (forum feature requests only, not shipped). Ask the same question as plain conversational text, listing the options in prose, and take the reply as free-form text.


---

## Harness note: Gemini CLI (auto-generated by `generate-harness-adapters.mjs` -- do not hand-edit)

This file is a generated copy of the canonical Claude Code source. It references the following Claude-Code-specific mechanism(s); here is the real Gemini CLI equivalent:

- **AskUserQuestion**: Gemini CLI has a real, confirmed structured question tool: `ask_user` (1-4 choices, blocking). Use it directly in place of `AskUserQuestion` -- this is the closest match to Claude Code's own tool found in any evaluated harness, not a prose fallback.


---

## Harness note: OpenHands (auto-generated by `generate-harness-adapters.mjs` -- do not hand-edit)

This file is a generated copy of the canonical Claude Code source. It references the following Claude-Code-specific mechanism(s); here is the real OpenHands equivalent:

- **AskUserQuestion**: OpenHands has no confirmed structured multi-choice question UI. Ask the same question as plain conversational text, listing the options in prose, and take the reply as free-form text.
