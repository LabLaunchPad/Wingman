# Eval: predict

<!-- eval:no-fixture-needed: evidence comes from a real prediction query against live codebase directories inside a simulated session, not a synthetic fixture -->

Tests `plugins/wingman/skills/swarm-predictive-layer/SKILL.md` and `commands/adaptive/predict.md` — does it initialize the multi-agent predictive swarm (Refactor, Dependency, and Specialist-evidence particles) over a target codebase directory, calculate a Predicted Risk Score, and render a visual Risk and Cascade Map alongside a plain-language mitigation report?

## Run 1 — 2026-07-23 (initial predictive simulation)

A fresh subagent ran a simulated `/wingman:predict` command over a sample directory containing a modular javascript API project.

The subagent initialized three virtual predictive particles in parallel:
- **Refactor Risk Particle:** Traced imports and exports to identify which controller files would be affected if the core database client was refactored.
- **Dependency Cascade Particle:** Scanned `package.json` to predict version upgrade risks.
- **Specialist Evidence Particle:** Cross-referenced candidate roles in the Specialist Candidate Catalog to recommend promoting a "Data Modeling Specialist" or "Migration Engineer" if the database client underwent major changes.

The subagent produced a comprehensive, plain-language predictive report with a **Predicted Risk Score** of "High" due to tight coupling on the database client. It also successfully rendered a universal ASCII visual risk tree mapping out the transitive coupling boundaries.

## Trust level

`provisional` — single scenario. Verified that the multi-agent swarm simulation initializes, calculates coupling-based Risk Scores, and outputs a visual Risk & Cascade map in plain, non-technical founder-facing terms.
