---
description: Run the AI Boardroom checkpoint on the current plan or diff and produce one plain-language go/no-go summary for a non-technical founder. Add "deep" as an argument, or ask to "really dig into this," "make sure everyone's questions get answered," or "have the team cross-check each other," for a deeper multi-round review where the five seats see and respond to each other's findings before the final verdict.
argument-hint: "[plan|diff] [deep] [optional focus notes]"
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

The dispatch prompt to each seat is an internal, agent-to-agent channel (no founder reads it), so apply the `token-economy` skill to it: pass the scope, the seat's lens, and the exact output contract — drop restated context the seat can already read for itself (file paths, prior tool output), and keep code, diffs, paths, and numbers verbatim. This is the single highest-volume internal channel in the whole pipeline (five dispatches per checkpoint, every checkpoint), so it's where terseness actually pays — but per `token-economy`'s own Verification note, never at the cost of a seat misunderstanding the scope; when in doubt, spend the words.

## Deep-review mode (optional — default path above is unchanged)

If `$ARGUMENTS` contains `deep`, or the founder's own words signal they want more rigor than a standard pass ("really dig into this," "make sure everyone's questions get answered," "have the team cross-check each other," "I want them to challenge each other" — the same class of trigger `systematic-auditing` and `secure.md`'s deeper-scrutiny tie-in already use), run this instead of stopping after the single dispatch above. **If none of these signals are present, none of this section applies — the default single-round path is unmodified.**

Compute `checkpoint_id` now, before round 1 dispatch, using the exact same format "Record the checkpoint" uses below (`<ISO-8601-timestamp-with-dashes>-<stage>`) — reuse this identical value for every round-file path in this section AND for the `checkpoint_id` field written to `checkpoints.jsonl` at the end. One checkpoint, one ID, referenced consistently throughout the run.

**Round 1** is the exact dispatch already described above — same 5 seats, same scope, same verdict contract, nothing different. Once all five verdicts are in, persist each seat's full verdict text verbatim to `.wingman/boardroom/<checkpoint_id>/round-1/<seat>.md` (one file per seat; create the directories if needed). This is not a new capability — it's the same write action "Record the checkpoint" below already performs on `checkpoints.jsonl`/`state.json`, just one more file, at the same point in the flow. It does not require granting any seat a `Write` tool — the command itself, which already holds each seat's returned text in order to build the founder-facing summary, does the writing.

**Round 2 (the meeting)**: re-dispatch all five seats one more time, in parallel, in a single message — still zero peer-to-peer contact, the command assembles every prompt. Give each seat: its own round-1 verdict, and the other four seats' round-1 verdicts as read-only reference text. Ask each seat to (a) name any question or conflict it has with another seat's specific finding, and (b) confirm or revise its own verdict in light of what it now sees. Persist each response to `.wingman/boardroom/<checkpoint_id>/round-2/<seat>.md`, same mechanism as round 1. Apply `token-economy` to this dispatch exactly as round 1's — it's a second instance of the same internal-channel pattern, not new content to invent.

**Convergence check**: if round 2 changed any seat's bottom-line verdict (`GO`/`GO_WITH_CONCERNS`/`NO_GO`) in a way that could change the overall consolidation outcome below, run one more round using the identical round-2 mechanic (each seat now sees the latest round's verdicts) — **hard-capped at round 3**, do not loop further regardless of outcome. Otherwise, stop after round 2.

Consolidate using the round from the last update to each seat's verdict (the *latest* real answer from each seat, not an average or a vote across rounds) and continue to the section below as normal, with one addition: the founder-facing summary gets one more line reporting how many rounds ran and whether any seat changed its mind, e.g. `_Reviewed across 2 rounds — Security revised its verdict after seeing Engineering's finding._` If only round 1 ran (deep mode wasn't triggered), omit this line entirely — it should never appear on a standard checkpoint.

## Consolidate into one founder-facing summary

Do not just concatenate the five reports — a founder should never have to read five separate verdicts to figure out what to do. Synthesize them into this exact structure:

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

**If a decision genuinely can't be obtained in this turn** — `AskUserQuestion` isn't available in every environment (confirmed missing entirely in headless/print-mode sessions; a `ToolSearch` for it there returns no match), or the session simply ends before the founder answers — do not leave the checkpoint unrecorded and the plan file unmarked indefinitely. Proceed immediately to "Mark the plan file" and "Record the checkpoint" below using `still reviewing` / `"still_reviewing"` as the decision. A real, pending checkpoint that a later session or founder reply can update is strictly better than no record at all — the five seats already did real work reviewing this, and losing that because the last step of the turn couldn't complete is exactly the "did the work, skipped persisting it" failure mode this project has hit before. Once a real decision does arrive (this turn or a later one), replace the `still reviewing` marker/entry with the actual outcome rather than leaving both on file.

## Mark the plan file (only when the scope was a plan, not a diff)

If step "What to review" resolved to a plan file, append this section to the end of that file, verbatim, once you have a decision — including the `still reviewing` fallback above if you couldn't get a real one this turn. This is what the `boardroom-checkpoint` hook checks before allowing `ExitPlanMode`, so it must be written even on a `DO NOT SHIP` or `GO WITH CHANGES` result, not just on approval, and it must never be left unwritten just because the founder hasn't answered yet:

```markdown
## Wingman Boardroom Checkpoint
Bottom line: <GO | GO WITH CHANGES | DO NOT SHIP>
Founder decision: <ship it | fix concerns first | still reviewing>
Timestamp: <ISO 8601 timestamp>
```

If this section already exists at the end of the file from a previous run, replace it rather than appending a second copy — the hook only looks at the most recent one. When the scope was a diff or content passed directly by the calling command instead of a plan file, this step does not apply (the hook only gates `ExitPlanMode`, which only fires for plans).

## Record the checkpoint (always, regardless of scope — and regardless of whether a decision was obtained; see the fallback in "Ask for the decision" above)

Append one line to `.wingman/checkpoints.jsonl` at the project root with exactly this shape:

```json
{
  "checkpoint_id": "<ISO-8601-timestamp-with-dashes>-<stage>",
  "stage": "plan | build | secure | ship | <free-text for an ad-hoc run>",
  "scope_ref": "<path to the plan file reviewed, \"diff\", or a short description of the directly-passed content and where it's headed (e.g. \"content passed directly: CHANGELOG.md entry + announcement copy\") when the calling command handed over content that's neither a plan nor a diff>",
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
  "next_stage": "<the stage this clears the way for>",
  "rounds": 1
}
```

`rounds` defaults to `1` — the meaning for every checkpoint that exists today, including every one recorded before this field existed (a missing `rounds` field means the same thing as `rounds: 1`, so no backfill is needed). Only a deep-review run (see "Deep-review mode" above) ever writes a value greater than 1, matching however many rounds actually ran there (2 or 3).

Create `.wingman/` and the file if they don't exist yet. This is a plain append (`>>`), never a rewrite — it's an audit log.

Then update `.wingman/state.json`. **Read the existing file first if it exists** — this is a merge, not a blind overwrite: keep `active_department_leads` and `active_specialists` exactly as they were (this file is the only place that roster is tracked; dropping it here breaks `department-lead-activation` and `evolve-promotion` on every subsequent run), and set only `current_stage` (to `next_stage` above), `last_checkpoint_id` (to this checkpoint's `checkpoint_id`), and `updated_at` (now, ISO 8601). If `state.json` doesn't exist yet, create it with `active_department_leads: []` and `active_specialists: []`. Both files should be committed to the project's own git repo, same as any other project file.

**Before reporting this checkpoint as done, re-read both files from disk to confirm the write actually landed** (per the `verification-before-completion` skill) — do not consider the stage complete on the strength of having decided to write them. All five seats reporting is not the same as the checkpoint being recorded; this step is what makes it real.

## References

- `references/plan-review-checklist.md` — the required plan sections the gstack `EXIT PLAN MODE GATE` enforces before `ExitPlanMode`; the same shape each seat should find present in the plan it reviews.
- `skills/spec-handler` — every plan under review is a spec; judge it against its stated success criteria, not its volume.
