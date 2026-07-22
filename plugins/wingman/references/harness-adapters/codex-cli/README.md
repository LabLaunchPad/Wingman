# Codex CLI adapter for Wingman's Boardroom

**Verification status: authored, unverified.** No live Codex CLI install exists in the Wingman dev
sandbox this was built in. Everything below is a faithful, best-effort translation checked against
public Codex CLI documentation (cited in `../README.md` and `docs/ARCHITECTURE.md` §8b), not against
a real running session. Treat it as a starting point, not a certified port — if something doesn't
load, it's more likely an API detail this research missed than a made-up feature.

## What's here

- `.codex/agents/boardroom-*.toml` (8 files) — the 8 Boardroom seat personas (CEO, CPO, CMO, CTO,
  CISO, CFO, Research, Design), translated from `plugins/wingman/agents/boardroom-*.md` into Codex
  CLI's custom-agent TOML schema. The review criteria and `## <SEAT> VERDICT` output contract are
  copied faithfully — that content is harness-agnostic prose, so this is the highest-confidence part
  of this adapter.
- `.codex/hooks.json` — only the git-push safety gate, which keys on command-text pattern-matching
  (`git push`), not a harness-specific tool name. Deliberately excludes the `boardroom-checkpoint.mjs`
  plan-approval gate: Codex CLI has no plan-mode tool to gate — it uses `approval_policy` instead;
  this is a genuine capability gap, not an oversight. See "2026-07-22 research update" below for
  what changed on the `secret-guard.mjs` Write/Edit path.

## 2026-07-22 research update — Bash matcher confirmed, Write/Edit matcher partially confirmed

A follow-up platform-conventions audit fetched OpenAI's official Codex hooks reference
(`learn.chatgpt.com/docs/hooks`, redirected from `developers.openai.com/codex/hooks`) directly,
resolving two things this adapter previously flagged as unconfirmed:

- **The `Bash` matcher is now confirmed, not a guess.** The official docs state PreToolUse/
  PostToolUse intercept "Bash, file edits performed through `apply_patch`, MCP tool calls, and
  other local function tools" — `Bash` is a real, documented tool name.
- **The Write/Edit matcher shape is now confirmed, but the payload field name still isn't.** The
  same docs confirm matcher values `apply_patch`, `Edit`, or `Write` all work for the file-edit hook
  path — the hook input's own `tool_name` field always reports `apply_patch` regardless of which
  matcher value is configured. That resolves this adapter's original blocker (unconfirmed tool-name
  strings). What's still unconfirmed: the exact JSON field name inside `apply_patch`'s `tool_input`
  that holds the actual patch/diff content — the equivalent of Claude Code's
  `toolInput.content`/`toolInput.new_string` that `secret-guard.mjs`'s `decide()` function scans.
  Wiring `secret-guard.mjs` against a guessed field name risks a hook that runs on every file edit
  but never actually matches anything — silently worse than not porting it at all, per this
  project's own standing engineering discipline. **Concrete next step, not attempted here**: a live
  Codex CLI session's own `/hooks` audit log would show the real payload shape in one inspection.
- **Left genuinely unresolved — conflicting sources**: whether Codex hooks are enabled by default.
  The official docs say hooks are on by default, with `[features] hooks = false` in `config.toml`
  to disable them (`codex_hooks` is called out as a deprecated alias for the same flag). A
  third-party cheatsheet claimed the opposite — an opt-in `codex_hooks = true` flag, with silent
  no-ops otherwise. Official docs are treated as authoritative here, but this specific point hasn't
  been confirmed against a live install either, so treat it as the one open question before relying
  on this adapter's hooks firing at all.

## Install

1. Copy this directory's `.codex/` folder into your project root: `cp -r .codex /path/to/your/project/`.
2. Edit each `boardroom-*.toml`'s `model` field to a model your Codex CLI install actually has access
   to (the placeholder `"gpt-5.5"` is a guess, not a confirmed default).
3. Fix `.codex/hooks.json`'s command path (see its own inline `_command_comment`) — or skip it
   entirely and use the git-level installer instead (next section), which is more robust.

## Running a Boardroom review under Codex CLI

Codex CLI's subagents are GA as of the 2026 GPT-5.5 release (6 concurrent, per
[the 2026 Codex CLI reference](https://www.codegateway.dev/en/blog/openai-codex-cli-complete-guide-2026)) — real parallel dispatch capability exists. What wasn't confirmed by research is a single
built-in primitive for "fan out to all 8 named subagents in one message" the way Claude Code's
`Task`/`Agent` tool calls do inside `commands/adaptive/boardroom.md`. Until that's confirmed one way
or the other against a real install, the honest guidance is: invoke each `boardroom-*` agent in turn
(or in whatever batch your Codex CLI version's subagent invocation actually supports), collect each
seat's `## <SEAT> VERDICT` block, and consolidate them yourself using the same rule
`commands/adaptive/boardroom.md` uses (any `NO_GO` → overall `DO NOT SHIP`; any `GO_WITH_CONCERNS`
→ overall `GO WITH CHANGES`; otherwise `GO`). This is slower and costs more per-seat context
re-establishment than Claude Code's single-message parallel dispatch — a real tradeoff, not solved
here, matching `docs/ARCHITECTURE.md` §8a's existing honest framing for this exact coupling point.

## The real, high-confidence win: the git-push gate

Rather than depending on this adapter's `hooks.json` (whose exact tool-name matcher is an unconfirmed
guess), install `plugins/wingman/scripts/dod-pre-push-check.mjs` as a real `.git/hooks/pre-push` hook
via `plugins/wingman/scripts/install-git-hooks.mjs`. That fires at the `git` level — under Codex CLI,
under Claude Code, under a human typing `git push` directly — with zero per-harness adaptation and
zero guessing about tool names. See the repo root's own use of this (item 3 of the parent plan) for
a real, tested example.
