# Harness adapters — running Wingman's Boardroom under a coding agent other than Claude Code

Wingman is built as a Claude Code plugin (see `CLAUDE.md`), and `docs/ARCHITECTURE.md` §8a gives an
honest account of what's harness-agnostic vs. Claude-Code-coupled — most of the plugin's *execution*
mechanism (`AskUserQuestion`, `ExitPlanMode` + its gating hooks, parallel `Task`/`Agent` subagent
dispatch) is genuinely coupled to Claude Code's own tool surface, and no blanket "make it all
portable" work is planned absent real, evidenced demand for a specific target harness (§8a's own
stated bar, and the reason an earlier external "flatten everything" proposal was declined on
2026-07-18 — see `docs/PROJECT.md`'s decisions log).

This directory is that evidenced-demand case, scoped narrowly to two named harnesses: **Codex CLI**
and **OpenCode**. It is not a claim that Wingman now runs identically everywhere.

## Verification-status legend

Every artifact in this directory carries one of these labels, matching this project's existing
"authored, pending first run" convention (used throughout `evals/cases/*.md` rather than overclaiming
a `verified` status with no real evidence):

- **built + tested** — created and confirmed working in this repo's own sandbox.
- **authored, unverified** — a faithful, best-effort translation checked against public
  documentation, but never run against a live install of the target harness (neither harness is
  installed in the Wingman dev sandbox this was built in).
- **not attempted, documented why** — deliberately skipped, with the concrete reason stated inline
  rather than silently omitted.

## What's here

- `codex-cli/` — Boardroom seat personas (8, **authored, unverified**) + a narrow hooks.json subset
  for the git-push gate (**authored, unverified**) + install/usage notes.
- `opencode/` — Boardroom seat personas (8, **authored, unverified**) + a real code port of the
  `boardroom-checkpoint.mjs` plan-approval gate as an OpenCode plugin (**authored, unverified**, but
  its core decision logic is a direct, faithful port — see the file itself) + install/usage notes.
- The single **built + tested** artifact from this investment isn't harness-specific at all:
  `plugins/wingman/scripts/install-git-hooks.mjs`, which wires the existing
  `dod-pre-push-check.mjs` up as a real `.git/hooks/pre-push` hook. That fires under any coding
  agent (or a human) that runs `git push`, with zero per-harness adaptation — the most robust piece
  of portability this investment produced, precisely because it doesn't depend on any AI harness's
  tool-naming or hook-API details at all.

## Deliberately not attempted here (and why)

- **Full 1:1 porting of all 26 commands / 40 skills** into Codex TOML or OpenCode markdown formats.
  Untestable in this sandbox at that scale, and exactly the unverified-breadth pattern this project's
  own `engineering-minimalism` skill warns against. Revisit if real, evidenced demand for full
  command-surface parity (not just the Boardroom + safety gate) shows up.
- **Codex CLI's `secret-guard.mjs` Write/Edit-matcher hook path.** Codex's exact tool-name strings
  for its file-edit tool weren't confirmed by research; a wrong guess would make the hook silently
  never fire, which is worse than not porting it and saying so plainly (see `codex-cli/.codex/hooks.json`'s own inline comment).
- **A Codex CLI equivalent of the `ExitPlanMode`/`boardroom-checkpoint.mjs` plan-approval gate.**
  Codex CLI has no plan-mode tool at all — it uses `approval_policy` instead. This is a genuine
  capability gap in the target harness, not a missed port.
- **Confirming a single-message N-way parallel subagent-dispatch primitive** for either harness, the
  way Claude Code's `Task`/`Agent` calls provide. Both harnesses gained real parallel-subagent
  capability during 2026 (see Sources below), which is new evidence worth recording (§8a's stale
  claim is corrected in `docs/ARCHITECTURE.md` §8b), but neither adapter's README claims a
  confirmed one-shot 8-seat fan-out — both document the honest fallback (sequential dispatch,
  manual consolidation) instead.

## Sources (2026 research)

- Codex CLI subagents GA, 6 concurrent — [Codex CLI 2026 reference](https://www.codegateway.dev/en/blog/openai-codex-cli-complete-guide-2026)
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
