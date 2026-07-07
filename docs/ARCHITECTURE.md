# Wingman Architecture: The Hybrid AI Boardroom

This document is the reference architecture for Wingman. It exists so that any future contributor — human or AI — can understand *why* Wingman is shaped the way it is, not just what files exist. Read this before adding a new agent, command, or skill.

## 1. The problem this solves

Wingman's promise is that a **non-technical founder** can run a full software development lifecycle — plan, build, secure, ship — without reading code or a diff. The mechanism for that is not "a smarter chatbot," it's **structure**: a fixed set of reviewers who gate progress in plain language, and a growing set of specialized workers who do the actual work, organized the way a company organizes itself.

## 2. Why "hybrid" and not a literal 56-agent corporation

An enterprise-scale AI organization (dozens of narrow specialist agents across 8 departments, orchestrated by a stateful graph runtime like LangGraph) is a real and useful *mental model*. It is the wrong *implementation* for a Claude Code plugin, for three concrete reasons:

1. **No persistent runtime.** Claude Code has no long-running multi-process graph server. A subagent is a markdown file invoked transiently through the Task tool inside one session; it does not persist between calls the way a LangGraph node does.
2. **Context is not free.** Every subagent's name and description are loaded into context so the router can select it, even when it's never invoked (this is how Claude Code's own plugin-dev toolkit describes progressive disclosure). Fifty-six always-loaded agent descriptions is a permanent tax paid by every project, including the ones that will never need a Row-Level-Security specialist or a canary-rollback agent.
3. **Most projects don't need most departments.** A founder's first landing page has no database migrations, no production incidents, no GPL license exposure to audit. Pre-building the full roster optimizes for Alphabet-scale problems on day-one MVPs.

**The hybrid resolves this:** keep the corporate hierarchy as the permanent organizing metaphor and naming scheme, but implement the agent population as **two tiers that grow lazily**, gated by real signals from the project — not a fixed roster shipped on install.

## 3. The two-tier agent model

| Tier | Role | Count | When it exists |
|---|---|---|---|
| **Boardroom seats** | Gate reviewers. Never write code — only render a plain-language verdict at a checkpoint. | Fixed: 5 | Every project, from install |
| **Department leads** | Build-time workers. One per corporate department, each covering that department's full remit via its own skills/checklists. | Grows 0 → 8 | Created the first time its department's activation signal is true for the project (§5) |
| **Specialists** | Narrow sub-roles (the full 56-role catalog in `docs/AGENT-ROSTER.md`). | Grows 0 → N | Only created by `/wingman:evolve`, after a department lead shows *repeated* (2+) friction in one narrow area |

This mirrors how an actual seed-stage company staffs itself: a handful of generalists doing everything, specialists hired only once a function is a proven bottleneck.

## 4. The Boardroom (fixed, 5 seats)

Every checkpoint runs all five seats in parallel and consolidates them into one plain-language verdict (see `plugins/wingman/commands/boardroom.md`).

| Seat | File | Lens | Absorbs |
|---|---|---|---|
| Founder | `agents/boardroom-founder.md` | Business/product/market fit | CEO + CPO + CMO — a founder-stage company doesn't need three separate C-suite personas negotiating with each other |
| Engineer | `agents/boardroom-engineer.md` | Correctness, architecture, test coverage | CTO |
| Security | `agents/boardroom-security.md` | Data safety, injection, auth, secrets | Legal & Compliance (license, privacy/GDPR/CCPA) — folded in as checklist items, not a separate seat |
| Design | `agents/boardroom-design.md` | Usability, consistency, dev-experience | — |
| Cost | `agents/boardroom-cost.md` | Compute/token spend, hosting cost, new paid dependencies | CFO |

**Gate rule:** any single `NO_GO` verdict makes the consolidated bottom line `DO NOT SHIP`, regardless of the other four. Any `GO_WITH_CONCERNS` (with no `NO_GO`) yields `GO WITH CHANGES`. Only all-`GO` is a clean `GO`. The founder always makes the final call via `AskUserQuestion` — the boardroom informs the decision, it doesn't make it.

### Checkpoint audit log

Every boardroom run appends one line to `.wingman/checkpoints.jsonl` at the project root (git-committed, human-readable):

```json
{
  "checkpoint_id": "2026-07-07T14-32-00Z-plan",
  "stage": "plan",
  "scope_ref": "docs/wingman/plans/2026-07-07-billing-integration.md",
  "seats": [
    { "seat": "founder",  "verdict": "GO",              "summary": "Solves the stated problem, scope is right-sized." },
    { "seat": "engineer", "verdict": "GO_WITH_CONCERNS", "summary": "No test plan for the webhook retry path yet." },
    { "seat": "security", "verdict": "GO",              "summary": "No new data exposure identified." },
    { "seat": "design",   "verdict": "GO",              "summary": "N/A — no user-facing surface in this stage." },
    { "seat": "cost",     "verdict": "GO",              "summary": "No new paid services introduced." }
  ],
  "bottom_line": "GO_WITH_CHANGES",
  "founder_decision": "fix_concerns_first",
  "founder_notes": "",
  "next_stage": "build"
}
```

This is deliberately **not cryptographically signed**. Signing solves multi-party adversarial trust (departments that might lie to each other) — a problem Wingman doesn't have, since there is exactly one trust root: the founder. A plain, git-tracked, append-only log gives a full audit trail without security theater.

## 5. Department leads (grow 0 → 8, per project)

One lead subagent per corporate department. Each lead covers its department's *entire* remit through its own skills/checklists — it is not itself split into the 56 sub-roles; those are specialist promotions (§6).

| # | Department | Lead agent | Activation signal | Delegating command |
|---|---|---|---|---|
| 1 | Product Management | `dept-product` | Always — every project has requirements | `/wingman:plan` |
| 2 | UX/UI & Brand | `dept-design` | Project has any user-facing surface | `/wingman:build` |
| 3 | Tech & Engineering | `dept-engineering` | Always | `/wingman:build` |
| 4 | Data & Analytics | `dept-data` | Codebase has (or the plan introduces) a schema/migrations directory | `/wingman:build` |
| 5 | QA & Peer Review | `dept-qa` | Always | `/wingman:build`'s verification step |
| 6 | Legal, Security & Compliance | `dept-legal-security` | Project touches auth, payments, or personal data | `/wingman:secure` |
| 7 | DevOps & SRE | `dept-devops` | Project has CI config, a Dockerfile, or has shipped once already | `/wingman:ship` |
| 8 | Revenue, Marketing & Ops | `dept-growth` | Founder requests docs/SEO/launch copy | `/wingman:launch` *(planned — see Open Items)* |

**Boardroom seats vs. department leads are different roles by design:** a boardroom seat reviews and gates; a department lead produces the thing being reviewed. This avoids the 1:1 redundancy in a literal corporate org chart (e.g. a CPO *and* a separate Requirements Analyst covering overlapping ground) — in Wingman, the Founder seat reviews what `dept-product` produces, full stop.

Department-lead files don't exist in a fresh install. `/wingman:plan` checks the activation signals above at the start of every planning pass and creates the relevant lead file (from the standard agent-file template) the first time it's actually warranted. Once created, it persists for the life of the project.

## 6. Specialists (grow 0 → N, per project, via `/wingman:evolve`)

The full 56-role catalog from the original corporate blueprint lives in `docs/AGENT-ROSTER.md` as **candidates**, organized under their department. None of them are files until `/wingman:evolve` promotes one:

- A department lead repeatedly hits friction in one narrow sub-task (2+ occurrences logged via `/wingman:learn` or surfaced in a `/wingman:retro`).
- `/wingman:evolve` proposes splitting that sub-task into its own dedicated specialist subagent, names the specific candidate role from the catalog (or a new one if the catalog doesn't cover it), and asks the founder to approve before creating it.

This means two different Wingman-managed projects end up with different specialist rosters — a fintech project accumulates Legal/Security specialists fast (PCI, fraud review); a content site may never need one. That's intentional: the roster should reflect what the company actually does, not a template applied uniformly regardless of fit.

## 7. Cross-departmental protocols

| Corporate concept | Wingman mechanism |
|---|---|
| Boardroom meeting / phase gateway | `/wingman:boardroom` — parallel dispatch of the 5 seats, consolidated verdict, `.wingman/checkpoints.jsonl` record (§4) |
| Cross-departmental PR loop (QA + Security run together; Security can block and reassign) | `/wingman:build`'s closing verification step and `/wingman:secure`'s gate. Read-only review passes (`dept-qa`, `boardroom-security`) dispatch in parallel — same one-message/multiple-Task-call pattern `/wingman:boardroom` already uses. |
| Automated error-correction loop (prod error → root-cause → hotfix → re-verify) | `/wingman:hotfix` *(planned — see Open Items)*: founder pastes a production error (or it arrives via an error-tracking MCP connector wired up through `/wingman:telemetry`) → `systematic-debugging` skill investigates → `dept-engineering` fixes → `dept-qa` verifies → boardroom checkpoint → `/wingman:ship`. |

## 8. Model tiering

Claude Code subagents support a `model:` frontmatter field. Assign by how expensive a wrong call is, not by department:

- **Opus-tier** (`model: opus`) — `boardroom-engineer`, `boardroom-security`, and `dept-engineering` when doing architecture or threat-modeling work.
- **Sonnet-tier** (`model: inherit`, default) — `boardroom-founder`, `boardroom-design`, `boardroom-cost`, and most department-lead build work.
- **Haiku-tier** (`model: haiku`) — high-volume, low-risk text generation: changelog/PR copy, `/wingman:learn` log entries, `dept-growth`'s routine copywriting.

## 9. Relationship to vendored reference repositories

`vendor/` holds 16 upstream projects (all MIT or Apache-2.0, except `andrej-karpathy-skills` which has no LICENSE file and is treated as idea-only/describe-don't-quote) as pinned git submodules — **reference material for design and prompt-writing, not runtime dependencies.** None of Wingman's plugin code depends on their bespoke infrastructure (`gsd-sdk`, `gbrain`, AgentShield, the instinct-CLI, npm-published CLIs, hosted dashboards); each has its own installer/runtime that Wingman deliberately does not take on. See `ATTRIBUTIONS.md` for exact file-level provenance and a systematic per-repo research writeup.

| Repo | What Wingman draws from it |
|---|---|
| `obra/superpowers` | Self-contained, dependency-free discipline skills: `verification-before-completion`, `writing-plans`, `systematic-debugging`. Adapted near-verbatim (MIT, attributed) since they're already excellent and portable. |
| `garrytan/gstack` | The multi-perspective plan-review concept (`plan-ceo-review`, `plan-eng-review`, `plan-design-review`, `plan-devex-review`) — the direct inspiration for the Boardroom's parallel-seats-then-consolidate pattern; also the "EXIT PLAN MODE GATE" idea (verify a required report section exists in the plan file before allowing `ExitPlanMode`) behind the `boardroom-checkpoint` hook. |
| `jnuyens/gsd-plugin` | The phase-gate pattern: a threat register with explicit CLOSED/OPEN dispositions that blocks advancement (`secure-phase`), and the preflight-checks-then-PR-body pattern (`ship`) — reimplemented in `/wingman:secure` and `/wingman:ship` without the upstream SDK dependency. Also the small-bundled-MCP-server-for-state pattern (planned, see Open Items). |
| `affaan-m/ECC` | Command-surface patterns (`checkpoint.md`, `evolve.md`, `security-scan.md` checklist structure) informing `/wingman:evolve` and `/wingman:secure`'s checklist shape. |
| `anthropics/claude-plugins-official` | The immutable-slug + renames-map convention for any future command/agent rename; validation of the LLM-as-gate-reviewer pattern (structurally the same idea as the Boardroom) in production CI. |
| `wshobson/agents` | The "index file ≤150 lines, detail lives in `docs/`" documentation discipline (already how `CLAUDE.md`/`ARCHITECTURE.md` are split); the globally-unique agent-name convention enforced by `scripts/validate-structure.mjs`; the 3-tier finding severity model (Critical/Should-Fix/Consider) behind Boardroom verdict framing. |
| `davila7/claude-code-templates` | Studied primarily as an anti-pattern to avoid (kitchen-sink scale, technical-user-only content, requires a hosted dashboard/analytics backend) — its narrowly-scoped `owasp-security` skill is a usable reference for `/wingman:secure` content once translated to plain language. |
| `VoltAgent/awesome-claude-code-subagents` | Studied primarily as an anti-pattern (154 always-loaded generic agents) — the "category as installable plugin" packaging idea is the one transferable concept, mapped to Wingman's lazy department-lead activation instead of pre-loading everything. |
| `Leonxlnx/taste-skill`, `pbakaus/impeccable`, `nextlevelbuilder/ui-ux-pro-max-skill` | Merged into `skills/design-taste` — the countable-rule checklist discipline, the slop-vs-quality/accessibility category split, and a lightweight product-type reference table, respectively. Paid-API and browser-extension sub-skills from these repos explicitly excluded. |
| `DietrichGebert/ponytail` | `skills/engineering-minimalism`'s decision ladder and "when NOT to be lazy" carve-out. |
| `JuliusBrussee/caveman` | `skills/token-economy`, deliberately scoped to internal-only channels — never founder-facing output, which stays governed by `plain-language-checkpoint`. |
| `multica-ai/andrej-karpathy-skills` | Assumption-surfacing and verifiable-success-criteria ideas folded into `skills/engineering-minimalism`, restated in Wingman's own words (no LICENSE file in this repo — not quoted). |
| `jeffallan/claude-skills` | The "description trap" finding (trigger conditions belong in the frontmatter `description`, not just the body) — enforced as a warning in `scripts/validate-structure.mjs`; the two-tier `SKILL.md`/`references/` split. |
| `addyosmani/agent-skills` | The single most load-bearing pattern adopted: Skill(how)/Persona(who)/Command(when) with the hard rule "personas never call personas, only commands orchestrate" (`commands/boardroom.md`); the parallel-fan-out-then-merge-in-main-context pattern; the Rationalizations/Red-Flags/Verification triad now required in every Wingman skill. |

## 10. Rollout sequencing

- **v1** (current scaffold): 5 boardroom seats (all built), 4 pipeline commands (`plan`/`build`/`secure`/`ship`), 5 adaptive commands (`retro`/`learn`/`evolve`/`harness`/`telemetry`). No department leads yet — pipeline commands do the work inline.
- **v1.1**: add `.wingman/checkpoints.jsonl` audit logging to `/wingman:boardroom` (a lightweight `## Wingman Boardroom Checkpoint` marker written to the plan file, and enforced by the `boardroom-checkpoint` hook, already exist — the structured JSONL log is the remaining piece).
- **v2**: add department-lead activation logic to `/wingman:plan` (§5's signal table) and the first lead agent templates, created on demand.
- **v3+**: `/wingman:evolve` begins promoting specialists out of department leads as real projects generate repeated, evidenced friction (§6). The 56-role catalog fills in organically and differently per project — never as a fixed upfront set.

## Open items (planned, not yet built)

- `commands/launch.md` — public-facing launch prep (changelog, docs, announcement copy), the `dept-growth` delegating command.
- `commands/hotfix.md` — the production error-correction loop.
- Department-lead agent templates and the activation-signal check inside `/wingman:plan`.
- `.wingman/checkpoints.jsonl` writer wired into `/wingman:boardroom`.
