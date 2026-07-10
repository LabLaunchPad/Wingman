# Wingman — System Requirements Specification

Companion to `docs/PRD.md` (the *why*) and `docs/ARCHITECTURE.md` (the *how it's organized*). This document specifies *what the system must do*, in checkable terms.

## System context

Wingman is a Claude Code plugin: a set of markdown command/agent/skill files plus a JSON hooks config, loaded into a Claude Code session via `.claude-plugin/marketplace.json` → `plugins/wingman/.claude-plugin/plugin.json`. It has no standalone executable and does not run outside a Claude Code session, except for the planned MCP server (see `docs/DATABASE.md`), which is a local child process Claude Code itself starts.

## Functional requirements

| ID | Requirement | Status |
|---|---|---|
| FR-1 | `/wingman:plan` must produce an implementation plan ending in a Plain-Language Summary section, before any code is written. | Built |
| FR-2 | `/wingman:plan` must not call `ExitPlanMode` directly; it must route through `/wingman:boardroom` first. | Built (enforced by hook, FR-9) |
| FR-3 | `/wingman:boardroom` must dispatch all 5 Boardroom seats in parallel, in independent subagent contexts, so their verdicts don't bias each other. | Built |
| FR-4 | `/wingman:boardroom` must consolidate the 5 verdicts into one summary with a single bottom line (`GO` / `GO WITH CHANGES` / `DO NOT SHIP`), per the gate rule in `docs/ARCHITECTURE.md` §4. | Built |
| FR-5 | `/wingman:boardroom` must obtain an explicit founder decision via `AskUserQuestion` — silence must never be treated as approval. | Built |
| FR-6 | No Boardroom agent (persona) may invoke another agent; only commands may orchestrate/dispatch. | Built (by convention — not yet mechanically enforced, see NFR-6) |
| FR-7 | `/wingman:build` must not mark a task complete without fresh verification evidence (test run, build output) — see `verification-before-completion`. | Built |
| FR-8 | `/wingman:secure` must not return a clean pass while any identified risk is in an OPEN disposition; OPEN risks must be closed (fixed) or explicitly accepted by the founder. | Built |
| FR-9 | The `boardroom-checkpoint` hook must block `ExitPlanMode` unless at least one checkpoint source (the inline plan text, or the most recent plan file) contains a `## Wingman Boardroom Checkpoint` section that is genuinely current (nothing but its own fields follows the marker), whose bottom line is not `DO NOT SHIP`, and whose recorded founder decision is explicitly `ship it`. An explicit `DO NOT SHIP` in any current checkpoint source vetoes exit regardless of another source. | Built |
| FR-10 | `/wingman:ship` must run preflight checks (verified, clean tree, feature branch, remote/auth available) before pushing or opening a PR. | Built |
| FR-11 | `/wingman:evolve` must not create a new department lead or specialist file without first presenting the proposed promotion to the founder in plain language and getting explicit approval. | Built |
| FR-12 | Every skill must declare an explicit "Use when..." trigger clause in its frontmatter `description`, not only in the body (the "description trap" — see `docs/ARCHITECTURE.md` §9, `jeffallan-claude-skills`). | Built, checked by `scripts/validate-structure.mjs` (warning-level) |
| FR-13 | Every agent `name` must be globally unique across the plugin. | Built, checked by `scripts/validate-structure.mjs` (error-level) |
| FR-14 | Department-lead agent files must be created only when their documented activation signal (`docs/ARCHITECTURE.md` §5) is actually true for the current project. | Built (v2) |
| FR-15 | (Planned) The MCP state-store server must expose Boardroom checkpoint history as a queryable resource, surviving session boundaries. | Planned — see `docs/DATABASE.md` |
| FR-16 | `/wingman:boardroom`'s deep-review mode must not change the default no-flag path's behavior; the second review round must give each seat the other seats' prior-round verdicts as read-only context and must be hard-capped at 3 rounds. | Built (v8) |
| FR-17 | `/wingman:drift` must not allow code for genuinely new/changed scope to proceed without a real Boardroom checkpoint on that delta, in both interactive and headless sessions. | Built (v8) |
| FR-18 | Tech-stack/MCP skill files must be materialized into the founder's own project only against a real, concrete signal (a dependency, config file, or `.mcp.json` entry) matched against `docs/SKILL-ROSTER.md`, never speculatively. | Built (v8) |

## Non-functional requirements

| ID | Requirement |
|---|---|
| NFR-1 | **No hosted backend.** Wingman must never require the founder to deploy, pay for, or maintain infrastructure beyond their own Claude Code usage. |
| NFR-2 | **No new language runtime beyond what Claude Code already requires.** Scripts use Node.js (bundled with Claude Code itself) or POSIX shell — never assume Python, Rust, or a package manager install step. |
| NFR-3 | **Founder-facing output must pass the `plain-language-checkpoint` bar** — no unexplained jargon, lead with consequence. This is a hard requirement on every checkpoint, error message, and stage-completion report, not a style preference. |
| NFR-4 | **Lazy agent population.** The always-loaded agent/command/skill surface must stay small regardless of how large the specialist candidate catalog (`docs/AGENT-ROSTER.md`) grows — nothing gets built speculatively. |
| NFR-5 | **Every skill must be self-contained** — no skill may assume another vendor repo's runtime, paid API, or infrastructure is present. |
| NFR-6 | **Structural consistency must be mechanically checkable**, not left to reviewer diligence — `scripts/validate-structure.mjs` must pass before any commit that changes `plugin.json` or adds/removes a command, agent, or skill. |
| NFR-7 | **Attribution.** Any content adapted from a vendored repo must be traceable to its source, license, and the specific adaptation made, in `ATTRIBUTIONS.md`. |

## Constraints

- Claude Code plugin model only: commands (markdown), agents (markdown + YAML frontmatter), skills (`SKILL.md` + optional `references/`/`examples/`/`scripts/`), hooks (`hooks.json` + scripts). No other extension mechanism is available or should be assumed.
- No LangGraph, no smolagents, no external orchestration service — evaluated and explicitly rejected (see `docs/ARCHITECTURE.md` §2, runtime provider decision). Cross-agent collaboration uses Claude Code's own Task-tool dispatch and (where appropriate in the future) the experimental Agent Teams feature, never a custom state-machine runtime.
- The only persistent state Wingman may introduce is the planned local MCP server described in `docs/DATABASE.md` — flat files (JSON/JSONL/Markdown), no external database service.

## Interfaces

- **Command interface**: each `commands/*.md` file is invoked as `/wingman:<name>` with optional `$ARGUMENTS`. Contract: must declare `description` and (where it takes input) `argument-hint` in frontmatter.
- **Agent interface**: each `agents/*.md` file is invoked via the Task tool with a prompt; it returns a single structured verdict block (for Boardroom seats: `## <SEAT> VERDICT` with `GO`/`GO_WITH_CONCERNS`/`NO_GO`). Contract: `name`, `description` (with trigger clause), optional `tools`/`model`.
- **Skill interface**: auto-triggered by the harness based on `description`; body follows the shape in `docs/ARCHITECTURE.md` §6 (When to Use → Core Workflow → Constraints → Rationalizations → Red Flags → Verification → Output).
- **Hook interface**: `hooks/hooks.json` registers lifecycle hooks; `boardroom-checkpoint.mjs` implements the `PreToolUse`/`ExitPlanMode` contract documented inline in that file and in `docs/ARCHITECTURE.md` §9.

## Verification

`plugins/wingman/scripts/validate-structure.mjs` and `scripts/check-repo-consistency.mjs` are the mechanical spec-conformance checks for this document's structural requirements (FR-12, FR-13, NFR-6, NFR-7). Both must exit 0 before any structural change is committed; CI enforces the same on every push/PR (`.github/workflows/validate.yml`). Behavioral requirements (FR-1 through FR-11, FR-16 through FR-18) are verified by the behavioral eval harness at `evals/` — 12 cases, all `verified` as of 2026-07-10 (see `evals/README.md` for trust-level definitions and per-case results), not manual walkthrough alone. `boardroom-checkpoint.mjs`'s own gate logic (FR-9) is additionally exercised by piping simulated hook input directly through the real script across every documented path, including the amendment-mode staleness case FR-9's current wording reflects.
