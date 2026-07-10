---
description: Show the founder who's currently on their AI team — the fixed Boardroom, any department leads or specialists this project has grown, and the most recent deep-review notes if any exist. Read-only.
argument-hint: ""
---

# Wingman: Agents

Answers "who's actually working on my project right now?" — read-only, no new agents, no new mechanism. Everything shown here already exists; this command only surfaces it in one place instead of leaving it scattered across `.wingman/state.json` and a folder of files.

## Step 1: Read what already exists

- `.wingman/state.json` — `active_department_leads`, `active_specialists`. If the file doesn't exist yet, that means neither has ever been created for this project; say so plainly rather than showing an empty table with no explanation.
- For each name found there, read that agent's own file — `.claude/agents/<name>.md` in the founder's project (`department-lead-activation` and `evolve-promotion` always write this file alongside updating `state.json`, so it should exist for every listed name) — and use its own description/remit for the one-line summary. **Never fall back to `docs/ARCHITECTURE.md` or `docs/AGENT-ROSTER.md` for this** — those are Wingman-repo-only reference docs that don't ship with the installed plugin and won't exist in a founder's actual project; every fact this command reports must come from files that are genuinely present in the founder's own repo. If a name in `state.json` has no matching `.claude/agents/<name>.md` file, note that specific inconsistency rather than inventing a description for it.
- The 5 fixed Boardroom seats — always present, never read from a file; list them directly (`boardroom-founder`, `boardroom-engineer`, `boardroom-security`, `boardroom-design`, `boardroom-cost`).
- `.wingman/boardroom/` — if any `<checkpoint_id>/round-*/<seat>.md` files exist (written by `boardroom.md`'s deep-review mode), find the most recent `checkpoint_id` directory by modification time and note it as available detail, without dumping its full contents unasked.

## Step 2: Report in plain language

Use the `plain-language-checkpoint` skill's bar for the output — no unexplained jargon, lead with what the founder actually wants to know:

```markdown
## Your AI team right now

**Always on (5):** Founder, Engineering, Security, Design, Cost — the Boardroom that reviews every checkpoint.

**Grown for this project:** <list active_department_leads by name and what each does, in one line each — or "None yet — created automatically the first time your project's setup calls for one."> <same for active_specialists, or "None yet — promoted only after the same kind of problem shows up twice for real.">

**Most recent deep review:** <if a .wingman/boardroom/ directory exists, name the checkpoint and offer to show the detail — otherwise omit this section entirely, don't mention its absence.>
```

Do not editorialize about whether the roster is "too small" or "should grow" — that's `department-lead-activation`'s and `/wingman:evolve`'s job at the moment a real signal calls for it, not something to suggest speculatively here.
