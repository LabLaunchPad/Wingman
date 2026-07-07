---
description: Run the AI Boardroom checkpoint on the current plan or diff and produce one plain-language go/no-go summary for a non-technical founder.
argument-hint: "[plan|diff] [optional focus notes]"
---

# Boardroom Checkpoint

This is Wingman's replacement for code review: instead of asking a non-technical founder to read a diff, four specialist reviewers each examine the current plan (if in plan mode, or a plan file was just written) or the current diff (if code has already changed), and their verdicts are consolidated into ONE short, plain-language summary the founder can act on.

$ARGUMENTS

## What to review

Figure out what's in scope, in this order of preference:
1. If a plan file exists (e.g. from `ExitPlanMode` or a `docs/**/plans/*.md` file just written), review that plan.
2. Otherwise, if there are uncommitted changes, review `git diff` (and `git diff --staged`).
3. Otherwise, ask the user what they want reviewed.

## Run the boardroom

Dispatch all four boardroom seats **in parallel** (single message, multiple Task/Agent calls) against the same scope, each as its own subagent so their reviews don't bias each other:

- `boardroom-founder` — business/product/scope lens
- `boardroom-engineer` — correctness/architecture/test lens
- `boardroom-security` — risk/data-safety lens
- `boardroom-design` — usability/consistency lens

Each seat returns its own `## <SEAT> VERDICT` block as specified in its agent definition. Wait for all four before continuing.

## Consolidate into one founder-facing summary

Do not just concatenate the four reports — a founder should never have to read four separate verdicts to figure out what to do. Synthesize them into this exact structure:

```
# Boardroom Checkpoint: <one-line description of what was reviewed>

## Bottom line: <GO | GO WITH CHANGES | DO NOT SHIP>

<2-4 plain-English sentences: what this does, whether it's safe and worth shipping, and why. No jargon. If you must use a technical word, define it in the same sentence.>

## What each seat said
- 💼 Business: <one-line plain summary of the founder-seat verdict>
- 🛠️ Engineering: <one-line plain summary>
- 🔒 Security: <one-line plain summary>
- 🎨 Design: <one-line plain summary>

## If you want to ship this
<Either "Nothing else needed — approve below to continue." OR a short numbered list of the specific things that need fixing first, in plain language, ordered by how much they matter.>
```

**Bottom line rule:** if ANY seat returned `NO_GO`, the bottom line is `DO NOT SHIP` regardless of the others. If any seat returned `GO_WITH_CONCERNS` and none returned `NO_GO`, the bottom line is `GO WITH CHANGES`. Only an all-`GO` result is a clean `GO`.

## Ask for the decision

After presenting the summary, use `AskUserQuestion` to get an explicit decision — do not assume silence means approval:

- "Ship it" — proceed with the next pipeline stage (e.g. from `/wingman:build` continue to `/wingman:secure`, from `/wingman:ship` actually ship).
- "Fix the concerns first" — go address the listed items, then re-run `/wingman:boardroom` before proceeding.
- "Let me see the details" — show the full, unabridged output from each seat (this is the only path where the founder sees raw technical detail, and only if they ask for it).

Record the decision so the calling stage command (`plan`/`build`/`secure`/`ship`) knows whether it's clear to continue.
