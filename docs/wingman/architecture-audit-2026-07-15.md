# AI-Native Architecture Research & Validation Audit — Wingman

**Date:** 2026-07-15
**Scope:** `/home/user/Wingman` (the Wingman Claude Code plugin repo itself)
**Method:** Three independent, evidence-only research passes (Knowledge/Memory layer; Agent/Capability/Workflow layer; Governance/Scalability/Agent-Agnosticism), each grounded in real file paths, line numbers, and quoted snippets — no self-report, no opinion-gathering. This document synthesizes those findings against the audit framework's own required structure. Per `docs/PROJECT.md`'s Roadmap Phase 5, item 13.

**A note on standing**: this document is the audit itself (item 13). It does not adopt any structural change. Every recommendation below is explicitly labeled Proven / Emerging / Speculative with a confidence band, and per Roadmap item 14, any structural adoption routes through a real Boardroom review before implementation — nothing here is self-executing.

---

## Executive Summary

Wingman's architecture is, on the whole, **honest about what it is** — it does not claim Hexagonal, Clean, or DDD labels it doesn't actually implement, and it explicitly and correctly rejects enterprise-scale complexity (`docs/ARCHITECTURE.md:11`) it doesn't need yet. Its real, load-bearing structural idea — **Skill (how) / Persona (who) / Command (when)**, with the rule "personas never call personas, only commands orchestrate" — is genuinely implemented, not just described: department-lead and Boardroom agent files hold persona/output-contract text and reference skills by name rather than embedding logic; pipeline commands hold sequencing and branching directly.

Two concrete, evidenced weaknesses are worth fixing soon, both mechanical and low-risk:

1. **Rule-text duplication.** At least three important rules (the Definition-of-Done gate's criteria, the Boardroom's consolidated-summary contract, the "2+ occurrence" promotion threshold) are independently restated as full prose in 3-6 separate files rather than referenced from one canonical source. This is a real, already-paid maintainability cost — this project's own roadmap history shows repeated "sweep every file for the same gap" passes, which is the concrete symptom of this exact problem, not a hypothetical risk.
2. **A governance gap between implied and actual enforcement.** The Definition-of-Done hook's `git push` check (`dod-structural-gate.mjs`) verifies that a Build-stage Boardroom checkpoint *entry exists* in `.wingman/checkpoints.jsonl` — it never reads that entry's actual verdict or bottom-line field. A recorded `NO_GO` that somehow survived past the `ExitPlanMode` gate (e.g., code changed after plan approval) is not re-checked at push time. The system's own documentation implies a stronger, verdict-aware gate than what's mechanically true.

The single most strategically important finding, directly answering the premise of the original request (organizational memory as a moat): **Wingman has built real, structured organizational memory for itself — and none at all for the founder projects it builds.** The `wingman:log` marker convention and `scripts/query-wingman-knowledge.mjs` are dev-repo-only by construction (confirmed: `plugins/wingman/.claude-plugin/plugin.json` has no `scripts` key and never ships `/scripts`). A founder's own installed project gets four fragmented, undocumented-in-part state files (`state.json`, `checkpoints.jsonl`, `memory/*.md`, `traceability.json`) and nothing that queries across them. If organizational memory is a real strategic bet, it needs to be validated on a founder's project — a different, currently untested product surface — not just on Wingman's own history.

On agent-agnosticism: the system is **not** portable to a different agent harness without rewrite, and this should be stated plainly rather than assumed. The Boardroom/governance core is hard-coupled to three Claude-Code-specific mechanisms (`AskUserQuestion`, `ExitPlanMode` plus its two hooks, and `Task`/`Agent` parallel subagent dispatch). Only two skills (`git-pr-workflow`, `package-manager-selection`) are genuinely, deliberately agent-agnostic today. This is not a defect so much as an unexamined gap between aspiration and reality that should be named honestly in the architecture docs.

---

## Current Architecture Assessment

What currently exists, observed directly: a **markdown-prompt-driven orchestration system**, not a compiled-language codebase with an object domain model. "Code" is commands/agents/skills as markdown files (23 commands, 8 Boardroom seats, 38 skills per `plugin.json`), a handful of deterministic Node hook scripts (`hooks/*.mjs`) providing the only truly mechanical enforcement points, and flat JSON/JSONL/Markdown state files under `.wingman/`. There is no domain-entity object graph, no service layer, no database in the conventional sense.

## Actual Architecture Classification

Closest classification: a **Workflow/Orchestration Architecture** with a thin **Agent-persona layer** on top and a **Capability (Skill) layer** underneath — closer in spirit to a pipeline with pluggable, named middleware steps than to any of Hexagonal/Clean/Onion/DDD. There *is* a rough DDD-flavored analog — departments (Product/Engineering/Design/Data/Legal-Security/DevOps/Growth/QA) function like bounded contexts — but this is informal and undeclared as such, not a deliberate DDD implementation. Wingman's own `docs/ARCHITECTURE.md` does not claim any of these labels for itself; it describes its own vocabulary (Boardroom/department-lead/specialist) without borrowing unearned academic credibility. That restraint is itself a positive architectural signal, not a gap.

**What the system believes it has vs. what it actually has**: the belief (per `ARCHITECTURE.md`) and the evidence agree closely on the agent/skill/command separation — this was directly confirmed, not just claimed (see Agent Architecture Audit below). They diverge on governance completeness (the DoD push-time gap above) and on how uniformly "AI-native structured knowledge" has actually been built — real and working for Wingman's own dev history, entirely absent for a founder's project.

---

## Structural Strengths

- **Real separation of concerns, not just documented intent.** `department-lead-activation` template: *"you never invoke another agent yourself. Only a command... dispatches you."* Confirmed followed in `build.md`, which never contains department-specific reasoning, only delegation language ("Delegate each task to the relevant department lead").
- **Lazy, threshold-gated complexity growth that's actually wired in, not aspirational.** Department leads and the Management Board are gated by real signals evaluated inside every pipeline command (`architecture.md`, `build.md`, `uxflow.md`, `ship.md`, `discovery.md` all invoke `department-lead-activation` then `management-board-activation`), with a real bug (v15, miscounted threshold) found and fixed via actual dogfooding — direct evidence this logic executes, not just exists in prose.
- **Deliberate rejection of premature enterprise complexity.** `ARCHITECTURE.md:11` explicitly names and rejects a "stateful graph runtime like LangGraph" pattern as "the wrong implementation for a Claude Code plugin" — correct scope discipline for the actual target market (non-technical founders, not enterprises), matching this project's own `engineering-minimalism` doctrine.
- **A genuine cross-reference pattern exists alongside the duplication problem.** `evolve-promotion` correctly cross-references `docs/ARCHITECTURE.md` §6, `docs/AGENT-ROSTER.md`, and its own `references/` files rather than duplicating their content — proof the team already knows the right pattern; it's just not applied everywhere.
- **Two skills are genuinely, deliberately agent-agnostic** (`git-pr-workflow`, `package-manager-selection`) — real, working precedent for portability, not a purely aspirational claim.

## Structural Weaknesses

- **Rule-text duplication** (detailed under Knowledge Architecture Audit) — confirmed across at least 3 independently-important rules, in 3-6 files each.
- **Verbatim-templated boilerplate in Boardroom agents.** `boardroom-cto.md` and `boardroom-ciso.md` share an identical 6-point "Prompt Defense Baseline" block, copy-pasted rather than transcluded from one file — roughly 15-20 of ~45-50 lines per seat file are unique; the rest is repeated scaffolding.
- **`docs/DATABASE.md` is out of date relative to what the code actually writes.** It documents `checkpoints.jsonl` and `state.json` but omits `.wingman/memory/*.md` and `.wingman/traceability.json`, both of which real skills (`memory`, `traceability-linking`) write today.
- **Per-project state is fragmented across four incompatible formats** with no unifying read surface (see Memory Architecture Audit).
- **The DoD push-time governance gap** (see Governance Architecture Audit).

## Coupling Analysis

- **Agent-to-skill coupling is loose and correct**: agents reference skills by name (e.g., `boardroom-cto.md:15`, "Reference the `verification-before-completion` and `writing-plans` skills"), never embedding that logic. This is real, low-coupling design.
- **Command-to-skill coupling is direct and intentional, appropriately so**: `build.md` names 8+ distinct skills/hooks inline with conditional branching written directly in the command's own prose (not delegated to a separate orchestration skill) — the command file *is* the orchestrator by design, which is a reasonable, simple choice given there's no need yet for a generic workflow engine.
- **Hook-to-tool-name coupling is tight and unavoidable given the platform**: `boardroom-checkpoint.mjs` and `dod-structural-gate.mjs` both key off the literal tool name `ExitPlanMode`; `dod-structural-gate.mjs`'s other trigger is a regex match on `Bash` commands containing `git push`. This is inherently fragile to a Claude Code tool-surface change, but there's no available abstraction layer in the platform today to avoid it.
- **Rule-text coupling (the duplication problem) is prose-level, not code-level** — because everything is markdown, there's no compiler to catch drift when one copy of a rule changes and the others don't. This is a materially different (and more dangerous) kind of coupling than code duplication, because nothing detects it automatically.

---

## Knowledge Architecture Audit

**Where knowledge lives** (observed, exhaustive): `plugins/wingman/commands/*.md` (23), `plugins/wingman/agents/*.md` (8), `plugins/wingman/skills/*/SKILL.md` (38) plus their `references/` subfolders, `plugins/wingman/references/*.md` (command-level shared references), `plugins/wingman/hooks/hooks.json` + `.mjs` scripts, `plugins/wingman/scripts/{check-traceability,validate-structure}.mjs` (ship with the plugin), top-level `docs/*.md`, top-level dev-only `scripts/*.mjs` (5 files, never ship), and `.wingman/*` structured data files.

**Confirmed duplication, not hypothetical**:
- The **"2+ occurrence" promotion threshold** is stated as literal prose in `evolve.md`, `evolve-promotion/SKILL.md` (which explicitly cites `ARCHITECTURE.md` §6 as authority — a partial single-source-of-truth pattern), `ARCHITECTURE.md:118`, and both files under `evolve-promotion/references/`. Six locations; only one of them formally defers to another as canonical, and the number itself is still re-typed as prose everywhere.
- The **Definition-of-Done gate criteria** are authored in full in `build.md:45-95`, restated in `ARCHITECTURE.md` §4b, and restated again (shorter) in `definition-of-done/SKILL.md`. Mechanical enforcement lives in exactly one place (`dod-structural-gate.mjs`), but the *rule text* itself is independently written three times.
- The **Boardroom consolidated-summary contract** is stated in `boardroom.md` twice and referenced from `evolve-promotion`, `memory/SKILL.md`, `references/orchestration-patterns.md`, and `references/spec-handler-pattern.md` — six touchpoints for one concept.

**Confirmed good pattern, for contrast**: `evolve-promotion` cross-references `ARCHITECTURE.md` §6, `AGENT-ROSTER.md`, and its own `references/` files by pointer rather than duplicating their content — proof the "right" pattern is already known and used elsewhere in this same codebase, just not consistently.

**Maintainability risk is not theoretical**: this project's own Roadmap history (`docs/PROJECT.md`) repeatedly records "swept the rest of the skills/commands for the same gap" as a distinct follow-up step after a fix — direct evidence that the same-rule-in-multiple-places pattern has already cost real remediation passes, more than once.

## Agent Architecture Audit

Four tiers, confirmed via direct file reads: Boardroom (fixed, 7 seats, every project from install), Management Board (0→9, threshold-gated on 3+ *conditionally-activated* department leads), Department leads (0→8, per-department activation signal), Specialists (0→N uncapped, gated on 2+ genuine occurrences via `/wingman:evolve`).

Boardroom agent files carry real domain-specific reasoning (roughly 15-20 lines per file) plus a verbatim-copied 6-point "Prompt Defense Baseline" scaffold (confirmed identical across `boardroom-cto.md` and `boardroom-ciso.md`). Agents are genuinely thin personas over shared skills — confirmed, not just claimed, by direct citation (`boardroom-cto.md:15` references `verification-before-completion`/`writing-plans` by name rather than embedding their content). `ARCHITECTURE.md:189`'s "personas never call personas, only commands orchestrate" rule is followed in practice in `build.md`, which contains zero department-specific logic, only delegation.

**Answer to "are agents the core architecture, or interfaces over capabilities?"**: interfaces over capabilities, confirmed. The skill layer holds the actual logic; agents hold persona voice and output contracts; commands hold sequencing. This is a real, working three-way separation, not aspirational documentation.

## Capability Architecture Audit

38 skills, roughly: 16 discipline/process skills (`verification-before-completion`, `systematic-debugging`, `systematic-auditing`, `test-driven-development`, etc.), 15 domain/mechanics skills (`git-pr-workflow`, `package-manager-selection`, `memory`, `incident-response`, etc.), 7 activation-logic skills (`department-lead-activation`, `management-board-activation`, `evolve-promotion`, `dogfood-gap-classification`, etc.).

Recurring capabilities are **mostly** centralized: code-review/audit capability lives in exactly two skills (`code-review`, `systematic-auditing`), referenced (not re-implemented) from `build.md`, `ship.md`, `audit.md`. The Definition-of-Done gate's *mechanical enforcement* is centralized in one hook, but as noted above its *rule text* is independently restated in three files. The "occurrence counting" capability is centralized in `evolve-promotion`/`dogfood-gap-classification` as a mechanism, but the counting *language* is independently restated with near-identical wording across `learn.md`, `retro.md`, and `evolve.md` rather than each pointing at one shared description.

## Workflow Architecture Audit

23 commands total (confirmed against `plugin.json`, not the ~14 initially estimated): 7 fixed pipeline stages (`discovery`/`define`/`architecture`/`uxflow`/`implementation-planning`/`build`/`ship`) plus 16 adaptive/on-demand commands. `build.md` (95 lines, 8 `##` sections) directly names 8+ distinct skill/hook invocations with conditional branching written in its own prose — the command file is the orchestrator, by design, with no separate workflow-engine abstraction. This is a reasonable choice at current scale (no evidence a generic engine is needed yet) but means orchestration logic will keep growing linearly inside command files as more conditions are added — worth watching, not yet a problem.

**No command-surface tiering exists at runtime** — `plugin.json`'s `commands` array is flat with no grouping field, and the `commands/` directory has no subfolders. The "pipeline vs. adaptive" split is a documentation-only narrative (in `ARCHITECTURE.md`'s rollout notes), not a founder-facing filtered view.

## Memory Architecture Audit

This is the audit's most consequential section, given the framing of the original request.

`skills/knowledge/memory/SKILL.md` persists three per-project files (`MEMORY.md`, `decisions.md`, `tried.md`) under `.wingman/memory/`. Its own eval (`evals/cases/memory.md`) is `provisional` after exactly one run, and its own run log states plainly that it is **not yet verified that a later session actually reads this store back and changes behavior as a result** — direct, self-disclosed evidence this mechanism is currently write-only/unproven, not a functioning memory loop yet.

`scripts/parse-wingman-logs.mjs` and `scripts/query-wingman-knowledge.mjs` are **dev-repo-only by construction** — confirmed structurally: `plugins/wingman/.claude-plugin/plugin.json` has no `scripts` key, and its `commands`/`agents`/`skills` arrays list only paths under `plugins/wingman/`. The top-level `/scripts` directory that holds these files is entirely outside the shipped plugin manifest. Only `dogfood-gap-classification` (itself dev-repo-only) references them. **No skill anywhere gives a founder's own installed project an equivalent structured-query capability over its own project history.** This is the direct, confirmed asymmetry named in the Executive Summary.

`.wingman/checkpoints.jsonl` captures per-seat verdicts and one-line summaries only — explicitly documented as "an audit log, not a mutable table," never rewritten. It is not a decision-rationale log and has no architecture-history narrative field.

**Per-project state is fragmented across four incompatible formats**, confirmed: `state.json` (JSON, overwritten in place), `checkpoints.jsonl` (append-only JSONL), `memory/{MEMORY,decisions,tried}.md` (three separate Markdown files), `traceability.json` (a JSON ID-counter map). `docs/DATABASE.md`'s schema section documents only the first two — `memory/*.md` and `traceability.json` are real, currently-written files with no corresponding entry in the project's own database documentation. No single file, skill, or view unifies these into one "what has this project decided and why" surface; reconstructing that today requires reading four different formats separately.

## Governance Architecture Audit

Hooks, confirmed by direct source read: hard/mechanical gates are `boardroom-checkpoint.mjs` (on `ExitPlanMode`, denies via `process.exit(2)` unless the plan contains the Boardroom Checkpoint marker, no `DO NOT SHIP` anywhere, and an explicit "ship it" founder decision) and `dod-structural-gate.mjs` (on `ExitPlanMode` for traceability, and on `Bash` matching `git push` for the full traceability/test-presence/threat-register check, including actually running the test suite and checking its exit code). Soft/advisory hooks (`session-health.mjs`, `context-monitor.mjs`, `secret-scanner.mjs`) all fire `PostToolUse` — after the action has already happened.

**The confirmed gap**: `dod-structural-gate.mjs`'s `git push` branch (`findLatestBuildCheckpoint`) checks only that a Build-stage checkpoint *entry exists* in `checkpoints.jsonl` (`entry.bundle === 'build'`) — it never reads that entry's `seats[].verdict` or `bottom_line` field. A `NO_GO` verdict that was recorded but somehow not caught at the `ExitPlanMode` gate (the hook's own comments acknowledge this doesn't apply when "the scope was a diff or content passed directly") would not be mechanically re-checked before a push proceeds. Verdict enforcement is genuinely hard only at the plan-approval boundary; at ship/push time it is advisory in practice, despite the DoD gate's overall framing implying comprehensive enforcement.

`permissions:` frontmatter (`read`/`write`/`approve`/`execute`/`deploy`) is confirmed, by the architecture document's own admission (`ARCHITECTURE.md:63`), to be "a documentation-and-consistency field today, not yet a runtime-enforced permission check." `validate-structure.mjs` only checks the field's presence and value legality — no hook inspects an agent's declared permission before allowing a `Write`/`Edit` call.

## Scalability Analysis

Activation thresholds for department leads and the Management Board are confirmed **actually wired into every pipeline command** (not just described in docs), with real state persisted in `.wingman/state.json`, and a real bug (v15's threshold miscounting) found and fixed via genuine dogfooding — direct evidence this scales a project from solo-founder (zero optional department leads, zero managers) up through a many-department SMB-scale project without any structural rewrite, using the identical mechanism at both ends.

There is **no enterprise-scale (multi-team/multi-repo/org-wide-policy) concept anywhere**, and `ARCHITECTURE.md:11` explicitly and correctly rejects that complexity as premature for a Claude Code plugin targeting non-technical founders. Relative to Wingman's actual target market, this is appropriate scope discipline, not a gap. Relative to the original audit brief's abstract requirement ("must scale solo founder → Enterprise"), it is a real, honest gap that should not be closed speculatively — see Speculative Findings.

## Maintainability Analysis

The rule-text duplication documented above is the dominant maintainability risk in this codebase, and it is evidenced, not theoretical — this project's own roadmap shows repeated multi-file "sweep for the same gap" remediation passes as a direct symptom. Because everything here is prose (markdown), there is no compiler or type system to catch drift between copies the way code duplication would eventually be caught by a refactor tool; a human or agent has to notice by inspection, which is exactly the failure mode this audit's own research passes had to work around by grepping for concept names across the whole repo.

## AI Agent Agnosticism Analysis

Confirmed, not assumed: only `git-pr-workflow` (which explicitly self-describes as agent-agnostic: *"written so any coding agent with shell access can use it, not just this one"*, built on plain `git`+`gh` CLI) and `package-manager-selection` (no explicit claim, but genuinely no Claude-Code-only dependency found) are portable today.

The Boardroom/governance core is hard-coupled to three Claude-Code-specific mechanisms: `AskUserQuestion` (whose own limitation — missing in headless/print-mode sessions — is already self-disclosed in `boardroom.md`, good existing practice), `ExitPlanMode` plus its two gating hooks (keyed on that exact tool name), and `Task`/`Agent` parallel subagent dispatch (the mechanism the whole 7-seat Boardroom review depends on). None of these have an abstraction layer; none would work unmodified under a different agent harness (Codex CLI, Gemini CLI, OpenHands, Cline). Model tiering (`model: opus`/`inherit`/`haiku`) is conceptually vendor-agnostic (risk-cost-based assignment is a portable idea) but its actual field values are literal Anthropic model names with no indirection layer.

**Plain conclusion**: Wingman as a whole is not agent-agnostic today. Two extracted skills are. This should be stated explicitly in the architecture docs rather than left as an implicit, unexamined assumption.

---

## Research-Backed Findings (Proven — High Confidence)

Grounded in established software-engineering principles (DRY/single-source-of-truth, fail-closed authorization verification, documentation-matches-implementation, YAGNI/scope discipline):

1. **Consolidate duplicated rule text** (DoD criteria, Boardroom consolidation contract, 2+ occurrence threshold, the Boardroom "Prompt Defense Baseline" block) into one canonical file each, with all other locations referencing it by path rather than restating prose. — *Confidence: High.* Standard DRY/single-source-of-truth discipline, already proven and used elsewhere in this exact codebase (`evolve-promotion`'s cross-reference pattern). Low implementation risk.
2. **Fix `docs/DATABASE.md`'s schema section** to include `.wingman/memory/*.md` and `.wingman/traceability.json`, which real skills already write. — *Confidence: High.* Documentation-matches-implementation is basic hygiene; trivial risk.
3. **Close the DoD `git push` governance gap**: have `dod-structural-gate.mjs` read the Build checkpoint's actual verdict/bottom-line field, not just confirm the entry exists. — *Confidence: High* that this is a real correctness gap (fail-closed verification of actual state, not just event occurrence, is bedrock access-control engineering). *Medium* implementation-risk band, since this hook already gates real pushes and needs careful, non-regressive testing before merging.
4. **State explicitly, in `ARCHITECTURE.md`, which mechanisms are agent-agnostic vs. Claude-Code-coupled**, rather than leaving portability as an unexamined assumption. — *Confidence: High.* Costs nothing, prevents a future false claim, matches this project's own "never present speculation as fact" discipline.
5. **Do not build enterprise/multi-project scaling speculatively.** The existing rejection of that complexity (`ARCHITECTURE.md:11`) is itself correct, evidenced, YAGNI-consistent engineering judgment for the current target market — a strength to preserve, not a gap to close.

## Emerging Findings (Medium Confidence)

Supported by active but not-yet-settled AI-agent-system and organizational-memory research; real but unproven at Wingman's own scale:

6. **A founder-project-scoped equivalent of `query-wingman-knowledge.mjs`** — giving a founder's own project the same structured-query capability Wingman's dev-repo has over its own history. This is the direct answer to the original "organizational memory as a moat" framing, but the right *shape* (skill vs. hook vs. bundled script) is unproven; should be prototyped via real dogfooding before being shipped broadly, per this project's own evolve-via-evidence culture. — *Confidence: Medium.*
7. **A unifying read-surface over the four fragmented per-project state files**, without necessarily changing their underlying write formats (avoids a risky migration). Related in spirit to event-sourcing/CQRS read-model patterns (a proven general pattern), but its specific application to this mixed-format state is untested here. — *Confidence: Medium.*
8. **A ports-and-adapters abstraction for the three Claude-Code-hard-coupled mechanisms** (an abstract "human-checkpoint" capability mapping to `AskUserQuestion`/`ExitPlanMode` today and to a different harness's equivalent tomorrow; an abstract "parallel-dispatch" capability mapping to `Task`/`Agent` today). Ports-and-adapters itself is a long-proven pattern; applying it specifically to swap AI-agent harnesses is new territory with no track record yet, and — critically — there is currently zero evidenced demand to run Wingman under a non-Claude-Code harness. — *Confidence: Medium, and currently unmotivated; correctly deferred.*

## Speculative Findings (Low Confidence)

Not yet proven at scale; flagged explicitly so they are never mistaken for settled recommendations:

9. **Runtime-enforced `permissions:` field** (mechanically preventing a `read`-permission agent from performing a write). The *principle* (least privilege, actually enforced rather than merely documented) is Proven and important, but *how* to mechanically enforce per-agent tool restriction inside a single prompt-driven Claude Code session, without a platform capability that doesn't exist today, is a genuinely open problem — this audit does not claim to know a concrete implementation. — *Confidence: Low* on any specific mechanism; revisit only if Claude Code itself exposes a new capability enabling it.
10. **A vendor-neutral model-tier abstraction** (mapping `opus`/`inherit`/`haiku` to portable tier names per-harness). No evidence Wingman needs to run under multiple model vendors simultaneously today; building this now would be a premature abstraction against a currently-hypothetical need. — *Confidence: Low.*
11. **Command-surface tiering (core vs. advanced)** as a founder-facing UI concept. The general need (reduce cognitive load as command count grows) has real support in HCI/progressive-disclosure research, but the *specific* tier boundaries are a product judgment call with no real founder-usage data behind it yet. — *Confidence: Low-Medium* on any specific list; worth watching, not worth committing to a specific cut today.

---

## Recommended Future Architecture

Adopt only the Research-Backed (Proven, High-confidence) items now, each still routed through a lightweight Boardroom review before merging per this project's own standing discipline (even though risk is low): rule-text consolidation, `DATABASE.md` accuracy fix, the DoD push-time verdict check, and explicit agent-agnosticism scoping in `ARCHITECTURE.md`.

Treat the Emerging items as **prototype-first, evidence-gated** work: build the founder-project memory/query capability as a real dogfooding experiment on an actual project, not a committed feature, before deciding whether to ship it broadly — exactly the discipline this project already applies to specialist promotion (`/wingman:evolve`'s 2+-occurrence gate) and to its own dogfood-gap-classification mechanism.

Do not adopt any Speculative item without materially new evidence (a real platform capability for permission enforcement; real multi-vendor usage; real founder-usage data for command tiering).

## Migration Strategy

Sequence strictly by confidence, not by how interesting an item is: Proven items first (low-risk, high-value, near-term), then a single Emerging prototype (the founder-project memory experiment) run as a bounded dogfood pass with its own explicit evidence bar before any broader decision, with the remaining Emerging items deferred until real demand signals appear. Speculative items are explicitly not scheduled — they're recorded here so they aren't silently forgotten, not because they're imminent.

## 1-Year Roadmap

Ship all four Proven items (rule consolidation, `DATABASE.md` fix, DoD push-time verdict check, explicit agent-agnosticism scoping). Run one bounded dogfood prototype of a founder-project-scoped memory/query capability and honestly grade the result (per this project's own evidence-over-self-report standard) before deciding whether it becomes a committed feature.

## 3-Year Roadmap

If the Year-1 memory prototype accumulated real evidenced value across multiple real founder projects, formalize it into a shipped skill with its own eval coverage. If real, evidenced demand emerges to run Wingman under a different agent harness, begin the ports-and-adapters abstraction work then — not before. Continue declining to build enterprise/multi-project scaling absent a real paying segment that needs it.

## 5-Year Architecture Outlook

Any specific 5-year target architecture for an LLM-agent-orchestration plugin is itself low-confidence territory — the underlying model/tooling landscape (which harnesses exist, what capabilities they expose, whether "subagent dispatch" persists in its current shape) is moving too fast to forecast a specific target with any honesty. The one claim worth defending on a 5-year horizon: the **Skill(how)/Persona(who)/Command(when)** separation of concerns is a durable idea independent of which agent-harness wins, because it's an application of long-proven separation-of-concerns/single-responsibility principles to agent orchestration, not a framework-specific trick. Specific tool names (`AskUserQuestion`, `Task`/`Agent`) are not something to bet on for five years; the underlying separation of "what capability," "who's applying it," and "when it happens" is.

## Final Verdict

The architecture earns its own self-description more than it fails it. It doesn't over-claim academic patterns it doesn't have, and it correctly defers complexity (enterprise scaling, runtime permission enforcement, multi-vendor model abstraction) it has no evidenced need for yet — that restraint is itself good architecture, not an absence of ambition. The two concrete weaknesses worth fixing soon — rule-text duplication and the DoD push-time governance gap — are both mechanical, low-risk, and already have a working pattern to copy from elsewhere in this same codebase. The one finding worth treating as strategically important, not just a nitpick: this project has proven to itself that structured organizational memory is achievable and valuable — for itself. Whether that same idea holds up on a founder's own project is a real, currently open question, and answering it with a bounded, evidence-gated prototype (not a speculative feature commitment) is the single highest-leverage next step to take from this audit.
