# AGENTS.md

This is a Claude Code plugin repository (commands/agents/skills as markdown, plus a hooks config) — see [`CLAUDE.md`](CLAUDE.md) for the full project brief. This file exists for coding agents/harnesses that look for `AGENTS.md` specifically rather than `CLAUDE.md`; the content below is deliberately a thin pointer, not a second copy, to avoid the two files drifting out of sync.

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

Most of this plugin is intentionally coupled to Claude Code's own tool surface (`AskUserQuestion`, `ExitPlanMode`, parallel `Task`/`Agent` dispatch) — see `docs/ARCHITECTURE.md` §8a for exactly what is and isn't portable today, and why. Two skills are built to be genuinely harness-agnostic: `plugins/wingman/skills/git-pr-workflow` and `plugins/wingman/skills/package-manager-selection`.
