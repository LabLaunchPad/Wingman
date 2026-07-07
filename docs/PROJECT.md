# Wingman — Project Status

Living document. Update this alongside any change that affects status, not as a separate afterthought — stale status here is worse than no status doc at all.

## Current state (as of this writing)

**Built, committed, and pushed** (branch `claude/init-6eg3d1`, in sync with remote):
- Marketplace + plugin scaffold (`.claude-plugin/marketplace.json`, `plugins/wingman/.claude-plugin/plugin.json`)
- 10 commands: `plan`, `build`, `secure`, `ship`, `boardroom`, `retro`, `learn`, `evolve`, `harness`, `telemetry`
- 5 Boardroom seats: `boardroom-founder`, `boardroom-engineer`, `boardroom-security`, `boardroom-design`, `boardroom-cost`
- 8 skills: `plain-language-checkpoint`, `verification-before-completion`, `writing-plans`, `systematic-debugging`, `design-taste`, `engineering-minimalism`, `token-economy`, `department-lead-activation`
- `hooks/hooks.json` + `boardroom-checkpoint.mjs` — the `ExitPlanMode` gate enforcing a recorded Boardroom verdict before plan mode can exit
- `.wingman/checkpoints.jsonl` + `state.json` writer, wired into `/wingman:boardroom` (flat files; no server — see `docs/DATABASE.md`)
- `plugins/wingman/scripts/validate-structure.mjs` — mechanical structural validator (see `docs/SRS.md` NFR-6)
- `docs/ARCHITECTURE.md`, `docs/AGENT-ROSTER.md`, `docs/PRD.md`, `docs/SRS.md`, `docs/DATABASE.md`, this file, `ATTRIBUTIONS.md`, `LICENSE`
- **v2, department-lead activation**: `skills/department-lead-activation` — the shared signal-check-and-create mechanism, wired into `plan`/`build`/`secure`/`ship`. Writes department-lead files to the *founder's own project* (`.claude/agents/dept-*.md`), never into Wingman's own plugin directory — see the decision log below for why.
- **`evals/`** — a lightweight behavioral eval harness (fixture scripts + case doc + run log), scoped down from the Tier 1/2/3 pattern in `addyosmani-agent-skills`. `cases/department-lead-activation.md` is now `verified`: both a positive case (Fetch — all conditional signals present) and a negative case (linecount — none present) passed, each independently checked against the real file tree rather than the tested agent's self-report.
- 16 vendor repos as git submodules under `vendor/`, each researched and mined for specific transferable patterns (see `docs/ARCHITECTURE.md` §9)

**Not yet built:**
- The MCP state-store server documented in `docs/DATABASE.md` (deliberately deferred — flat files cover the current need)
- `commands/launch.md`, `commands/hotfix.md`
- Any specialist from `docs/AGENT-ROSTER.md` (none should exist yet — this is expected, not a gap)

**Known open items:**
- The commit history shows as "Unverified" on GitHub (missing GPG/SSH signature — identity itself is correct). Unresolved by design pending the founder's decision on whether to set up commit signing.

## Decisions log

Durable decisions only — not every turn-level choice. Newest first.

- **Behavioral claims about a skill need a real, independently-verified run, not a worked example.** The department-lead-activation skill was initially "proven" only by a hand-written worked example showing what the template *would* produce. That's evidence the template is well-formed, not evidence the skill's instructions actually produce that outcome when a fresh agent follows them. `evals/` exists to close that gap — see `evals/README.md` and `evals/cases/department-lead-activation.md`'s run log for the actual verified run.
- **Department-lead files live in the founder's project, not in Wingman's plugin directory.** Considered writing dynamically-created `dept-*.md` agents into `plugins/wingman/agents/` at runtime; rejected because plugin files are resynced from the marketplace source and a mid-session write there risks silent loss on the next update, plus there's no guaranteed way to make a freshly-written *plugin* agent discoverable within the same session without a reload. Claude Code's project-scoped subagent mechanism (`.claude/agents/*.md`, auto-discovered, no manifest) is the correct home — it also matches intent, since each founder's project should accumulate its own department-lead roster, not share Wingman's.
- **Runtime provider: Claude Code native only.** Evaluated LangGraph and smolagents for the literal 56-agent blueprint's orchestration layer; rejected both because either would require a separate hosted Python service, turning Wingman into "a plugin + a product" instead of just a plugin. Cross-agent collaboration uses Claude Code's own Task-tool dispatch (built) and, where useful later, the experimental Agent Teams feature (not yet used). Persistent state, where needed, is a small local MCP server following `gsd-plugin`'s proven pattern — not a database, not LangGraph state.
- **Hybrid agent population, not the literal 56-agent roster upfront.** The full corporate-hierarchy blueprint is kept as a naming/organizing scheme (`docs/AGENT-ROSTER.md`), but only 5 Boardroom seats are built at install time; department leads and specialists grow lazily per-project. Rationale: a fixed 56-agent roster taxes every project's context budget regardless of whether that project ever needs a Row-Level-Security specialist or a canary-rollback agent.
- **Vendoring means "read and adapt," not "depend on."** All 16 vendor repos are git submodules for reference/attribution only. None of their bespoke infrastructure (SDKs, CLIs, MCP servers, hosted dashboards) is a runtime dependency of the installed Wingman plugin.
- **Boardroom seats never call other agents.** Adopted verbatim from `addyosmani-agent-skills`' persona/command distinction: only commands (`boardroom.md`, the pipeline stages) orchestrate and merge; agents (personas) only ever report back.
- **Checkpoint enforcement is a deterministic hook, not an LLM judgment call.** The `boardroom-checkpoint` hook checks for a marker string, not the plan's actual content — the LLM reasoning happens earlier, in `/wingman:boardroom` itself. This keeps the safety backstop auditable and testable independent of model behavior.

## Roadmap

See `docs/ARCHITECTURE.md` §10 for the full v1 → v3+ sequencing. Immediate next steps, in the order being worked:
1. `commands/launch.md`, `commands/hotfix.md`
2. Resolve or explicitly accept the commit-signature notice
3. Begin v3: `/wingman:evolve` specialist-promotion logic, once a project has generated real, evidenced friction to promote from
