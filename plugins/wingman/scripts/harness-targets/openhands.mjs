// Harness target descriptor: OpenHands.
//
// Capability findings below come from the 2026-07-27 general 6-harness capability-matrix pass, NOT
// a dedicated field-level schema-verification pass the way Gemini CLI got (see gemini-cli.mjs's own
// header comment for that contrast). Scope is deliberately narrower here as a result: this
// descriptor ports what's confirmed at the capability level (hook event *names* matching Claude
// Code's own taxonomy near-1:1, real parallel delegation via DelegateTool) and explicitly does NOT
// invent a Boardroom-persona file format or an exact hooks-config file schema, since neither was
// independently pinned down at the field level in this pass -- see openhands/README.md's
// "Deliberately not attempted here" section for the honest accounting, and docs/HUMAN-TODOS.md for
// the follow-up needing a real OpenHands install/account to close.

export default {
  id: 'openhands',
  label: 'OpenHands',

  // --- generator config (generate-harness-adapters.mjs) ---
  commands: {
    // OpenHands has no confirmed user-authored slash-command/prompt-template file primitive of its
    // own (conversational + microagent-driven instead) -- fold all commands into one
    // appendable reference file, the same shape Codex CLI's AGENTS.md fallback uses.
    // `.openhands/microagents/repo.md` is OpenHands' own confirmed-real repository-instructions
    // file, automatically loaded as context every session -- the closest analog to AGENTS.md this
    // harness has.
    mode: 'folded',
    outFile: 'openhands/microagents/repo.md',
    outFileLabel: 'repo.md',
    headerRationale:
      'OpenHands has no confirmed user-authored slash-command/prompt-template file primitive --\n' +
      "it's driven by conversation plus microagents, not discrete command files. `.openhands/\n" +
      'microagents/repo.md` is OpenHands\' own confirmed-real repository-instructions file,\n' +
      'automatically loaded as context every session -- so, as with Codex CLI\'s AGENTS.md fallback,\n' +
      "each Wingman command below is written as a section you can paste into your project's own\n" +
      'repo.md (or reference from it) to get the same workflow under OpenHands.',
  },
  skills: {
    // No confirmed native skill-discovery convention for this exact shared-file shape either --
    // contributed anyway (same honest "for manual copy/reference" posture as Gemini CLI) rather than
    // skipping skills for this harness entirely.
    sharedOutDir: 'shared/.agents/skills',
  },

  // --- drift-check config (check-harness-adapter-drift.mjs) ---
  // Deliberately no `agents` block: no Boardroom-persona file format for OpenHands was
  // independently confirmed in this pass (unlike Gemini CLI's real Markdown+YAML schema) -- see
  // README.md. Omitting this key means check-harness-adapter-drift.mjs simply skips OpenHands for
  // the persona-drift check, which is the honest outcome, not a silent gap.

  // --- capability profile (§8f) ---
  capabilities: {
    hasHooks: true, // confirmed near-1:1 event-name parity with Claude Code (Pre/PostToolUse, UserPromptSubmit, Stop, SessionStart/End) -- exact config-file schema NOT independently pinned at the field level this pass
    hasPlanGate: false, // only a blanket confirmation-mode toggle, no discrete plan-approved transition event
    hasParallelDispatch: true, // confirmed real delegation via DelegateTool (newer SDK)
    hasQuestionTool: false, // genuinely undocumented in this pass
  },

  notes: {
    AskUserQuestion:
      'OpenHands has no confirmed structured multi-choice question UI. Ask the same question as plain conversational text, listing the options in prose, and take the reply as free-form text.',
    ExitPlanMode:
      'OpenHands has no plan-mode concept at all -- only a blanket confirmation-mode toggle with no discrete "plan approved" transition event to hook. Use `plugins/wingman/scripts/install-git-hooks.mjs` (already harness-agnostic, fires under any `git push` regardless of which agent drove the session) as the real enforcement point instead of a mid-session plan gate -- the same fallback Codex CLI uses, since neither harness has anything closer.',
    ParallelDispatch:
      'OpenHands has real, confirmed parallel delegation via its `DelegateTool` (newer SDK) -- dispatch Boardroom seats the same way this file describes.',
  },
};
