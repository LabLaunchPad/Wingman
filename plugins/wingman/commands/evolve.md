---
description: Look for repeated friction across recent plans, retros, and learnings, and suggest promoting them into a new command, skill, or agent.
argument-hint: ""
---

# Wingman: Evolve

Wingman's pipeline is meant to get sharper the more it's used on a given project. This command is the mechanism: it looks for repetition across `LEARNINGS.md`, past retros, and recent commit/plan history, and suggests turning genuine patterns into reusable structure — instead of the same workaround getting rediscovered every session.

$ARGUMENTS

## Gather signal

Read (whatever exists):
- `LEARNINGS.md` at the project root.
- Recent plan files and their Plain-Language Summaries.
- Recent commit messages.
- Any `## Retro` sections left by `/wingman:retro`.

## Look for clusters

Group related entries by theme. A cluster is worth promoting only if it shows up **more than once** — a single occurrence is not a pattern.

- **Repeated multi-step sequence a founder or agent keeps doing manually** → propose a new command (e.g. three learnings about "when adding a new API integration, always do X then Y then Z" → propose a `/wingman:add-integration` command).
- **Repeated constraint or house style that should apply automatically** → propose a new skill (e.g. recurring notes about a specific coding convention or a recurring mistake to avoid).
- **Repeated complex, multi-step judgment call** (not a fixed sequence, needs its own isolated reasoning) → propose a new agent.

## Present, don't auto-generate silently

Show the founder a short plain-language list of proposed promotions, each with: what pattern was noticed, how many times it showed up, and what new command/skill/agent it would become. Ask via `AskUserQuestion` which (if any) to actually create.

Only after approval, write the new command/skill/agent file into `plugins/wingman/commands|skills|agents/`, following the structure of the existing files in this plugin, and update `plugins/wingman/.claude-plugin/plugin.json` to register it.

## Keep it rare

This is meant to run occasionally (after a handful of shipped features), not every session. If there isn't a genuine repeated pattern yet, say so plainly and don't force a promotion.
