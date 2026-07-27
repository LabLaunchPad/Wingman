# Wingman for Gemini CLI

This is Wingman's context file for Gemini CLI (`contextFileName` in `gemini-extension.json`).
Gemini CLI has no confirmed native skill-discovery convention of its own (unlike Codex CLI/OpenCode,
which both read `.agents/skills/<name>/SKILL.md` natively) -- so Wingman's 40 skills are pulled in
here via Gemini CLI's real `@file.md` import syntax instead of relying on autodiscovery. Copy
`../shared/.agents/skills/` into your project (or reference it from wherever you placed it) and
uncomment the imports below for the skills your workflow actually uses -- importing all 40
unconditionally would spend context budget on skills a given task never touches.

## Core discipline (import these for any Wingman-driven session)

@../shared/.agents/skills/plain-language-checkpoint/SKILL.md
@../shared/.agents/skills/verification-before-completion/SKILL.md
@../shared/.agents/skills/engineering-minimalism/SKILL.md

## Boardroom seats

Eight Boardroom-seat subagents live under `agents/` in this directory (`boardroom-ceo.md`,
`boardroom-cpo.md`, `boardroom-cmo.md`, `boardroom-cto.md`, `boardroom-ciso.md`, `boardroom-cfo.md`,
`boardroom-research.md`, `boardroom-design.md`) -- translated from
`plugins/wingman/agents/boardroom-*.md`. Gemini CLI's confirmed real parallel subagent dispatch
(isolated-context subagents, parent consolidates) means these can genuinely run concurrently, the
same way the canonical `/wingman:boardroom` command describes -- no sequential-fallback disclosure
needed here, unlike OpenCode/Codex CLI's weaker dispatch story.

## Commands

`commands/wingman/*.toml` mirrors all 24 canonical `/wingman:*` commands 1:1 -- Gemini CLI's
subdirectory-as-namespace convention (`commands/wingman/build.toml` -> `/wingman:build`)
reproduces this plugin's own naming with zero translation.

## The plan-gate gap (read before relying on this for founder sign-off)

Gemini CLI's real Plan mode has no discrete, interceptable "plan approved" transition event the way
Claude Code's `ExitPlanMode` + `boardroom-checkpoint.mjs` gate does -- exiting Plan mode
auto-escalates straight to YOLO mode, bypassing further tool-approval gating entirely. See
`hooks/plan-gate.mjs` for the disclosed substitute (a `BeforeAgent`/`Notification` hook watching
for that mode-switch signal) and this directory's `README.md` for why it's a weaker gate than
Claude Code's, not an equivalent one. `plugins/wingman/scripts/dod-pre-push-check.mjs` (wired via
`plugins/wingman/scripts/install-git-hooks.mjs`) is the second, independent backstop -- it fires on
`git push` regardless of which agent drove the session, including this one.
