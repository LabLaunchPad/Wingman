# AGENTS.md

This is a Claude Code plugin repository (commands/agents/skills as markdown, plus a hooks config) — see [`CLAUDE.md`](CLAUDE.md) for the full project brief. This file exists for coding agents/harnesses that look for `AGENTS.md` specifically rather than `CLAUDE.md`; the content below is deliberately a thin pointer, not a second copy, to avoid the two files drifting out of sync.

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
| Governance / policy / meta | root (`CLAUDE.md`, `SECURITY.md`, `CONTRIBUTING.md`, …) + `docs/GOVERNANCE.md` | Never ships | Rules plus their mechanical enforcement — indexed in `docs/GOVERNANCE.md`. |
| Vendored reference repos | `vendor/` (git submodules) | Never ships | Design inspiration only, per `ATTRIBUTIONS.md` — never a runtime dependency. |

Two boundaries are easy to get wrong — state them plainly rather than re-deriving them:

- **Shipped vs. dev-only scripts.** Only `plugins/wingman/scripts/` ships with the plugin. Root
  `scripts/` never ships, which is exactly why a skill that must run inside an installed founder
  project (e.g. `evolve-promotion`) cannot depend on it. Don't "fix" that asymmetry.
- **Two manifests, not a duplicate.** `.claude-plugin/marketplace.json` (marketplace listing:
  `source`/`owner`/`category`) and `plugins/wingman/.claude-plugin/plugin.json` (plugin manifest:
  `version`/`commands`/`agents`/`skills`) are the standard two-file marketplace/plugin split, each
  serving a different purpose — not duplication.

For what is and isn't portable to a non-Claude-Code harness, see `docs/ARCHITECTURE.md` §8a (not restated here).

## Skills and commands, by category

`plugins/wingman/skills/` and `plugins/wingman/commands/` are subdivided into category folders —
skill/command identity comes from the `name:` frontmatter field (skills) or filename (commands),
never from the directory path, so this taxonomy is purely for navigation; it doesn't change any
`/wingman:*` invocation.

| `skills/<category>/` | Skills |
|---|---|
| `discipline/` | engineering-minimalism, doubt-driven-development, anti-rationalization, verification-before-completion, verification-loop, test-driven-development, systematic-debugging, systematic-auditing, subagent-driven-development, writing-plans, simplify |
| `mechanics/` | git-pr-workflow, package-manager-selection, testing-patterns, code-review, spec-handler, interview-one-question-at-a-time |
| `governance/` | department-lead-activation, management-board-activation, evolve-promotion, dogfood-gap-classification, evidence-gated-catalog, traceability-linking, definition-of-done, security-checklist |
| `output/` | plain-language-checkpoint, visual-founder-output, design-taste |
| `knowledge/` | memory, doc-index, token-economy, prompt-diff-check, research, platform-native-reference |
| `personas/` | founder-cfo, founder-cmo, founder-cro |
| `response/` | incident-response, ponytail-debt-harvesting, council |

| `commands/<category>/` | Commands |
|---|---|
| `pipeline/` | discovery, define, architecture, uxflow, implementation-planning, build, ship |
| `adaptive/` | boardroom, retro, learn, evolve, harness, telemetry, launch, hotfix, audit, dogfood, over-engineering-review, bloat-audit, debt-ledger, research, advisory, incident, knowledge-export |

`agents/` (8 Boardroom seats) and `references/` (15 files) stay flat — both small and homogeneous
enough that subdividing them would be churn without benefit.

## Before making a structural change

1. Read `CLAUDE.md` and `docs/ARCHITECTURE.md` first — they explain *why* the plugin is shaped the way it is, not just what files exist.
2. There is no build step. The plugin is markdown + dependency-free Node scripts; `install-smoke.yml` proves `node_modules` never gets created.
3. Run these four before committing any structural change (new command, agent, skill, or department) — all must exit 0:
   - `node plugins/wingman/scripts/validate-structure.mjs`
   - `node scripts/check-repo-consistency.mjs`
   - `node scripts/check-fixtures.mjs`
   - `node plugins/wingman/scripts/check-traceability.mjs`
4. Shipped content lives under `plugins/wingman/` only — `docs/` at the repo root does not ship with the plugin (see `docs/ARCHITECTURE.md`'s "docs/ isn't installed" note before citing a `docs/` path from anything under `plugins/wingman/`).

## Portability

Most of this plugin is intentionally coupled to Claude Code's own tool surface (`AskUserQuestion`, `ExitPlanMode`, parallel `Task`/`Agent` dispatch) — see `docs/ARCHITECTURE.md` §8a for exactly what is and isn't portable today, and why. Two skills are built to be genuinely harness-agnostic: `plugins/wingman/skills/mechanics/git-pr-workflow` and `plugins/wingman/skills/mechanics/package-manager-selection`.
