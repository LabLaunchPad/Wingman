---
name: evolve-promotion
description: Use inside /wingman:evolve — gathers signal from LEARNINGS.md, docs/wingman/retros.md, and .wingman/checkpoints.jsonl, clusters repeated friction, and promotes a genuine 2+ occurrence pattern into a new command, skill, or specialist agent in the founder's own project. Triggers whenever /wingman:evolve runs.
---

# Evolve Promotion

## Overview

Wingman's pipeline should get sharper the more it's used on a given project, without ever growing speculative scaffolding nobody asked for. This skill is the mechanism: it reads three signal sources, requires genuine repetition (not a single occurrence) before proposing anything, and — this is the part `/wingman:evolve`'s original design got wrong and this skill corrects — writes every promoted artifact (command, skill, or specialist agent) to the founder's own project, never into Wingman's own plugin directory, for exactly the same reason `department-lead-activation` writes department leads there (see `docs/ARCHITECTURE.md` §5 and §6, and `docs/PROJECT.md`'s decisions log).

**Core principle:** promote only what's shown up more than once, with concrete evidence, and only after the founder explicitly approves what's about to be created.

## When To Use

At the start of `/wingman:evolve`'s run, and nowhere else — this is a rare, on-demand operation, not something invoked from the regular pipeline commands.

## Core Workflow

**1. Gather signal from all three sources:**
- `LEARNINGS.md` — dated entries, each a short title + 1-3 sentence body (see `commands/learn.md`'s exact format). Free text; clustering here is topical/semantic, not a field match.
- `docs/wingman/retros.md` — `## Retro: <title> — <date>` blocks (see `commands/retro.md`'s exact format). Same free-text clustering approach.
- `.wingman/checkpoints.jsonl` — structured, one JSON object per line (see `docs/DATABASE.md`'s schema). Group by `seats[].seat` plus repeated keywords in `seats[].summary` or `bottom_line` across multiple lines — e.g. the `security` seat returning `GO_WITH_CONCERNS` about the same narrow topic (auth, a specific integration) more than once is exactly the kind of structured signal this file can surface that free-text sources can't.

**2. Cluster by genuine topical overlap, not superficial keyword match.** Group entries (from any combination of the three sources) that describe the *same underlying friction*, even if worded differently. A cluster is only a candidate if it has **2 or more entries** — this threshold is fixed by `docs/ARCHITECTURE.md` §6 and `docs/AGENT-ROSTER.md`; do not round down from "close to 2" or promote on a single strong occurrence, no matter how compelling it looks.

**3. Classify each qualifying cluster by what it should become**, per `commands/evolve.md`'s existing rule:
- Repeated multi-step manual sequence → a new **command**, written to `.claude/commands/<name>.md`. Follow the structure of this plugin's own existing commands (`commands/*.md`) as the reference for shape — no separate template file needed.
- Repeated constraint or house style → a new **skill**, written to `.claude/skills/<name>/SKILL.md`. Follow `docs/ARCHITECTURE.md` §6's skill-anatomy shape (When to Use → Core Workflow → Constraints → Rationalizations → Red Flags → Verification → Output) — this skill's own structure and `department-lead-activation`'s are both worked examples.
- Repeated complex judgment call needing isolated reasoning → a new **specialist agent**, written to `.claude/agents/<specialist-slug>.md`, named from `references/specialist-catalog.md` (in this skill) if a matching role exists there, or a new name if it doesn't. Use `references/specialist-agent-template.md`.

**4. Present the proposed promotions to the founder in plain language**, via `AskUserQuestion`: what pattern was noticed, how many times it showed up (cite the actual entries, don't just assert a count), and what it would become. Ask which (if any) to actually create. Do not create anything before this approval.

**5. Write the approved artifact to the founder's own project, by type — never into Wingman's own plugin directory, regardless of artifact type:**
- **Specialist agents** → `.claude/agents/<specialist-slug>.md`, exactly like `department-lead-activation` writes department leads.
- **Commands** → `.claude/commands/<name>.md`, using Claude Code's standard project-scoped command mechanism.
- **Skills** → `.claude/skills/<name>/SKILL.md`, using Claude Code's standard project-scoped skill mechanism.

All three follow the identical reasoning: "Wingman's plugin directory" means the founder's *local installed copy* of the plugin, which gets resynced from the marketplace source — anything written there risks silent loss on the next update, and every one of these artifacts is specific to this founder's own project/patterns anyway, not a general-purpose Wingman capability. There is no case where `/wingman:evolve` writes into `plugins/wingman/`. (A founder who genuinely believes something they evolved deserves to become part of Wingman itself for everyone would need to propose that back to the Wingman project directly — a separate, human-driven contribution, not something this automatic mechanism does.)

**6. Record the promotion in `.wingman/state.json`** — add the new specialist's slug to its `active_specialists` array (create the array if it doesn't exist yet), following the same pattern `department-lead-activation` uses for `active_department_leads`. This is the per-project promotion record; `references/specialist-catalog.md` in this skill is a fixed reference list, not a per-project tracker, and there's no shared roster file to update across projects at runtime.

**7. Keep this rare.** If nothing has genuinely repeated, say so plainly and don't force a promotion. This should run occasionally (after a handful of shipped features), not every session.

## Constraints

**MUST:**
- Require 2+ genuine occurrences of the same underlying friction before proposing a promotion.
- Get explicit founder approval via `AskUserQuestion` before writing anything.
- Write every promoted artifact — command, skill, or specialist agent — to the founder's own project under `.claude/`, never into Wingman's own plugin directory.
- Record the promotion in `.wingman/state.json`'s `active_specialists` array.

**MUST NOT:**
- Promote on a single strong occurrence, no matter how compelling.
- Auto-generate and write files without founder approval.
- Write any promoted artifact into Wingman's own plugin directory (`plugins/wingman/`), regardless of type.
- Invent scope beyond what the clustered entries actually support.

## Rationalizations

| Excuse | Reality |
|---|---|
| "This one occurrence is clearly going to happen again" | Prediction isn't evidence — wait for the second real occurrence. |
| "It's just a file, plugin dir vs. project dir doesn't matter much" | It does — anything written into Wingman's plugin directory can be silently wiped on the next plugin update, and none of these artifacts belong in a shared install anyway (see Core Workflow step 5). |
| "The founder will probably say yes, I'll just create it" | The approval step exists precisely so the founder decides what gets added to their own roster — skipping it defeats the purpose of a plain-language gate. |

## Red Flags — Stop and Reconsider

- You're about to propose a promotion backed by only one entry.
- You're about to write any promoted command, skill, or specialist agent file into `plugins/wingman/`.
- You're about to create a file before the founder has responded to the `AskUserQuestion` proposal.
- You're running this on every single `/wingman:evolve` invocation regardless of whether new signal has actually accumulated since the last run.

## Verification

Before writing anything: recount the cluster's actual entries (don't trust a remembered impression — reread `LEARNINGS.md`/`docs/wingman/retros.md`/`checkpoints.jsonl` fresh), confirm the founder's `AskUserQuestion` response was an explicit approval for this specific item, and confirm the write target is under the founder's own `.claude/` (agents/commands/skills as appropriate to the type) — never under `plugins/wingman/`.

## Output

No fixed template beyond the `AskUserQuestion` proposal shape described in step 4. The written artifact follows the relevant template (`references/specialist-agent-template.md` for agents; existing plugin files as the shape reference for commands/skills).
