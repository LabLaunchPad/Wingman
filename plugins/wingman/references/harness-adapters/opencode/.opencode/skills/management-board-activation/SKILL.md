---
name: management-board-activation
description: Use immediately after department-lead-activation at the start of /wingman:discovery, /wingman:architecture, /wingman:uxflow, /wingman:build, /wingman:ship, /wingman:launch, or /wingman:hotfix — every command that can create a conditionally-activated department lead must run this check afterward, since that creation is exactly what can cross the threshold. Checks whether this project has crossed the complexity threshold for a Management Board manager and creates one in the founder's own repo if so. Triggers only once a project has 3+ active CONDITIONALLY-activated department leads (Design/Data/Legal-Security/DevOps/Growth); never on a fresh or simple project, and never merely because the 3 always-active departments (Product/Engineering/QA) exist.
---

# Management Board Activation

## Overview

Wingman's Management Board (Engineering, Product, Design, Data, Security, QA, Platform, Research, Growth Managers — see `docs/ARCHITECTURE.md` §5a) sits between the 7-seat Boardroom and the department leads. It doesn't exist at install time, and it doesn't exist for most projects, ever. This skill is the shared mechanism every pipeline command uses to check whether this project has grown complex enough to actually need execution-layer coordination, and to create the relevant manager's file if it's needed and doesn't exist yet.

**Core principle:** a Manager exists only once its corresponding department lead exists *and* the project as a whole has crossed a real complexity threshold — never on day one, never "just in case." This mirrors `department-lead-activation`'s own lazy-growth discipline one layer up; it does not introduce a second, independent gating system.

**Critical: the threshold counts only conditionally-activated department leads** (`dept-design`, `dept-data`, `dept-legal-security`, `dept-devops`, `dept-growth`) — never `dept-product`, `dept-engineering`, or `dept-qa`, which are unconditionally active on every project regardless of complexity (see `department-lead-activation`'s table). Found via a real dogfooding pass (2026-07-14): counting all active leads meant the 3-lead threshold was met by Build time on literally every project, including the simplest possible one (a single health-check endpoint, no UI, no database, no auth) — the "complexity gate" wasn't gating on complexity at all, since those 3 departments exist unconditionally. Counting only the 5 conditional departments restores the actual intent: the Management Board activates when a project has genuinely grown complex (3+ of Design/Data/Legal-Security/DevOps/Growth active), not merely because it reached Build.

## When To Use

Immediately after `department-lead-activation` runs, at the start of `/wingman:discovery`, `/wingman:architecture`, `/wingman:uxflow`, `/wingman:build`, `/wingman:ship`, `/wingman:launch`, or `/wingman:hotfix` — every command that can create a conditionally-activated department lead runs this check right after, in the same pass, since that creation is exactly what can cross the threshold. Not a separate always-checked gate on commands that never touch a conditional department lead.

## Core Workflow

**1. Read `.wingman/state.json`.** If it doesn't exist yet, stop — there's nothing to check. Otherwise, filter `active_department_leads` to just the **conditionally-activated** departments — `dept-design`, `dept-data`, `dept-legal-security`, `dept-devops`, `dept-growth` — discarding `dept-product`, `dept-engineering`, and `dept-qa` from this count entirely (they're always active and count for nothing here). If that filtered list has fewer than 3 entries, stop — the complexity threshold isn't met. Do not create any manager. This is the common case for most projects, including ones already well into Build; treat it as the expected, healthy outcome, not a step to work around.

**2. If the conditional-department count is >= 3, check `.claude/agents/` for existing `mgr-*.md` files.** For **every** department lead currently in `active_department_leads` (including `dept-product`/`dept-engineering`/`dept-qa`, once the conditional-count threshold above is met — their own presence just doesn't count *toward* that threshold) that doesn't yet have a corresponding manager, **create the file regardless of whether the calling command's own stage appears in that manager's "Relevant to" column below** — creation eligibility is just "department lead active + threshold met," full stop. Use the table only to decide, in step 5, whether to actually dispatch that manager's coordination work *this turn*:

| Manager | Agent name | Corresponds to department lead | Relevant to |
|---|---|---|---|
| Engineering Manager | `mgr-engineering` | `dept-engineering` | `build` |
| Product Manager | `mgr-product` | `dept-product` | `discovery` |
| Design Manager | `mgr-design` | `dept-design` | `uxflow`, `build` |
| Data Manager | `mgr-data` | `dept-data` | `build` |
| Security Manager | `mgr-security` | `dept-legal-security` | `build` (folded in from the former `secure` stage — see `commands/pipeline/build.md`'s Definition-of-Done gate) |
| QA Manager | `mgr-qa` | `dept-qa` | `build` |
| Platform Manager | `mgr-platform` | `dept-devops` | `ship` |
| Research Manager | `mgr-research` | `dept-product` (no dedicated Research department lead exists — this manager rides on Product's activation) | `discovery` |
| Growth Manager | `mgr-growth` | `dept-growth` | `launch`, and `discovery` when `dept-growth` is active |

**"Relevant to" note (fixed 2026-07-14, found via a real dogfooding pass of the 7-stage pipeline):** this column previously named retired stages (`plan`, `secure`) from before the MVP2 pipeline rename, and Design Manager's row omitted `uxflow` even though `uxflow.md` explicitly checks for it — a real, reproducible inconsistency between the calling command's own instructions and this table. If a department lead is active, the count-of-3 threshold is met, and its manager doesn't exist yet, create it the first time **any** command whose stage appears in that manager's "Relevant to" column runs — do not wait for every possible stage to run first, and do not skip creating a manager just because the currently-running command isn't the *only* one listed for it.

**"Relevant to" no longer gates creation — it only describes when a manager's coordination work
gets dispatched (fixed after a second real dogfooding pass, 2026-07-15).** The rule above has a
real gap: `mgr-product` and `mgr-research`'s only "Relevant to" entry is `discovery`, a stage that
typically runs exactly once, early, before a project has usually accumulated the 3+ conditional
department leads this threshold requires. Confirmed directly in that dogfood run: the threshold
crossed at Build, `discovery` never ran again, and both managers stayed permanently uncreated for
the rest of the project's life — not because their signal was ever false, but because the *only*
command that ever checks their eligibility had already run and won't run again. Fixed: **every**
command that invokes this skill checks **every** currently-missing manager whose corresponding
department lead is active, not just the ones whose "Relevant to" column names the currently-running
stage. The "Relevant to" table still matters for step 5 (only dispatch a manager's actual
coordination work when its own stage is genuinely in scope this turn) — it just no longer decides
whether the manager's file gets created in the first place.

A manager's own activation signal is: **its corresponding department lead is in `active_department_leads` AND the count of *conditionally-activated* department leads (Design/Data/Legal-Security/DevOps/Growth only) is 3 or more.** Do not create a manager for a department lead that doesn't exist yet, even once the conditional-count threshold is met elsewhere in the project. Note this applies even to `mgr-product`/`mgr-engineering`/`mgr-qa` themselves — their own departments don't count toward the threshold, but once 3+ conditional departments push the project past it, their managers become eligible the same as any other's.

**3. If a signal is true and `.claude/agents/mgr-<name>.md` doesn't already exist in the founder's project:**
- Read the template at `references/template.md` in this skill.
- Fill in the manager-specific sections (remit, responsibilities, activation reason) — its activation reason should name both the corresponding department lead and the project's total department-lead count (e.g. "activated because `dept-engineering` is active and this project now has 4 department leads, past the coordination threshold").
- Write the file to `.claude/agents/mgr-<name>.md` **in the founder's project repository** — never under Wingman's own plugin directory. Same placement rule as department leads and specialists, for the same reason (see `docs/ARCHITECTURE.md` §5).
- Tell the founder, in one plain-language sentence, that a new coordination role was added and why (e.g. "Your project has grown enough that I've added an Engineering Manager to help coordinate the work — you won't need to do anything differently.").
- Add `mgr-<name>` to `active_managers` in `.wingman/state.json` (read the existing file first and append to the array — never drop `active_department_leads` or `active_specialists`; create `state.json` fresh with all three empty arrays if it doesn't exist yet).

**4. If the file already exists, use it as-is** — don't regenerate or overwrite a manager that's already been created and possibly customized for this project.

**5. Dispatch a manager's actual coordination work this turn only if its own stage is relevant to the calling command** (per the "Relevant to" column) — a manager created in step 3 because the threshold was crossed by a *different* stage's department lead doesn't need dispatching until its own relevant stage actually runs. This is the one place the "Relevant to" table still matters: it gates *dispatch*, not *creation* (see the step 2 note above). Dispatch via the Task tool using the `mgr-<name>` agent type, discovered the same way any other project-scoped subagent is.

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
| "This project has one department lead, might as well add its manager too" | The threshold is 3+ *conditionally-activated* department leads, not 1, and never counts `dept-product`/`dept-engineering`/`dept-qa` (always active). A single conditional department lead doesn't need execution-layer coordination — it needs the department lead doing the work. |
| "This project reached Build, so Product+Engineering+QA are all active — that's 3, might as well activate the Board" | This is the exact miscounting a real dogfooding pass caught: those 3 departments are unconditionally active on every project and must never be counted toward the threshold. Reaching Build is not the same as being complex. |
| "Managers are cheap, no real cost to creating them early" | Same reasoning `department-lead-activation` already rejects for department leads — every agent file is a context/discoverability cost, and this layer exists specifically to avoid recreating the kitchen-sink problem one level up. |
| "The project will probably grow into needing this" | Prediction isn't evidence — same standard `department-lead-activation` already holds department leads to. |

## Red Flags — Stop and Reconsider

- You're about to create a manager when the *conditionally-activated* department count is below 3 — including the common trap of counting `dept-product`/`dept-engineering`/`dept-qa` toward that number.
- You're about to create a manager whose corresponding department lead doesn't exist.
- You're about to write a `mgr-*.md` file into `plugins/wingman/` instead of the founder's own `.claude/agents/`.
- You're about to create more than one manager in a single pipeline run without each having its own true signal.

## Verification

Before creating a file, confirm: (1) the count of *conditionally-activated* leads only (`dept-design`/`dept-data`/`dept-legal-security`/`dept-devops`/`dept-growth`, excluding `dept-product`/`dept-engineering`/`dept-qa`) is `>= 3`, read directly from `.wingman/state.json`, not assumed; (2) the corresponding department lead is actually in that array; (3) the target path is under the founder's project's `.claude/agents/`; (4) the file doesn't already exist. After creating it, re-read `.wingman/state.json` to confirm `active_managers` actually includes the new entry and nothing else was dropped.

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

- You're about to create a manager without checking the conditionally-activated department count first, or you're counting an always-active department (Product/Engineering/QA) toward that threshold.
- You're about to create a Growth or Research manager without `dept-growth` active or a clear plan-stage trigger.
- You're about to skip the `.wingman/state.json` update after creating a manager.

### Anti-Pattern Callouts

- **Premature layering:** Adding the Management Board the moment any department lead exists, recreating the exact always-on-org problem `docs/ARCHITECTURE.md` §2 rejected — just one layer higher than department leads.
- **Silent state desync:** Creating a manager file but forgetting to add it to `.wingman/state.json` — the manager becomes invisible to future activation checks and to `/wingman:evolve`.
