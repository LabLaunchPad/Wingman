# Wingman Specialist Roster (Candidate Catalog)

This is the full catalog of specialist roles from Wingman's original enterprise blueprint, organized under the 8 departments defined in `docs/ARCHITECTURE.md`. **Every role below is a candidate, not a file.** None of them exist as subagents in a fresh Wingman install.

A role only gets built when `/wingman:evolve` promotes it — after a department lead shows repeated, evidenced friction in that specific narrow area on a real project (see `ARCHITECTURE.md` §6). This catalog exists so `/wingman:evolve` has a named vocabulary to promote from instead of inventing role names ad hoc, and so a human reading this repo can see the full ambition without mistaking it for what's actually built.

**Status legend:** every row starts as `candidate`. Update a row to `active (<project>)` only when `/wingman:evolve` actually creates that specialist's file for a specific project, with a link to the generated agent file.

---

## Executive Leadership Team → The Boardroom

Not a department — the 5 fixed gate-reviewer seats, always present. See `ARCHITECTURE.md` §4 for the full mapping (Founder seat absorbs CEO+CPO+CMO; Engineer seat = CTO; Security seat absorbs Legal & Compliance; Design seat unchanged; Cost seat = CFO, planned).

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
| Backend Core Specialist | Service orchestration, middleware, request handling | candidate |
| Business Logic Developer | Functional server code, endpoints, algorithms, webhooks | candidate — largely covered inline by `/wingman:build` today |
| AI Integration Specialist | RAG pipelines, vector search, LLM guardrails | candidate |
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

## How promotion actually happens

1. A department lead (or a pipeline command working inline before a lead exists) logs friction via `/wingman:learn` — a gotcha, a repeated workaround, a decision that had to be re-made.
2. On the second occurrence of the same narrow friction, `/wingman:evolve` clusters the learnings and proposes a promotion, naming the matching candidate role from this catalog (or a new one if nothing here fits).
3. The founder approves via `AskUserQuestion` in plain language — what's being created and why, not a technical spec.
4. Only then is the specialist's agent file written, following the structure of the existing boardroom/department agent files, and registered in `plugins/wingman/.claude-plugin/plugin.json`.
5. This file gets updated: the promoted row's status changes from `candidate` to `active (<project-or-context>)` with a link.

No role in this catalog should ever be bulk-created "to be thorough." A roster that reflects real, evidenced need is the entire point of the hybrid model in `ARCHITECTURE.md`.
