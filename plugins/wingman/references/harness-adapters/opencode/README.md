# OpenCode adapter for Wingman's Boardroom

**Verification status: authored, unverified.** No live OpenCode install exists in the Wingman dev
sandbox this was built in. Everything below is a faithful, best-effort translation checked against
public OpenCode documentation (cited in `../README.md` and `docs/ARCHITECTURE.md` §8b), not against
a real running session.

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
3. Confirm `.opencode/plugin/wingman-gate.js` actually loads (OpenCode's plugin-loading location and
   exact hook-registration API weren't verified against a live install — check your OpenCode
   version's own plugin docs if it doesn't).

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
