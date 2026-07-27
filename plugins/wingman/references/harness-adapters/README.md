# Harness adapters — running Wingman's Boardroom under a coding agent other than Claude Code

Wingman is built as a Claude Code plugin (see `CLAUDE.md`), and `docs/ARCHITECTURE.md` §8a gives an
honest account of what's harness-agnostic vs. Claude-Code-coupled — most of the plugin's *execution*
mechanism (`AskUserQuestion`, `ExitPlanMode` + its gating hooks, parallel `Task`/`Agent` subagent
dispatch) is genuinely coupled to Claude Code's own tool surface.

**2026-07-27 update — founder-directed override, expanding to 6 harnesses (all 6 now built).** §8a's
"no blanket portability work absent real demand" bar had held since 2026-07-18 (declining a full
rewrite 3 times). The founder then asked directly for full agent-agnostic support and, after being
shown that full history, explicitly confirmed this as a deliberate override — not new organic
evidence that the gate cleared itself. See `docs/ARCHITECTURE.md` §8f for the full framing, the
fresh capability-matrix research, and the phase-by-phase build (each phase its own commit). This
directory now covers all 7 harnesses Wingman is evaluated against, symmetrically: **Claude Code**
(`claude-code/` — the native target; no translation exists because none is needed), **Codex CLI**
(`codex-cli/`), **OpenCode** (`opencode/`), **Gemini CLI** (`gemini-cli/`), **OpenHands**
(`openhands/`), **Cline** (`cline/`), and **Cursor** (`cursor/`, sequenced last on purpose — weakest
capability match). It is not a claim that Wingman runs identically everywhere — each directory
states plainly what's genuinely ported, what's structurally verified vs. authored-but-unverified,
and what has no equivalent at all in that harness.

## Capability matrix

The live, generated version of this table is `plugins/wingman/references/harness-capability-profile.md`
(emitted straight from each harness's own `harness-targets/<id>.mjs` descriptor — never hand-edited).
Consumed directly by capability-aware branching in `boardroom.md` and other canonical command/skill
files (§8f) — a session running under any of these harnesses reads this table to pick the real
primitive vs. the disclosed substitute.

| Harness | Hooks | Plan-gate | Parallel dispatch | Question tool |
|---|---|---|---|---|
| Claude Code (native) | ✅ | ✅ | ✅ | ✅ |
| Codex CLI | ✅ | ❌ | ✅ | ❌ |
| OpenCode | ✅ | ⚠️ weak | ❌ | ❌ |
| Gemini CLI | ✅ | ⚠️ weak | ✅ | ✅ |
| OpenHands | ⚠️ weak (schema unconfirmed) | ❌ | ✅ | ❌ |
| Cline | ⚠️ weak (schema unconfirmed) | ❌ | ❌ | ✅ |
| Cursor | ⚠️ weak | ⚠️ weak | ✅ | ❌ |

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

- `claude-code/` — **built + tested**, the native target. Not a translated copy — `plugins/wingman/`
  itself, in Claude Code's own format, already is the artifact. See that directory's own README for
  what's genuinely unique to this harness (`AskUserQuestion`, `ExitPlanMode` + its gates, native
  parallel `Task`/`Agent` dispatch) and why the other two adapters exist at all.
- `codex-cli/` — Boardroom seat personas (8, **authored, unverified** — directory convention and
  field schema independently confirmed correct against official docs, but no Codex CLI account
  exists in this sandbox to confirm the files are actually recognized at runtime) + `hooks.json`
  wiring a real, tested `secret-guard.mjs` port against both `Bash` and `apply_patch` matchers plus
  the git-push gate (both **schema-verified via a real stdin/stdout round-trip test**, per the
  2026-07-25 research pass confirming hooks are enabled by default and `apply_patch`'s field name —
  see `codex-cli/README.md`) + install/usage notes. Live model inference under a real Codex CLI
  account is still unconfirmed — no credential provided for it (`docs/HUMAN-TODOS.md`).
- `opencode/` — Boardroom seat personas (8, **structurally verified (live install)** as of
  2026-07-23 — `opencode agent list`/`debug config`/`debug agent` all confirm real discovery,
  parsing, and permission enforcement) + a real code port of the `boardroom-checkpoint.mjs`
  plan-approval gate as an OpenCode plugin (**structurally verified (live install)** — confirmed
  registered in the resolved plugin config; its hook name and matched tool name are both
  independently confirmed against real sources) + install/usage notes. **Live model inference now
  confirmed, 2026-07-25** — a real `opencode run --agent boardroom-cto` invocation against a real
  OpenCode Zen API key produced a genuine, persona-correct verdict; see `opencode/README.md`'s "Live
  model inference — confirmed" section for the full finding (including a real caveat about
  `--agent`'s fallback-to-default-then-auto-delegate behavior).
- `gemini-cli/` — the strongest capability match of the 6 new harnesses. Boardroom seat personas (8,
  **authored, unverified** — real Markdown+YAML subagent schema confirmed via a dedicated
  2026-07-27 schema-verification pass, no live Gemini CLI account exists to confirm runtime
  discovery) + `commands/wingman/*.toml` (24, **built + tested** — generated, `--check`-verified in
  this sandbox) + `gemini-extension.json`/`GEMINI.md` (real `@file.md` imports) +
  `hooks/hooks.json` + a self-contained `secret-guard.mjs` port + `hooks/plan-gate.mjs` (the one
  genuinely new piece of hook logic across this whole 6-harness build — smoke-tested directly
  against 5 constructed fixture shapes, all matching documented behavior exactly). See
  `gemini-cli/README.md` for the full capability-profile breakdown.
- `openhands/` — deliberately narrower scope than Gemini CLI's, since its capability findings come
  from the general 6-harness matrix pass, not a dedicated schema-verification pass.
  `microagents/repo.md` (**built + tested**, generated via the existing `'folded'` commands mode —
  the same shape Codex CLI's `AGENTS.md` fallback uses) + a shared-skills contribution. No
  Boardroom-persona adapter or hooks-config file shipped here — both honestly logged as open gaps
  (no confirmed schema for either in this pass) rather than guessed at. See `openhands/README.md`.
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
  natively — no per-harness translation of the frontmatter/body shape itself). **For Codex CLI
  specifically, this generated copy is now the secondary path, not the primary one** — see
  `codex-cli/README.md`'s "2026-07-23 update" for the native `codex plugin marketplace add` +
  `codex plugin add` install, which reads Wingman's own existing `plugin.json` directly with zero
  copying at all. OpenCode has no equivalent native mechanism, so `.agents/skills/`/`.opencode/skills/`
  stay the only real path there.
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
  either harness. **Partially resolved, 2026-07-25**: given a real OpenCode Zen API key, a live
  `opencode run --agent boardroom-cto` call confirmed real model inference and persona-correct
  behavior — see `opencode/README.md`'s "Live model inference — confirmed" section. Codex CLI's half
  of this remains genuinely unattempted — no credential has been provided for it
  (`docs/HUMAN-TODOS.md`'s open item).
- ~~Codex CLI's `secret-guard.mjs` Write/Edit-matcher hook path~~ — **resolved, 2026-07-25**. A fresh
  research pass fetching `learn.chatgpt.com/docs/hooks` directly confirmed the exact field:
  `apply_patch` reports its scannable content in the same `tool_input.command` field `Bash` uses. A
  real, tested port now ships at `codex-cli/.codex/hooks/secret-guard.mjs`, wired into
  `codex-cli/.codex/hooks.json` for both matchers — see `codex-cli/README.md`'s "2026-07-25 research
  pass" section for the full finding, including a disclosed caveat (two open GitHub issues report
  `apply_patch` hooks not always firing consistently in practice, despite being documented).
- **A Codex CLI equivalent of the `ExitPlanMode`/`boardroom-checkpoint.mjs` plan-approval gate.**
  Codex CLI has no plan-mode tool at all — it uses `approval_policy` instead. This is a genuine
  capability gap in the target harness, not a missed port.
- **Confirming a single-message N-way parallel subagent-dispatch primitive** for either harness, the
  way Claude Code's `Task`/`Agent` calls provide, at full 7/8-seat Boardroom scale. **Update
  2026-07-23**: Codex CLI's mechanism was confirmed directly at the tool-call layer —
  `spawn_agent`/`followup_task`/`send_message`/`wait_agent`, observed live via `codex debug
  prompt-input`, with a **confirmed 4-concurrent-agent ceiling** at that layer. **A real,
  disclosed inconsistency with the 2026-07-25 pass, not silently reconciled**: that later pass,
  fetching `learn.chatgpt.com/docs/agent-configuration/subagents` directly, found a *different*,
  natural-language-driven dispatch surface (no discrete tool call — "spawn N agents in parallel for
  X, Y, Z" in one message) governed by a separate `agents.max_concurrent_threads_per_session` config
  (example configs use `8`). Both are real findings from direct primary-source verification at
  different times; the most likely explanation is that `spawn_agent`/etc. are the underlying
  mechanism the natural-language interface compiles down to, with the two passes observing different
  layers of the same system rather than two competing truths — but this hasn't been independently
  re-tested to confirm that reconciliation, so it's stated as an open question, not resolved by
  assumption. OpenCode's Task tool remains confirmed only via docs (§8b), not a live multi-agent run
  in this sandbox. Neither harness is confirmed at the exact 7/8-seat scale `boardroom.md` uses in
  one message — the honest fallback (batch beyond the concurrency ceiling, or dispatch sequentially
  and consolidate the same way) is what `generate-harness-adapters.mjs`'s `ParallelDispatch` harness
  note documents.

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
