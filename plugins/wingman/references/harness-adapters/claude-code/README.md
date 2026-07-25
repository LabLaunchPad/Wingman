# Claude Code — the native target, no adapter needed

**Verification status: built + tested.** This is not a translated copy — it's a pointer to the real
thing, which already exists and already ships.

Every other directory in `harness-adapters/` (`codex-cli/`, `opencode/`) exists because those
harnesses read a *different* file shape than Claude Code's own conventions, so a translation step is
required before they can discover Wingman's commands/agents/skills/hooks at all. Claude Code needs no
such step: `plugins/wingman/` **is** the Claude Code plugin, in Claude Code's own native format,
already. There is nothing to port, because there is no format gap to cross.

## What "the adapter" actually is, for this one harness

- **`.claude-plugin/marketplace.json`** (repo root) + **`plugins/wingman/.claude-plugin/plugin.json`**
  — the two-file marketplace/plugin manifest pair Claude Code reads natively.
- **`plugins/wingman/{commands,agents,skills,hooks}/`** — the 24 commands, 8 Boardroom seat agents,
  40 skills, and `hooks/hooks.json` wiring, all in Claude Code's own authored format, no translation
  layer in between.
- **Install path**: `/plugin marketplace add <this-repo>` then `/plugin install wingman@wingman`
  inside a real Claude Code session — the same two commands used throughout this project's own real
  dogfooding history (see `docs/PROJECT.md`'s decisions log and `docs/HUMAN-TODOS.md` for the actual
  install-time bugs those real runs found and fixed).

## Why this directory exists at all, given there's nothing to build here

So that `harness-adapters/` names all 3 harnesses Wingman is evaluated against symmetrically, rather
than silently treating Claude Code as an unstated default and only naming the other two. A reader
scanning this directory for "does Wingman support harness X" should find an explicit, honest answer
for all 3 — including the one where the honest answer is "there's no separate adapter, the canonical
plugin already is one."

## What's genuinely unique to this harness (not shared with the other two)

- `AskUserQuestion` — a real interactive multiple-choice UI primitive neither Codex CLI nor OpenCode
  expose an equivalent for; see `docs/ARCHITECTURE.md` §8a for the documented fallback.
- `ExitPlanMode` + its two gating hooks (`dod-structural-gate.mjs`, `boardroom-checkpoint.mjs`) — a
  plan-mode-exit tool Claude Code exposes that the other two harnesses don't have a direct analog
  for (Codex CLI uses `approval_policy` instead; OpenCode has a structurally similar `plan_exit` tool
  that `opencode/.opencode/plugin/wingman-gate.js` targets, but it isn't the identical mechanism).
- Native parallel `Task`/`Agent` subagent dispatch for the Boardroom's 7/8-seat review — see
  `docs/ARCHITECTURE.md` §8a for how this compares to Codex CLI's confirmed natural-language parallel
  dispatch and OpenCode's confirmed sequential/orchestrator-driven dispatch.

None of these are gaps to fix — they're the reason `plugins/wingman/` is built against Claude Code's
tool surface first, with the other two harnesses' adapters explicitly scoped down to what actually
survives translation (Boardroom personas, skills, commands, the git-push safety gate) rather than
claiming full parity that doesn't exist.
