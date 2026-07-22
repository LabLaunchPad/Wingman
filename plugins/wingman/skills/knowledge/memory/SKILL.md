---
name: memory
description: Use when the founder's instruction implies remembering, recalling, or carrying context forward across sessions (decisions, preferences, "what we already tried"), or when a session should persist a durable fact for later.
---

# Memory

Gives Wingman durable, cross-session memory for a founder's project without
relying on the model's implicit context window. Wingman reads and writes a small
structured store so future sessions start where the last one ended.

## When to use
- The founder says "remember", "note that", "don't forget", "we decided".
- You are about to lose important context at the end of a session.
- A later session needs a decision, preference, or prior attempt.

## Store layout
- `.wingman/memory/MEMORY.md` — evergreen facts: project name, stack, constraints, preferences.
- `.wingman/memory/decisions.md` — dated decision log (what was decided, why, by whom).
- `.wingman/memory/tried.md` — approaches already attempted and their outcome (avoid repeats).

## Operating rules
1. Read the store at the start of any task that touches prior context.
2. Write only verified, non-secret facts. Never store API keys, tokens, or credentials.
3. Keep entries one or two lines; date decisions.
4. On SessionStart, surface a one-line recall of the most relevant memory.

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

See `docs/ARCHITECTURE.md` for this skill's place in Wingman's overall architecture.

## References

- `references/org-template/founder-preferences.md` — what's worth learning about a founder's
  working/approval style and where it lands in `MEMORY.md`; guidance, not a second store.
- `references/org-template/capability-map.md` — what's worth noticing about a founder's own
  technical background, for the same reason.
