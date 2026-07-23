---
description: Perform multi-agent swarm predictive simulation over target files or dependency changes — predicts refactor blast radius, dependency cascades, and specialist-agent promotion needs in plain language.
---

# /wingman:predict

Run a swarm-intelligence predictive simulation on the codebase to identify cascading side-effects of planned changes and recommend organizational specialist-agent promotions.

## When to use
- "What files are likely to break if I change this module?"
- "Simulate refactor risks or dependency cascades for our next feature."
- "What specialist from our roster is needed to support this change?"

## Steps
1. Load the `swarm-predictive-layer` skill and follow its simulation workflow.
2. Initialize 3 virtual particles (agents) in parallel:
   - **Refactor Risk Particle:** Traces local imports/exports to determine the transitive blast radius.
   - **Dependency Cascade Particle:** Inspects version pin files and dependency constraints.
   - **Specialist Evidence Particle:** Cross-checks predicted risk areas with the candidate roster in `references/specialist-catalog.md` or `docs/AGENT-ROSTER.md`.
3. Compute and assign a quantitative **Predicted Risk Score** (Low, Medium, or High) based on coupling complexity and file touch density.
4. Render a structured, visual **Risk & Cascade Map** using Mermaid or ASCII trees (Tier B universal format).
5. Produce a plain-language summary for the founder detailing:
   - **Consequence:** Exactly what parts of the system are at risk.
   - **Mitigation:** Recommended defensive steps (e.g. TDD, isolation patterns).
   - **Evolution recommendation:** Which specialist agent should be promoted from the candidate catalog to permanently de-risk this concern.

## Guardrails
- Never invent dependency pathways or file imports — base the simulation strictly on on-disk code imports, requires, or config files.
- Deliver results in clean, non-technical, consequence-first language. No AST parsing or raw code dumps unless explicitly requested.
- Keep the prediction focused on proactive mitigation rather than retroactive debugging.
