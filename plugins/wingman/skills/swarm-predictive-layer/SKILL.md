---
name: swarm-predictive-layer
description: Use when requested to perform predictive analysis, run risk simulations, or analyze cascading side-effects of code and dependency changes — triggers on phrases like "predictive analysis," "simulate refactor risk," "predict side effects," "dependency cascade simulation," "swarm intelligence," "pso/aco/gwo prediction," "oasis simulation," or via /wingman:predict. Packages a multi-agent swarm simulation model to forecast refactor risk, dependency cascades, and specialist-promotion evidence.
---

# Swarm-Intelligence Predictive Layer

## Overview

In complex codebases, changes are rarely isolated. A simple modification to a utility function can trigger a cascading series of regressions across seemingly unrelated modules. Traditional static analysis and test suites can only tell you what is *currently* broken, not what is *likely* to break or what organizational growth (specialist promotion) is needed next.

This skill implements a **Swarm-Intelligence Predictive Layer** inspired by Particle Swarm Optimization (PSO), Ant Colony Optimization (ACO), Grey Wolf Optimizer (GWO), and OASIS-style multi-agent simulations. It models different aspects of the codebase as a swarm of virtual "particles" or "agents", each moving through the code/dependency space to locate, predict, and quantify hidden cascading risks before they manifest.

**Core principle:** simulate multi-angle predictive perspectives in parallel (particles/agents), fuse their findings to forecast refactor risks and dependency cascades, and determine the exact specialist-promotion evidence needed.

## When To Use

Whenever a major architectural change, refactoring, or dependency upgrade is planned, or when explicitly requested by the founder using phrases like:
- "Predict what will break if I change this."
- "What is the refactor risk for Y?"
- "Run a swarm intelligence prediction/simulation on Z."
- "Or via the `/wingman:predict` custom command."

## Core Workflow

**1. Initialize the Predictive Swarm:**
Scope the simulation into three distinct virtual "particles" (agents) working in parallel, each representing a specialized swarm intelligence focus:
- **Refactor Risk Particle (PSO/ACO Lens):** Focuses on code connectivity, tracing imports/exports, and predicting which files are most likely to experience cascading regressions if a target module is changed.
- **Dependency Cascade Particle (GWO Lens):** Focuses on package.json, lockfiles, stdlib vs. external dependencies, and version compatibility, predicting where version or API changes will cause compilation or runtime failures.
- **Specialist Evidence Particle (OASIS Lens):** Focuses on organizational friction, matching predicted code risks against the candidate roles in `docs/AGENT-ROSTER.md` to identify what specialist agent should be promoted next.

**2. Execute Parallel Simulation:**
Dispatch the 3 virtual particles (or run three distinct analytical passes) over the target scope (code directory, specific file, or planned task). Each particle performs its localized search of the file tree and codebase, tracing dependency graphs and code complexity indicators.

**3. Synthesize and Quantify Risk (The Swarm Consensus):**
Consolidate the particles' findings into a unified, structured prediction report. Calculate a **Predicted Risk Score** (Low, Medium, High) based on three factors:
- **Blast Radius (Code Coupling):** The number of files/modules transitively importing or depending on the target scope.
- **Dependency Complexity:** The number of external libraries or complex configurations touched by the change.
- **Friction Density:** The frequency of historically recorded issues or learnings (`LEARNINGS.md`/`retros.md`) in the same functional category.

**4. Generate a Risk Map:**
Following the `visual-founder-output` skill guidelines, render a visual **Risk & Cascade Map** (using ASCII tree or Mermaid) to show the predicted flow of risk from the target file out to its coupling boundaries.

**5. Formulate Mitigation & Promotion Evidence:**
For any predicted high-risk zones, recommend specific defensive steps (e.g., writing a failing test first, pinning a dependency). If the simulation predicts high friction in a specific department's domain, extract the exact candidate role from the Specialist Catalog to advise the founder on potential specialist-agent promotion via `/wingman:evolve`.

## Constraints

**MUST:**
- Run all three particle perspectives (Refactor, Dependency, Specialist) to ensure a complete, multi-angle forecast.
- Map predicted organizational friction directly to named candidates in `references/specialist-catalog.md` or `docs/AGENT-ROSTER.md`.
- Present visual Risk and Cascade maps using universal ASCII/Mermaid notation (Tier B) or Rich wireframe layers (Tier A) where supported.

**MUST NOT:**
- Fabricate dependency paths or coupling relationships — every predicted cascade must be backed by real code import/require lines or configuration files on disk.
- Recommend speculative specialist promotion without citing the exact friction/risk evidence found in the codebase.
- Provide a raw model dump of code — the prediction must be written in plain, jargon-free founder terms, leading with consequence over mechanism.

## Rationalizations

| Excuse | Reality |
|---|---|
| "The codebase is small, so there is no refactor risk to simulate" | Even in simple projects, minor changes can propagate. Simulating the swarm confirms the coupling is zero, rather than assuming it is. |
| "A static grep is enough to find imports" | Grep finds string matches, but it doesn't simulate dependency cascades, version constraints, or organizational specialist-promotion needs. |
| "I don't need the specialist-evidence particle since we aren't evolving now" | Prediction is about foresight. Knowing which specialist *would* de-risk a complex area helps the founder make better planning decisions today. |

## Red Flags — Stop and Reconsider

- You are about to run a prediction without referencing real import lines, package files, or roster roles.
- The visual cascade map shows files that have no relation or imports to the target.
- Your report is filled with dense AST parser jargon instead of plain-language business impact.
- You skip the specialist-evidence analysis because "no specialist is active yet."

## Verification

Before final output, verify: (1) every file named in the predicted blast radius actually exists and imports/uses the target scope directly or transitively; (2) the recommended specialist exists as a candidate in the roster; (3) the visual Mermaid/ASCII graph has valid syntax and renders correctly.

## Continuous Execution

See `references/continuous-execution.md` — maintain momentum through a workflow once started; don't pause to narrate or summarize mid-flight.

## Anti-Rationalization Defense

### Common Rationalizations

| Excuse | Reality |
|---|---|
| "This change is too small to have any cascading risk" | Small changes in shared modules have the largest blast radiuses. Always run the simulation to prove the risk is low. |
| "The dependency graph is obvious from looking at package.json" | Package.json only shows top-level declarations, not transitive cascades, lockfile constraints, or local module wiring. |
| "I'll skip the visual risk map to save tokens" | Visualizing the cascade is how non-technical founders understand the coupling of their system. Skipping it degrades usability. |

### Red Flags

- Your predicted blast radius list includes files that have no direct or transitive imports to the target.
- The specialist recommended for promotion has no connection to the predicted risk profile.
- You present the cascade using complex compilation/AST terminology instead of plain-language business consequence.

### Anti-Pattern Callouts

- **Isolated-thinking:** Only predicting refactoring risk while ignoring dependency cascades and specialist organizational evolution.
- **Hypothetical-cascades:** Inventing file connections or dependencies that do not exist in the real codebase.
- **Speculative-promotion:** Recommending a specialist from the catalog without concrete predicted risk/friction evidence to justify it.

## Referenced by

- `commands/adaptive/predict.md`

See `docs/ARCHITECTURE.md` for this skill's place in Wingman's overall architecture.
