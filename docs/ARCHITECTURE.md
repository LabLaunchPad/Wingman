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
| 8 | Revenue, Marketing & Ops | `dept-growth` | Founder requests docs/SEO/launch copy | `/wingman:launch` |

**Boardroom seats vs. department leads are different roles by design:** a boardroom seat reviews and gates; a department lead produces the thing being reviewed. This avoids the 1:1 redundancy in a literal corporate org chart (e.g. a CPO *and* a separate Requirements Analyst covering overlapping ground) — in Wingman, the Founder seat reviews what `dept-product` produces, full stop.

Department-lead files don't exist in a fresh install. Each of the four delegating commands checks its relevant activation signals above at the start of its run and creates the relevant lead file (from the standard template in `skills/department-lead-activation/references/template.md`) the first time it's actually warranted. Once created, it persists for the life of the project.

**Where these files actually live is load-bearing, not incidental.** Department-lead agents are written to **`.claude/agents/dept-<name>.md` in the founder's own project repository — never into Wingman's own plugin installation directory.** Two reasons:
1. Wingman's plugin files live under Claude Code's plugin cache, resynced from the marketplace source; anything written there by a running session risks silent loss on the next plugin update, and there's no guaranteed way to make a freshly-written *plugin* agent file discoverable within the same session without a reload.
2. Claude Code natively supports **project-scoped** subagents — `.claude/agents/*.md` in a project, auto-discovered with no manifest — which is exactly the right scope for a per-project, lazily-grown roster. It also matches intent: each founder's project accumulates its *own* department-lead roster in *their* repo, not a shared one baked into Wingman.

The mechanism for detecting signals and writing these files is `skills/department-lead-activation`, shared by all four delegating commands rather than duplicated in each.

## 6. Specialists (grow 0 → N, per project, via `/wingman:evolve`)

The full 56-role catalog from the original corporate blueprint lives in `docs/AGENT-ROSTER.md` as **candidates**, organized under their department. None of them are files until `/wingman:evolve` promotes one:

- A department lead repeatedly hits friction in one narrow sub-task (2+ occurrences logged via `/wingman:learn`, surfaced in `docs/wingman/retros.md`, or visible as repeated `GO_WITH_CONCERNS`/`NO_GO` on the same topic in `.wingman/checkpoints.jsonl`).
- `/wingman:evolve` (via the `skills/evolve-promotion` mechanism) proposes splitting that sub-task into its own dedicated specialist subagent, names the specific candidate role from the catalog (or a new one if the catalog doesn't cover it), and asks the founder to approve before creating it.

**Every artifact `/wingman:evolve` promotes — specialist agent, command, or skill — follows the exact same placement rule as department leads (§5): written into the founder's own project under `.claude/` (`agents/`, `commands/`, or `skills/` as appropriate), never into Wingman's own plugin directory.** "Wingman's plugin directory" means the founder's locally-installed copy, which gets resynced from the marketplace source — every one of these artifacts is specific to this founder's own project/patterns anyway, not a general-purpose Wingman capability, so the plugin directory is never the right home for them.

This means two different Wingman-managed projects end up with different specialist rosters — a fintech project accumulates Legal/Security specialists fast (PCI, fraud review); a content site may never need one. That's intentional: the roster should reflect what the company actually does, not a template applied uniformly regardless of fit.

## 7. Cross-departmental protocols

| Corporate concept | Wingman mechanism |
|---|---|
| Boardroom meeting / phase gateway | `/wingman:boardroom` — parallel dispatch of the 5 seats, consolidated verdict, `.wingman/checkpoints.jsonl` record (§4) |
| Cross-departmental PR loop (QA + Security run together; Security can block and reassign) | `/wingman:build`'s closing verification step and `/wingman:secure`'s gate. Read-only review passes (`dept-qa`, `boardroom-security`) dispatch in parallel — same one-message/multiple-Task-call pattern `/wingman:boardroom` already uses. |
| Automated error-correction loop (prod error → root-cause → hotfix → re-verify) | `/wingman:hotfix`: founder pastes a production error (or it arrives via an error-tracking MCP connector wired up through `/wingman:telemetry`) → `systematic-debugging` skill investigates → `dept-engineering` fixes → `dept-qa` verifies → boardroom checkpoint → `/wingman:ship`. |

## 8. Model tiering

Claude Code subagents support a `model:` frontmatter field. Assign by how expensive a wrong call is, not by department:

- **Opus-tier** (`model: opus`) — `boardroom-engineer`, `boardroom-security`, and `dept-engineering` when doing architecture or threat-modeling work.
- **Sonnet-tier** (`model: inherit`, default) — `boardroom-founder`, `boardroom-design`, `boardroom-cost`, and most department-lead build work.
- **Haiku-tier** (`model: haiku`) — high-volume, low-risk text generation: changelog/PR copy, `/wingman:learn` log entries, `dept-growth`'s routine copywriting.

## 9. Relationship to vendored reference repositories

`vendor/` holds 16 upstream projects, all MIT or Apache-2.0 (including `andrej-karpathy-skills`, MIT-declared in its `plugin.json`/`README.md`/`SKILL.md` frontmatter despite having no standalone `LICENSE` file — corrected 2026-07-08 from an earlier, inaccurate "no license" claim in this doc; its content is still restated in Wingman's own words rather than quoted, which was and remains the right approach regardless), as pinned git submodules — **reference material for design and prompt-writing, not runtime dependencies.** None of Wingman's plugin code depends on their bespoke infrastructure (`gsd-sdk`, `gbrain`, AgentShield, the instinct-CLI, npm-published CLIs, hosted dashboards); each has its own installer/runtime that Wingman deliberately does not take on. See `ATTRIBUTIONS.md` for exact file-level provenance and a systematic per-repo research writeup.

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
| `multica-ai/andrej-karpathy-skills` | Assumption-surfacing and verifiable-success-criteria ideas folded into `skills/engineering-minimalism`, restated in Wingman's own words (MIT-declared, no standalone `LICENSE` file — not quoted regardless). |
| `jeffallan/claude-skills` | The "description trap" finding (trigger conditions belong in the frontmatter `description`, not just the body) — enforced as a warning in `scripts/validate-structure.mjs`; the two-tier `SKILL.md`/`references/` split. |
| `addyosmani/agent-skills` | The single most load-bearing pattern adopted: Skill(how)/Persona(who)/Command(when) with the hard rule "personas never call personas, only commands orchestrate" (`commands/boardroom.md`); the parallel-fan-out-then-merge-in-main-context pattern; the Rationalizations/Red-Flags/Verification triad now required in every Wingman skill. |

Not every skill traces to a vendor repo. `skills/systematic-auditing` (paired with `systematic-debugging`, §10 v5) is original to this project — codified directly from Wingman's own dogfooding, after noticing that specific founder phrasing ("audit this," "evidence-driven," "test-driven") reliably triggered a multi-angle-parallel-review pattern that found real bugs a single review pass had repeatedly missed. See `docs/PROJECT.md`'s decisions log for the origin story.

## 10. Rollout sequencing

- **v1** (initial scaffold): 5 boardroom seats (all built), 4 pipeline commands (`plan`/`build`/`secure`/`ship`), 5 adaptive commands (`retro`/`learn`/`evolve`/`harness`/`telemetry`; `launch`/`hotfix`/`audit` added later — see v3.1/v5). No department leads yet — pipeline commands do the work inline.
- **v1.1**: add `.wingman/checkpoints.jsonl` audit logging to `/wingman:boardroom` (a lightweight `## Wingman Boardroom Checkpoint` marker written to the plan file, and enforced by the `boardroom-checkpoint` hook, already exist — the structured JSONL log is the remaining piece).
- **v2** (built, verified): department-lead activation logic (`skills/department-lead-activation`), wired into all four delegating commands, and the standard lead-agent template. Behaviorally exercised — `evals/cases/department-lead-activation.md` (`verified`) and again as part of `evals/cases/full-pipeline-e2e.md` (`verified`).
- **v3** (built, verified): `skills/evolve-promotion` — the concrete mechanism behind `/wingman:evolve`, gathering signal from `LEARNINGS.md`, `docs/wingman/retros.md`, and `.wingman/checkpoints.jsonl`, requiring 2+ genuine occurrences, and writing promoted specialists to the founder's own project (never Wingman's plugin directory). Behaviorally exercised — `evals/cases/evolve-promotion.md` (`verified`, positive + negative cases). The 56-role catalog fills in organically and differently per project as this runs — never as a fixed upfront set.
- **v3.1 (built, verified)**: `commands/launch.md` and `commands/hotfix.md` — each has a dedicated eval case now (`evals/cases/launch.md`, `evals/cases/hotfix.md`), both `verified` as of 2026-07-08 (launch: docs-skip + docs-write; hotfix: single- and multi-hypothesis bugs).
- **v4 (built, verified)**: the full pipeline exercised end-to-end in sequence (`evals/cases/full-pipeline-e2e.md`), twice now (Run 1: fresh project; Run 2: mid-life project, real dispatch throughout, deliberately seeded adversarial elements). Surfaced and fixed real bugs along the way in both runs — Run 1: `boardroom.md`'s checkpoint-recording step wasn't reliably followed through on and could silently clobber `active_department_leads`/`active_specialists` in `state.json`, and `hooks/hooks.json` registered the `boardroom-checkpoint` gate under a hook event name (`PermissionRequest`) that doesn't exist in Claude Code's hooks system — the gate had never actually fired; Run 2: a real ship-stage `dept-devops` branch-timing check gap, self-caught and honestly disclosed rather than hidden. Now `verified` (2026-07-08): a Run 3 adversarial fixture produced the first real-independent-dispatch `DO NOT SHIP`, closing the one dimension the two "realistic" runs couldn't.
- **v4.1 (built, verified)**: a dedicated `boardroom.md` gate-rule eval (`evals/cases/boardroom-gate-rule.md`) covering the `DO NOT SHIP` path, which no prior run (real or simulated) had ever hit; `verified` after real file-write checks of both the mixed- and unanimous-`NO_GO` shapes. Surfaced and fixed two more real gaps: `next_stage`'s meaning on a blocked checkpoint was undefined (risked silently advancing a blocked project past its gate), and `scope_ref`'s format for directly-passed content (as opposed to a plan file or diff) was undocumented.
- **v5 (built, verified)**: `skills/systematic-auditing` + `commands/audit.md`, codifying the multi-angle-parallel-review pattern (§9) as a standing, on-demand mechanism rather than something only available when a founder happens to phrase a request the right way. Also: `docs/wingman/founder-todos.md`, a per-project convention (wired into `secure.md`'s founder-accepted-risk step) giving founders one scannable list of business-risk decisions only they can make, instead of those decisions being buried in a checkpoint's `founder_notes` field. **This is a process skill, not a 9th department** — it doesn't appear in §5's department table and isn't gated by an activation signal the way department leads are; it's cross-cutting, like `systematic-debugging`. `evals/cases/systematic-auditing.md`: `verified` (a flawed-project positive run found all 3 seeded issues plus 2 bonus ones with zero false positives; a clean-project negative run correctly manufactured nothing).
- **v6 (built, verified)**: a real `/wingman:harness` self-audit of Wingman's own repo (2026-07-09) found one genuine gap — no CI, meaning every mechanical validator and eval had only ever been run locally and could be skipped by pushing without running them. Fixed with `.github/workflows/validate.yml`, running both `validate-structure.mjs` and `check-repo-consistency.mjs` on every push/PR. `evals/cases/harness.md`: `verified` on first run via two differently-shaped scenarios — Wingman's own repo (positive) and a fixture with a rubber-stamp `npm test` that always reports "passing" regardless of the code (negative, correctly distrusted).

## Open items (planned, not yet built)

- The MCP state-store server documented in `docs/DATABASE.md` (deliberately deferred — see that document's "Why no server yet").
- Dedicated eval cases for `learn.md`/`telemetry.md` and 4 discipline skills (`plain-language-checkpoint`, `design-taste`, `engineering-minimalism`, `token-economy`) — currently covered only by structural validation, or incidentally where a pipeline eval happens to delegate to one (e.g. `plain-language-checkpoint`'s output contract has held across every checkpoint any eval has ever produced, similar in spirit to the personas' incidental-coverage decision below). `retro.md`, `systematic-auditing`/`audit.md`, `verification-before-completion`, and `harness.md` now have dedicated cases.
- `docs/wingman/founder-todos.md`'s convention (wired into `secure.md`) was behaviorally exercised for the first time in `full-pipeline-e2e` Run 2's secure stage (PASS) — no dedicated case of its own yet, but no longer untested.
- A deliberate decision, not an oversight: the 5 Boardroom personas don't get a separate dedicated eval case. By the time `boardroom-gate-rule.md` landed, the personas had already been dispatched roughly 20+ times across `full-pipeline-e2e`, `hotfix.md`, and `launch.md`'s eval runs (once per seat per checkpoint) via the general-purpose-persona-substitution workaround, with their `## <SEAT> VERDICT` output contract followed correctly every time — a dedicated case would mostly re-confirm what's already been incidentally and repeatedly observed, at real token cost, for little new signal. Revisit if a persona's own file changes in a way that could affect its output contract.
- ~~A third, deliberately adversarial `full-pipeline-e2e` run~~ — done (2026-07-08). An already-committed vulnerable diff (SQL injection + plaintext passwords) handed over as "ship it" produced the first real-independent-dispatch `DO NOT SHIP` (4/5 seats `NO_GO`), promoting `full-pipeline-e2e` to `verified`.
- ~~A real `/wingman:harness` self-audit of this repo~~ — done (2026-07-09). Found and fixed the one genuine gap (no CI); closed `harness.md`'s own eval gap in the same pass. All 10 eval cases are now `verified`; the remaining coverage gaps (`learn`/`telemetry`, 4 discipline skills) are the deliberately-deferred ones above.
