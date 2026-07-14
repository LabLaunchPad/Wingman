---
name: management-board-activation
description: Use immediately after department-lead-activation at the start of /wingman:discovery, /wingman:architecture, /wingman:uxflow, /wingman:build, or /wingman:ship — checks whether this project has crossed the complexity threshold for a Management Board manager and creates one in the founder's own repo if so. Triggers only once a project has 3+ active department leads; never on a fresh or simple project.
---

# Management Board Activation

## Overview

Wingman's Management Board (Engineering, Product, Design, Data, Security, QA, Platform, Research, Growth Managers — see `docs/ARCHITECTURE.md` §5a) sits between the 7-seat Boardroom and the department leads. It doesn't exist at install time, and it doesn't exist for most projects, ever. This skill is the shared mechanism every pipeline command uses to check whether this project has grown complex enough to actually need execution-layer coordination, and to create the relevant manager's file if it's needed and doesn't exist yet.

**Core principle:** a Manager exists only once its corresponding department lead exists *and* the project as a whole has crossed a real complexity threshold — never on day one, never "just in case." This mirrors `department-lead-activation`'s own lazy-growth discipline one layer up; it does not introduce a second, independent gating system.

## When To Use

Immediately after `department-lead-activation` runs, at the start of `/wingman:discovery`, `/wingman:architecture`, `/wingman:uxflow`, `/wingman:build`, or `/wingman:ship` — so a manager can be created in the same pass as the department lead that crosses the threshold, not as a separate always-checked gate.

## Core Workflow

**1. Read `.wingman/state.json`.** If it doesn't exist yet, or `active_department_leads` has fewer than 3 entries, stop here — the complexity threshold isn't met. Do not create any manager. This is the common case for most projects; treat it as the expected, healthy outcome, not a step to work around.

**2. If `active_department_leads.length >= 3`, check `.claude/agents/` for existing `mgr-*.md` files.** For each department lead that's active and doesn't yet have a corresponding manager, evaluate whether that manager is relevant to the calling command (mirroring `department-lead-activation`'s per-command department table):

| Manager | Agent name | Corresponds to department lead | Relevant to |
|---|---|---|---|
| Engineering Manager | `mgr-engineering` | `dept-engineering` | `build` |
| Product Manager | `mgr-product` | `dept-product` | `plan` |
| Design Manager | `mgr-design` | `dept-design` | `build` |
| Data Manager | `mgr-data` | `dept-data` | `build` |
| Security Manager | `mgr-security` | `dept-legal-security` | `secure` |
| QA Manager | `mgr-qa` | `dept-qa` | `build` |
| Platform Manager | `mgr-platform` | `dept-devops` | `ship` |
| Research Manager | `mgr-research` | `dept-product` (no dedicated Research department lead exists — this manager rides on Product's activation) | `plan` |
| Growth Manager | `mgr-growth` | `dept-growth` | `launch`, and `plan` when `dept-growth` is active |

A manager's own activation signal is: **its corresponding department lead is in `active_department_leads` AND the total `active_department_leads` count is 3 or more.** Do not create a manager for a department lead that doesn't exist yet, even once the count-of-3 threshold is met elsewhere in the project.

**3. If a signal is true and `.claude/agents/mgr-<name>.md` doesn't already exist in the founder's project:**
- Read the template at `references/template.md` in this skill.
- Fill in the manager-specific sections (remit, responsibilities, activation reason) — its activation reason should name both the corresponding department lead and the project's total department-lead count (e.g. "activated because `dept-engineering` is active and this project now has 4 department leads, past the coordination threshold").
- Write the file to `.claude/agents/mgr-<name>.md` **in the founder's project repository** — never under Wingman's own plugin directory. Same placement rule as department leads and specialists, for the same reason (see `docs/ARCHITECTURE.md` §5).
- Tell the founder, in one plain-language sentence, that a new coordination role was added and why (e.g. "Your project has grown enough that I've added an Engineering Manager to help coordinate the work — you won't need to do anything differently.").
- Add `mgr-<name>` to `active_managers` in `.wingman/state.json` (read the existing file first and append to the array — never drop `active_department_leads` or `active_specialists`; create `state.json` fresh with all three empty arrays if it doesn't exist yet).

**4. If the file already exists, use it as-is** — don't regenerate or overwrite a manager that's already been created and possibly customized for this project.

**5. Do the actual delegated coordination work this turn regardless of file-creation timing**, same as `department-lead-activation` step 5 — dispatch via the Task tool using the `mgr-<name>` agent type, discovered the same way any other project-scoped subagent is.

## Constraints

**MUST:**
- Write manager files only to `.claude/agents/` in the founder's project, never into `plugins/wingman/`.
- Check both conditions (corresponding department lead active, AND 3+ total department leads) before creating a file — never create a manager "just in case" or the moment a single department lead exists.
- Tell the founder in plain language when a new manager is added.

**MUST NOT:**
- Create a manager whose corresponding department lead isn't active, even if the count threshold is met.
- Create all 9 managers on the first run a project happens to cross the threshold — only the ones whose department leads are actually active.
- Treat "a department lead exists" alone as sufficient signal — the count-of-3 threshold is what distinguishes this from just re-running `department-lead-activation` one layer up.

## Rationalizations

| Excuse | Reality |
|---|---|
| "This project has one department lead, might as well add its manager too" | The threshold is 3+ department leads, not 1. A single-department-lead project doesn't need execution-layer coordination — it needs the department lead doing the work. |
| "Managers are cheap, no real cost to creating them early" | Same reasoning `department-lead-activation` already rejects for department leads — every agent file is a context/discoverability cost, and this layer exists specifically to avoid recreating the kitchen-sink problem one level up. |
| "The project will probably grow into needing this" | Prediction isn't evidence — same standard `department-lead-activation` already holds department leads to. |

## Red Flags — Stop and Reconsider

- You're about to create a manager when `active_department_leads.length < 3`.
- You're about to create a manager whose corresponding department lead doesn't exist.
- You're about to write a `mgr-*.md` file into `plugins/wingman/` instead of the founder's own `.claude/agents/`.
- You're about to create more than one manager in a single pipeline run without each having its own true signal.

## Verification

Before creating a file, confirm: (1) `active_department_leads.length >= 3`, read directly from `.wingman/state.json`, not assumed; (2) the corresponding department lead is actually in that array; (3) the target path is under the founder's project's `.claude/agents/`; (4) the file doesn't already exist. After creating it, re-read `.wingman/state.json` to confirm `active_managers` actually includes the new entry and nothing else was dropped.

## Output

No founder-facing template beyond the one-sentence notification in step 3. The manager file itself follows `references/template.md`.

## Anti-Rationalization Defense

### Common Rationalizations

| Excuse | Reality |
|---|---|
| "One department lead is basically complex enough" | The threshold is a specific, checkable number (3+), not a judgment call — this is what makes the gate mechanical rather than a rationalization surface. |
| "I'll create the manager now so it's ready when the project grows" | This is the same "might as well, saves checking later" pattern `department-lead-activation` already names as the kitchen-sink anti-pattern, one layer up. |
| "It's just a coordination role, low stakes to add early" | Every agent file — coordination or execution — has a real context/discoverability tax. "Low stakes" isn't "zero cost." |

### Red Flags

- You're about to create a manager without checking `active_department_leads.length` first.
- You're about to create a Growth or Research manager without `dept-growth` active or a clear plan-stage trigger.
- You're about to skip the `.wingman/state.json` update after creating a manager.

### Anti-Pattern Callouts

- **Premature layering:** Adding the Management Board the moment any department lead exists, recreating the exact always-on-org problem `docs/ARCHITECTURE.md` §2 rejected — just one layer higher than department leads.
- **Silent state desync:** Creating a manager file but forgetting to add it to `.wingman/state.json` — the manager becomes invisible to future activation checks and to `/wingman:evolve`.
