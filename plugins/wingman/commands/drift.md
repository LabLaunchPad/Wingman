---
description: A founder asks for something new mid-build, or real evidence (a bug report, user feedback) surfaces after a plan was already approved. Routes the new scope back through a real Boardroom checkpoint before any code for it gets written — never silently absorbed into the current work.
argument-hint: "<the new ask, bug report, or feedback, in your own words>"
---

# Wingman: Drift

Plans get approved, then reality changes them — a founder thinks of one more thing, or a real user hits something the plan never covered. This command is the difference between that new scope quietly becoming part of whatever's already being built (no review, no record) and it getting the same real go/no-go every other change gets.

$ARGUMENTS

## Step 1: Detect

Find the current plan file (the same one `/wingman:boardroom` would resolve to — see its "What to review" step) and read its stated scope. Compare it, in plain language, against what's being asked or reported now — this is a direct judgment call, not a classifier or a heuristic script; the cheapest thing that actually works, per `engineering-minimalism`.

**If it's already covered by the approved plan**, say so in one or two plain sentences and stop here. Do not write an amendment, do not trigger a re-review — that would be wasted ceremony for something the founder already signed off on.

**If it's genuinely new or changed scope**, continue to Step 2.

## Step 2: Route through a real checkpoint — with a gate that holds in every session type

Hand off to `plan.md`'s amendment mode (see `plan.md`'s "Amendment mode" section) to record the delta against the existing plan file. Then get a real checkpoint on it before any code for the drifted scope gets written — the mechanism differs by session type, but the guarantee is identical: **nothing proceeds on undecided scope, in either case.**

Determine session type the same way `boardroom.md` already does: attempt `EnterPlanMode`/confirm `AskUserQuestion` is available via `ToolSearch`; if either comes back missing, this is a headless/non-interactive session (the exact, real gap this plugin's own dogfooding already found once for `/wingman:boardroom` — don't assume, check).

**Interactive session**: enter plan mode via `EnterPlanMode` before writing any code for the drifted scope. This re-arms the real `boardroom-checkpoint.mjs` `PreToolUse`/`ExitPlanMode` hook — the same deterministic gate every fresh plan goes through, not a weaker parallel one invented for this command. Inside plan mode, `plan.md`'s amendment mode runs `/wingman:boardroom` (plain or `deep`, per the founder's or the evidence's signal) against just the delta.

**Headless/non-interactive session**: do not attempt to fabricate the interactive flow. Record the checkpoint as `still_reviewing` (the exact fallback value `boardroom.md`'s own checkpoint schema already has for "a decision couldn't be obtained this turn" — see its "Ask for the decision" section), append the plan file's amendment section as unresolved, and **stop** — write zero code for the drifted scope. This is a direct reuse of an already-shipped, already-verified fallback (real dogfooding found and fixed the underlying gap once already), not new surface area. The next real interactive session picks up the pending decision.

This differs from `boardroom.md`'s own `still_reviewing` fallback in one specific way worth being explicit about: `boardroom.md`'s fallback only ever fires *after* all five seats have already been dispatched and returned real verdicts — it's a fallback for the *decision* field only. Here, no seat dispatch happens at all (a headless session routing straight to code review would defeat the point of deferring to the next interactive session). So when writing the `.wingman/checkpoints.jsonl` line for this case, use exactly: `"seats": []`, `"bottom_line": ""` (empty string — deliberately outside the normal `GO`/`GO_WITH_CHANGES`/`DO NOT SHIP` enum, meaning "no review ran," not "reviewed and passed"), `"rounds": 0`, `"next_stage"` set to whatever stage/pipeline step was interrupted by this drift (never advanced), and `"scope_ref"` pointing at the amendment section specifically (e.g. `"docs/wingman/plans/<file>.md (Amendment: <date>)"`). Do not invent a `GO`-family value for `bottom_line` to make the entry "look" reviewed — an empty string is the honest representation of "not yet reviewed," and downstream consumers of `checkpoints.jsonl` (e.g. `/wingman:agents`, `/wingman:evolve`'s gather step) should treat it as pending, not as a pass.

Either path ends at the same place: no drifted-scope code exists until a real "ship it" comes back from `/wingman:boardroom`.

## Step 3: Capture the drift, always — regardless of outcome

At the same moment the checkpoint is recorded (Step 2, either path), append one entry to `LEARNINGS.md` using its existing format (see `learn.md`):

```markdown
### <YYYY-MM-DD> — Scope drift: <short title>
<What was asked/reported, whether it was already in-scope or genuinely new, and the outcome (still reviewing / approved / sent back). 1-3 sentences.>
```

This is the only new automatic write in this command — everything else reuses an existing mechanism. `/wingman:evolve`'s gather step already scans `LEARNINGS.md`; it needs no changes to benefit from this richer signal the next time the founder runs it.

## Step 4: Hand back

Once a real decision clears the delta (this turn or a later one), resume whatever pipeline stage was in progress before the drift was reported — `/wingman:build` continues with the now-approved scope folded in, same as it would with any other approved plan content.
