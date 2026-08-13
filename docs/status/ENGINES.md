# Engines: the index

Built in PR7 of the "Wingman as an AI Engineering Operating System" build
(`docs/status/ARCHITECTURE.md` §8g). Reorganized 2026-07-30 into an explicit **EngineOS** layout
(`docs/status/ARCHITECTURE.md`'s EngineOS section) per a founder-directed blueprint: engines give
every command/skill/hook/reference exactly one declared owner — `scripts/validate-engines.mjs`
(ships with the plugin) enforces this mechanically, so this index cannot silently drift into
aspiration the way a ~60-file governance blueprint already did once (`docs/status/PROJECT.md`,
2026-07-22).

**This is a naming and ownership layer over machinery that mostly already existed** — not a rebuild.
The 17-engine set built in PR7/PR8 covered nearly all of it; the 2026-07-30 EngineOS pass split 4 of
those 17 into narrower, more precisely-scoped engines (Constitution/Risk/Graph carved out of
Governance; Operations carved out of Workflow+Orchestration+Governance) and added one new thin
engine (Contract), bringing the real count to 22. Each engine's manifest lives at
`plugins/wingman/engines/<engine-name>/ENGINE.md`; `plugins/wingman/engines/registry.yaml` declares
every engine's id/path/status plus the Core Operating Loop's execution order as data, not folder
numbering.

| Engine | Status | Manifest |
|---|---|---|
| Constitution | Built | `engines/constitution-engine/ENGINE.md` |
| Governance | Built | `engines/governance-engine/ENGINE.md` |
| Risk | Built | `engines/risk-engine/ENGINE.md` |
| Context | Built | `engines/context-engine/ENGINE.md` |
| Knowledge | Built | `engines/knowledge-engine/ENGINE.md` |
| Graph | Built | `engines/graph-engine/ENGINE.md` |
| Research | Built | `engines/research-engine/ENGINE.md` |
| Planning | Built | `engines/planning-engine/ENGINE.md` |
| Vision | Built | `engines/vision-engine/ENGINE.md` |
| UX Intelligence | Built | `engines/ux-intelligence-engine/ENGINE.md` |
| Design | Built | `engines/design-engine/ENGINE.md` |
| Architecture | Built | `engines/architecture-engine/ENGINE.md` |
| Contract | Built (thin) | `engines/contract-engine/ENGINE.md` |
| Agent Adapter | Built | `engines/agent-adapter-engine/ENGINE.md` |
| Evaluation | Built | `engines/evaluation-engine/ENGINE.md` |
| Operations | Built | `engines/operations-engine/ENGINE.md` |
| Memory | Built | `engines/memory-engine/ENGINE.md` |
| Engineering | Built | `engines/engineering-engine/ENGINE.md` |
| Code Intelligence | Built | `engines/code-intelligence-engine/ENGINE.md` |
| Tool Runtime | Built | `engines/tool-runtime-engine/ENGINE.md` |
| Workflow | Built | `engines/workflow-engine/ENGINE.md` |
| Orchestration | Built | `engines/orchestration-engine/ENGINE.md` |

## Reconciliation with the founder's 19-engine blueprint

The founder's EngineOS blueprint named 19 engines (Constitution, Governance, Risk, Context,
Knowledge, Graph, Research, Planning, Product, PRD, SRS, UX, Design System, Architecture, ADR,
Contract, Harness, Evaluation, Operations). Wingman's real count is 22, not 19 — reconciled here
explicitly rather than forcing an artificial fit, per the blueprint's own "no duplicated
responsibility" acceptance criterion:

| Blueprint name | Wingman engine | Why |
|---|---|---|
| Product | Vision | Wingman treats vision-capture and product-intent as one concern (Discovery is the pipeline's single entry point); splitting them would duplicate responsibility, not clarify it. |
| PRD | Planning | `define.md` (Planning Engine) already mints the requirement rows a PRD needs; no separate stage exists to own. |
| SRS | Architecture | `architecture.md` (Architecture Engine) already covers system/non-functional requirements; folding SRS in avoids a second, thinner engine with near-identical inputs. |
| ADR | Architecture | Architecture decisions and their record-keeping are the same act in Wingman's real pipeline (WKOS's `TEMPLATE_ADR.md`, cited from the Architecture Engine); a dedicated ADR Engine would own a template, not a process. |
| UX | UX Intelligence | Direct rename — Wingman's 7 UX pipeline stages already matched this scope before the EngineOS pass. |
| Design System | Design | Direct rename — no change in scope. |
| Harness | Agent Adapter | Direct rename — no change in scope. |
| *(not in blueprint)* | Memory | Wingman's own 7-tier memory system; the blueprint's interaction model lists Memory as a cross-cutting concern after Operations, not one of its 19 numbered engines — kept as a real, distinct Wingman engine regardless. |
| *(not in blueprint)* | Engineering | The actual code-writing engine (`build.md`, TDD/debugging/simplification skills) — a generic SDLC blueprint didn't separately name "the engine that writes code," but Wingman's real pipeline needs one. |
| *(not in blueprint)* | Code Intelligence, Tool Runtime | PR8's two additions (reuse-before-writing, declarative tool selection) — genuinely new capability the blueprint's 19-name list predates. |
| *(not in blueprint)* | Workflow, Orchestration | Ship-time mechanics and session/loop-level dispatch efficiency — infrastructure concerns the blueprint's SDLC-stage-shaped list doesn't cover. |

Constitution, Risk, and Graph were carved out of what used to be one Governance engine — see each
new engine's own `ENGINE.md` for why the split is a genuine responsibility distinction, not a
cosmetic rename. Operations was carved out of Workflow (launch/post-launch), Orchestration
(telemetry), and Governance (incident response) for the same reason: "shipping a change,"
"bounding a session's dispatch," and "what happens to a live project" are three different concerns
that happened to share owners before this pass.

## The one rule

Every command, skill, hook, and top-level reference doc belongs to **exactly one** engine. No
orphans, no double ownership. `scripts/validate-engines.mjs` walks the real plugin file tree and
every `ENGINE.md`'s `## Members` section and fails on either violation — confirmed by deliberately
breaking one member declaration during this PR's own build and watching the check catch it before
being restored.

**Scope note:** the check covers `commands/**/*.md` (excluding `README.md` navigation docs),
`skills/*/SKILL.md`, `hooks/*.mjs`, `agents/*.md`, and top-level `references/*.md` — not
`plugins/wingman/scripts/*.mjs` (a narrower, disclosed scope matching the plan's own literal
wording) and not the structured subdirectories `references/wkos/`, `references/harness-adapters/`,
`references/org-template/` (document collections, not flat reference docs — each is instead owned
by its governing engine as a whole directory, named in that engine's manifest). `engines/registry.yaml`
is also outside this check's scope (it describes engines, it isn't itself a command/skill/hook/
reference to be owned).

## Evaluation dimensions

The Evaluation Engine's 12-dimension map onto the 8 Boardroom seats lives in
`references/evaluation-dimensions.md` — derived directly from each seat's own real "What you check"
content, not invented, and deliberately not a second numeric-scoring system next to the existing
GO/GO_WITH_CONCERNS/NO_GO verdict contract.

## Core Operating Loop

See `docs/status/CORE-LOOP.md` for the 12-phase loop these engines implement, mapped to the real
14 pipeline stages, and `engines/registry.yaml`'s `pipeline:` list for the same order as data.
