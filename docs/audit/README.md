# Wingman — Full System Audit Dossier

**Date**: 2026-07-18
**Scope**: Complete inventory and assessment of the Wingman Claude Code plugin — commands, agents, skills, hooks, scripts, evals, governance docs, CI/CD, and security posture.
**Auditor**: OpenCode (deepseek-v4-flash-free)
**Repository**: clean at `5ee9219` (no uncommitted changes at start of audit)

## Documents

| # | Document | Focus |
|---|---|---|
| 1 | [Strategic Summary](01-strategic-summary.md) | Project purpose, target user, success criteria, key architectural decisions |
| 2 | [Operational Assessment](02-operational-assessment.md) | Surface area (commands, agents, skills, hooks), coverage gaps, version history |
| 3 | [Governance & Policy](03-governance-policy.md) | Docs maturity, decision log (PROJECT.md v1-v16), version gates, compliance with own rules |
| 4 | [Architecture & Data](04-architecture-data.md) | Component model, data flow, state persistence, agent topology, decision trees |
| 5 | [User Flows](05-user-flows.md) | Pipeline flow, Boardroom checkpoint, build/ship lifecycle, adaptive command flows |
| 6 | [Security & Compliance](06-security-compliance.md) | Threat model, secret scanning, prompt injection defenses, dependency analysis |
| 7 | [Operational Playbooks](07-operational-playbooks.md) | Retro, learn, evolve, hotfix, incident response, launch, dogfood, telemetry |
| 8 | [Testing & Quality](08-testing-quality.md) | Eval harness (62 cases, 36 fixtures), integration tests (72 pass), validator suite (5 scripts) |
| 9 | [Artifacts & Glossary](09-artifacts-glossary.md) | All artifact types, file inventory, data schemas, terminology reference |
| 10 | [Enterprise Architecture Review](10-enterprise-architecture-review.md) | Evidence-first audit against a harness-agnostic, enterprise-scoped target model; diagnosis, purpose map, governance/promotion trace, migration phases |

## Methodology

1. **Read all governance docs**: CLAUDE.md, ARCHITECTURE.md, REGRESSION-CHECKLIST.md, AGENT-ROSTER.md, PROJECT.md (v1-v16), HUMAN-TODOS.md, SRS.md, PRD.md, LEARNINGS.md
2. **Surface inventory**: plugin.json (23 commands, 8 agents, 39 skills), hooks.json (9 scripts, 6 lifecycle events), marketplace.json
3. **Code review**: Every hook script, key command files, eval harness, and validator script
4. **Test baseline**: Ran hooks integration tests (72/72 pass), all 5 validators
5. **Validation**: Cross-checked every finding against actual source code — 2 false positives corrected, 4 confirmed issues fixed prior to dossier creation

## Key Metrics

| Metric | Value |
|---|---|
| Commands | 23 |
| Agents | 8 (7 Boardroom seats + Research) |
| Skills | 39 |
| Hook scripts | 9 |
| Validator scripts | 5 |
| Eval cases | 62 |
| Eval fixtures | 36 |
| Integration tests | 72 |
| Git commits | 300+ |
| Governance docs | 9 |
| Total `.mjs` scripts | ~20 |
| External dependencies | 0 (Node stdlib only) |
