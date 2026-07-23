---
description: Experimental — thin client to the agnostic-boardroom Python backend (route_task/retrieve_memories_tool MCP tools + scoped git/gh bash). Not part of the shipped plugin surface; not registered in plugin.json. Still stops at every one of the real 7-stage pipeline checkpoints for founder sign-off — this is not an unattended, fully-autonomous ship command.
argument-hint: "<issue-number>"
---

# Wingman (experimental): Ship Feature

## Why this exists, and why it's experimental

This command is a thin client to `agnostic-boardroom/` — a separate, in-progress Python backend
(see `docs/ARCHITECTURE.md` §12) that is deliberately **not** part of Wingman's shipped plugin
surface today. It lives at `.claude/commands/ship-feature.md` — a repo-level, project-scoped Claude
Code custom command, not a Wingman plugin command — specifically so it stays discoverable and
testable in this repo without ever reaching a founder's real plugin install. It was originally
drafted under `plugins/wingman/commands/experimental/`, but `validate-structure.mjs`'s own orphan
check treats *any* `.md` file under `plugins/wingman/commands/` not listed in `plugin.json` as a
hard error ("exists on disk but is not declared... it will never load") — confirmed by actually
running the validator, not assumed. `.claude/commands/` is outside `plugins/wingman/` entirely, so
none of the plugin's validators apply to it, while it's still a real, invocable Claude Code command
in this repo.

Matches `skills/git-pr-workflow`'s own precedent for automation-heavy work: explain the rationale
before the mechanics, since this is exactly the kind of command a founder could mistake for "fully
autonomous" if the boundary isn't stated plainly up front. It is not. **This command still stops at
every one of the real 7 pipeline stage checkpoints (Discovery, Define, Architecture, UX Flow,
Implementation Planning, Build, Ship) for founder sign-off, exactly like the rest of Wingman.** It
does not remove, bypass, or shortcut the Boardroom's per-stage governance — that line has held since
this project's very first version, and nothing here crosses it. What it *does* automate is the
mechanical connective tissue between stages: pulling relevant memory, routing to the right skill,
and running the scoped `git`/`gh` steps a founder would otherwise type by hand.

## What it invokes

- `agnostic-boardroom/mcp_server`'s `retrieve_memories_tool` — pulls project-durable memory relevant
  to the named issue before starting, so the agent isn't starting from zero context.
- `agnostic-boardroom/knowledge/skill_router.py`'s `route_task` — picks the single most relevant
  Wingman skill for the current stage's work, rather than the agent guessing.
- Scoped `git`/`gh` commands, the same ones a founder would run by hand during `/wingman:ship` —
  nothing this command does with `git`/`gh` is new; it is automating existing, already-reviewed
  mechanics (see `skills/git-pr-workflow`), not inventing new git operations.

$ARGUMENTS

## Step 1: Load context

Call `retrieve_memories_tool` with a query built from the issue number/title. Surface what comes
back to the founder plainly before proceeding — this is context, not a decision, so no checkpoint is
needed yet.

## Step 2: Route to the relevant skill

Call `route_task` with a short description of the issue's likely work. If it returns
`confidence: "low_confidence_fallback"`, say so plainly to the founder rather than silently
proceeding as if the match were certain — this is a known, currently-unguarded gap (see
`agnostic-boardroom/knowledge/skill_router.py`'s own docstring) until a real Maker/Checker loop is
wired to catch a wrong pick downstream.

## Step 3: Run the real 7-stage pipeline, one checkpoint at a time

Invoke each stage exactly as `/wingman:discovery`, `/wingman:define`, ... `/wingman:ship` already do
— this command does not reimplement stage logic, it sequences the existing ones. **Stop and wait for
the founder's explicit decision at every checkpoint**, per `commands/adaptive/boardroom.md`'s
existing gate rule (any `NO_GO` blocks; `GO_WITH_CONCERNS` needs the founder to say how to proceed).
Never auto-advance to the next stage on your own judgment.

## Step 4: Report

Summarize what happened in the shape `plain-language-checkpoint` already establishes elsewhere in
this plugin — no unexplained jargon, lead with consequence, not mechanism.

<!-- See docs/ARCHITECTURE.md §12 for the agnostic-boardroom/ backend this command is a thin client of. -->
