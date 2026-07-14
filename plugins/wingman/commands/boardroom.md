---
description: Run the AI Boardroom checkpoint on the current plan or diff and produce one plain-language go/no-go summary for a non-technical founder.
argument-hint: "[plan|diff] [optional focus notes]"
---

# Boardroom Checkpoint

This is Wingman's replacement for code review: instead of asking a non-technical founder to read a diff, seven specialist reviewers each examine the current plan (if in plan mode, or a plan file was just written) or the current diff (if code has already changed), and their verdicts are consolidated into ONE short, plain-language summary the founder can act on.

$ARGUMENTS

## What to review

Figure out what's in scope, in this order of preference:
1. If the calling command passed specific content to review directly (e.g. `/wingman:launch` handing over drafted announcement copy that isn't a plan or a diff), review that content as given.
2. Otherwise, if a plan file exists (e.g. from `ExitPlanMode` or a `docs/**/plans/*.md` file just written), review that plan.
3. Otherwise, if there are uncommitted changes, review `git diff` (and `git diff --staged`).
4. Otherwise, ask the user what they want reviewed.

## Run the boardroom

Dispatch all seven boardroom seats **in parallel** (single message, multiple Task/Agent calls) against the same scope, each as its own subagent so their reviews don't bias each other. Per the `addyosmani-agent-skills` orchestration pattern this plugin follows: boardroom seats never call each other or any other agent — only this command orchestrates and merges.

| Group | Seat | Lens |
|---|---|---|
| Business | `boardroom-ceo` | Vision/strategy fit, cross-seat arbitration |
| Business | `boardroom-cpo` | User value, feature scope, market fit |
| Business | `boardroom-cmo` | Go-to-market, positioning, audience |
| Technical | `boardroom-cto` | Correctness, architecture, scalability |
| Technical | `boardroom-ciso` | Security, compliance, privacy |
| Finance | `boardroom-cfo` | Cost, budget, token/compute spend |
| Research | `boardroom-research` | Evidence grounding, competitive/landscape awareness |

`boardroom-design` (usability/consistency) is dispatched alongside these seven whenever the scope has a user-facing or developer-facing surface, using the same "N/A — nothing to review" fast-path it already documents when there isn't one; it is not grouped under the four headers above since it doesn't map cleanly to a single C-suite lens.

Each seat returns its own `## <SEAT> VERDICT` block as specified in its agent definition. Wait for all seats before continuing.

**N/A fast-path**: not every seat has material input on every checkpoint (e.g. `boardroom-cmo` on a pure `build`-stage internal diff with no customer-facing surface, or `boardroom-research` on a routine, well-precedented change). Each seat's own instructions already document returning a one-line `GO` with "no material input on this checkpoint" rather than manufacturing a concern — dispatch every seat every time regardless (for audit-log completeness), but expect and accept a fast one-liner from seats with nothing substantive to add. Do not skip dispatching a seat to save cost; let the seat itself decide it has nothing to say.

The dispatch prompt to each seat is an internal, agent-to-agent channel (no founder reads it), so apply the `token-economy` skill to it: pass the scope, the seat's lens, and the exact output contract — drop restated context the seat can already read for itself (file paths, prior tool output), and keep code, diffs, paths, and numbers verbatim. This is the single highest-volume internal channel in the whole pipeline (seven dispatches per checkpoint, every checkpoint — up from five before the 7-seat expansion), so it's where terseness actually pays — but per `token-economy`'s own Verification note, never at the cost of a seat misunderstanding the scope; when in doubt, spend the words.

## Consolidate into one founder-facing summary

Do not just concatenate seven reports — a founder should never have to read seven separate verdicts to figure out what to do. Group by the four headers above (plus Design when it returned substantive input) so the summary stays skimmable as the seat count grows. Synthesize into this exact structure:

```
# Boardroom Checkpoint: <one-line description of what was reviewed>

## Bottom line: <GO | GO WITH CHANGES | DO NOT SHIP>

<2-4 plain-English sentences: what this does, whether it's safe and worth shipping, and why. No jargon. If you must use a technical word, define it in the same sentence.>

## What each seat said
**Business** — 👔 CEO: <one line> · 🎯 CPO: <one line> · 📣 CMO: <one line>
**Technical** — 🛠️ CTO: <one line> · 🔒 CISO: <one line>
**Finance** — 💰 CFO: <one line>
**Research** — 🔍 Research: <one line>
<🎨 Design: <one line>, only if Design returned substantive (non-N/A) input>

## If you want to ship this
<Either "Nothing else needed — approve below to continue." OR a short numbered list of the specific things that need fixing first, in plain language, ordered by how much they matter.>
```

**Bottom line rule:** if ANY seat returned `NO_GO`, the bottom line is `DO NOT SHIP` regardless of the others. If any seat returned `GO_WITH_CONCERNS` and none returned `NO_GO`, the bottom line is `GO WITH CHANGES`. Only an all-`GO` result is a clean `GO`. This predicate is seat-count-agnostic — it reduces however many verdicts are in scope to one bottom line, unchanged by the seat count going from five to seven.

**`next_stage` on `DO NOT SHIP`:** set `next_stage` to the *same* stage that was just reviewed (e.g. a `build`-stage checkpoint that comes back `DO NOT SHIP` gets `next_stage: "build"`), not the following pipeline stage. `state.json`'s `current_stage` is set from `next_stage` unconditionally (see "Record the checkpoint" below), so pointing it at the next stage would silently advance the project past a blocked gate. The project should stay pinned at the reviewed stage until the concerns are fixed and a re-run clears cleanly.

## Human Escalation Framework

Every checkpoint's bottom line maps to who actually needs to act on it — this makes explicit what the gate rule above already implies, so it's a named, referenceable tier rather than an implicit convention:

| Risk tier | Bottom line pattern | Who acts |
|---|---|---|
| Low | Clean `GO`, no concerns from any seat | Proceeds automatically — no founder prompt needed beyond the standard "ship it" confirmation |
| Medium | `GO WITH CHANGES`, no `NO_GO` | The relevant Management Board manager (once one exists for this project — see `management-board-activation`) or the calling command fixes the listed concerns and re-runs the checkpoint, before it ever reaches the founder as a decision |
| High | `DO NOT SHIP` from a single seat, or a pattern of repeated `GO WITH CHANGES` on the same concern | Full Boardroom review is already what happened; the founder sees the consolidated summary and makes the ship/hold call via `AskUserQuestion` below |
| Critical | `DO NOT SHIP` touching security/data-safety (a `boardroom-ciso` `NO_GO`), or a one-way-door business decision any seat flags | Explicit founder `AskUserQuestion`, phrased with the specific irreversible consequence named — never bundled into a routine "ship it?" prompt |

## Ask for the decision

After presenting the summary, use `AskUserQuestion` to get an explicit decision — do not assume silence means approval:

- "Ship it" — proceed with the next pipeline stage (e.g. from `/wingman:build` continue to `/wingman:secure`, from `/wingman:ship` actually ship).
- "Fix the concerns first" — go address the listed items, then re-run `/wingman:boardroom` before proceeding.
- "Let me see the details" — show the full, unabridged output from each seat (this is the only path where the founder sees raw technical detail, and only if they ask for it).

Record the decision so the calling stage command (`plan`/`build`/`secure`/`ship`) knows whether it's clear to continue.

**If a decision genuinely can't be obtained in this turn** — `AskUserQuestion` isn't available in every environment (confirmed missing entirely in headless/print-mode sessions; a `ToolSearch` for it there returns no match), or the session simply ends before the founder answers — do not leave the checkpoint unrecorded and the plan file unmarked indefinitely. Proceed immediately to "Mark the plan file" and "Record the checkpoint" below using `still reviewing` / `"still_reviewing"` as the decision. A real, pending checkpoint that a later session or founder reply can update is strictly better than no record at all — the seven seats already did real work reviewing this, and losing that because the last step of the turn couldn't complete is exactly the "did the work, skipped persisting it" failure mode this project has hit before. Once a real decision does arrive (this turn or a later one), replace the `still reviewing` marker/entry with the actual outcome rather than leaving both on file.

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
  "schema_version": 2,
  "checkpoint_id": "<ISO-8601-timestamp-with-dashes>-<stage>",
  "stage": "plan | build | secure | ship | <free-text for an ad-hoc run>",
  "scope_ref": "<path to the plan file reviewed, \"diff\", or a short description of the directly-passed content and where it's headed (e.g. \"content passed directly: CHANGELOG.md entry + announcement copy\") when the calling command handed over content that's neither a plan nor a diff>",
  "seats": [
    { "seat": "ceo",      "verdict": "GO | GO_WITH_CONCERNS | NO_GO", "summary": "<one line>" },
    { "seat": "cpo",      "verdict": "...", "summary": "..." },
    { "seat": "cmo",      "verdict": "...", "summary": "..." },
    { "seat": "cto",      "verdict": "...", "summary": "..." },
    { "seat": "ciso",     "verdict": "...", "summary": "..." },
    { "seat": "cfo",      "verdict": "...", "summary": "..." },
    { "seat": "research", "verdict": "...", "summary": "..." },
    { "seat": "design",   "verdict": "...", "summary": "... (omit this entry if Design was N/A for this checkpoint)" }
  ],
  "bottom_line": "GO | GO_WITH_CHANGES | DO NOT SHIP",
  "founder_decision": "ship_it | fix_concerns_first | still_reviewing",
  "founder_notes": "",
  "next_stage": "<the stage this clears the way for>"
}
```

**Schema note (seat-rename migration, 2026):** `schema_version: 2` marks the 7-seat Boardroom (`ceo`/`cpo`/`cmo`/`cto`/`ciso`/`cfo`/`research`/`design`), replacing the prior 5-seat schema (`founder`/`engineer`/`security`/`design`/`cost`, implicitly `schema_version: 1`, unmarked). Existing `checkpoints.jsonl` entries written before this change keep their old seat names — this is an append-only audit log and is never rewritten. See `docs/DATABASE.md` for the full old→new seat mapping. Any consumer reading this file (e.g. `evolve-promotion`'s clustering logic) iterates `seats[]` generically and does not assume a fixed seat count or fixed names, so old and new entries coexist safely.

Create `.wingman/` and the file if they don't exist yet. This is a plain append (`>>`), never a rewrite — it's an audit log.

Then update `.wingman/state.json`. **Read the existing file first if it exists** — this is a merge, not a blind overwrite: keep `active_department_leads`, `active_managers`, and `active_specialists` exactly as they were (this file is the only place that roster is tracked; dropping it here breaks `department-lead-activation`, `management-board-activation`, and `evolve-promotion` on every subsequent run), and set only `current_stage` (to `next_stage` above), `last_checkpoint_id` (to this checkpoint's `checkpoint_id`), and `updated_at` (now, ISO 8601). If `state.json` doesn't exist yet, create it with `active_department_leads: []`, `active_managers: []`, and `active_specialists: []`. Both files should be committed to the project's own git repo, same as any other project file.

**Before reporting this checkpoint as done, re-read both files from disk to confirm the write actually landed** (per the `verification-before-completion` skill) — do not consider the stage complete on the strength of having decided to write them. All seven seats reporting is not the same as the checkpoint being recorded; this step is what makes it real.

## References

- `references/plan-review-checklist.md` — the required plan sections the gstack `EXIT PLAN MODE GATE` enforces before `ExitPlanMode`; the same shape each seat should find present in the plan it reviews.
- `skills/spec-handler` — every plan under review is a spec; judge it against its stated success criteria, not its volume.
