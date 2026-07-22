# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Wingman is a Claude Code plugin, packaged as a marketplace + plugin under `.claude-plugin/` and `plugins/wingman/`. There is no build/lint/test toolchain in the traditional sense — the plugin's "code" is markdown (commands, agents, skills) plus a hooks config. There is no application source code, database, or web app in this repository; do not assume one exists. There is a lightweight behavioral eval harness at `evals/` (see `evals/README.md`) for verifying that a skill's *instructions* actually produce correct behavior when run, since a structural check alone can't catch that.

**For a whole-repo zone map** — which functional zone lives where, and (critically) what ships with the plugin vs. what's dev-repo-only — see the "Repository map" section in [`AGENTS.md`](AGENTS.md).

**Before committing any structural change, run the mechanical validators (all must exit 0):** `node plugins/wingman/scripts/validate-structure.mjs` (plugin-internal invariants), `node scripts/check-repo-consistency.mjs` (repo-root doc/attribution invariants), `node scripts/check-fixtures.mjs` (every eval fixture still runs, all at once — there's no per-fixture flag), and `node plugins/wingman/scripts/check-traceability.mjs` (requirement/marker cross-referencing — this one also ships with the plugin, since a founder's own project runs it too, via `skills/governance/traceability-linking`). These are Layer 1 of the regression defense; the genuinely-semantic checks they deliberately don't mechanize are Layer 2, run via `/wingman:audit`. See `docs/REGRESSION-CHECKLIST.md` for the full hybrid and which check lives where. CI enforces the same via `.github/workflows/` (validate, actionlint, install-smoke, version-gate); the behavioral eval + `@claude` workflows there need an `ANTHROPIC_API_KEY` repo secret — see `docs/HUMAN-TODOS.md`.

There's no unit-test runner to point at a single test: the closest equivalent is a single behavioral eval case in `evals/cases/*.md`, exercised by hand (spawn a fresh subagent against the named fixture, grade its output against the case's expectations, append to the run log) per `evals/README.md` — grading stays human/independent by design, not scripted.

**For a current-state snapshot** (plugin surface size, eval coverage by trust level, which commands/skills still have no dedicated eval case), run `node scripts/wingman-health.mjs` — it's read-only and reads only flat files (no network, no DB). Cross-check its numbers against `docs/PROJECT.md` (the durable decisions log and roadmap) before trusting stale counts in other docs, since prose summaries (e.g. README's command/skill counts) drift as the plugin grows and this script doesn't. **For structured queries** over the `wingman:log` markers in `LEARNINGS.md`/`docs/wingman/retros.md`/`docs/PROJECT.md`'s decisions log/`docs/HUMAN-TODOS.md` (by category/type/status, or which categories have crossed the 2+-occurrence threshold), run `node scripts/query-wingman-knowledge.mjs` — dev-repo-only tooling, see `docs/ARCHITECTURE.md` §6a for why it never ships with the plugin. **For real cost/quality/debt signals** (Boardroom seat model-tier cost shape, eval-suite verified/provisional ratio, technical-debt ceiling rate, occurrence-threshold visibility, and the **agent-weakness coverage benchmark** — deliberately not a service-style benchmark, since Wingman has no persistent runtime or request traffic to instrument p95 latency/throughput/cache-hit-rate against), run `node scripts/wingman-metrics.mjs`. **For the agent-weakness coverage benchmark itself** — which community-verified coding-agent failure modes are encoded as an enforced rule and measured by a `verified` eval (its positive/negative A/B pair) — see `docs/AGENT-WEAKNESS-BENCHMARK.md`; `wingman-metrics.mjs` §5 scores it and self-verifies by re-deriving each entry's status from the real rule/eval files.

**For a one-page index of governance/policy/benchmarks** (where org governance, policy rules + their mechanical enforcement, and cost/quality metrics each already live), see `docs/GOVERNANCE.md` — pure cross-reference, no new mechanism.

**Before making any structural change** (new command, agent, skill, or department), read `docs/ARCHITECTURE.md` first — it explains the hybrid Boardroom/department-lead/specialist model and the reasoning behind it. Read `docs/AGENT-ROSTER.md` before creating any new specialist subagent — it's the canonical candidate catalog and promotion process; specialists should be promoted via `/wingman:evolve` on evidenced need, not created speculatively.

## Commands

```
node plugins/wingman/scripts/validate-structure.mjs   # plugin-internal invariants (frontmatter, refs)
node scripts/check-repo-consistency.mjs                # repo-root doc/attribution invariants
node scripts/check-fixtures.mjs                        # every eval fixture (evals/fixtures/setup-*.sh) still runs clean
node plugins/wingman/scripts/check-traceability.mjs     # requirement/marker cross-referencing (also shippable, runs in founder projects)
node plugins/wingman/scripts/check-harness-adapter-drift.mjs  # checks the Codex CLI/OpenCode Boardroom adapters haven't drifted from the canonical agents/boardroom-*.md
node scripts/wingman-health.mjs                         # read-only dev-health report: built vs. verified vs. gaps
node scripts/query-wingman-knowledge.mjs                # dev-repo-only: query the wingman:log markers by type/category/status, or --recurring
node scripts/wingman-metrics.mjs                        # dev-repo-only: real cost/quality/debt signals, not a service benchmark
node evals/run-headless.mjs --dry-run                   # confirms every eval case references an existing fixture, no API key needed
node evals/run-headless.mjs                              # runs the behavioral eval cases via `claude -p`, needs ANTHROPIC_API_KEY
```

All three validators must exit 0 before committing a structural change. There is no build step and no unit test runner in the conventional sense — see "Project status" above.

## Project purpose

Wingman is a Claude Code plugin that gives non-technical founders a full AI SDLC — an "AI Boardroom" of agents that plans, builds, secures, and ships production-grade software end to end, with plain-language checkpoints instead of code review.

## Architecture (see docs/ARCHITECTURE.md for full detail)

- **Boardroom seats** (`plugins/wingman/agents/boardroom-*.md`) — fixed, always-present gate reviewers: CEO, CPO, CMO, CTO, CISO, CFO, Research, and Design (7 C-suite-style seats + Design). They only render plain-language verdicts, never write code. Dispatched in parallel by `commands/adaptive/boardroom.md` and consolidated into a grouped Business/Technical/Finance/Research summary — this is Wingman's substitute for code review.
- **Management Board** — 9 manager roles (`mgr-*`, written to the founder's own project), activated only once a project crosses 3+ active *conditionally-activated* department leads (Design/Data/Legal-Security/DevOps/Growth — never counting the always-active Product/Engineering/QA, per `skills/governance/management-board-activation`). They coordinate department-lead work; they never render Boardroom verdicts.
- **Pipeline commands** (`commands/pipeline/discovery.md`, `define.md`, `architecture.md`, `uxflow.md`, `implementation-planning.md`, `build.md`, `ship.md`) — 7 named SDLC stages, but only 3 founder-visible Boardroom checkpoints: the 5 planning stages bundle into one "Planning Milestone" checkpoint at the end of `implementation-planning.md`, then `build.md` (whose own Definition-of-Done gate folds in what used to be a separate `secure.md` stage) and `ship.md` each keep their own checkpoint. See `docs/ARCHITECTURE.md` §4/§4b.
- **Adaptive commands** (`commands/adaptive/retro.md`, `learn.md`, `evolve.md`, `harness.md`, `dogfood.md`, `telemetry.md`, `launch.md`, `hotfix.md`, `audit.md`, `over-engineering-review.md`, `bloat-audit.md`, `debt-ledger.md`, `research.md`, `advisory.md`, `incident.md`, `knowledge-export.md`) — invoked as needed, not part of the fixed pipeline. `knowledge-export.md` exports `.wingman/checkpoints.jsonl` and `memory/*.md` into a Google Open Knowledge Format (OKF v0.1) bundle at `.wingman/okf-export/`, so a founder can hand their project's decision history to a non-Wingman AI tool — see `docs/ARCHITECTURE.md` §8a. `dogfood.md` runs the real pipeline end to end against a throwaway or real project to find genuine behavioral gaps; in maintainer mode (Wingman's own dev repo only) a found gap can be promoted into `plugins/wingman/` itself via `skills/governance/dogfood-gap-classification` — the mirror image of `evolve-promotion`, which only ever writes to a founder's own project.
- **Department leads** — build-time worker subagents, one per corporate department, created lazily per-project only when that department's activation signal is true (see `docs/ARCHITECTURE.md` §5). None exist in a fresh install.
- **`skills/mechanics/git-pr-workflow`** — the draft-PR/CI-poll/squash-merge-resync procedure `ship.md` uses, deliberately built on plain `git` + the `gh` CLI (not a platform-specific tool) with bundled scripts under `scripts/`, so the same procedure works regardless of which coding agent is actually driving a session.
- **`skills/output/visual-founder-output`** — adaptive visual layer (Mermaid/ASCII, or a real Artifact-rendered wireframe when the session actually supports it) on top of `plain-language-checkpoint`'s prose bar, for output with real shape (a flow, a tree, a status grid). Detects the session's rendering capability before choosing a tier; never assumes. Wired into all 7 pipeline commands (a pipeline-status tree everywhere; a DEF→ARCH graph in `architecture.md`, a task-dependency diagram in `implementation-planning.md`'s plan document, and the UX-flow diagram in `uxflow.md`) plus `boardroom.md` — see `docs/ARCHITECTURE.md` §4c.
- **Specialists** — the 56-role candidate catalog in `docs/AGENT-ROSTER.md`. Only created by `/wingman:evolve` after repeated, evidenced friction. Never bulk-created.
- **`vendor/`** — pinned upstream reference repositories (MIT-licensed), used as design inspiration only. Nothing in the plugin depends on their runtime infrastructure at execution time. See `ATTRIBUTIONS.md` for exact provenance.

## Working here

- Do not add a new department lead or specialist speculatively — check `docs/ARCHITECTURE.md`'s activation signals and `docs/AGENT-ROSTER.md`'s promotion process first.
- Every checkpoint-facing output (boardroom verdicts, stage completions) must follow the `plain-language-checkpoint` skill's writing bar — no unexplained jargon, lead with consequence not mechanism.
- Update this CLAUDE.md and `docs/ARCHITECTURE.md` together when the architecture actually changes, rather than letting them drift apart.
