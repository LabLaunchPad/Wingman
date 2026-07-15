# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Wingman is a Claude Code plugin, packaged as a marketplace + plugin under `.claude-plugin/` and `plugins/wingman/`. There is no build/lint/test toolchain in the traditional sense — the plugin's "code" is markdown (commands, agents, skills) plus a hooks config. There is no application source code, database, or web app in this repository; do not assume one exists. There is a lightweight behavioral eval harness at `evals/` (see `evals/README.md`) for verifying that a skill's *instructions* actually produce correct behavior when run, since a structural check alone can't catch that.

**Before committing any structural change, run the mechanical validators (all must exit 0):** `node plugins/wingman/scripts/validate-structure.mjs` (plugin-internal invariants), `node scripts/check-repo-consistency.mjs` (repo-root doc/attribution invariants), `node scripts/check-fixtures.mjs` (every eval fixture still runs, all at once — there's no per-fixture flag), and `node plugins/wingman/scripts/check-traceability.mjs` (requirement/marker cross-referencing — this one also ships with the plugin, since a founder's own project runs it too, via `skills/traceability-linking`). These are Layer 1 of the regression defense; the genuinely-semantic checks they deliberately don't mechanize are Layer 2, run via `/wingman:audit`. See `docs/REGRESSION-CHECKLIST.md` for the full hybrid and which check lives where. CI enforces the same via `.github/workflows/` (validate, actionlint, install-smoke, version-gate); the behavioral eval + `@claude` workflows there need an `ANTHROPIC_API_KEY` repo secret — see `docs/HUMAN-TODOS.md`.

There's no unit-test runner to point at a single test: the closest equivalent is a single behavioral eval case in `evals/cases/*.md`, exercised by hand (spawn a fresh subagent against the named fixture, grade its output against the case's expectations, append to the run log) per `evals/README.md` — grading stays human/independent by design, not scripted.

**For a current-state snapshot** (plugin surface size, eval coverage by trust level, which commands/skills still have no dedicated eval case), run `node scripts/wingman-health.mjs` — it's read-only and reads only flat files (no network, no DB). Cross-check its numbers against `docs/PROJECT.md` (the durable decisions log and roadmap) before trusting stale counts in other docs, since prose summaries (e.g. README's command/skill counts) drift as the plugin grows and this script doesn't.

**Before making any structural change** (new command, agent, skill, or department), read `docs/ARCHITECTURE.md` first — it explains the hybrid Boardroom/department-lead/specialist model and the reasoning behind it. Read `docs/AGENT-ROSTER.md` before creating any new specialist subagent — it's the canonical candidate catalog and promotion process; specialists should be promoted via `/wingman:evolve` on evidenced need, not created speculatively.

## Commands

```
node plugins/wingman/scripts/validate-structure.mjs   # plugin-internal invariants (frontmatter, refs)
node scripts/check-repo-consistency.mjs                # repo-root doc/attribution invariants
node scripts/check-fixtures.mjs                        # every eval fixture (evals/fixtures/setup-*.sh) still runs clean
node plugins/wingman/scripts/check-traceability.mjs     # requirement/marker cross-referencing (also shippable, runs in founder projects)
node scripts/wingman-health.mjs                         # read-only dev-health report: built vs. verified vs. gaps
node evals/run-headless.mjs --dry-run                   # confirms every eval case references an existing fixture, no API key needed
node evals/run-headless.mjs                              # runs the behavioral eval cases via `claude -p`, needs ANTHROPIC_API_KEY
```

All three validators must exit 0 before committing a structural change. There is no build step and no unit test runner in the conventional sense — see "Project status" above.

## Project purpose

Wingman is a Claude Code plugin that gives non-technical founders a full AI SDLC — an "AI Boardroom" of agents that plans, builds, secures, and ships production-grade software end to end, with plain-language checkpoints instead of code review.

## Architecture (see docs/ARCHITECTURE.md for full detail)

- **Boardroom seats** (`plugins/wingman/agents/boardroom-*.md`) — fixed, always-present gate reviewers: CEO, CPO, CMO, CTO, CISO, CFO, Research, and Design (7 C-suite-style seats + Design). They only render plain-language verdicts, never write code. Dispatched in parallel by `commands/boardroom.md` and consolidated into a grouped Business/Technical/Finance/Research summary — this is Wingman's substitute for code review.
- **Management Board** — 9 manager roles (`mgr-*`, written to the founder's own project), activated only once a project crosses 3+ active *conditionally-activated* department leads (Design/Data/Legal-Security/DevOps/Growth — never counting the always-active Product/Engineering/QA, per `skills/management-board-activation`). They coordinate department-lead work; they never render Boardroom verdicts.
- **Pipeline commands** (`commands/discovery.md`, `define.md`, `architecture.md`, `uxflow.md`, `implementation-planning.md`, `build.md`, `ship.md`) — 7 named SDLC stages, but only 3 founder-visible Boardroom checkpoints: the 5 planning stages bundle into one "Planning Milestone" checkpoint at the end of `implementation-planning.md`, then `build.md` (whose own Definition-of-Done gate folds in what used to be a separate `secure.md` stage) and `ship.md` each keep their own checkpoint. See `docs/ARCHITECTURE.md` §4/§4b.
- **Adaptive commands** (`commands/retro.md`, `learn.md`, `evolve.md`, `harness.md`, `dogfood.md`, `telemetry.md`, `launch.md`, `hotfix.md`, `audit.md`, `over-engineering-review.md`, `bloat-audit.md`, `debt-ledger.md`, `research.md`, `advisory.md`, `incident.md`) — invoked as needed, not part of the fixed pipeline. `dogfood.md` runs the real pipeline end to end against a throwaway or real project to find genuine behavioral gaps; in maintainer mode (Wingman's own dev repo only) a found gap can be promoted into `plugins/wingman/` itself via `skills/dogfood-gap-classification` — the mirror image of `evolve-promotion`, which only ever writes to a founder's own project.
- **Department leads** — build-time worker subagents, one per corporate department, created lazily per-project only when that department's activation signal is true (see `docs/ARCHITECTURE.md` §5). None exist in a fresh install.
- **Specialists** — the 56-role candidate catalog in `docs/AGENT-ROSTER.md`. Only created by `/wingman:evolve` after repeated, evidenced friction. Never bulk-created.
- **`vendor/`** — pinned upstream reference repositories (MIT-licensed), used as design inspiration only. Nothing in the plugin depends on their runtime infrastructure at execution time. See `ATTRIBUTIONS.md` for exact provenance.

## Working here

- Do not add a new department lead or specialist speculatively — check `docs/ARCHITECTURE.md`'s activation signals and `docs/AGENT-ROSTER.md`'s promotion process first.
- Every checkpoint-facing output (boardroom verdicts, stage completions) must follow the `plain-language-checkpoint` skill's writing bar — no unexplained jargon, lead with consequence not mechanism.
- Update this CLAUDE.md and `docs/ARCHITECTURE.md` together when the architecture actually changes, rather than letting them drift apart.
