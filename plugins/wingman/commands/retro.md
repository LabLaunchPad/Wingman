---
description: Run a plain-language retrospective on the work just shipped — what went well, what didn't, and what to change next time.
argument-hint: "[optional: what to retro on, defaults to the most recent shipped work]"
---

# Wingman: Retro

A short look back, written for the founder, not a process ritual. Skip this for trivial changes — use it after a meaningful feature, a rough patch (multiple failed attempts, a bug that took a while to track down), or when the founder asks "how did that go?"

$ARGUMENTS

## Gather the facts first

Before writing anything, look at real evidence from this work: commit history, the plan file and how much it changed during execution, any boardroom checkpoints that came back `GO_WITH_CONCERNS` or `NO_GO`, and anything logged via `/wingman:learn` during the work.

## Write the retro

```markdown
## Retro: <what was built>

**What went well:** <1-3 concrete things, plain language>
**What was harder than expected:** <1-3 concrete things, plain language, with the real reason if known>
**What we'd do differently next time:** <concrete, actionable — not "be more careful">
**Anything for you to know:** <only if there's a genuine business-relevant takeaway — a cost, a timeline lesson, a decision that needs revisiting>
```

Keep it short. A retro that takes longer to read than the feature took to explain has failed its own purpose.

## Feed it forward

If the retro surfaces a durable lesson (not a one-off), run `/wingman:learn` to capture it so it isn't relearned on the next project. If it surfaces a repeated pattern across several retros, consider `/wingman:evolve`.
