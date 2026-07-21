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
  (`git push`), not a harness-specific tool name. Deliberately excludes two things, both explained
  inline in the file's own comments: the `secret-guard.mjs` Write/Edit-matcher path (Codex's actual
  tool-name strings for file edits weren't confirmed by research) and the `boardroom-checkpoint.mjs`
  plan-approval gate (Codex CLI has no plan-mode tool to gate — it uses `approval_policy` instead;
  this is a genuine capability gap, not an oversight).

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
