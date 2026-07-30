---
name: tool-selection
description: Use whenever a task requires choosing between more than one plausible tool or action (e.g. Bash vs. a language-specific MCP connector, a local git commit vs. a push, a read-only check vs. a write) — confirms the choice against references/tool-runtime.md's declarative intent-to-tool map and its permission level, rather than picking ad hoc. Not needed for a single-obvious-tool action (reading one named file with Read).
effort: low
---

# Tool Selection

## Overview

The Tool Runtime Engine's core skill (`docs/status/ENGINES.md`). Makes tool choice **explicit and
governed** rather than ad-hoc, by checking a genuinely ambiguous tool decision against
`references/tool-runtime.md`'s declarative map before acting — composed with the existing Level 0-4
permission scale (`references/permission-model.md`), never a second one.

**Core principle:** this is a decision-time check, not a new capability. It never grants access to a
tool that wasn't already available, and it never blocks a tool call by itself — it names the
permission level the intended action actually sits at, so the calling command/hook's own gate
(`hooks/deploy-approval-gate.mjs`, `hooks/dod-structural-gate.mjs`) can do the actual blocking.

## Inputs

The action about to be taken and the set of tools that could plausibly accomplish it.

## Escalation

An action that maps to Level 3+ (`references/tool-runtime.md`) but has no corresponding approval
already recorded (a clean Boardroom verdict for a deploy-class action, an explicit `{ approved: true }`
for a Global/Org memory write) is a **Must-ask** — surface this before proceeding, don't assume the
gate downstream will catch it if this skill is the first place the ambiguity was visible.

## When To Use

Only when there is a genuine choice between two or more plausible tools/actions for the same intent
(e.g. run a check locally via `Bash` vs. dispatching to an MCP-connected service; commit locally vs.
push and open a PR). Skip this for an unambiguous single-tool action — reading one named file, a
straightforward `Grep` search — where consulting a map would be pure overhead with no real decision
to make.

## Core Workflow

**1. Name the actual intent**, not the tool — "get this diff into the shared repo," not "call `git push`."

**2. Look up the intent's row in `references/tool-runtime.md`.** If no row fits, state that plainly
rather than forcing a strained match — a genuinely new intent is worth a new row eventually (via
evidenced need, not speculatively), not a mismatched one today.

**3. Confirm the permission level the intent maps to**, and check whether that level's requirement is
already satisfied (a clean checkpoint, an explicit approval) before proceeding. If not satisfied,
escalate per the Escalation section above rather than proceeding and letting a downstream gate be the
only thing that catches it.

**4. Choose the tool named in the map**, not a functionally-similar alternative picked for
convenience — e.g. `skills/git-pr-workflow`'s bundled scripts for a push/PR flow, not a hand-rolled
`git push` sequence that skips the same skill's CI-poll/squash-merge discipline.

## Constraints

**MUST:**
- Check `references/tool-runtime.md` before an ambiguous tool choice, not after acting.
- Name the actual permission level an action requires, using the existing Level 0-4 scale only.
- Escalate a Level 3+ action with no recorded approval before proceeding.

**MUST NOT:**
- Introduce a second risk/permission scale alongside `references/permission-model.md`'s existing one.
- Treat this skill's own check as the enforcement mechanism — it names the level; the real hooks
  (`deploy-approval-gate.mjs`, `dod-structural-gate.mjs`, `memory-tiers.mjs`'s approval gate) enforce it.
- Add a new row to `references/tool-runtime.md` speculatively for a tool/connector not actually in
  use yet.

## Rationalizations

| Excuse | Reality |
|---|---|
| "I'll just use whichever tool is fastest to call" | Fastest-to-call and correctly-scoped aren't the same thing — a `Bash git push` that skips `git-pr-workflow`'s CI-poll discipline is faster and wrong. |
| "The downstream gate will catch it if this is actually Level 3+" | Relying on a later gate to catch what this skill could have named earlier means an avoidable escalation gets silently skipped when the gate has a blind spot — name the level here, don't defer the whole check. |
| "This is basically the same permission level as something I did earlier" | Each action's level comes from what it actually does, not from pattern-matching to an earlier, superficially similar action. |

## Red Flags — Stop and Reconsider

- About to pick a tool for an ambiguous action without checking `references/tool-runtime.md`.
- About to proceed on a Level 3+ action with no clean verdict/approval already recorded.
- About to hand-roll a sequence a bundled skill (`git-pr-workflow`) already provides correctly.

## Verification

Before acting on an ambiguous tool choice: confirm the intent's row was actually looked up (not
assumed from memory), and that the chosen tool matches what the map names for that intent and
permission level.

## Output

No founder-facing artifact — this is an internal decision-time check, surfaced only when it results
in an escalation.

## Referenced by

- `references/tool-runtime.md`

See `docs/status/ENGINES.md`'s Tool Runtime Engine entry and `docs/status/ARCHITECTURE.md` for this
skill's place in Wingman's overall architecture.
