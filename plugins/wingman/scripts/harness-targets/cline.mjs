// Harness target descriptor: Cline.
//
// Like openhands.mjs, this descriptor's capability findings come from the 2026-07-27 general
// 6-harness capability-matrix pass, not a dedicated field-level schema-verification pass the way
// Gemini CLI got. Cline's `.clinerules/workflows/*.md` slash-command convention and
// `ask_followup_question` tool are well-documented, stable public conventions (used here with
// reasonable confidence); the exact hook-config file schema (introduced v3.36, tool-call-scoped,
// macOS/Linux only per public release notes) was NOT independently re-verified at the field level
// in this pass, so no hooks.json-equivalent is authored here -- see cline/README.md.

export default {
  id: 'cline',
  label: 'Cline',

  // --- generator config (generate-harness-adapters.mjs) ---
  commands: {
    // Cline's real, documented workflow convention: markdown files under `.clinerules/workflows/`,
    // each invocable as a slash command in chat (`/<filename>`) -- a genuine per-file primitive,
    // unlike Codex CLI/OpenHands' folded-file fallback.
    mode: 'perFile',
    outDir: 'cline/.clinerules/workflows',
  },
  skills: {
    // Cline's `.clinerules/*.md` files are always-active context, not an on-demand per-skill
    // invocation mechanism the way Claude Code's skills are -- bulk-copying 40 always-loaded files
    // would burn context on every turn regardless of relevance. Contributed to the same shared
    // output anyway (for manual, selective copying into a project's own .clinerules/), same honest
    // posture as Gemini CLI/OpenHands take where no native on-demand equivalent exists.
    sharedOutDir: 'shared/.agents/skills',
  },

  // --- drift-check config (check-harness-adapter-drift.mjs) ---
  // No `agents` block: Cline has no confirmed Boardroom-persona/subagent-definition file format
  // (it has no subagent concept at all -- `hasParallelDispatch: false` below reflects this).

  // --- capability profile (§8f) ---
  capabilities: {
    hasHooks: true, // new in v3.36 (tool-call-scoped only, macOS/Linux only per public release notes) -- exact config schema not independently re-verified at the field level this pass
    hasPlanGate: false, // Plan/Act toggle is manual-only, no interception point (Cline's own docs are explicit about this)
    hasParallelDispatch: false, // confirmed none -- `/newtask` is a sequential context-reset, not concurrency, and Cline has no subagent-dispatch primitive at all
    hasQuestionTool: true, // real `ask_followup_question` tool, single-select
  },

  notes: {
    AskUserQuestion:
      "Cline has a real question tool, `ask_followup_question` (single-select, not Claude Code's up-to-4-option multi-select) -- use it in place of `AskUserQuestion`, adapting a multi-option ask into Cline's single-select shape (e.g. present options as a numbered list, or ask one option at a time).",
    ExitPlanMode:
      "Cline has a real Plan/Act mode toggle, but the transition is manual-only with no interception point (Cline's own docs are explicit about this) -- there is nothing to hook. Use `plugins/wingman/scripts/install-git-hooks.mjs` (already harness-agnostic, fires under any `git push` regardless of which agent drove the session) as the real enforcement point instead of a mid-session plan gate -- the same fallback Codex CLI and OpenHands use.",
    ParallelDispatch:
      'Cline has no parallel-subagent-dispatch primitive at all -- `/newtask` starts a fresh, sequential context-reset task, not concurrent execution. Dispatch Boardroom seats one at a time in this same session and consolidate the same way this file describes, disclosing the sequential degradation plainly in the founder-facing summary rather than presenting it as a normal parallel review.',
  },
};
