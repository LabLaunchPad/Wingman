---
description: Run the AI Boardroom checkpoint on the current plan or diff and produce one plain-language go/no-go summary for a non-technical founder.
argument-hint: "[plan|diff] [optional focus notes]"
---

# Boardroom Checkpoint

This is Wingman's replacement for code review: instead of asking a non-technical founder to read a diff, five specialist reviewers each examine the current plan (if in plan mode, or a plan file was just written) or the current diff (if code has already changed), and their verdicts are consolidated into ONE short, plain-language summary the founder can act on.

$ARGUMENTS

## What to review

Figure out what's in scope, in this order of preference:
1. If the calling command passed specific content to review directly (e.g. `/wingman:launch` handing over drafted announcement copy that isn't a plan or a diff), review that content as given.
2. Otherwise, if a plan file exists (e.g. from `ExitPlanMode` or a `docs/**/plans/*.md` file just written), review that plan.
3. Otherwise, if there are uncommitted changes, review `git diff` (and `git diff --staged`).
4. Otherwise, ask the user what they want reviewed.

## Run the boardroom

Dispatch all five boardroom seats **in parallel** (single message, multiple Task/Agent calls) against the same scope, each as its own subagent so their reviews don't bias each other. Per the `addyosmani-agent-skills` orchestration pattern this plugin follows: boardroom seats never call each other or any other agent — only this command orchestrates and merges.

- `boardroom-founder` — business/product/scope lens
- `boardroom-engineer` — correctness/architecture/test lens
- `boardroom-security` — risk/data-safety lens
- `boardroom-design` — usability/consistency lens
- `boardroom-cost` — compute/token/hosting cost lens

Each seat returns its own `## <SEAT> VERDICT` block as specified in its agent definition. Wait for all five before continuing.

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
- 💰 Cost: <one-line plain summary>

## If you want to ship this
<Either "Nothing else needed — approve below to continue." OR a short numbered list of the specific things that need fixing first, in plain language, ordered by how much they matter.>
```

**Bottom line rule:** if ANY seat returned `NO_GO`, the bottom line is `DO NOT SHIP` regardless of the others. If any seat returned `GO_WITH_CONCERNS` and none returned `NO_GO`, the bottom line is `GO WITH CHANGES`. Only an all-`GO` result is a clean `GO`.

**`next_stage` on `DO NOT SHIP`:** set `next_stage` to the *same* stage that was just reviewed (e.g. a `build`-stage checkpoint that comes back `DO NOT SHIP` gets `next_stage: "build"`), not the following pipeline stage. `state.json`'s `current_stage` is set from `next_stage` unconditionally (see "Record the checkpoint" below), so pointing it at the next stage would silently advance the project past a blocked gate. The project should stay pinned at the reviewed stage until the concerns are fixed and a re-run clears cleanly.

## Ask for the decision

After presenting the summary, use `AskUserQuestion` to get an explicit decision — do not assume silence means approval:

- "Ship it" — proceed with the next pipeline stage (e.g. from `/wingman:build` continue to `/wingman:secure`, from `/wingman:ship` actually ship).
- "Fix the concerns first" — go address the listed items, then re-run `/wingman:boardroom` before proceeding.
- "Let me see the details" — show the full, unabridged output from each seat (this is the only path where the founder sees raw technical detail, and only if they ask for it).

Record the decision so the calling stage command (`plan`/`build`/`secure`/`ship`) knows whether it's clear to continue.

## Mark the plan file (only when the scope was a plan, not a diff)

If step "What to review" resolved to a plan file, append this section to the end of that file, verbatim, after the founder's decision is known — this is what the `boardroom-checkpoint` hook checks before allowing `ExitPlanMode`, so it must be written even on a `DO NOT SHIP` or `GO WITH CHANGES` result, not just on approval:

```markdown
## Wingman Boardroom Checkpoint
Bottom line: <GO | GO WITH CHANGES | DO NOT SHIP>
Founder decision: <ship it | fix concerns first | still reviewing>
Timestamp: <ISO 8601 timestamp>
```

If this section already exists at the end of the file from a previous run, replace it rather than appending a second copy — the hook only looks at the most recent one. When the scope was a diff or content passed directly by the calling command instead of a plan file, this step does not apply (the hook only gates `ExitPlanMode`, which only fires for plans).

## Record the checkpoint (always, regardless of scope)

Append one line to `.wingman/checkpoints.jsonl` at the project root with exactly this shape:

```json
{
  "checkpoint_id": "<ISO-8601-timestamp-with-dashes>-<stage>",
  "stage": "plan | build | secure | ship | <free-text for an ad-hoc run>",
  "scope_ref": "<path to the plan file reviewed, or \"diff\">",
  "seats": [
    { "seat": "founder",  "verdict": "GO | GO_WITH_CONCERNS | NO_GO", "summary": "<one line>" },
    { "seat": "engineer", "verdict": "...", "summary": "..." },
    { "seat": "security", "verdict": "...", "summary": "..." },
    { "seat": "design",   "verdict": "...", "summary": "..." },
    { "seat": "cost",     "verdict": "...", "summary": "..." }
  ],
  "bottom_line": "GO | GO_WITH_CHANGES | DO NOT SHIP",
  "founder_decision": "ship_it | fix_concerns_first | still_reviewing",
  "founder_notes": "",
  "next_stage": "<the stage this clears the way for>"
}
```

Create `.wingman/` and the file if they don't exist yet. This is a plain append (`>>`), never a rewrite — it's an audit log.

Then update `.wingman/state.json`. **Read the existing file first if it exists** — this is a merge, not a blind overwrite: keep `active_department_leads` and `active_specialists` exactly as they were (this file is the only place that roster is tracked; dropping it here breaks `department-lead-activation` and `evolve-promotion` on every subsequent run), and set only `current_stage` (to `next_stage` above), `last_checkpoint_id` (to this checkpoint's `checkpoint_id`), and `updated_at` (now, ISO 8601). If `state.json` doesn't exist yet, create it with `active_department_leads: []` and `active_specialists: []`. Both files should be committed to the project's own git repo, same as any other project file.

**Before reporting this checkpoint as done, re-read both files from disk to confirm the write actually landed** (per the `verification-before-completion` skill) — do not consider the stage complete on the strength of having decided to write them. All five seats reporting is not the same as the checkpoint being recorded; this step is what makes it real.
