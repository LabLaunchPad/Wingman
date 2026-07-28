# Governance & Policy Assessment

## Document Inventory

| Document | Status | Purpose |
|---|---|---|
| CLAUDE.md | ✅ Current | Working instructions for Claude Code sessions |
| ARCHITECTURE.md | ✅ Current | Component model, agent topology, design rationale |
| REGRESSION-CHECKLIST.md | ✅ Current | Hybrid mechanical/manual regression checklist |
| AGENT-ROSTER.md | ✅ Current | 56-role specialist catalog, promotion process |
| PROJECT.md | ✅ Current | Version history (v1-v16), decisions log, roadmap |
| HUMAN-TODOS.md | ✅ Current | Manual setup tasks, CI secrets, Windows gaps |
| SRS.md | ✅ Current | Functional (FR-1..FR-15) + non-functional (NFR-1..NFR-7) requirements |
| PRD.md | ✅ Current | Product requirements, success criteria, out-of-scope items |
| LEARNINGS.md | ✅ Current | Append-only learning log with `wingman:log` markers |
| ATTRIBUTIONS.md | ✅ Present | MIT-licensed vendor references with provenance |
| DATABASE.md | ✅ Present | Planned MCP state-store spec (not yet built) |

## Requirements Coverage (SRS)

### Functional Requirements

| ID | Requirement | Status | Verification |
|---|---|---|---|
| FR-1 | `/wingman:plan` produces plan with Plain-Language Summary | Built | Manual walkthrough |
| FR-2 | `/wingman:plan` routes through `/wingman:boardroom` | Built | Hook-enforced |
| FR-3 | Boardroom dispatches 5+ seats in parallel | Built | Code review |
| FR-4 | Consolidated verdict with GO/GO_WITH_CHANGES/DO_NOT_SHIP | Built | Code review |
| FR-5 | Explicit founder decision via AskUserQuestion | Built | Code review |
| FR-6 | No agent may invoke another agent | Built (convention) | Not mechanically enforced |
| FR-7 | Build requires fresh verification evidence | Built | DoD gate |
| FR-8 | Secure must not return clean pass with OPEN risks | Built | Code review |
| FR-9 | Boardroom-checkpoint hook blocks ExitPlanMode without verdict | Built | Integration test |
| FR-10 | Ship runs 4 preflight checks | Built | Integration test |
| FR-11 | Evolve presents promotion in plain language, gets approval | Built | Code review |
| FR-12 | Every skill has "Use when..." in frontmatter description | Built | validate-structure (warning) |
| FR-13 | Agent names globally unique | Built | validate-structure (error) |
| FR-14 | Department leads created only on activation signal | Planned | N/A |
| FR-15 | MCP state-store server for checkpoint history | Planned | DATABASE.md |

### Non-Functional Requirements

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| NFR-1 | No hosted backend | ✅ Compliant | Zero network dependencies in plugin |
| NFR-2 | No new language runtime | ✅ Compliant | Node stdlib only, POSIX shell |
| NFR-3 | Plain-language checkpoint bar | ✅ Compliant | Enforced by skill content |
| NFR-4 | Lazy agent population | ✅ Compliant | 8 fixed agents, 0 speculatively built |
| NFR-5 | Self-contained skills | ✅ Compliant | No cross-skill runtime dependencies |
| NFR-6 | Mechanically checkable structure | ✅ Compliant | validate-structure.mjs |
| NFR-7 | Attributions traceable | ✅ Compliant | ATTRIBUTIONS.md present |

## Decision Log Quality (PROJECT.md)

- 16 versioned entries covering 9 days of development (2026-07-09 to 2026-07-18)
- Each entry records: what changed, why, what was considered and rejected
- Architecture rationale documented per decision (e.g., v6 framework choice: LangGraph rejected, Claude Code Task tool selected)
- Living-doc rule enforced: ARCHITECTURE.md updated alongside every structural change

## Compliance with Own Rules

| Rule | Compliant? | Evidence |
|---|---|---|
| Stale status is worse than no status doc | ✅ PROJECT.md updated with each version |
| validate-structure.mjs must pass before structural changes | ✅ CI enforces, passes current |
| Every skill has "Use when..." trigger clause | ✅ 39/39 (warnings if missing, not errors) |
| LEARNINGS.md is append-only | ✅ 7 entries, no deletions |
| REGRESSION-CHECKLIST.md consulted before changes | ✅ Cross-checked during this audit |
| `wingman:log` markers use type/category/status taxonomy | ✅ Verified by check-traceability.mjs |

## Version Gate Awareness

The `scripts/` files include an `expectedVersion` or version-compatibility check for the plugin. CI enforces that the version in `plugin.json` matches the expected version before publishing (`.github/workflows/version-gate.yml`). Not mechanically verifiable locally since `.github/workflows/` only exists on GitHub.
