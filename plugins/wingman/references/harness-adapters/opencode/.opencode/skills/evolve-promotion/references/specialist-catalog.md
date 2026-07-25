# Specialist Candidate Catalog

The named vocabulary `evolve-promotion` promotes specialist agents from, so a promoted role gets an established name/scope instead of one invented ad hoc. Every role below is a **candidate**, not a file — none of these exist until a real project's repeated friction (2+ occurrences, see `SKILL.md`) justifies promoting one.

**This file must stay in sync with `docs/AGENT-ROSTER.md` in the Wingman repo** — that file is the human-facing version (with promotion-process narrative, aimed at repo browsers/contributors); this one is the runtime-facing version that actually ships inside the installed plugin (`docs/` at the Wingman repo root is not part of what `marketplace.json` installs — only `plugins/wingman/` is, which is why this copy exists here). When one changes, update the other. See `docs/PROJECT.md`'s decisions log for why this duplication exists rather than a single shared file.

## 1. Product Management — lead: `dept-product`

| Candidate role | Original responsibility | Status |
|---|---|---|
| Market Intel Specialist | Scans competitor products/repos/docs to identify feature gaps | candidate |
| User Persona Simulator | Simulates user demographics to pressure-test feature viability pre-build | candidate |
| Requirements Analyst | Formal SRS/PRD generation | candidate — largely covered inline by `/wingman:discovery`/`/wingman:define` today |
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
| React Engineer | React-specific component/hook/state patterns, when the project's frontend is specifically React (narrower than Frontend Core Specialist's framework-agnostic scope) | candidate |
| Backend Core Specialist | Service orchestration, middleware, request handling | candidate |
| Python Engineer | Python-specific backend patterns (async, typing, packaging), when the project's backend is specifically Python (narrower than Backend Core Specialist's language-agnostic scope) | candidate |
| Business Logic Developer | Functional server code, endpoints, algorithms, webhooks | candidate — largely covered inline by `/wingman:build` today |
| AI Integration Specialist | RAG pipelines, vector search, LLM guardrails | candidate |
| RAG Engineer | Retrieval pipeline design specifically (chunking, embedding strategy, retrieval-quality tuning) — narrower than AI Integration Specialist's general RAG/vector-search/guardrails scope | candidate |
| LLM Integration Engineer | Prompt/response contract design and model-call integration for LLM-backed features, distinct from RAG's retrieval concern | candidate |
| RL Engineer | Reinforcement-learning system design (reward shaping, training-loop correctness) — only relevant to a project that's actually building an RL system, not Wingman's own operation (Wingman has no RLHF/model-training layer; see `docs/PRD.md` Non-goals) | candidate |
| Prompt Engineer | Prompt authoring/iteration for a project's own LLM-backed features — distinct from `Prompt Security Guard` below, which reviews prompts for injection risk, not authors them | candidate |
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
| SAST Specialist | Static security scanning (OWASP Top 10, injection classes) | candidate — largely covered inline by `/wingman:build`'s Definition-of-Done gate and `boardroom-ciso` today |
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
| Product Launch & Content Specialist | Changelogs, announcements, launch copy | candidate — the core of the `/wingman:launch` command |

## Using this catalog

If the clustered friction matches an existing row, name the promoted specialist after that row (e.g. a project with repeated migration-safety friction promotes "Migration Engineer"). If nothing here fits, name a new one clearly — don't force a poor match just to reuse a catalog name.
