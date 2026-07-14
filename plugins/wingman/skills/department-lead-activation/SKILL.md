---
name: department-lead-activation
description: Use at the start of /wingman:discovery, /wingman:architecture, /wingman:uxflow, /wingman:build, or /wingman:ship — checks whether a department lead is needed for this project and creates it in the founder's own repo if so. Triggers whenever a pipeline stage command is about to delegate build-time work and needs to know which department leads exist or should be created.
---

# Department Lead Activation

## Overview

Wingman's department leads (Product, Design, Engineering, Data, QA, Legal/Security, DevOps, Growth — see `docs/ARCHITECTURE.md` §5) don't exist at install time. This skill is the shared mechanism every pipeline command uses to check whether a department's activation signal is true for the current project, and to create that department's lead file if it's needed and doesn't exist yet.

**Core principle:** create exactly the department leads a project's real signals call for — never more, never speculatively, and never inside Wingman's own plugin directory.

## When To Use

At the start of `/wingman:discovery` (checks Product, always), `/wingman:architecture` (checks Engineering, always), `/wingman:uxflow` (checks Design), `/wingman:build` (checks Design, Engineering, Data, QA, and Legal/Security — Legal/Security's dedicated review now happens inline as part of Build's own Definition-of-Done gate, not a separate `/wingman:secure` stage), and `/wingman:ship` (checks DevOps).

## Core Workflow

**1. Check whether `.claude/agents/` exists in the founder's project.** If not, this is the first department lead for this project — create the directory.

**2. For each department relevant to the calling command, evaluate its activation signal against the actual project:**

| Department | Lead agent name | Activation signal | Check method |
|---|---|---|---|
| Product Management | `dept-product` | Always | No check needed — always active |
| UX/UI & Brand | `dept-design` | Project has any user-facing surface | Look for a frontend framework, HTML templates, or a UI component directory in the codebase |
| Tech & Engineering | `dept-engineering` | Always | No check needed — always active |
| Data & Analytics | `dept-data` | Codebase has, or the current plan introduces, a schema/migrations directory | `Glob` for `**/migrations/**`, `**/schema.*`, or an ORM config; also check the current plan file for new data-model tasks |
| QA & Peer Review | `dept-qa` | Always | No check needed — always active |
| Legal, Security & Compliance | `dept-legal-security` | Project touches auth, payments, or personal data | `Grep` for auth/session/payment-provider/PII-handling code, or check the current plan for such tasks |
| DevOps & SRE | `dept-devops` | Project has CI config, a Dockerfile, or has shipped once already | Look for `.github/workflows/`, `Dockerfile`, or a prior `/wingman:ship` entry in `.wingman/checkpoints.jsonl` |
| Revenue, Marketing & Ops | `dept-growth` | Founder explicitly requests docs/SEO/launch copy | Only ever triggered by an explicit founder request, never inferred |

**3. If a signal is true and `.claude/agents/dept-<name>.md` doesn't already exist in the founder's project:**
- Read the template at `references/template.md` in this skill.
- Fill in the department-specific sections (remit, checklist, activation reason) using the table above plus the department's evident remit — its activation signal defines what it owns (e.g. a `dept-legal-security` triggered by payment-handling code owns exactly that risk surface). The `references/template.md` placeholders show what each section needs; everything required to fill them is in this skill, not in a separate doc (the repo-root `docs/` folder is not part of the installed plugin, so it can't be a runtime dependency).
- Write the file to `.claude/agents/dept-<name>.md` **in the founder's project repository** — never under Wingman's own plugin directory (`plugins/wingman/...`). This distinction matters: see `docs/ARCHITECTURE.md` §5 for why.
- Tell the founder, in one plain-language sentence, that a new specialist was added to their project and why (e.g. "Since this touches customer payments, I've added a Legal & Security lead to your project's team going forward.").
- Add `dept-<name>` to `active_department_leads` in `.wingman/state.json` (read the existing file first and append to the array — never drop `active_specialists` or the rest of the file's contents; create `state.json` fresh with empty arrays if it doesn't exist yet). This is the only place that roster is tracked, so skipping this step makes the department lead invisible to `/wingman:evolve` and to a fresh session recovering state.

**4. If the file already exists, use it as-is** — don't regenerate or overwrite a department lead that's already been created and possibly customized for this project.

**5. Do the actual delegated work this turn regardless of file-creation timing.** Whether the department-lead file was just created or already existed, dispatch to it via the Task tool using its `dept-<name>` agent type for this turn's work. Newly-created project-level agents under `.claude/agents/` are discovered the same way any other project subagent is — no plugin reload is needed, because this is a project-scoped file, not a plugin-scoped one.

## Constraints

**MUST:**
- Write department-lead files only to `.claude/agents/` in the founder's project, never into `plugins/wingman/`.
- Check the activation signal before creating a file — never create a department lead "just in case."
- Tell the founder in plain language when a new department lead is added.

**MUST NOT:**
- Recreate or overwrite an existing department-lead file.
- Create all 8 department leads on the first run regardless of signals — this is the exact kitchen-sink anti-pattern `docs/ARCHITECTURE.md` and `docs/AGENT-ROSTER.md` warn against.
- Infer the Growth department's activation from anything other than an explicit founder request.

## Rationalizations

| Excuse | Reality |
|---|---|
| "Might as well create all 8 now, saves checking later" | This is the literal kitchen-sink anti-pattern the whole hybrid model exists to avoid — see `docs/ARCHITECTURE.md` §2. |
| "The signal is ambiguous, I'll create it to be safe" | An ambiguous signal is a reason to look closer or ask the founder, not a reason to default to "create." |
| "It's just a file, no real cost to creating it early" | Every existing agent (project or plugin) has some context/discoverability cost, and an unused department lead is exactly the kind of scaffolding `engineering-minimalism` argues against. |

## Red Flags — Stop and Reconsider

- You're about to write a `dept-*.md` file into `plugins/wingman/` instead of the founder's own `.claude/agents/`.
- You're about to create a department lead without a true activation signal.
- You're about to overwrite an existing department-lead file the founder may have customized.

## Verification

Before creating a file, confirm: (1) the activation signal is actually true, with a concrete piece of evidence (a file found, a grep match, an explicit founder request) — not a guess; (2) the target path is under the founder's project's `.claude/agents/`, not under Wingman's plugin directory; (3) the file doesn't already exist. After creating it, re-read `.wingman/state.json` to confirm `active_department_leads` actually includes the new entry and nothing else was dropped.

## Output

No founder-facing template beyond the one-sentence notification in step 3. The department-lead file itself follows `references/template.md`.

## Anti-Rationalization Defense

### Common Rationalizations

| Excuse | Reality |
|---|---|
| "Might as well create all 8 now, saves checking later" | This is the literal kitchen-sink anti-pattern the whole hybrid model exists to avoid — see `docs/ARCHITECTURE.md` §2. |
| "The signal is ambiguous, I'll create it to be safe" | An ambiguous signal is a reason to look closer or ask the founder, not a reason to default to "create." |
| "It's just a file, no real cost to creating it early" | Every existing agent has some context/discoverability cost, and an unused department lead is exactly the kind of scaffolding `engineering-minimalism` argues against. |
| "The founder will probably need this department eventually" | Prediction isn't evidence. Create only when the activation signal is true *now*, not when you anticipate it might be. |
| "I'll create it in the plugin directory for easy access" | Anything written into Wingman's plugin directory can be silently wiped on the next plugin update. Write to the founder's project, never to `plugins/wingman/`. |
| "The activation check is trivial, I'll skip it" | The check is trivial. The discipline of not creating speculative infrastructure is not. Check the signal. |

### Red Flags

- You're about to write a `dept-*.md` file into `plugins/wingman/` instead of the founder's own `.claude/agents/`.
- You're about to create a department lead without a true activation signal.
- You're about to overwrite an existing department-lead file the founder may have customized.
- You're creating more than one department lead in a single pipeline run without multiple true signals.
- You're creating the Growth department lead from anything other than an explicit founder request.
- You're about to skip the `.wingman/state.json` update after creating a department lead.

### Anti-Pattern Callouts

- **Kitchen-sink activation:** Creating all 8 department leads on first run because "we'll need them eventually." The lazy-creation model exists to avoid this exact bloat.
- **Plugin-directory writes:** Writing department-lead files to `plugins/wingman/` instead of the founder's project. These get wiped on update and don't belong in a shared install.
- **Silent state desync:** Creating a department-lead file but forgetting to add it to `.wingman/state.json` — the lead becomes invisible to `/wingman:evolve` and fresh sessions.
