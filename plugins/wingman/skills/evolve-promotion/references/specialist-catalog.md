# Specialist Candidate Catalog

The named vocabulary `evolve-promotion` promotes specialist agents from, so a promoted role gets an established name/scope instead of one invented ad hoc. Every role below is a **candidate**, not a file — none of these exist until a real project's repeated friction (2+ occurrences, see `SKILL.md`) justifies promoting one.

**This file must stay in sync with `docs/AGENT-ROSTER.md` in the Wingman repo** — that file is the human-facing version (with promotion-process narrative, aimed at repo browsers/contributors); this one is the runtime-facing version that actually ships inside the installed plugin (`docs/` at the Wingman repo root is not part of what `marketplace.json` installs — only `plugins/wingman/` is, which is why this copy exists here). When one changes, update the other. See `docs/PROJECT.md`'s decisions log for why this duplication exists rather than a single shared file.

## 1. Product Management — lead: `dept-product`

| Candidate role | Original responsibility |
|---|---|
| Market Intel Specialist | Scans competitor products/repos/docs to identify feature gaps |
| User Persona Simulator | Simulates user demographics to pressure-test feature viability pre-build |
| Requirements Analyst | Formal SRS/PRD generation |
| Ticket Sync Specialist | Syncs epics/stories/acceptance criteria to Jira/Linear (via MCP) |
| Localization (L10n) Planner | Ensures multi-language/currency layout compliance |

## 2. UX/UI & Brand Design — lead: `dept-design`

| Candidate role | Original responsibility |
|---|---|
| UX Researcher | Wireframes, user-flow diagrams (e.g. Mermaid) |
| Design System Specialist | Global design tokens (Tailwind vars, typography, theming) |
| Vector Asset Generator | UI icons, logos, marketing imagery via generative tools |
| Component Interaction Specialist | Micro-interactions: hover states, loading skeletons, animation |
| Asset Optimization Specialist | Compression/format of visual assets (WebP, optimized SVG) |

## 3. Tech & Core Engineering — lead: `dept-engineering`

| Candidate role | Original responsibility |
|---|---|
| Enterprise Architect | System blueprints, sequence diagrams from the PRD |
| API Contract Specialist | OpenAPI/Swagger schema authoring before coding |
| Frontend Core Specialist | App scaffolding, routing, state management setup |
| Frontend Component Builder | Presentational components against the design system |
| React Engineer | React-specific component/hook/state patterns, when the project's frontend is specifically React (narrower than Frontend Core Specialist's framework-agnostic scope) |
| Backend Core Specialist | Service orchestration, middleware, request handling |
| Python Engineer | Python-specific backend patterns (async, typing, packaging), when the project's backend is specifically Python (narrower than Backend Core Specialist's language-agnostic scope) |
| Business Logic Developer | Functional server code, endpoints, algorithms, webhooks |
| AI Integration Specialist | RAG pipelines, vector search, LLM guardrails |
| RAG Engineer | Retrieval pipeline design specifically (chunking, embedding strategy, retrieval-quality tuning) — narrower than AI Integration Specialist's general RAG/vector-search/guardrails scope |
| LLM Integration Engineer | Prompt/response contract design and model-call integration for LLM-backed features, distinct from RAG's retrieval concern |
| RL Engineer | Reinforcement-learning system design (reward shaping, training-loop correctness) — only relevant to a project that's actually building an RL system, not Wingman's own operation (Wingman has no RLHF/model-training layer; see `docs/PRD.md` Non-goals) |
| Prompt Engineer | Prompt authoring/iteration for a project's own LLM-backed features — distinct from `Prompt Security Guard` below, which reviews prompts for injection risk, not authors them |
| Protocol & RPC Specialist | gRPC/WebSockets/GraphQL transport layers |
| Legacy Refactoring Specialist | Prevents new tech debt when touching old code |
| Dependency Management Specialist | Version pinning, conflict prevention |

## 4. Data & Analytics — lead: `dept-data`

| Candidate role | Original responsibility |
|---|---|
| Data Modeling Specialist | Relational/NoSQL/graph schema design |
| Migration Engineer | Safe up/down migrations, zero-downtime |
| Query Optimization Specialist | Indexing, N+1 prevention |
| Row-Level Security Specialist | Structural data-isolation policies |
| Analytics Pipeline Specialist | Event tracking wiring (Segment/Mixpanel-style) |

## 5. Quality Assurance & Peer Review — lead: `dept-qa`

| Candidate role | Original responsibility |
|---|---|
| Unit Test Generator | Coverage-focused test suite authoring |
| E2E Automation Specialist | Headless browser flows (Playwright/Cypress-style) |
| Static Code Reviewer | Style/lint/anti-pattern review |
| Functional Code Reviewer | Verifies acceptance criteria are actually met |
| Boundary & Fuzz Testing Specialist | Adversarial/malformed-input testing of endpoints |

## 6. Legal, Security & Compliance — lead: `dept-legal-security`

| Candidate role | Original responsibility |
|---|---|
| SAST Specialist | Static security scanning (OWASP Top 10, injection classes) |
| Secret Scan Guard | Blocks hardcoded keys/certs/env values from commits |
| Open Source License Auditor | Flags GPL/non-compliant dependency licenses |
| Privacy & Compliance Specialist | GDPR/CCPA/HIPAA data-handling review |
| Prompt Security Guard | Prompt-injection risk review for AI features |

## 7. DevOps & SRE Infrastructure — lead: `dept-devops`

| Candidate role | Original responsibility |
|---|---|
| Container Architect | Multi-stage Dockerfiles, orchestration |
| Infrastructure-as-Code Specialist | Terraform/Pulumi provisioning |
| CI/CD Pipeline Specialist | Delivery workflow authoring (GitHub Actions/GitLab CI) |
| Secrets & Key Vault Specialist | Production credential provisioning |
| SRE Observability Specialist | Logging, metrics, tracing (OpenTelemetry-style) |
| Canary & Rollback Specialist | Health-based automated rollback on bad deploys |

## 8. Revenue, Marketing & Ops — lead: `dept-growth`

| Candidate role | Original responsibility |
|---|---|
| Technical Copywriter | API docs, README, developer portal content |
| SEO Optimization Specialist | Semantic structure, schema markup, meta tags |
| Product Documentation Specialist | User guides, feature explainers, support content |
| Pricing & Billing Integration Specialist | Stripe/Chargebee webhook and plan verification |
| Product Launch & Content Specialist | Changelogs, announcements, launch copy |

## Using this catalog

If the clustered friction matches an existing row, name the promoted specialist after that row (e.g. a project with repeated migration-safety friction promotes "Migration Engineer"). If nothing here fits, name a new one clearly — don't force a poor match just to reuse a catalog name.
