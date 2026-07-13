# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Wingman is a Claude Code plugin, packaged as a marketplace + plugin under `.claude-plugin/` and `plugins/wingman/`. There is no build/lint/test toolchain in the traditional sense — the plugin's "code" is markdown (commands, agents, skills) plus a hooks config. There is no application source code, database, or web app in this repository; do not assume one exists. There is a lightweight behavioral eval harness at `evals/` (see `evals/README.md`) for verifying that a skill's *instructions* actually produce correct behavior when run, since a structural check alone can't catch that.

**Before committing any structural change, run the mechanical validators (all must exit 0):** `node plugins/wingman/scripts/validate-structure.mjs` (plugin-internal invariants), `node scripts/check-repo-consistency.mjs` (repo-root doc/attribution invariants), and `node scripts/check-fixtures.mjs` (every eval fixture still runs). These are Layer 1 of the regression defense; the genuinely-semantic checks they deliberately don't mechanize are Layer 2, run via `/wingman:audit`. See `docs/REGRESSION-CHECKLIST.md` for the full hybrid and which check lives where. CI enforces the same via `.github/workflows/` (validate, actionlint, install-smoke, version-gate); the behavioral eval + `@claude` workflows there need an `ANTHROPIC_API_KEY` repo secret — see `docs/HUMAN-TODOS.md`.

**Before making any structural change** (new command, agent, skill, or department), read `docs/ARCHITECTURE.md` first — it explains the hybrid Boardroom/department-lead/specialist model and the reasoning behind it. Read `docs/AGENT-ROSTER.md` before creating any new specialist subagent — it's the canonical candidate catalog and promotion process; specialists should be promoted via `/wingman:evolve` on evidenced need, not created speculatively.

## Commands

```
node plugins/wingman/scripts/validate-structure.mjs   # plugin-internal invariants (frontmatter, refs)
node scripts/check-repo-consistency.mjs                # repo-root doc/attribution invariants
node scripts/check-fixtures.mjs                        # every eval fixture (evals/fixtures/setup-*.sh) still runs clean
node scripts/wingman-health.mjs                         # read-only dev-health report: built vs. verified vs. gaps
node evals/run-headless.mjs --dry-run                   # confirms every eval case references an existing fixture, no API key needed
node evals/run-headless.mjs                              # runs the behavioral eval cases via `claude -p`, needs ANTHROPIC_API_KEY
```

All three validators must exit 0 before committing a structural change. There is no build step and no unit test runner in the conventional sense — see "Project status" above.

## Project purpose

Wingman is a Claude Code plugin that gives non-technical founders a full AI SDLC — an "AI Boardroom" of agents that plans, builds, secures, and ships production-grade software end to end, with plain-language checkpoints instead of code review.

## Architecture (see docs/ARCHITECTURE.md for full detail)

- **Boardroom seats** (`plugins/wingman/agents/boardroom-*.md`) — fixed, always-present gate reviewers (founder/business, engineering, security, design, cost). They only render plain-language verdicts, never write code. Dispatched in parallel by `commands/boardroom.md` and consolidated into one go/no-go summary — this is Wingman's substitute for code review.
- **Pipeline commands** (`commands/plan.md`, `build.md`, `secure.md`, `ship.md`) — the core SDLC stages, each ending in a Boardroom checkpoint before advancing.
- **Adaptive commands** (`commands/retro.md`, `learn.md`, `evolve.md`, `harness.md`, `telemetry.md`, `launch.md`, `hotfix.md`, `audit.md`, `over-engineering-review.md`, `bloat-audit.md`, `debt-ledger.md`, `research.md`, `advisory.md`) — invoked as needed, not part of the fixed pipeline.
- **Department leads** — build-time worker subagents, one per corporate department, created lazily per-project only when that department's activation signal is true (see `docs/ARCHITECTURE.md` §5). None exist in a fresh install.
- **Specialists** — the 56-role candidate catalog in `docs/AGENT-ROSTER.md`. Only created by `/wingman:evolve` after repeated, evidenced friction. Never bulk-created.
- **`vendor/`** — pinned upstream reference repositories (MIT-licensed), used as design inspiration only. Nothing in the plugin depends on their runtime infrastructure at execution time. See `ATTRIBUTIONS.md` for exact provenance.

## Working here

- Do not add a new department lead or specialist speculatively — check `docs/ARCHITECTURE.md`'s activation signals and `docs/AGENT-ROSTER.md`'s promotion process first.
- Every checkpoint-facing output (boardroom verdicts, stage completions) must follow the `plain-language-checkpoint` skill's writing bar — no unexplained jargon, lead with consequence not mechanism.
- Update this CLAUDE.md and `docs/ARCHITECTURE.md` together when the architecture actually changes, rather than letting them drift apart.
