# Wingman

<p align="center">
  <img src="docs/assets/cover.svg" alt="Wingman — an AI Boardroom that plans, builds, secures, and ships production-grade software, with 7 C-suite-style seats plus Design reviewing every stage." width="100%">
</p>

<p align="center">
  <a href="https://github.com/LabLaunchPad/Wingman/actions/workflows/validate.yml"><img src="https://github.com/LabLaunchPad/Wingman/actions/workflows/validate.yml/badge.svg" alt="Validate"></a>
  <a href="https://github.com/LabLaunchPad/Wingman/actions/workflows/install-smoke.yml"><img src="https://github.com/LabLaunchPad/Wingman/actions/workflows/install-smoke.yml/badge.svg" alt="Install smoke"></a>
  <a href="https://github.com/LabLaunchPad/Wingman/actions/workflows/actionlint.yml"><img src="https://github.com/LabLaunchPad/Wingman/actions/workflows/actionlint.yml/badge.svg" alt="Actionlint"></a>
  <a href="https://github.com/LabLaunchPad/Wingman/actions/workflows/codeql.yml"><img src="https://github.com/LabLaunchPad/Wingman/actions/workflows/codeql.yml/badge.svg" alt="CodeQL"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT"></a>
</p>

Wingman is a [Claude Code](https://claude.com/product/claude-code) plugin that gives non-technical founders a full AI SDLC — an AI Boardroom of agents that plans, builds, secures, and ships production-grade software end to end, with plain-language checkpoints instead of code review.

**At a glance:**

| | |
|---|---|
| **Plugin surface** | Commands, skills, and 8 fixed Boardroom seats — run `node scripts/wingman-health.mjs` for the live command/skill counts |
| **Eval coverage** | Behavioral eval cases across `verified`/`provisional` trust levels — run `node scripts/wingman-health.mjs` for the live count and split |
| **Current release** | See [`CHANGELOG.md`](CHANGELOG.md) for the current version and history |
| **Install target** | Claude Code marketplace + plugin (`.claude-plugin/marketplace.json`) |
| **Runtime dependencies** | None — markdown + one dependency-free Node hook script |

## Quickstart

```
/plugin marketplace add LabLaunchPad/Wingman
/plugin install wingman
```

Then run `/wingman:discovery` to start a new project, or `/wingman:boardroom` to get a plain-language review of work already in progress. Every `wingman:*` command is listed in [`plugins/wingman/.claude-plugin/plugin.json`](plugins/wingman/.claude-plugin/plugin.json).

### Using a different AI coding agent

Wingman is built as a Claude Code plugin, and most of the Boardroom's execution mechanism (interactive
founder questions, the plan-approval gate, parallel multi-seat dispatch) is genuinely coupled to
Claude Code's own tool surface — see [`docs/status/ARCHITECTURE.md` §8a/§8b](docs/status/ARCHITECTURE.md) for the
honest account of what is and isn't portable. Two harnesses have a real, scoped starting point:

- **Codex CLI** and **OpenCode** — Boardroom seat personas translated into each harness's native
  agent format, plus install steps: [`plugins/wingman/references/harness-adapters/`](plugins/wingman/references/harness-adapters/README.md).
  Every artifact there is labeled `built + tested`, `authored, unverified`, or `not attempted,
  documented why` — nothing is overclaimed as working until it's actually been run against a live
  install of that harness.
- **Any harness at all** (including a human running plain `git`) — the git-push safety gate
  (`dod-structural-gate.mjs`'s threat-register/traceability/test checks) has a harness-agnostic
  fallback: `plugins/wingman/scripts/install-git-hooks.mjs` wires it up as a real `.git/hooks/pre-push`
  hook, with zero per-harness adaptation. This is the one piece confirmed working outside Claude Code.

## How it works

Instead of asking a founder to read code or a diff, Wingman gates every stage of the SDLC through a **Boardroom checkpoint**: 7 C-suite-style seats plus Design (CEO / CPO / CMO / CTO / CISO / CFO / Research / Design) examine the plan or change in parallel and hand back one short, jargon-free go/no-go summary, consolidated into a grouped Business / Technical / Finance / Research report. The founder makes the call; Wingman never assumes silence means approval.

```mermaid
flowchart LR
    subgraph P1["1. Problem Definition"]
        direction LR
        A1[discovery] --> A2[research-synthesis] --> A3[personas-jobs]
    end
    subgraph P2["2. Logic & Mapping"]
        direction LR
        B1[journey-mapping] --> B2[define]
    end
    subgraph P3["3. Lean Design"]
        direction LR
        C1[information-architecture] --> C2[uxflow] --> C3[wireframes] --> C4[visual-design-system]
    end
    subgraph P4["4. Architecture & Build"]
        direction LR
        D1[prototype-usability] --> D2[architecture] --> D3[implementation-planning] --> D4[build]
    end
    subgraph P6["6. Launch & Iterate"]
        direction LR
        E1[ship]
    end
    P1 --> P2 --> P3 --> P4 --> P6
    P4 -.->|every one of stages 1-12 has its own solo checkpoint| CP{{Boardroom}}
```

**14 named stages, 14 founder-visible checkpoints** — every stage 1 through 12 records its own solo Boardroom checkpoint immediately after itself (no bundling), plus `build`'s own Definition-of-Done gate (folding in the security pass) and `ship`'s. See [`docs/status/ARCHITECTURE.md`](docs/status/ARCHITECTURE.md) §4d for the full stage list, traceability prefixes, and the founder-approved reversal of an earlier, more-bundled 7-stage/3-checkpoint model. A `change-triage` skill runs at intake (`discovery`, `build`, `hotfix`) to route a genuinely small, non-trust-boundary fix to a lighter path instead of the full sequence — see §4d's note on this deliberate, explicitly-recorded partial exception.

The agent population is deliberately **lazy, not exhaustive**:

- A fixed **7+1-seat Boardroom** is always present — it only renders verdicts, never writes code.
- A small set of **department leads** (Product, Engineering, QA always active; Design, Data, Legal/Security, DevOps, Growth created only when a project's real complexity calls for them) do the actual build-time work.
- A **Management Board** of coordinators activates only once a project crosses 3+ active conditionally-created department leads.
- Narrow **specialists** (a 56-role candidate catalog) are promoted one at a time via `/wingman:evolve`, only after proven, repeated need — never bulk-created.

See [`docs/status/ARCHITECTURE.md`](docs/status/ARCHITECTURE.md) for the full model and [`docs/roadmap/AGENT-ROSTER.md`](docs/roadmap/AGENT-ROSTER.md) for the complete specialist catalog.

## Status

The pipeline is built and behaviorally tested, not just scaffolded:

- **Commands** — 14 named SDLC pipeline stages (`discovery` / `research-synthesis` / `personas-jobs` / `journey-mapping` / `define` / `information-architecture` / `uxflow` / `wireframes` / `visual-design-system` / `prototype-usability` / `architecture` / `implementation-planning` / `build` / `ship`) plus adaptive commands (`audit`, `boardroom`, `launch`, `hotfix`, `harness`, `telemetry`, `retro`, `learn`, `evolve`, `over-engineering-review`, `bloat-audit`, `debt-ledger`, `research`, `advisory`, `incident`, `dogfood`, `knowledge-export`, `post-launch`, `review`, `test`). Run `node scripts/wingman-health.mjs` for the live, exact count.
- **Skills** covering discipline (`engineering-minimalism`, `verification-before-completion`), mechanics (`git-pr-workflow`, `security-checklist`), and adaptive output (`visual-founder-output`, `plain-language-checkpoint`).
- **8 fixed Boardroom seats** (7 C-suite-style + Design), dispatched in parallel and never writing code.

`evals/` holds a lightweight behavioral eval harness (not just structural validation): eval cases in a mix of `verified` (passed 2+ differently-shaped scenarios including a negative case) and `provisional` (passed one real run) — see `evals/README.md` for the trust-level bar. Covers every command and the high-value skills, including full end-to-end pipeline runs against realistic projects (one adversarial run producing a real `DO NOT SHIP`). Run `node scripts/wingman-health.mjs` for a live, read-only snapshot of these numbers straight from the repo — it's the source of truth this table is generated from, not a number to trust in prose.

See [`docs/status/PROJECT.md`](docs/status/PROJECT.md) for exact build/eval status and decisions log, and [`docs/status/ARCHITECTURE.md`](docs/status/ARCHITECTURE.md) for what's built versus deliberately deferred. Most of this was verified in a sandboxed testing environment; real dogfooding passes (actual `claude` CLI install, live pipeline runs via `/wingman:dogfood`) have also happened and found real gaps, now fixed — see [`docs/HUMAN-TODOS.md`](docs/HUMAN-TODOS.md) for what real dogfooding still needs.

## For humans and for agents

This README is written to be skimmed top-to-bottom in under a minute. If you're an AI coding agent working in this repo instead of a human reading it, start with [`AGENTS.md`](AGENTS.md) — the canonical project brief, following the open [AGENTS.md standard](https://agents.md) (`CLAUDE.md` is a symlink to it, kept for tools that look for that filename specifically) — rather than re-deriving conventions from source. See `docs/status/ARCHITECTURE.md` §8a for the honest scope of what's portable to a non-Claude-Code harness today (two skills) versus what isn't (the rest).

## Documentation

- [`docs/status/ARCHITECTURE.md`](docs/status/ARCHITECTURE.md) — the hybrid Boardroom/department/specialist model and why it's shaped this way.
- [`docs/status/GOVERNANCE.md`](docs/status/GOVERNANCE.md) — a one-page index of where org governance, policy enforcement, and benchmarks/metrics each already live in this repo.
- [`docs/roadmap/AGENT-ROSTER.md`](docs/roadmap/AGENT-ROSTER.md) — the full specialist candidate catalog, organized by department.
- [`docs/status/PROJECT.md`](docs/status/PROJECT.md) — current build/eval status, decisions log, and roadmap.
- [`CHANGELOG.md`](CHANGELOG.md) — release history.
- [`docs/HUMAN-TODOS.md`](docs/HUMAN-TODOS.md) — what's blocked on a human rather than more engineering (publishing, demo content — see `docs/DEMO-CHECKLIST.md`).
- [`evals/README.md`](evals/README.md) — how the behavioral eval harness works and what's been verified.
- [`ATTRIBUTIONS.md`](ATTRIBUTIONS.md) — provenance for design patterns adapted from vendored reference repositories.
- [`SECURITY.md`](SECURITY.md) — vulnerability disclosure and this repo's actual trust boundaries.
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — how to propose a change.

## License

[MIT](LICENSE)
