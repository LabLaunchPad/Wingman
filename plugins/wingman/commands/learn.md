---
description: Capture a durable lesson, decision, or gotcha discovered during this work so future Wingman sessions don't rediscover it the hard way.
argument-hint: "<what was learned, in your own words>"
---

# Wingman: Learn

A tiny, low-ceremony memory system: one file, plain language, append-only. This is not a database or a service — it's a `LEARNINGS.md` at the project root that every future Wingman session reads at the start of `/wingman:discovery`.

$ARGUMENTS

## What belongs here

Only durable, reusable facts — things that would save real time if known upfront next time:

- A decision made and why (so it isn't silently re-litigated later).
- A gotcha or non-obvious constraint about this codebase, this founder's business, or a third-party service it depends on.
- A pattern that worked well and should be repeated, or one that didn't and should be avoided.

Do **not** log routine facts, one-time transient errors, or anything already obvious from reading the code.

## How to log it

1. If `LEARNINGS.md` doesn't exist at the project root, create it with a one-line header explaining its purpose.
2. Append a new entry:

```markdown
### <YYYY-MM-DD> — <short title>
<1-3 sentences: what was learned, in plain language, and why it matters>
```

3. Keep entries short and skimmable. If `LEARNINGS.md` grows past ~30 entries, suggest pruning stale or superseded ones during the next `/wingman:evolve` pass rather than letting it grow forever.

## Confirm

Tell the founder in one sentence what was captured and where, so they know it's not lost.
