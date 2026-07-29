# WKOS producer map

Which WKOS document is produced by what, and which are templates only.

**This file is the anti-dead-weight mechanism.** `scripts/validate-wkos.mjs` reads it and fails if a
document appears in the shipped structure with neither a named producer nor a template. Keep it
accurate: a stale entry here is worse than a missing one, because it claims a document is being
produced when nothing produces it.

**Status values:**

- **`produced`** — a pipeline stage, skill, hook, or script already writes this today. Real.
- **`existing`** — Wingman's own repo already holds this under its current name. WKOS names the
  existing file rather than creating a parallel one (constitution rule 3: reuse before reinvent).
- **`template`** — nothing produces it yet. Scaffold lives in `templates/`; never created empty in a
  founder's repo.

---

## 00-governance

| Document | Status | Producer / existing file |
|---|---|---|
| `CONSTITUTION.md` | `existing` | `references/constitution.md` |
| `POLICIES.md` | `existing` | `references/permission-model.md` + `references/security-checklist.md` |
| `RISK_MATRIX.md` | `existing` | `references/permission-model.md`'s risk-dimension ownership table |
| `APPROVAL_MATRIX.md` | `existing` | `references/permission-model.md`'s permission matrix |
| `DECISION_POLICY.md` | `existing` | `skills/change-triage` |
| `GUARDRAILS.md` | `existing` | `hooks/hooks.json` + the 12 hook scripts |
| `COMPLIANCE.md` | `existing` | `references/security-checklist.md` |
| `AUDIT_LOG.md` | `produced` | `commands/adaptive/boardroom.md` → `.wingman/checkpoints.jsonl` |
| `PRINCIPLES.md` | `template` | — |

## 01-discovery

| Document | Status | Producer / existing file |
|---|---|---|
| `VISION.md` | `produced` | `commands/pipeline/discovery.md` (problem statement, target user, `DISC-*`) |
| `PROBLEM_STATEMENT.md` | `produced` | `commands/pipeline/discovery.md` |
| `SUCCESS_METRICS.md` | `produced` | `commands/pipeline/discovery.md` (success signal) |
| `MARKET_RESEARCH.md` | `produced` | `commands/pipeline/research-synthesis.md` (`RS-*`) |
| `COMPETITOR_ANALYSIS.md` | `produced` | `commands/pipeline/discovery.md`'s feasibility check + `skills/research` |
| `USER_RESEARCH.md` | `produced` | `commands/pipeline/research-synthesis.md` |
| `PERSONAS.md` | `produced` | `commands/pipeline/personas-jobs.md` (`PJ-*`) |
| `JTBD.md` | `produced` | `commands/pipeline/personas-jobs.md` |
| `BUSINESS_CASE.md` | `template` | — |
| `VALUE_PROPOSITION.md` | `template` | — |

## 02-product

| Document | Status | Producer / existing file |
|---|---|---|
| `MVP_SCOPE.md` | `produced` | `commands/pipeline/discovery.md`'s scope boundary + solo-founder realism check |
| `PRD.md` | `template` | `templates/TEMPLATE_PRD.md` |
| `ROADMAP.md` | `template` | — |
| `FEATURE_CATALOG.md` | `template` | — |
| `FEATURE_PRIORITY.md` | `template` | — |
| `RELEASE_PLAN.md` | `produced` | `commands/pipeline/ship.md` |
| `CHANGE_REQUESTS.md` | `existing` | `skills/change-triage` |

## 03-requirements

| Document | Status | Producer / existing file |
|---|---|---|
| `FUNCTIONAL_REQUIREMENTS.md` | `produced` | `commands/pipeline/define.md` (`DEF-*`) |
| `ACCEPTANCE_CRITERIA.md` | `produced` | `skills/acceptance-criteria` |
| `TRACEABILITY_MATRIX.md` | `produced` | `scripts/check-traceability.mjs --chain` / `--orphans` |
| `CONSTRAINTS.md` | `produced` | `commands/pipeline/discovery.md`'s constraints field |
| `SRS.md` | `template` | `templates/TEMPLATE_SRS.md` |
| `NON_FUNCTIONAL_REQUIREMENTS.md` | `template` | — |
| `ASSUMPTIONS.md` | `template` | — |

## 04-ux

| Document | Status | Producer / existing file |
|---|---|---|
| `INFORMATION_ARCHITECTURE.md` | `produced` | `commands/pipeline/information-architecture.md` (`IA-*`) |
| `USER_FLOWS.md` | `produced` | `commands/pipeline/uxflow.md` (`UX-*`) |
| `JOURNEY_MAPS.md` | `produced` | `commands/pipeline/journey-mapping.md` (`JM-*`) |
| `WIREFRAMES.md` | `produced` | `commands/pipeline/wireframes.md` (`WF-*`) |
| `ACCESSIBILITY.md` | `existing` | `references/accessibility-checklist.md` |
| `UX_HEURISTICS.md` | `produced` | `commands/pipeline/prototype-usability.md` (`PT-*`) |
| `UX_STRATEGY.md` | `template` | — |
| `INTERACTION_PATTERNS.md` | `template` | `templates/TEMPLATE_USER_FLOW.md` |
| `BEHAVIOURAL_PATTERNS.md` | `template` | — |
| `DEVICE_GUIDELINES.md` | `template` | — |

## 05-design-system

| Document | Status | Producer / existing file |
|---|---|---|
| `DESIGN_TOKENS.md` | `produced` | `commands/pipeline/visual-design-system.md` (`VS-*`) |
| `TYPOGRAPHY.md` | `produced` | `commands/pipeline/visual-design-system.md` |
| `COLOUR_SYSTEM.md` | `produced` | `commands/pipeline/visual-design-system.md` |
| `SPACING_SYSTEM.md` | `produced` | `commands/pipeline/visual-design-system.md` |
| `COMPONENT_LIBRARY.md` | `produced` | `commands/pipeline/visual-design-system.md` |
| `DESIGN_PRINCIPLES.md` | `existing` | `skills/design-taste` |
| `RESPONSIVE_RULES.md` | `produced` | `commands/pipeline/visual-design-system.md` |
| `ATOMIC_DESIGN.md` | `template` | `templates/TEMPLATE_COMPONENT.md` |
| `ICONOGRAPHY.md` | `template` | — |
| `MOTION.md` | `template` | — |

## 06-architecture

| Document | Status | Producer / existing file |
|---|---|---|
| `ARCHITECTURE.md` | `produced` | `commands/pipeline/architecture.md` (`ARCH-*`) |
| `SECURITY_ARCHITECTURE.md` | `existing` | `references/security-checklist.md` + `references/threat-register.md` |
| `DEPLOYMENT.md` | `produced` | `commands/pipeline/ship.md` |
| `SYSTEM_CONTEXT.md` | `template` | — |
| `DOMAIN_MODEL.md` | `template` | — |
| `C4_CONTEXT.md` / `C4_CONTAINER.md` / `C4_COMPONENT.md` / `C4_CODE.md` | `template` | — |
| `OBSERVABILITY.md` | `existing` | `commands/adaptive/telemetry.md` |
| `SCALING.md` | `template` | — |

## 07-decisions

| Document | Status | Producer / existing file |
|---|---|---|
| `DECISION_LOG.md` | `produced` | `skills/memory` → `.wingman/memory/decisions.md` |
| `TRADEOFFS.md` | `produced` | `commands/pipeline/architecture.md`'s alternatives-considered |
| `ADR-NNNN.md` | `template` | `templates/TEMPLATE_ADR.md` |
| `RFC-NNNN.md` | `template` | `templates/TEMPLATE_RFC.md` |

## 08-data

| Document | Status | Producer / existing file |
|---|---|---|
| `DATA_MODEL.md` | `produced` | `commands/pipeline/architecture.md` |
| `DATABASE_SCHEMA.md` | `produced` | `commands/pipeline/architecture.md` |
| `MEMORY_MODEL.md` | `existing` | `skills/memory` |
| `KNOWLEDGE_GRAPH.md` | `produced` | `scripts/check-traceability.mjs`'s `Satisfies` graph |
| `MIGRATIONS.md` | `template` | — |
| `DATA_DICTIONARY.md` | `template` | — |
| `RETENTION_POLICY.md` | `existing` | `references/secrets-policy.md` (partial — retention proper is a gap) |

## 09-api

| Document | Status | Producer / existing file |
|---|---|---|
| `API_OVERVIEW.md` | `produced` | `commands/pipeline/architecture.md`, when the project has an API |
| `AUTHENTICATION.md` | `existing` | `references/security-checklist.md` |
| `ERROR_MODEL.md` | `template` | — |
| `VERSIONING.md` | `template` | — |
| `WEBHOOKS.md` | `template` | — |

## 10-engineering

| Document | Status | Producer / existing file |
|---|---|---|
| `TESTING_STRATEGY.md` | `existing` | `skills/testing-patterns` + `references/testing-patterns.md` |
| `SECURITY.md` | `existing` | `references/security-checklist.md` |
| `RELEASE_CHECKLIST.md` | `existing` | `references/definition-of-done.md` |
| `DEPENDENCY_POLICY.md` | `existing` | `skills/package-manager-selection` |
| `DEV_WORKFLOW.md` | `existing` | `skills/git-pr-workflow` |
| `CODING_STANDARDS.md` | `existing` | `skills/engineering-minimalism` + `skills/code-review` |
| `PERFORMANCE.md` | `template` | — |
| `REPOSITORY_STRUCTURE.md` | `template` | — |

## 11-ai

Wingman's own engine layer. These describe the system doing the building, not the thing being built.

| Document | Status | Producer / existing file |
|---|---|---|
| `MEMORY_ENGINE.md` | `existing` | `skills/memory` |
| `KNOWLEDGE_ENGINE.md` | `existing` | `references/` + `skills/doc-index` |
| `ORCHESTRATION.md` | `existing` | `references/orchestration-patterns.md` + `commands/adaptive/boardroom.md` |
| `EVALUATION.md` | `existing` | the 8 Boardroom seats + `skills/definition-of-done` |
| `MODEL_POLICY.md` | `existing` | `references/model-selection-guide.md` |
| `PROMPT_POLICY.md` | `existing` | `references/prompt-defense-baseline.md` + `skills/prompt-diff-check` |
| `AGENT_ARCHITECTURE.md` | `existing` | `references/harness-capability-profile.md` |
| `CONTEXT_ENGINE.md` | `template` | *(being built — see the Context Engine phase)* |
| `TOOL_REGISTRY.md` | `template` | *(being built — see the Tool Runtime phase)* |
| `WORKFLOWS.md` | `existing` | `references/org-template/project-types/` |

## 12-quality

| Document | Status | Producer / existing file |
|---|---|---|
| `QUALITY_SCORECARD.md` | `produced` | `commands/adaptive/boardroom.md`'s consolidated verdicts |
| `SECURITY_AUDIT.md` | `produced` | `commands/pipeline/build.md`'s threat register |
| `ACCESSIBILITY_AUDIT.md` | `produced` | `commands/pipeline/prototype-usability.md` |
| `UX_AUDIT.md` | `produced` | `commands/pipeline/prototype-usability.md` |
| `TEST_PLAN.md` | `template` | `templates/TEMPLATE_TEST_PLAN.md` |
| `TEST_CASES.md` | `template` | — |
| `QA_PLAN.md` | `template` | — |
| `PERFORMANCE_AUDIT.md` | `template` | — |

## 13-operations

| Document | Status | Producer / existing file |
|---|---|---|
| `INCIDENT_RESPONSE.md` | `existing` | `skills/incident-response` + `commands/adaptive/incident.md` |
| `DEPLOYMENT_RUNBOOK.md` | `produced` | `commands/pipeline/ship.md` |
| `MONITORING.md` | `existing` | `commands/adaptive/telemetry.md` |
| `COST_MANAGEMENT.md` | `existing` | `agents/boardroom-cfo.md` |
| `MAINTENANCE.md` | `existing` | `commands/adaptive/post-launch.md` + `commands/adaptive/debt-ledger.md` |
| `BACKUP.md` | `template` | — |
| `DISASTER_RECOVERY.md` | `template` | — |

## 14-learning

| Document | Status | Producer / existing file |
|---|---|---|
| `RETROSPECTIVES.md` | `produced` | `commands/adaptive/retro.md` |
| `LESSONS_LEARNED.md` | `produced` | `commands/adaptive/learn.md` → `LEARNINGS.md` |
| `SUCCESS_LIBRARY.md` | `produced` | `skills/memory` → `.wingman/memory/MEMORY.md` |
| `FAILURE_LIBRARY.md` | `produced` | `skills/memory` → `.wingman/memory/tried.md` |
| `IMPROVEMENT_BACKLOG.md` | `existing` | `commands/adaptive/debt-ledger.md` |
| `BENCHMARKS.md` | `template` | — |

---

## Coverage summary

Roughly **two-thirds of WKOS already has a producer or an existing file.** That is the entire
argument for building it: this is a contract over machinery that exists, not a scaffold hoped into
being. The `template` entries are the honest remainder — real gaps, named as gaps, shipped as
scaffolds rather than as empty files pretending to be knowledge.

Three genuine gaps worth naming rather than burying: **`CONTEXT_ENGINE.md`** and
**`TOOL_REGISTRY.md`** are being built in later phases, and **`RETENTION_POLICY.md`** is only
partially covered by `references/secrets-policy.md` — data retention proper has no owner today.
