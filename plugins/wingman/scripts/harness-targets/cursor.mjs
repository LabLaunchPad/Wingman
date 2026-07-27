// Harness target descriptor: Cursor.
//
// Sequenced last in the 6-harness build on purpose (weakest capability match). Like OpenHands/
// Cline, capability findings come from the 2026-07-27 general capability-matrix pass, not a
// dedicated field-level schema-verification pass. Cursor's `.cursor/commands/*.md` slash-command
// convention and `.cursor/rules/*.mdc` project-rules convention are well-documented, stable public
// conventions; the exact 3-hook-event payload schema was NOT independently re-verified at the field
// level this pass -- see cursor/README.md.

export default {
  id: 'cursor',
  label: 'Cursor',

  // --- generator config (generate-harness-adapters.mjs) ---
  commands: {
    // Cursor's real, documented custom-command convention: markdown files under
    // `.cursor/commands/`, each invocable as a slash command in chat -- a genuine per-file
    // primitive, same shape as OpenCode's/Cline's own adapters.
    mode: 'perFile',
    outDir: 'cursor/.cursor/commands',
  },
  skills: {
    // Cursor's real skill-adjacent mechanism is `.cursor/rules/*.mdc` -- a DIFFERENT frontmatter
    // shape (description/globs/alwaysApply) than Wingman's own SKILL.md (name/description). Real
    // translation (2026-07-27 completeness pass), not just the raw SKILL.md offered for reference:
    // `alwaysApply: false` + empty `globs` makes Cursor treat the rule as "Agent Requested" --
    // the agent reads `description` and decides whether to pull it in, the closest real Cursor
    // analog to Claude Code's own description-triggered skill auto-invocation.
    mdcOutDir: 'cursor/.cursor/rules',
    mdcFrontmatter: (description) =>
      `---\ndescription: "${description}"\nglobs: []\nalwaysApply: false\n---\n\n`,
    sharedOutDir: 'shared/.agents/skills',
  },

  // --- drift-check config (check-harness-adapter-drift.mjs) ---
  // No `agents` block: Cursor has no confirmed Boardroom-persona/subagent-definition file format --
  // its parallel-dispatch primitive (up to 8 worktree-isolated background agents) has no
  // per-persona configuration file the way Gemini CLI's `agents/*.md` does.

  // --- capability profile (§8f) ---
  capabilities: {
    hasHooks: 'weak', // only 3 narrow lifecycle points (beforeShellExecution/beforeMCPExecution/afterFileEdit), no generic PreToolUse equivalent
    hasPlanGate: 'weak', // real Plan Mode exists, but the transition is UI-click-only -- no hook fires on it
    hasParallelDispatch: true, // confirmed genuine: up to 8 parallel, worktree-isolated background agents
    hasQuestionTool: false, // none -- forum feature requests only, not shipped
  },

  notes: {
    AskUserQuestion:
      'Cursor has no structured multi-choice question UI (forum feature requests only, not shipped). Ask the same question as plain conversational text, listing the options in prose, and take the reply as free-form text.',
    ExitPlanMode:
      "Cursor has a real Plan Mode, but the transition out of it is UI-click-only -- no hook fires on it, so there is nothing to intercept (unlike Gemini CLI's coarser-but-real BeforeAgent proxy). Use `plugins/wingman/scripts/install-git-hooks.mjs` (already harness-agnostic, fires under any `git push` regardless of which agent drove the session) as the real enforcement point instead of a mid-session plan gate.",
    ParallelDispatch:
      'Cursor has real, confirmed parallel dispatch: up to 8 background agents, each in its own isolated git worktree. Dispatch Boardroom seats the same way this file describes -- note Cursor batches at 8, so an 8-seat Boardroom (7 core + Design) fits in one batch exactly.',
  },
};
