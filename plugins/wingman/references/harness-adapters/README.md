# Harness adapters — running Wingman's Boardroom under a coding agent other than Claude Code

Wingman is built as a Claude Code plugin (see `CLAUDE.md`), and `docs/ARCHITECTURE.md` §8a gives an
honest account of what's harness-agnostic vs. Claude-Code-coupled — most of the plugin's *execution*
mechanism (`AskUserQuestion`, `ExitPlanMode` + its gating hooks, parallel `Task`/`Agent` subagent
dispatch) is genuinely coupled to Claude Code's own tool surface, and no blanket "make it all
portable" work is planned absent real, evidenced demand for a specific target harness (§8a's own
stated bar, and the reason an earlier external "flatten everything" proposal was declined on
2026-07-18 — see `docs/PROJECT.md`'s decisions log).

This directory is that evidenced-demand case, scoped to two named harnesses: **Codex CLI** and
**OpenCode**. It is not a claim that Wingman now runs identically everywhere.

**2026-07-23 update — full command/skill parity, not just Boardroom + git-push gate.** The founder
named "agent-agnostic across Claude Code, OpenCode, and Codex CLI" as an explicit MVP goal — the
kind of real, named demand §8a's own bar requires to revisit "no portability work scheduled." A
same-session research pass found the earlier "full port = untestable at scale" verdict no longer
holds the way it used to: both target harnesses turn out to read Claude Code's own skill/command
*file shapes* almost natively, so "port" mostly means "place the same file where that harness
already looks," not "hand-translate into a different format." See `plugins/wingman/scripts/generate-harness-adapters.mjs`
and the "What's here" section below for what that produced — every claim is backed by a real,
live-install check run this session, not docs prose alone.

## Verification-status legend

Every artifact in this directory carries one of these labels, matching this project's existing
"authored, pending first run" convention (used throughout `evals/cases/*.md` rather than overclaiming
a `verified` status with no real evidence):

- **built + tested** — created and confirmed working in this repo's own sandbox.
- **structurally verified (live install)** — confirmed against a real, installed instance of the
  target harness that the artifact is discovered, parsed, loaded, and (where applicable) its policy
  is enforced — but no live model inference was run (no configured API key/model provider), so
  behavioral/output-level correctness is still unconfirmed.
- **authored, unverified** — a faithful, best-effort translation checked against public
  documentation, but never run against a live install of the target harness.
- **not attempted, documented why** — deliberately skipped, with the concrete reason stated inline
  rather than silently omitted.

## What's here

- `codex-cli/` — Boardroom seat personas (8, **authored, unverified** — directory convention and
  field schema independently confirmed correct against official docs, but no Codex CLI account
  exists in this sandbox to confirm the files are actually recognized at runtime) + a narrow
  hooks.json subset for the git-push gate (**authored, unverified**) + install/usage notes.
- `opencode/` — Boardroom seat personas (8, **structurally verified (live install)** as of
  2026-07-23 — `opencode agent list`/`debug config`/`debug agent` all confirm real discovery,
  parsing, and permission enforcement) + a real code port of the `boardroom-checkpoint.mjs`
  plan-approval gate as an OpenCode plugin (**structurally verified (live install)** — confirmed
  registered in the resolved plugin config; its hook name and matched tool name are both
  independently confirmed against real sources) + install/usage notes.
- The single **built + tested** artifact from this investment isn't harness-specific at all:
  `plugins/wingman/scripts/install-git-hooks.mjs`, which wires the existing
  `dod-pre-push-check.mjs` up as a real `.git/hooks/pre-push` hook. That fires under any coding
  agent (or a human) that runs `git push`, with zero per-harness adaptation — the most robust piece
  of portability this investment produced, precisely because it doesn't depend on any AI harness's
  tool-naming or hook-API details at all.
- `shared/.agents/skills/` — all **40 skills**, generated verbatim from the canonical
  `plugins/wingman/skills/**` source by `plugins/wingman/scripts/generate-harness-adapters.mjs`.
  **structurally verified (live install)**, 2026-07-23 — a real `opencode-ai@1.18.4` install's
  `opencode debug skill` and a real `@openai/codex@0.145.0` install's `codex debug prompt-input`
  both listed all 40 skill names when this directory was copied into a scratch project as
  `.agents/skills/`. One shared file serves both harnesses (both read the identical path/format
  natively — no per-harness translation of the frontmatter/body shape itself).
- `opencode/.opencode/commands/` — all **24 commands**, generated verbatim from
  `plugins/wingman/commands/**`. **structurally verified (live install)** — `opencode debug config`
  showed all 24 command names, template content byte-identical to the canonical source, when
  copied into a scratch project as `.opencode/commands/`.
- `codex-cli/commands-as-agents-md.md` — all 24 commands, one per section, generated for **manual
  append into a Codex CLI project's own `AGENTS.md`** — Codex CLI has no user-authored slash-command
  file primitive (confirmed by direct CLI inspection: no `codex commands` subcommand exists; its
  `prompts/list`/`prompts/get` are MCP protocol methods an MCP *server* exposes, not a local file
  convention a plugin author can drop files into). This is a genuine capability gap, not a missed
  port. **structurally verified (live install)** for the fallback mechanism itself — a real Codex
  CLI install's `codex debug prompt-input` confirmed pasted section content actually reaches the
  assembled model prompt when placed in a project's `AGENTS.md`.
- 13 of the 40 skills and 6 of the 24 commands reference a Claude-Code-specific primitive
  (`AskUserQuestion`, `ExitPlanMode`, or parallel `Task`/`Agent` dispatch). Each generated copy gets
  an additive, clearly-marked "Harness note" section appended (never a rewrite of the original
  prose) explaining that harness's real equivalent — see `generate-harness-adapters.mjs`'s
  `HARNESS_NOTES` table for the exact mapping per primitive.

## Deliberately not attempted here (and why)

- **Live, end-to-end model-inference verification** of the generated skill/command surface under
  either harness — this sandbox has no configured API key/model provider for OpenCode or Codex CLI,
  so "the file is discovered and its content reaches the assembled prompt" (confirmed, see above) is
  as far as this pass could verify; "the model then behaves correctly when actually invoked" needs
  founder-provided credentials (`docs/HUMAN-TODOS.md`'s `ANTHROPIC_API_KEY`-equivalent item for these
  two harnesses specifically — not yet tracked there, added this update).
- **Codex CLI's `secret-guard.mjs` Write/Edit-matcher hook path.** A 2026-07-22 follow-up audit
  confirmed the matcher shape via OpenAI's official Codex hooks docs (`apply_patch`/`Edit`/`Write`
  all valid matcher values; hook input's `tool_name` always reports `apply_patch`) — the original
  "tool-name strings weren't confirmed" blocker is resolved. What's still unconfirmed is the exact
  JSON field name inside `apply_patch`'s `tool_input` holding the patch content itself (the
  equivalent of Claude Code's `toolInput.content`/`new_string`), so `secret-guard.mjs` still isn't
  wired here — guessing that field risks a hook that runs but silently never matches anything,
  worse than not porting it and saying so plainly. See `codex-cli/README.md`'s "2026-07-22 research
  update" section and `codex-cli/.codex/hooks.json`'s own inline comment for the full detail.
- **A Codex CLI equivalent of the `ExitPlanMode`/`boardroom-checkpoint.mjs` plan-approval gate.**
  Codex CLI has no plan-mode tool at all — it uses `approval_policy` instead. This is a genuine
  capability gap in the target harness, not a missed port.
- **Confirming a single-message N-way parallel subagent-dispatch primitive** for either harness, the
  way Claude Code's `Task`/`Agent` calls provide, at full 7/8-seat Boardroom scale. **Update
  2026-07-23**: Codex CLI's real mechanism is now confirmed directly (not just documented) —
  `spawn_agent`/`followup_task`/`send_message`/`wait_agent`, observed live via `codex debug
  prompt-input`, with a **confirmed 4-concurrent-agent ceiling** (lower than an 8-seat single-message
  fan-out). OpenCode's Task tool remains confirmed only via docs (§8b), not a live multi-agent run in
  this sandbox. Neither is confirmed at the exact 7/8-seat scale `boardroom.md` uses in one message —
  the honest fallback (batch beyond the concurrency ceiling, or dispatch sequentially and consolidate
  the same way) is what `generate-harness-adapters.mjs`'s `ParallelDispatch` harness note documents.

## Sources (2026 research)

- **2026-07-23 additions, direct live-install verification (stronger evidence than docs prose,
  used specifically because an earlier research pass on this same topic found docs prose
  incomplete/inconsistent — see the `.agents/skills/` finding below):**
  - OpenCode skill discovery paths (`.opencode/skills/`, `.claude/skills/`, `.agents/skills/`) —
    [OpenCode skills docs](https://opencode.ai/docs/skills/), confirmed directly via
    `opencode debug skill` against a real `opencode-ai@1.18.4` install (the docs page alone was
    trusted only after a same-name-collision false negative in an early test was diagnosed and
    re-tested with unique names).
  - OpenCode command format (`.opencode/commands/*.md`, `description`/`agent`/`model`/`subtask`
    frontmatter, `$ARGUMENTS` templating) — [OpenCode commands docs](https://opencode.ai/docs/commands/),
    confirmed directly via `opencode debug config` showing byte-identical template content.
  - Codex CLI skill discovery (`.agents/skills/`, `.codex/skills/`, `$CODEX_HOME/skills`) —
    confirmed directly via `codex debug prompt-input` against a real `@openai/codex@0.145.0`
    install (docs prose at `learn.chatgpt.com/docs/build-skills` only mentioned `.agents/skills`;
    the `$CODEX_HOME/skills` path was found independently via the installed binary's own embedded
    strings).
  - Codex CLI has no command/prompt-template file primitive — confirmed by direct `codex --help`/
    `codex plugin --help` inspection (no such subcommand exists) rather than inferred from docs
    silence.
  - Codex CLI real parallel multi-agent primitives (`spawn_agent`, `followup_task`, `send_message`,
    `wait_agent`, 4 concurrent slots) — found directly in `codex debug prompt-input`'s assembled
    system prompt, not previously documented anywhere in this repo.
- Codex CLI subagents GA — [Codex CLI 2026 reference](https://www.codegateway.dev/en/blog/openai-codex-cli-complete-guide-2026)
  cites 6 concurrent; this session's direct live-install observation (above) saw the system prompt
  state "4 available concurrency slots." Both are logged rather than silently picking one — the
  discrepancy may be a version difference (this reference predates the installed `0.145.0`) or a
  configurable limit; treated as an open, disclosed question, not resolved by assumption.
- Codex CLI hooks: event list, JSON schema, `hookSpecificOutput.permissionDecision` / exit-code-2
  blocking protocol — [official Codex hooks reference](https://learn.chatgpt.com/docs/hooks)
- Codex CLI custom-agent TOML config (`.codex/agents/*.toml`), `AGENTS.md` discovery —
  [Codex config-advanced reference](https://learn.chatgpt.com/docs/config-file/config-advanced)
- OpenCode Task tool, parallel general-purpose agent, `permission.task` — [OpenCode Agents docs](https://opencode.ai/docs/agents/)
- OpenCode `plan_exit` tool as the `ExitPlanMode` analog — [OpenCode plan/build mode issue #32022](https://github.com/anomalyco/opencode/issues/32022)
- OpenCode `tool.execute.before` plugin hook, and its known subagent-bypass limitation (not relevant
  to this adapter, since `plan_exit` fires from the primary agent) — [OpenCode issue #5894](https://github.com/sst/opencode/issues/5894)
- AGENTS.md as the cross-agent standard (Claude Code, Codex CLI, Cursor, OpenCode, Copilot, Gemini
  CLI, Windsurf, Aider, Devin, Amazon Q) — [AGENTS.md guide](https://www.augmentcode.com/guides/how-to-build-agents-md)
