// Harness target descriptor: Gemini CLI.
//
// Schemas verified directly (2026-07-27, dedicated research pass, corrected an earlier general pass
// that wrongly assumed PreToolUse/PostToolUse event names -- see docs/ARCHITECTURE.md §8f):
//   - `gemini-extension.json`: name/version/description required; commands/hooks/agents/skills live
//     in sibling directories, not manifest fields (contextFileName defaults to GEMINI.md).
//   - `commands/*.toml`: `prompt` (required) + `description` (optional) -- no `name` field, the
//     command's invocation name derives from its file path (a subdirectory becomes a
//     colon-namespace, e.g. `commands/wingman/build.toml` -> `/wingman:build`, matching this
//     plugin's own `/wingman:<name>` convention exactly). Placeholders: `{{args}}`, `!{...}`, `@{...}`.
//   - Subagents: Markdown + YAML frontmatter under `agents/` (extension root) -- name/description
//     required, kind/tools/mcpServers/model/temperature/max_turns/timeout_mins optional; body below
//     frontmatter is the system prompt. Real schema, not TOML/JSON as other harnesses use.
//   - Hooks: a `"hooks"` object (settings.json or the extension's own `hooks/hooks.json`); real event
//     names are BeforeTool/AfterTool/BeforeAgent/AfterAgent/BeforeModel/AfterModel/
//     BeforeToolSelection/SessionStart/SessionEnd/Notification/PreCompress -- NOT PreToolUse/
//     PostToolUse. Each maps to `[{matcher, sequential, hooks: [{type: "command", command, ...}]}]`.
//   - GEMINI.md: real `@file.md` import syntax (relative/absolute, `.md` files only).

export default {
  id: 'gemini-cli',
  label: 'Gemini CLI',

  // --- generator config (generate-harness-adapters.mjs) ---
  commands: {
    // Gemini CLI reads commands/<name>.toml natively; a subdirectory becomes the invocation's
    // colon-namespace, so nesting every command under commands/wingman/ reproduces this plugin's
    // own /wingman:<name> convention with zero extra translation.
    mode: 'toml',
    outDir: 'gemini-cli/commands/wingman',
  },
  skills: {
    // Gemini CLI has no confirmed native skill-discovery convention of its own (unlike Codex
    // CLI/OpenCode, which both read .agents/skills/<name>/SKILL.md) -- contribute to the same
    // shared output anyway so a Gemini CLI project can copy it in manually via GEMINI.md @-imports
    // (see gemini-cli/GEMINI.md), rather than skipping skills for this harness entirely.
    sharedOutDir: 'shared/.agents/skills',
  },

  // --- drift-check config (check-harness-adapter-drift.mjs) ---
  agents: {
    // Real schema: Markdown + YAML frontmatter under agents/ at the extension root (not TOML/JSON).
    dir: 'gemini-cli/agents',
    ext: '.md',
    modelFieldName: 'model',
  },

  // --- capability profile (§8f) ---
  capabilities: {
    hasHooks: true, // confirmed: BeforeTool/AfterTool/etc., can block via hookSpecificOutput
    hasPlanGate: 'weak', // real Plan mode exists, but exiting it auto-escalates to YOLO, bypassing further gating -- closest of any harness, still not a discrete interceptable transition event
    hasParallelDispatch: true, // confirmed: isolated-context subagents, parent consolidates results
    hasQuestionTool: true, // real `ask_user` tool, 1-4 choices, blocks -- closest match to AskUserQuestion found in any harness
  },

  // --- disclosed substitute prose (appended by the generator as "Harness note" blocks) ---
  notes: {
    AskUserQuestion:
      "Gemini CLI has a real, confirmed structured question tool: `ask_user` (1-4 choices, blocking). Use it directly in place of `AskUserQuestion` -- this is the closest match to Claude Code's own tool found in any evaluated harness, not a prose fallback.",
    ExitPlanMode:
      'Gemini CLI has a real Plan mode, but exiting it auto-escalates to YOLO mode, which bypasses further tool-approval gating entirely -- there is no discrete, interceptable "plan approved" event to hook the way `ExitPlanMode` + `boardroom-checkpoint.mjs` do. The disclosed substitute is a `BeforeAgent`/`Notification` hook watching for the mode-switch signal (see `gemini-cli/hooks/plan-gate.mjs`) plus `dod-pre-push-check.mjs`\'s existing git-push fallback as a second, independent backstop -- treat this as a weaker gate than Claude Code\'s, not an equivalent one.',
    ParallelDispatch:
      'Gemini CLI has real, confirmed parallel subagent dispatch: isolated-context subagents run concurrently and the parent consolidates their results. Dispatch Boardroom seats the same way this file describes.',
  },
};
