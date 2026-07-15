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

Append to `docs/wingman/retros.md` at the project root (create it with a one-line header if it doesn't exist yet — same append-only convention as `LEARNINGS.md`). Retros scattered across individual plan files can't be reliably found later, including by `/wingman:evolve`'s clustering step, so this is the one canonical location:

```markdown
<!-- wingman:log type=retro category=<short free-text tag matching what this retro is mainly about> status=resolved -->
## Retro: <what was built> — <YYYY-MM-DD>

**What went well:** <1-3 concrete things, plain language>
**What was harder than expected:** <1-3 concrete things, plain language, with the real reason if known>
**What we'd do differently next time:** <concrete, actionable — not "be more careful">
**Anything for you to know:** <only if there's a genuine business-relevant takeaway — a cost, a timeline lesson, a decision that needs revisiting>
```

The marker line is a plain HTML comment (invisible when rendered) that lets `/wingman:evolve`'s
clustering step count genuine repeated `category` occurrences exactly rather than only ever
reading free text — same convention `/wingman:learn` now uses. Pick whatever tag genuinely fits;
it's an open vocabulary, not a fixed list.

Keep it short. A retro that takes longer to read than the feature took to explain has failed its own purpose.

## Feed it forward

If the retro surfaces a durable lesson (not a one-off), run `/wingman:learn` to capture it so it isn't relearned on the next project. If it surfaces a repeated pattern across several retros, consider `/wingman:evolve`.
