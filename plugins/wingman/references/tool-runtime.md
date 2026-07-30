# Tool Runtime: the declarative intent → tool map

Built in PR8 of the "Wingman as an AI Engineering Operating System" build
(`docs/status/ENGINES.md`, Tool Runtime Engine). **Not a daemon and not a router process** — Claude
Code (or whichever harness is actually driving the session, per `references/harness-capability-profile.md`)
remains the sole executor. This document exists to make tool choice **explicit and governed** rather
than ad-hoc, composed with the existing Level 0-4 permission tiers (`references/permission-model.md`)
rather than a second scale.

## The map

| Intent | Real tool(s) | Permission level required | Notes |
|---|---|---|---|
| Read a file, search code | `Read`, `Grep`, `Glob` | Level 0 | Always available, never gated. |
| Run a build/test/lint command | `Bash` | Level 1-2 | Level 1 for a dry run/check; Level 2 once it can write files (`--fix`, code generation). |
| Write/edit project source | `Write`, `Edit` | Level 2 | Scoped to the project directory; never a system path outside it. |
| Git commit / local branch operations | `Bash` (`git`) | Level 2 | Local-only; never a push. |
| Git push / open a pull request | `skills/git-pr-workflow` (`Bash` + `gh`) | Level 3 | Gated by `hooks/deploy-approval-gate.mjs`'s clean-Boardroom-verdict check. |
| GitHub review/comment/merge actions | `mcp__github__*` tools (when available) | Level 3 | Same boundary as a raw `git push` — a merge is a deploy-class action. |
| Filesystem operations outside the project (global config, `~/.wingman/`) | `Bash`, `Read`/`Write` scoped to `~/.wingman/` | Level 2-3 | Memory Engine's Global/Org tiers already gate this mechanically (`scripts/memory-tiers.mjs`'s `{ approved: true }` requirement) — this row states the tier, the Memory Engine enforces it. |
| Browser automation (Playwright, screenshots) | `Bash` (project's own browser tooling) | Level 1-2 | Read-only verification (screenshot, DOM check) is Level 1; anything that submits a form or triggers a side effect is Level 2. |
| Database queries / migrations | `Bash` (project's own DB tooling), MCP DB connectors when configured | Level 2-4 | A read-only query is Level 2; a schema migration is Level 3+ by definition per `references/permission-model.md`'s "irreversible migration" rule. |
| Cloud/infra actions (deploy, provision) | `Bash`, cloud-provider MCP tools when configured | Level 3-4 | Always at or above the deploy-approval boundary; `Level 4` for anything genuinely irreversible (destroy, force-push to a shared branch). |
| Reading Wingman's own docs/references | `Read`, `skills/doc-index` | Level 0 | `docs/` never ships, so this only applies inside Wingman's own dev-repo checkout — a founder's install has no `docs/` to read. |
| Founder-facing questions / approval gates | `AskUserQuestion` (Claude Code); disclosed substitutes per harness | Level 1-4 (gates the level above it) | See `references/harness-capability-profile.md` for the per-harness substitute where no native question tool exists. |

## What this is not

- **Not a new execution layer.** Every row above names a tool that already exists in the calling
  harness's real tool surface — this document doesn't introduce a wrapper, proxy, or intermediate
  process between the agent and the tool.
- **Not a second risk scale.** The "Permission level required" column is the exact same Level 0-4
  scale `references/permission-model.md` already defines — composed here, not duplicated.
- **Not exhaustive of every possible tool call.** New rows get added only when a real capability
  needs one (matching the evidence-gate discipline applied everywhere else in this build), not
  speculatively for every conceivable MCP server or CLI a founder's environment might have.

## Cited by

- `skills/tool-selection` — the skill that applies this map at decision time.
- `docs/status/ENGINES.md`'s Tool Runtime Engine entry.

See `docs/status/ARCHITECTURE.md` for this document's place in Wingman's overall architecture.
