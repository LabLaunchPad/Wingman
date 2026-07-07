# Wingman — Project Status

Living document. Update this alongside any change that affects status, not as a separate afterthought — stale status here is worse than no status doc at all.

## Current state (as of this writing)

**Built and committed** (local branch `claude/init-6eg3d1`, not yet pushed to remote):
- Marketplace + plugin scaffold (`.claude-plugin/marketplace.json`, `plugins/wingman/.claude-plugin/plugin.json`)
- 10 commands: `plan`, `build`, `secure`, `ship`, `boardroom`, `retro`, `learn`, `evolve`, `harness`, `telemetry`
- 5 Boardroom seats: `boardroom-founder`, `boardroom-engineer`, `boardroom-security`, `boardroom-design`, `boardroom-cost`
- 7 skills: `plain-language-checkpoint`, `verification-before-completion`, `writing-plans`, `systematic-debugging`, `design-taste`, `engineering-minimalism`, `token-economy`
- `hooks/hooks.json` + `boardroom-checkpoint.mjs` — the `ExitPlanMode` gate enforcing a recorded Boardroom verdict before plan mode can exit
- `plugins/wingman/scripts/validate-structure.mjs` — mechanical structural validator (see `docs/SRS.md` NFR-6)
- `docs/ARCHITECTURE.md`, `docs/AGENT-ROSTER.md`, `docs/PRD.md`, `docs/SRS.md`, this file
- 16 vendor repos as git submodules under `vendor/`, each researched and mined for specific transferable patterns (see `docs/ARCHITECTURE.md` §9)

**Not yet built:**
- `docs/DATABASE.md` and the MCP state-store server it specifies
- Department-lead agent templates and the activation-signal check inside `/wingman:plan`
- `.wingman/checkpoints.jsonl` structured audit log (the plan-file marker exists; the JSONL log does not yet)
- `commands/launch.md`, `commands/hotfix.md`
- `ATTRIBUTIONS.md` (referenced by several files, not yet written)
- Any specialist from `docs/AGENT-ROSTER.md` (none should exist yet — this is expected, not a gap)

**Known open items:**
- The commit history shows as "Unverified" on GitHub (missing GPG/SSH signature — identity itself is correct). Unresolved by design pending the founder's decision on whether to set up commit signing.
- Nothing has been pushed to the remote branch yet.

## Decisions log

Durable decisions only — not every turn-level choice. Newest first.

- **Runtime provider: Claude Code native only.** Evaluated LangGraph and smolagents for the literal 56-agent blueprint's orchestration layer; rejected both because either would require a separate hosted Python service, turning Wingman into "a plugin + a product" instead of just a plugin. Cross-agent collaboration uses Claude Code's own Task-tool dispatch (built) and, where useful later, the experimental Agent Teams feature (not yet used). Persistent state, where needed, is a small local MCP server following `gsd-plugin`'s proven pattern — not a database, not LangGraph state.
- **Hybrid agent population, not the literal 56-agent roster upfront.** The full corporate-hierarchy blueprint is kept as a naming/organizing scheme (`docs/AGENT-ROSTER.md`), but only 5 Boardroom seats are built at install time; department leads and specialists grow lazily per-project. Rationale: a fixed 56-agent roster taxes every project's context budget regardless of whether that project ever needs a Row-Level-Security specialist or a canary-rollback agent.
- **Vendoring means "read and adapt," not "depend on."** All 16 vendor repos are git submodules for reference/attribution only. None of their bespoke infrastructure (SDKs, CLIs, MCP servers, hosted dashboards) is a runtime dependency of the installed Wingman plugin.
- **Boardroom seats never call other agents.** Adopted verbatim from `addyosmani-agent-skills`' persona/command distinction: only commands (`boardroom.md`, the pipeline stages) orchestrate and merge; agents (personas) only ever report back.
- **Checkpoint enforcement is a deterministic hook, not an LLM judgment call.** The `boardroom-checkpoint` hook checks for a marker string, not the plan's actual content — the LLM reasoning happens earlier, in `/wingman:boardroom` itself. This keeps the safety backstop auditable and testable independent of model behavior.

## Roadmap

See `docs/ARCHITECTURE.md` §10 for the full v1 → v3+ sequencing. Immediate next steps, in the order being worked:
1. `docs/DATABASE.md` + the MCP state-store server (in progress)
2. `ATTRIBUTIONS.md`
3. Push to remote, resolve or explicitly accept the commit-signature notice
4. Department-lead activation logic in `/wingman:plan` (v2 start)
