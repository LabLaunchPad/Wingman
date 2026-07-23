# OpenCode adapter for Wingman's Boardroom

**Verification status (updated 2026-07-23): structurally verified against a real, live OpenCode
install** (v1.18.4, `npm install -g opencode-ai`, no fabricated environment — installed and run
directly in this dev sandbox). Confirmed for real, not just checked against documentation:

- All 8 `boardroom-*.md` agent files are discovered, parsed, and loaded (`opencode agent list`
  correctly typed each as `(subagent)`).
- `opencode debug config`'s resolved output shows each file's exact prompt content verbatim — no
  parsing loss or truncation.
- `boardroom-ceo.md`'s `permission: {edit: deny, bash: deny}` frontmatter is genuinely enforced in
  the resolved permission engine (`opencode debug agent boardroom-ceo` shows the real deny rules).
- `.opencode/plugin/wingman-gate.js` is registered — `opencode debug config`'s top-level `plugin`
  array lists this exact file, confirming the plugin export shape loaded without error.
- The plugin's hook name (`tool.execute.before`) and matched tool name (`plan_exit`) are both
  independently confirmed against real sources beyond this project's own research (a documented
  OpenCode plugin hook, and a real GitHub issue referencing `plan_exit` by name).

**What's still unverified**: actual live model inference — a real Boardroom review firing end to
end. This sandbox has no configured model provider/API key for OpenCode, so the throw-on-reject gate
logic has never been observed running live, only confirmed to load and enforce policy correctly.

## What's here

- `.opencode/agent/boardroom-*.md` (8 files) — the 8 Boardroom seat personas, translated from
  `plugins/wingman/agents/boardroom-*.md` into OpenCode's YAML-frontmatter markdown agent format
  (`mode: subagent`, `description`, `model`, `permission`). The review criteria and
  `## <SEAT> VERDICT` output contract are copied faithfully — the highest-confidence part of this
  adapter, same as the Codex CLI adapter.
- `.opencode/plugin/wingman-gate.js` — a genuine code port (not just documentation) of
  `boardroom-checkpoint.mjs`'s decision logic, wired to OpenCode's `tool.execute.before` plugin hook
  matched against `plan_exit` — OpenCode's own plan-mode-exit tool, which is a real structural analog
  to Claude Code's `ExitPlanMode`. This is the one gate with a genuinely strong port target across
  both harnesses this session researched; see the file's own header comment for exactly which parts
  are high-confidence (the pure `evaluateCheckpoint` logic) vs. lower-confidence (the exact plugin
  wiring shape).

## Install

1. Copy this directory's `.opencode/` folder into your project root: `cp -r .opencode /path/to/your/project/`.
2. Edit each `boardroom-*.md`'s `model:` field to a model your OpenCode install actually has
   configured (the placeholders here are guesses, not confirmed defaults).
3. Confirm `.opencode/plugin/wingman-gate.js` actually loads — this specific loading path and hook
   registration are confirmed working against OpenCode v1.18.4 (`opencode debug config` shows the
   file registered); if a different version doesn't pick it up, check that version's own plugin docs.

## Running a Boardroom review under OpenCode

OpenCode has a documented Task tool and a "General purpose agent" that can run multiple units of
work in parallel (per [OpenCode's Agents docs](https://opencode.ai/docs/agents/)), plus
peer-messaging/shared-task-board coordination for parallel agents. Research did not confirm a single
built-in primitive for "fan out to all 8 named subagents in one message" the way Claude Code's
`Task`/`Agent` calls do — so, same honest caveat as the Codex CLI adapter: until that's confirmed
against a real install, invoke each `boardroom-*` subagent (via `@boardroom-cto`, etc., or your
OpenCode version's Task-tool syntax) and consolidate the `## <SEAT> VERDICT` blocks yourself using
`commands/adaptive/boardroom.md`'s own rule (any `NO_GO` → `DO NOT SHIP`; any `GO_WITH_CONCERNS` →
`GO WITH CHANGES`; otherwise `GO`).

## The real, high-confidence win: the git-push gate

Same recommendation as the Codex CLI adapter: rather than depending on any harness-specific hook
wiring, install `plugins/wingman/scripts/dod-pre-push-check.mjs` as a real `.git/hooks/pre-push` hook
via `plugins/wingman/scripts/install-git-hooks.mjs`. That fires under OpenCode, Codex CLI, Claude
Code, or a human typing `git push` directly, with zero per-harness adaptation.
