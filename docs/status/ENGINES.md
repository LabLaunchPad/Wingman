# Engines: the index

Built in PR7 of the "Wingman as an AI Engineering Operating System" build
(`docs/status/ARCHITECTURE.md` §8g). 17 engines give every command/skill/hook/reference exactly one
declared owner — `scripts/validate-engines.mjs` (ships with the plugin) enforces this mechanically,
so this index cannot silently drift into aspiration the way a ~60-file governance blueprint already
did once (`docs/status/PROJECT.md`, 2026-07-22).

**This is a naming and ownership layer over machinery that mostly already existed** (~14 of 17
engines were fully built before PR7) — not a rebuild. PR8 built the remaining 3 (Code Intelligence,
Tool Runtime, Knowledge's searchability layer), so all 17 are now built. Each engine's manifest lives
at `plugins/wingman/engines/<engine-name>/ENGINE.md`.

| # | Engine | Status | Manifest |
|---|---|---|---|
| 1 | Vision | Built | `engines/vision-engine/ENGINE.md` |
| 2 | Context | Built | `engines/context-engine/ENGINE.md` |
| 3 | Memory | Built | `engines/memory-engine/ENGINE.md` |
| 4 | Research | Built | `engines/research-engine/ENGINE.md` |
| 5 | Planning | Built | `engines/planning-engine/ENGINE.md` |
| 6 | Design | Built | `engines/design-engine/ENGINE.md` |
| 7 | Architecture | Built | `engines/architecture-engine/ENGINE.md` |
| 8 | Engineering | Built | `engines/engineering-engine/ENGINE.md` |
| 9 | UX Intelligence | Built | `engines/ux-intelligence-engine/ENGINE.md` |
| 10 | Workflow | Built | `engines/workflow-engine/ENGINE.md` |
| 11 | Orchestration | Built | `engines/orchestration-engine/ENGINE.md` |
| 12 | Governance | Built | `engines/governance-engine/ENGINE.md` |
| 13 | Evaluation | Built | `engines/evaluation-engine/ENGINE.md` |
| 14 | Agent Adapter | Built | `engines/agent-adapter-engine/ENGINE.md` |
| 15 | Knowledge | Built | `engines/knowledge-engine/ENGINE.md` |
| 16 | Tool Runtime | Built | `engines/tool-runtime-engine/ENGINE.md` |
| 17 | Code Intelligence | Built | `engines/code-intelligence-engine/ENGINE.md` |

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
by its governing engine as a whole directory, named in that engine's manifest).

## Evaluation dimensions

The Evaluation Engine's 12-dimension map onto the 8 Boardroom seats lives in
`references/evaluation-dimensions.md` — derived directly from each seat's own real "What you check"
content, not invented, and deliberately not a second numeric-scoring system next to the existing
GO/GO_WITH_CONCERNS/NO_GO verdict contract.

## Core Operating Loop

See `docs/status/CORE-LOOP.md` for the 12-phase loop these 17 engines implement, mapped to the real
14 pipeline stages.
