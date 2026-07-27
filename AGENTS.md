# AGENTS.md

This file provides guidance to AI coding agents working in this repository. It follows the open
[AGENTS.md standard](https://agents.md) (formalized August 2025, donated to the Linux Foundation's
Agentic AI Foundation in December 2025) so any compliant agent or harness can read it directly.
Wingman ships as a **Claude Code plugin** specifically, so most of the content below documents
Claude Code mechanics (hooks, `AskUserQuestion`, parallel `Task`/`Agent` dispatch) — see
"Portability" below for exactly what does and doesn't carry over to another harness. `CLAUDE.md` at
the repo root is a symlink to this file, kept for tools that specifically look for that filename;
there is only ever one copy of this content to keep in sync.

## Project status

Wingman is a Claude Code plugin, packaged as a marketplace + plugin under `.claude-plugin/` and `plugins/wingman/`. There is no build or lint toolchain in the traditional sense — the plugin's "code" is mostly markdown (commands, agents, skills) plus a hooks config. The `.mjs` hooks and scripts *are* real code, and they do have a real test suite (345 tests under `tests/`, run via `node --test`, enforced in CI since 2026-07-27). There is no application source code, database, or web app in this repository; do not assume one exists. There is a lightweight behavioral eval harness at `evals/` (see `evals/README.md`) for verifying that a skill's *instructions* actually produce correct behavior when run, since a structural check alone can't catch that.

**Before committing any structural change, run the mechanical validators (all must exit 0):** `node plugins/wingman/scripts/validate-structure.mjs` (plugin-internal invariants), `node scripts/check-repo-consistency.mjs` (repo-root doc/attribution invariants), `node scripts/check-fixtures.mjs` (every eval fixture still runs, all at once — there's no per-fixture flag), and `node plugins/wingman/scripts/check-traceability.mjs` (requirement/marker cross-referencing — this one also ships with the plugin, since a founder's own project runs it too, via `skills/traceability-linking`). These are Layer 1 of the regression defense; the genuinely-semantic checks they deliberately don't mechanize are Layer 2, run via `/wingman:audit`. See `docs/REGRESSION-CHECKLIST.md` for the full hybrid and which check lives where. **CI's `validate.yml` runs 7 checks, not 4** — the 4 Layer-1 validators above, plus `check-harness-adapter-drift.mjs` and `generate-harness-adapters.mjs --check` (the harness-adapter generator's own idempotency check, distinct from the drift check — one confirms the generator's *inputs* haven't silently changed shape, the other confirms its *output* is actually regenerated and current), plus `node --test tests/*/*.test.mjs` (the 345-test suite; added 2026-07-27, when it turned out the suite had existed for months with **no CI workflow running it at all**). Don't run these 7 by hand — `node scripts/validate-all.mjs` runs exactly this set in one command, which is the point of it. A real PR (`#120`, 2026-07-26) hit the gap that motivated it: a 4-validator local pass was clean, but `generate-harness-adapters.mjs --check` failed in CI because Phase-header edits to the 14 pipeline command files and `definition-of-done`'s SKILL.md had gone in without regenerating their OpenCode/Codex-CLI adapter mirrors. Other workflows (actionlint, install-smoke, version-gate) round out CI; the behavioral eval + `@claude` workflows there need an `ANTHROPIC_API_KEY` repo secret — see `docs/HUMAN-TODOS.md`.

There's no unit-test runner to point at a single test: the closest equivalent is a single behavioral eval case in `evals/cases/*.md`, exercised by hand (spawn a fresh subagent against the named fixture, grade its output against the case's expectations, append to the run log) per `evals/README.md` — grading stays human/independent by design, not scripted.

**For a current-state snapshot** (plugin surface size, eval coverage by trust level, which commands/skills still have no dedicated eval case), run `node scripts/wingman-health.mjs` — it's read-only and reads only flat files (no network, no DB). Cross-check its numbers against `docs/PROJECT.md` (the durable decisions log and roadmap) before trusting stale counts in other docs, since prose summaries (e.g. README's command/skill counts) drift as the plugin grows and this script doesn't. **For structured queries** over the `wingman:log` markers in `LEARNINGS.md`/`docs/wingman/retros.md`/`docs/PROJECT.md`'s decisions log/`docs/HUMAN-TODOS.md` (by category/type/status, or which categories have crossed the 2+-occurrence threshold), run `node scripts/query-wingman-knowledge.mjs` — dev-repo-only tooling, see `docs/ARCHITECTURE.md` §6a for why it never ships with the plugin. **For real cost/quality/debt signals** (Boardroom seat model-tier cost shape, eval-suite verified/provisional ratio, technical-debt ceiling rate, occurrence-threshold visibility, and the **agent-weakness coverage benchmark** — deliberately not a service-style benchmark, since Wingman has no persistent runtime or request traffic to instrument p95 latency/throughput/cache-hit-rate against), run `node scripts/wingman-metrics.mjs`. **For the agent-weakness coverage benchmark itself** — which community-verified coding-agent failure modes are encoded as an enforced rule and measured by a `verified` eval (its positive/negative A/B pair) — see `docs/AGENT-WEAKNESS-BENCHMARK.md`; `wingman-metrics.mjs` §5 scores it and self-verifies by re-deriving each entry's status from the real rule/eval files.

**For a one-page index of governance/policy/benchmarks** (where org governance, policy rules + their mechanical enforcement, and cost/quality metrics each already live), see `docs/GOVERNANCE.md` — pure cross-reference, no new mechanism.

**Before making any structural change** (new command, agent, skill, or department), read `docs/ARCHITECTURE.md` first — it explains the hybrid Boardroom/department-lead/specialist model and the reasoning behind it. Read `docs/AGENT-ROSTER.md` before creating any new specialist subagent — it's the canonical candidate catalog and promotion process; specialists should be promoted via `/wingman:evolve` on evidenced need, not created speculatively.

## Commands

```
node scripts/validate-all.mjs                           # runs all 7 checks below in one command (--fast skips check-fixtures)
node plugins/wingman/scripts/validate-structure.mjs   # plugin-internal invariants (frontmatter, refs)
node scripts/check-repo-consistency.mjs                # repo-root doc/attribution invariants (incl. leftover conflict-marker scan)
node scripts/check-fixtures.mjs                        # every eval fixture (evals/fixtures/setup-*.sh) still runs clean
node plugins/wingman/scripts/check-traceability.mjs     # requirement/marker cross-referencing (also shippable, runs in founder projects)
node plugins/wingman/scripts/check-harness-adapter-drift.mjs  # checks the Boardroom-persona adapters (Codex CLI/Gemini CLI) and every harness's ported skills haven't drifted from canonical
node plugins/wingman/scripts/generate-harness-adapters.mjs --check  # confirms all generated harness-adapter files are current (run --write to see the current count); --write regenerates them
node scripts/install-dev-git-hooks.mjs                  # dev-repo-only, opt-in: installs a local pre-commit hook running `validate-all.mjs --fast` automatically
node scripts/wingman-health.mjs                         # read-only dev-health report: built vs. verified vs. gaps
node scripts/query-wingman-knowledge.mjs                # dev-repo-only: query the wingman:log markers by type/category/status, or --recurring
node scripts/wingman-metrics.mjs                        # dev-repo-only: real cost/quality/debt signals, not a service benchmark
node evals/run-headless.mjs --dry-run                   # confirms every eval case references an existing fixture, no API key needed
node evals/run-headless.mjs                              # runs the behavioral eval cases via `claude -p`, needs ANTHROPIC_API_KEY
```

All four Layer-1 validators (`validate-structure.mjs`, `check-repo-consistency.mjs`, `check-fixtures.mjs`, `check-traceability.mjs`) must exit 0 before committing a structural change; `check-harness-adapter-drift.mjs` and `generate-harness-adapters.mjs --check` are two separate, narrower checks for the harness adapters specifically, and `node --test` covers the hook/script suite — CI's `validate.yml` runs all of these, so a clean local pass of just the 4 Layer-1 validators is not sufficient evidence the push will pass CI. Run `node scripts/validate-all.mjs`, which is exactly that set. There is no build step and no npm-style task runner (no `package.json` anywhere — `install-smoke.yml` proves `node_modules` never appears), but there *is* a real unit test suite: 345 tests under `tests/`, run with Node's built-in `node --test` and enforced in CI as of 2026-07-27.

## Project purpose

Wingman is a Claude Code plugin that gives non-technical founders a full AI SDLC — an "AI Boardroom" of agents that plans, builds, secures, and ships production-grade software end to end, with plain-language checkpoints instead of code review.

## Architecture (see docs/ARCHITECTURE.md for full detail)

- **Boardroom seats** (`plugins/wingman/agents/boardroom-*.md`) — fixed, always-present gate reviewers: CEO, CPO, CMO, CTO, CISO, CFO, Research, and Design (7 C-suite-style seats + Design). They only render plain-language verdicts, never write code. Dispatched in parallel by `commands/adaptive/boardroom.md` and consolidated into a grouped Business/Technical/Finance/Research summary — this is Wingman's substitute for code review.
- **Management Board** — 9 manager roles (`mgr-*`, written to the founder's own project), activated only once a project crosses 3+ active *conditionally-activated* department leads (Design/Data/Legal-Security/DevOps/Growth — never counting the always-active Product/Engineering/QA, per `skills/management-board-activation`). They coordinate department-lead work; they never render Boardroom verdicts.
- **Pipeline commands** (`commands/pipeline/discovery.md`, `research-synthesis.md`, `personas-jobs.md`, `journey-mapping.md`, `define.md`, `information-architecture.md`, `uxflow.md`, `wireframes.md`, `visual-design-system.md`, `prototype-usability.md`, `architecture.md`, `implementation-planning.md`, `build.md`, `ship.md`) — 14 named SDLC stages, each with its own founder-visible Boardroom checkpoint: 12 individual pre-build checkpoints (one per stage 1–12) plus `build.md` (whose own Definition-of-Done gate folds in what used to be a separate `secure.md` stage) and `ship.md`, each keeping their own checkpoint. This is a founder-approved reversal of the earlier 3-checkpoint bundling decision, trading ceremony for full enterprise UX process completeness — see `docs/ARCHITECTURE.md` §4/§4d.
- **Adaptive commands** (`commands/adaptive/retro.md`, `learn.md`, `evolve.md`, `harness.md`, `dogfood.md`, `telemetry.md`, `launch.md`, `hotfix.md`, `audit.md`, `over-engineering-review.md`, `bloat-audit.md`, `debt-ledger.md`, `research.md`, `advisory.md`, `incident.md`, `knowledge-export.md`, `post-launch.md`, `review.md`, `test.md`) — invoked as needed, not part of the fixed pipeline. `review.md`/`test.md` are thin wrappers over the `code-review`/`testing-patterns` skills (added 2026-07-27), giving a founder an on-demand review or test run without convening the full Boardroom. `post-launch.md` is opt-in and run periodically after `/wingman:ship`, reviewing real usage/support signals and feeding findings back into the next `/wingman:discovery` pass. `knowledge-export.md` exports `.wingman/checkpoints.jsonl` and `memory/*.md` into a Google Open Knowledge Format (OKF v0.1) bundle at `.wingman/okf-export/`, so a founder can hand their project's decision history to a non-Wingman AI tool — see `docs/ARCHITECTURE.md` §8a. `dogfood.md` runs the real pipeline end to end against a throwaway or real project to find genuine behavioral gaps; in maintainer mode (Wingman's own dev repo only) a found gap can be promoted into `plugins/wingman/` itself via `skills/dogfood-gap-classification` — the mirror image of `evolve-promotion`, which only ever writes to a founder's own project.
- **Department leads** — build-time worker subagents, one per corporate department, created lazily per-project only when that department's activation signal is true (see `docs/ARCHITECTURE.md` §5). None exist in a fresh install.
- **`skills/git-pr-workflow`** — the draft-PR/CI-poll/squash-merge-resync procedure `ship.md` uses, deliberately built on plain `git` + the `gh` CLI (not a platform-specific tool) with bundled scripts under `scripts/`, so the same procedure works regardless of which coding agent is actually driving a session.
- **`skills/visual-founder-output`** — adaptive visual layer (Mermaid/ASCII, or a real Artifact-rendered wireframe when the session actually supports it) on top of `plain-language-checkpoint`'s prose bar, for output with real shape (a flow, a tree, a status grid). Detects the session's rendering capability before choosing a tier; never assumes. Wired into all 7 pipeline commands (a pipeline-status tree everywhere; a DEF→ARCH graph in `architecture.md`, a task-dependency diagram in `implementation-planning.md`'s plan document, and the UX-flow diagram in `uxflow.md`) plus `boardroom.md` — see `docs/ARCHITECTURE.md` §4c.
- **Specialists** — the 56-role candidate catalog in `docs/AGENT-ROSTER.md`. Only created by `/wingman:evolve` after repeated, evidenced friction. Never bulk-created.
- **`vendor/`** — pinned upstream reference repositories (MIT-licensed), used as design inspiration only. Nothing in the plugin depends on their runtime infrastructure at execution time. See `ATTRIBUTIONS.md` for exact provenance.

## Repository map

Where each functional zone lives, so any agent can infer where to look. "Class" is the single most
load-bearing distinction here: only `plugins/wingman/` is installed when a founder runs the plugin —
everything else is dev-repo-only and never ships.

| Functional zone | Where it lives | Class | Note |
|---|---|---|---|
| Shipped plugin — commands / seats / skills / hooks | `plugins/wingman/{commands,agents,skills,hooks}/` | **Ships** | The installable surface: slash commands, Boardroom agents, skills, and the `hooks.json` wiring. |
| Shipped plugin scripts | `plugins/wingman/scripts/` | **Ships** | e.g. `validate-structure.mjs`, `check-traceability.mjs`, `dod-pre-push-check.mjs`. |
| Shared reference material | `plugins/wingman/references/` | Ships (reference) | Checklists/patterns, each cited by an owning skill/command (see the `doc-index` skill). |
| Dev-only tooling | root `scripts/` | **Never ships** | Health/consistency/metrics over flat files (`wingman-health.mjs`, `check-repo-consistency.mjs`, …). |
| Docs + decision records | `docs/`, `docs/wingman/`, `docs/audit/` | Never ships | `ARCHITECTURE.md`/`PRD.md`/`SRS.md`/`GOVERNANCE.md`, retros, and `PROJECT.md`'s decisions log. |
| Tests + evals | `evals/`, `tests/` | Never ships | Behavioral eval harness (cases/fixtures/dogfood-runs) + integration tests. |
| Governance / policy / meta | root (`AGENTS.md`/`CLAUDE.md`, `SECURITY.md`, `CONTRIBUTING.md`, …) + `docs/GOVERNANCE.md` | Never ships | Rules plus their mechanical enforcement — indexed in `docs/GOVERNANCE.md`. |
| Vendored reference repos | `vendor/` (git submodules) | Never ships | Design inspiration only, per `ATTRIBUTIONS.md` — never a runtime dependency. |

Two boundaries are easy to get wrong — state them plainly rather than re-deriving them:

- **Shipped vs. dev-only scripts.** Only `plugins/wingman/scripts/` ships with the plugin. Root
  `scripts/` never ships, which is exactly why a skill that must run inside an installed founder
  project (e.g. `evolve-promotion`) cannot depend on it. Don't "fix" that asymmetry.
- **Two manifests, not a duplicate.** `.claude-plugin/marketplace.json` (marketplace listing:
  `source`/`owner`/`category`) and `plugins/wingman/.claude-plugin/plugin.json` (plugin manifest:
  `version`/`commands`/`agents`/`skills`) are the standard two-file marketplace/plugin split, each
  serving a different purpose — not duplication.

## Skills and commands, by category

`plugins/wingman/commands/` is subdivided into category folders. `plugins/wingman/skills/` is
**flat** (`skills/<name>/SKILL.md`, no category subdirectory) as of 2026-07-23 — flattened from an
earlier `skills/<category>/<name>/` nesting to match the on-disk layout multi-harness precedent
repos use and to let Codex CLI's native plugin-install cache (`codex plugin add`, which reads this
tree directly) line up cleanly; see `docs/ARCHITECTURE.md` §8b for the full reasoning. Skill/command
identity comes from the `name:` frontmatter field (skills) or filename (commands), never from the
directory path — this table is purely a conceptual grouping for navigation, no longer folder-backed
for skills, and doesn't change any `/wingman:*` invocation either way.

| Category (conceptual, not a folder) | Skills |
|---|---|
| discipline | engineering-minimalism, doubt-driven-development, anti-rationalization, verification-before-completion, verification-loop, test-driven-development, systematic-debugging, systematic-auditing, subagent-driven-development, writing-plans, simplify |
| mechanics | git-pr-workflow, package-manager-selection, testing-patterns, code-review, spec-handler, interview-one-question-at-a-time |
| governance | department-lead-activation, management-board-activation, evolve-promotion, dogfood-gap-classification, evidence-gated-catalog, traceability-linking, definition-of-done, security-checklist |
| output | plain-language-checkpoint, visual-founder-output, design-taste |
| knowledge | memory, doc-index, token-economy, prompt-diff-check, research, platform-native-reference |
| personas | founder-cfo, founder-cmo, founder-cro |
| response | incident-response, ponytail-debt-harvesting, council |

| `commands/<category>/` | Commands |
|---|---|
| `pipeline/` | discovery, research-synthesis, personas-jobs, journey-mapping, define, information-architecture, uxflow, wireframes, visual-design-system, prototype-usability, architecture, implementation-planning, build, ship |
| `adaptive/` | boardroom, retro, learn, evolve, harness, dogfood, telemetry, launch, hotfix, audit, over-engineering-review, bloat-audit, debt-ledger, research, advisory, incident, knowledge-export, post-launch, review, test |

`agents/` (8 Boardroom seats) stays flat — small and homogeneous enough that subdividing it would
be churn without benefit. `references/` is mostly flat (15 top-level files) but also holds two
nested subtrees: `references/harness-adapters/` — its files must mirror Codex CLI's/OpenCode's own
discovery layout (`.codex/agents/`, `.opencode/agent/`, `.opencode/plugin/`, `.opencode/skills/`) to
stay drop-in copyable, so a flat structure wasn't an option there; see that directory's own
`README.md` — and
`references/org-template/` — static reference content (a project-type catalog + playbooks, founder-
preferences and capability-map guidance) cited from `discovery.md` and `skills/memory`;
deliberately scoped down from a much larger founder-org-scaffold proposal (see `docs/PROJECT.md`'s
decisions log, 2026-07-22) to only the pieces with a real, evidenced consumer — see that directory's
own `README.md`.

## Working here

1. Read `docs/ARCHITECTURE.md` first before making a structural change (new command, agent, skill, or department) — it explains *why* the plugin is shaped the way it is, not just what files exist. Read `docs/AGENT-ROSTER.md` before creating any new specialist subagent — it's the canonical candidate catalog and promotion process; specialists should be promoted via `/wingman:evolve` on evidenced need, not created speculatively. Do not add a new department lead or specialist speculatively — check `docs/ARCHITECTURE.md`'s activation signals first.
2. There is no build step. The plugin is markdown + dependency-free Node scripts; `install-smoke.yml` proves `node_modules` never gets created.
3. Shipped content lives under `plugins/wingman/` only — `docs/` at the repo root does not ship with the plugin (see `docs/ARCHITECTURE.md`'s "docs/ isn't installed" note before citing a `docs/` path from anything under `plugins/wingman/`).
4. Every checkpoint-facing output (boardroom verdicts, stage completions) must follow the `plain-language-checkpoint` skill's writing bar — no unexplained jargon, lead with consequence not mechanism.
5. Update this file and `docs/ARCHITECTURE.md` together when the architecture actually changes, rather than letting them drift apart.

## Portability

Most of this plugin is intentionally coupled to Claude Code's own tool surface (`AskUserQuestion`, `ExitPlanMode`, parallel `Task`/`Agent` dispatch) — see `docs/ARCHITECTURE.md` §8a for exactly what is and isn't portable today, and why (re-confirmed against 2026 multi-harness conventions — see §8a's note on the re-check). Two skills (`plugins/wingman/skills/git-pr-workflow`, `plugins/wingman/skills/package-manager-selection`) are built to be genuinely harness-agnostic in *how they're invoked*. Separately, a live 2026-07-25 finding established that all 40 skills' `SKILL.md` *file format* itself is directly readable by OpenCode's own project-level skill discovery with zero translation (confirmed via a live install, not assumed) — the two claims are about different things: invocation-mechanism portability vs. file-format compatibility with one specific other harness. `docs/ARCHITECTURE.md` §8b documents adapters for all 3 harnesses Wingman is evaluated against — Claude Code (`claude-code/`, the native target, no translation needed), Codex CLI, and OpenCode (Boardroom seat personas, all 40 skills ported, a real `install.mjs`, and the git-push safety gate) — at `plugins/wingman/references/harness-adapters/`, honestly labeled per-artifact by verification status, not a claim of full portability. `plugins/wingman/` also has its own nested `AGENTS.md` (monorepo "nearest wins" convention) with package-scoped authoring conventions.
