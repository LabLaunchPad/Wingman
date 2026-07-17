# Wingman Specialist Roster (Candidate Catalog)

This is the full catalog of specialist roles from Wingman's original enterprise blueprint, organized under the 8 departments defined in `docs/ARCHITECTURE.md`. **Every role below is a candidate, not a file.** None of them exist as subagents in a fresh Wingman install.

A role only gets built when `/wingman:evolve` promotes it — after a department lead shows repeated, evidenced friction in that specific narrow area on a real project (see `ARCHITECTURE.md` §6). This catalog exists so `/wingman:evolve` has a named vocabulary to promote from instead of inventing role names ad hoc, and so a human reading this repo can see the full ambition without mistaking it for what's actually built.

**Status legend:** every row starts as `candidate`. Update a row to `active (<project>)` only when `/wingman:evolve` actually creates that specialist's file for a specific project, with a link to the generated agent file.

**Runtime copy:** this file lives at the Wingman repo root, outside `plugins/wingman/` — the only directory `marketplace.json` actually installs into a founder's project. `plugins/wingman/skills/evolve-promotion/references/specialist-catalog.md` is the copy that ships with the installed plugin and is what `/wingman:evolve` actually reads at runtime. Keep both in sync when either changes (see `docs/PROJECT.md`'s decisions log for why this duplication exists instead of one shared file).

---

## Executive Leadership Team → The Boardroom

Not a department — the 7 fixed gate-reviewer seats, always present (expanded from 5 in the 7-seat Boardroom rearchitecture). See `ARCHITECTURE.md` §4 for the full mapping: `boardroom-ceo` (business alignment/vision/strategy, split from the former Founder seat), `boardroom-cpo` (user value/feature fit, new), `boardroom-cmo` (go-to-market/positioning, new), `boardroom-cto` (renamed from Engineer), `boardroom-ciso` (renamed from Security, still absorbs Legal & Compliance), `boardroom-cfo` (renamed from Cost), `boardroom-research` (evidence/competitive-landscape lens, new — named "Research" not "CRO" to avoid colliding with the Growth department's Chief Revenue Officer advisory skill below), plus `boardroom-design` (unchanged).

---

## Management Board (Layer 2, complexity-gated)

Not a department — 9 execution-layer coordinator roles that sit between the Boardroom and department leads, created lazily and only once a project has **3+ active department leads** (see `skills/management-board-activation`). Unlike department leads, these coordinate and prioritize; they never produce the work themselves.

| Manager role | Agent name | Corresponds to |
|---|---|---|
| Engineering Manager | `mgr-engineering` | `dept-engineering` |
| Product Manager | `mgr-product` | `dept-product` |
| Design Manager | `mgr-design` | `dept-design` |
| Data Manager | `mgr-data` | `dept-data` |
| Security Manager | `mgr-security` | `dept-legal-security` |
| QA Manager | `mgr-qa` | `dept-qa` |
| Platform Manager | `mgr-platform` | `dept-devops` |
| Research Manager | `mgr-research` | (activates alongside Product once threshold is met) |
| Growth Manager | `mgr-growth` | `dept-growth` |

---

## 1. Product Management — lead: `dept-product`

| Candidate role | Original responsibility | Status |
|---|---|---|
| Market Intel Specialist | Scans competitor products/repos/docs to identify feature gaps | candidate |
| User Persona Simulator | Simulates user demographics to pressure-test feature viability pre-build | candidate |
| Requirements Analyst | Formal SRS/PRD generation | candidate — largely covered inline by `/wingman:plan` today |
| Ticket Sync Specialist | Syncs epics/stories/acceptance criteria to Jira/Linear (via MCP) | candidate |
| Localization (L10n) Planner | Ensures multi-language/currency layout compliance | candidate |

## 2. UX/UI & Brand Design — lead: `dept-design`

| Candidate role | Original responsibility | Status |
|---|---|---|
| UX Researcher | Wireframes, user-flow diagrams (e.g. Mermaid) | candidate |
| Design System Specialist | Global design tokens (Tailwind vars, typography, theming) | candidate |
| Vector Asset Generator | UI icons, logos, marketing imagery via generative tools | candidate |
| Component Interaction Specialist | Micro-interactions: hover states, loading skeletons, animation | candidate |
| Asset Optimization Specialist | Compression/format of visual assets (WebP, optimized SVG) | candidate |

## 3. Tech & Core Engineering — lead: `dept-engineering`

| Candidate role | Original responsibility | Status |
|---|---|---|
| Enterprise Architect | System blueprints, sequence diagrams from the PRD | candidate |
| API Contract Specialist | OpenAPI/Swagger schema authoring before coding | candidate |
| Frontend Core Specialist | App scaffolding, routing, state management setup | candidate |
| Frontend Component Builder | Presentational components against the design system | candidate |
| React Engineer | React-specific component/hook/state patterns (narrower than Frontend Core Specialist) | candidate |
| Backend Core Specialist | Service orchestration, middleware, request handling | candidate |
| Python Engineer | Python-specific backend patterns (narrower than Backend Core Specialist) | candidate |
| Business Logic Developer | Functional server code, endpoints, algorithms, webhooks | candidate — largely covered inline by `/wingman:build` today |
| AI Integration Specialist | RAG pipelines, vector search, LLM guardrails | candidate |
| RAG Engineer | Retrieval pipeline design specifically (narrower than AI Integration Specialist) | candidate |
| LLM Integration Engineer | Prompt/response contract design and model-call integration | candidate |
| RL Engineer | Reinforcement-learning system design — for a founder's own project, never for Wingman itself (no RLHF/training layer here; see `docs/PRD.md` Non-goals) | candidate |
| Prompt Engineer | Prompt authoring/iteration for a project's own LLM features (distinct from Prompt Security Guard below, which reviews for injection risk) | candidate |
| Protocol & RPC Specialist | gRPC/WebSockets/GraphQL transport layers | candidate |
| Legacy Refactoring Specialist | Prevents new tech debt when touching old code | candidate |
| Dependency Management Specialist | Version pinning, conflict prevention | candidate |

## 4. Data & Analytics — lead: `dept-data`

| Candidate role | Original responsibility | Status |
|---|---|---|
| Data Modeling Specialist | Relational/NoSQL/graph schema design | candidate |
| Migration Engineer | Safe up/down migrations, zero-downtime | candidate |
| Query Optimization Specialist | Indexing, N+1 prevention | candidate |
| Row-Level Security Specialist | Structural data-isolation policies | candidate |
| Analytics Pipeline Specialist | Event tracking wiring (Segment/Mixpanel-style) | candidate |

## 5. Quality Assurance & Peer Review — lead: `dept-qa`

| Candidate role | Original responsibility | Status |
|---|---|---|
| Unit Test Generator | Coverage-focused test suite authoring | candidate — largely covered by the bundled `verification-before-completion` skill today |
| E2E Automation Specialist | Headless browser flows (Playwright/Cypress-style) | candidate |
| Static Code Reviewer | Style/lint/anti-pattern review | candidate |
| Functional Code Reviewer | Verifies acceptance criteria are actually met | candidate |
| Boundary & Fuzz Testing Specialist | Adversarial/malformed-input testing of endpoints | candidate |

## 6. Legal, Security & Compliance — lead: `dept-legal-security`

| Candidate role | Original responsibility | Status |
|---|---|---|
| SAST Specialist | Static security scanning (OWASP Top 10, injection classes) | candidate — largely covered inline by `/wingman:secure` and `boardroom-security` today |
| Secret Scan Guard | Blocks hardcoded keys/certs/env values from commits | candidate |
| Open Source License Auditor | Flags GPL/non-compliant dependency licenses | candidate |
| Privacy & Compliance Specialist | GDPR/CCPA/HIPAA data-handling review | candidate |
| Prompt Security Guard | Prompt-injection risk review for AI features | candidate |

## 7. DevOps & SRE Infrastructure — lead: `dept-devops`

| Candidate role | Original responsibility | Status |
|---|---|---|
| Container Architect | Multi-stage Dockerfiles, orchestration | candidate |
| Infrastructure-as-Code Specialist | Terraform/Pulumi provisioning | candidate |
| CI/CD Pipeline Specialist | Delivery workflow authoring (GitHub Actions/GitLab CI) | candidate |
| Secrets & Key Vault Specialist | Production credential provisioning | candidate |
| SRE Observability Specialist | Logging, metrics, tracing (OpenTelemetry-style) | candidate |
| Canary & Rollback Specialist | Health-based automated rollback on bad deploys | candidate — the trigger for the `/wingman:hotfix` loop in `ARCHITECTURE.md` §7 |

## 8. Revenue, Marketing & Ops — lead: `dept-growth`

| Candidate role | Original responsibility | Status |
|---|---|---|
| Technical Copywriter | API docs, README, developer portal content | candidate — partially covered by `/wingman:ship`'s PR-description writing today |
| SEO Optimization Specialist | Semantic structure, schema markup, meta tags | candidate |
| Product Documentation Specialist | User guides, feature explainers, support content | candidate |
| Pricing & Billing Integration Specialist | Stripe/Chargebee webhook and plan verification | candidate |
| Product Launch & Content Specialist | Changelogs, announcements, launch copy | candidate — the core of the planned `/wingman:launch` command |

---

## Deferred mechanism ideas (not roles — architectural proposals awaiting evidence)

Unlike the candidate roles above (specialist agents, gated by the 2+-occurrence rule below), the
entries here are proposals for new *kinds* of mechanism — a new subsystem, not a new persona. They
get the same evidence-gate `ARCHITECTURE.md` already applies to MVP2-5's dropped placeholders
(local vector search, self-healing, enterprise-governance systems): logged so the idea isn't lost,
built only if a real dogfood run or founder session surfaces genuine, repeated friction that
nothing existing already solves.

| Idea | Proposed by | Why deferred |
|---|---|---|
| Swarm-intelligence predictive layer (PSO/ACO/GWO/OASIS-style multi-agent simulation for predicting refactor risk, dependency cascades, specialist-promotion evidence) | Pasted research document, 2026-07-15 | No dogfood run or retro in this project's history has ever surfaced a need for predictive simulation of code-change risk — every real risk caught so far (SQL injection, plaintext passwords, missing tests) was found by the existing Boardroom/DoD-gate review path operating directly on the real diff, not a simulated one. Building a PSO/ACO/OASIS layer now would be exactly the premature-abstraction pattern `ARCHITECTURE.md`'s evidence-gate exists to block — a large, complex, unvalidated addition with zero current signal it solves a real problem this plugin's actual founder-user base has. Revisit only if a real dogfood run or founder complaint shows the existing single-pass review genuinely misses cascading/emergent risk that a simulation layer would have caught. |
| "Enterprise-grade hybrid framework" pipeline restructuring (per-stage `PROJECT_INIT.json`/`PRD_SPEC.yaml`/`ARCH_SCHEMA.json`/etc. output files; configurable Boardroom "strictness" — unanimous/majority/founder-override; canary rollout + AI/human/hybrid observability dashboards) | Pasted framework document, 2026-07-16 | Conflicts with decisions this project already made and documented, not just unevidenced: `docs/DATABASE.md` explicitly chose one flat append-only `checkpoints.jsonl` + `state.json` over per-stage schema files (a real, revisited decision — see its `schema_version` 1→2→3 migration history), and separately deferred a local MCP state-server for the same reason. The proposed "majority/override" Boardroom strictness would weaken the one unconditional safety gate (any seat's `NO_GO` blocks) this project is built around, for exactly the non-technical-founder audience that gate protects — a governance regression, not an addition. Canary rollout/observability dashboards are real infrastructure `docs/PROJECT.md`'s "Not yet built" section already scopes out, with no dogfooding history showing a founder has hit this gap. Revisit only if a real dogfood run or founder complaint shows the current flat-file/unconditional-gate approach has genuinely failed — not preemptively. |

---

## How promotion actually happens

1. A department lead (or a pipeline command working inline before a lead exists) logs friction via `/wingman:learn` — a gotcha, a repeated workaround, a decision that had to be re-made.
2. On the second occurrence of the same narrow friction, `/wingman:evolve` clusters the learnings and proposes a promotion, naming the matching candidate role from this catalog (or a new one if nothing here fits).
3. The founder approves via `AskUserQuestion` in plain language — what's being created and why, not a technical spec.
4. Only then is the specialist's agent file written, following `skills/evolve-promotion/references/specialist-agent-template.md`, to `.claude/agents/<specialist-slug>.md` **in the founder's own project — never into Wingman's own plugin directory.** This matches the department-lead rule in `docs/ARCHITECTURE.md` §5: plugin files get resynced from the marketplace source, and a specialist tied to one founder's specific codebase belongs in that founder's repo, not baked into a shared plugin install.
5. The promotion is recorded in that project's own `.wingman/state.json` (`active_specialists` array) — there's no cross-project roster to update at runtime. This catalog file itself only gets a status update by a human maintaining the Wingman repo, when they choose to note that a candidate role has proven itself active somewhere.

No role in this catalog should ever be bulk-created "to be thorough." A roster that reflects real, evidenced need is the entire point of the hybrid model in `ARCHITECTURE.md`.
