---
name: department-lead-activation
description: Use at the start of /wingman:plan, /wingman:build, /wingman:secure, or /wingman:ship — checks whether a department lead is needed for this project and creates it in the founder's own repo if so. Triggers whenever a pipeline stage command is about to delegate build-time work and needs to know which department leads exist or should be created.
---

# Department Lead Activation

## Overview

Wingman's department leads (Product, Design, Engineering, Data, QA, Legal/Security, DevOps, Growth — see `docs/ARCHITECTURE.md` §5) don't exist at install time. This skill is the shared mechanism every pipeline command uses to check whether a department's activation signal is true for the current project, and to create that department's lead file if it's needed and doesn't exist yet.

**Core principle:** create exactly the department leads a project's real signals call for — never more, never speculatively, and never inside Wingman's own plugin directory.

## When To Use

At the start of `/wingman:plan` (checks Product, always), `/wingman:build` (checks Design, Engineering, Data, QA), `/wingman:secure` (checks Legal/Security), and `/wingman:ship` (checks DevOps).

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
- Fill in the department-specific sections (remit, checklist, activation reason) from the table above and `docs/ARCHITECTURE.md` §5.
- Write the file to `.claude/agents/dept-<name>.md` **in the founder's project repository** — never under Wingman's own plugin directory (`plugins/wingman/...`). This distinction matters: see `docs/ARCHITECTURE.md` §5 for why.
- Tell the founder, in one plain-language sentence, that a new specialist was added to their project and why (e.g. "Since this touches customer payments, I've added a Legal & Security lead to your project's team going forward.").

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

Before creating a file, confirm: (1) the activation signal is actually true, with a concrete piece of evidence (a file found, a grep match, an explicit founder request) — not a guess; (2) the target path is under the founder's project's `.claude/agents/`, not under Wingman's plugin directory; (3) the file doesn't already exist.

## Output

No founder-facing template beyond the one-sentence notification in step 3. The department-lead file itself follows `references/template.md`.
