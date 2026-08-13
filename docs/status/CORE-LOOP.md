# Core Operating Loop

The 12-phase loop from the founder's Master Build Prompt, mapped onto the engines
(`docs/status/ENGINES.md` — 17 at the time this loop was first written, reorganized 2026-07-30 into
22 EngineOS engines; the phase mapping below still holds since the split engines inherited their
parent's phase ownership) and the real 14 pipeline stages. This is the operating instruction the
engine layer implements — not a new mechanism, a naming layer over what PR1-PR7 of the "Wingman as
an AI Engineering Operating System" build already made real.

| # | Phase | Owning engine(s) | Real implementation |
|---|---|---|---|
| 1 | Vision | Vision | `commands/pipeline/discovery.md` — mints `DISC-*` findings, the root of the traceability chain |
| 2 | Understand | Context | `skills/context-assembly`, `hooks/session-start.mjs`'s `Recall:` line — read unified project state before anything else |
| 3 | Research | Research | `commands/pipeline/research-synthesis.md` (founder-facing), `skills/research-gate` (maintainer-facing, dev-repo-only) |
| 4 | Ground | Governance + Research | `references/constitution.md` rule 1 ("grounding truth before generation") and the Research Engine's evidence-grounding dimension (`references/evaluation-dimensions.md` #11) — a claim gets checked against something real before it's acted on |
| 5 | Plan | Planning | `commands/pipeline/define.md`, `commands/pipeline/implementation-planning.md` — `DEF-*`/`IP-*` rows, the plan file |
| 6 | Design | UX Intelligence + Design | The 7 UX-stage commands (personas through prototype-usability) plus `skills/design-taste`/`references/accessibility-checklist.md`'s standard |
| 7 | Architect | Architecture | `commands/pipeline/architecture.md` — `ARCH-*` rows, `skills/acceptance-criteria`, the WKOS document contract |
| 8 | Execute | Engineering | `commands/pipeline/build.md` and its 13 discipline skills (TDD, debugging, minimalism, verification) |
| 9 | Evaluate | Evaluation | `commands/adaptive/boardroom.md`'s 8-seat review against the 12-dimension map (`references/evaluation-dimensions.md`) |
| 10 | Improve | Engineering + Governance | `commands/adaptive/{over-engineering-review,bloat-audit,debt-ledger}.md` plus `skills/ponytail-debt-harvesting` |
| 11 | Remember | Memory | `skills/memory`, `scripts/memory-tiers.mjs` — the 7-tier store, precedence narrowest-first |
| 12 | Learn | Governance | `commands/adaptive/{retro,learn,evolve}.md` — a genuine, evidenced pattern gets promoted; a one-off doesn't |

## What this is not

Not a new state machine and not a 12th/13th/14th pipeline stage — the real pipeline still has 14
named stages, encoded in the checkpoint schema (`docs/status/DATABASE.md`). This loop is a
higher-altitude description of what those 14 stages (plus the adaptive commands around them)
collectively do, useful for reasoning about the system as a whole without re-deriving it from 34
individual command files each time.

## Orchestration and Agent Adapter

Two engines run underneath every phase above rather than owning a phase themselves:
**Orchestration** (`docs/status/ENGINES.md` #11) bounds how the loop is actually run — parallel
dispatch, token economy, loop/compaction control — and **Agent Adapter** (#14) makes the same loop
run, with honestly-disclosed substitutions, on harnesses other than Claude Code.
