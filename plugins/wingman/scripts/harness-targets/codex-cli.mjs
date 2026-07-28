// Harness target descriptor: Codex CLI.
//
// Extracted from the previously-hardcoded HARNESS_NOTES/HARNESS_LABELS tables and inline
// buildTargets() branch in generate-harness-adapters.mjs, plus the hardcoded codexDir constant in
// check-harness-adapter-drift.mjs -- see docs/status/ARCHITECTURE.md §8f for why this became a
// descriptor-driven model instead of two more hand-added harness branches.

export default {
  id: 'codex-cli',
  label: 'Codex CLI',

  // --- generator config (generate-harness-adapters.mjs) ---
  commands: {
    // Codex CLI has no per-file slash-command/prompt-template primitive (confirmed by direct CLI
    // inspection: no `codex commands` subcommand; `prompts/list`/`prompts/get` are MCP protocol
    // methods, not a local file convention) -- fold all commands into one AGENTS.md-appendable file.
    mode: 'folded',
    outFile: 'codex-cli/commands-as-agents-md.md',
    outFileLabel: 'AGENTS.md',
    headerRationale:
      'Codex CLI has no user-authored slash-command/prompt-template file primitive (confirmed by direct\n' +
      'CLI inspection: no `codex commands` subcommand; `prompts/list`/`prompts/get` are MCP protocol\n' +
      'methods for an MCP *server* to expose, not a local file convention a plugin author can drop files\n' +
      'into) -- a genuine capability gap in this harness, not a missed port. Codex CLI does genuinely\n' +
      "discover and read a project's `AGENTS.md` for workflow instructions, so each Wingman command below\n" +
      "is written as a section you can paste into your own project's `AGENTS.md` (or reference from it)\n" +
      'to get the same workflow under Codex CLI.',
  },
  skills: {
    // Codex CLI reads the same shared/.agents/skills/<name>/SKILL.md file OpenCode reads --
    // confirmed via `codex debug prompt-input`, real install v0.145.0.
    sharedOutDir: 'shared/.agents/skills',
  },

  // --- drift-check config (check-harness-adapter-drift.mjs) ---
  agents: {
    dir: 'codex-cli/.codex/agents',
    ext: '.toml',
    modelFieldPattern: /^model = .*$/m,
  },

  // --- capability profile (§8f) ---
  capabilities: {
    hasHooks: true, // opt-in `codex_hooks` feature flag, v0.114+; PreToolUse can block
    hasPlanGate: false, // no plan-mode primitive at all; long-requested, no maintainer commitment
    hasParallelDispatch: true, // confirmed 2026-07-27: spawn_agent/send_message/wait_agent/close_agent
    hasQuestionTool: false,
  },

  // --- disclosed substitute prose (appended by the generator as "Harness note" blocks) ---
  notes: {
    AskUserQuestion:
      'Codex CLI has no structured multi-choice question UI. Ask the same question as plain conversational text, listing the options in prose, and take the reply as free-form text.',
    ExitPlanMode:
      'Codex CLI has no plan-mode concept at all (it uses `approval_policy` for command-level escalation instead, a genuine capability gap, not a missed port). Use `plugins/wingman/scripts/install-git-hooks.mjs` (already harness-agnostic, fires under any `git push` regardless of which agent drove the session) as the real enforcement point instead of a mid-session plan gate.',
    ParallelDispatch:
      'Codex CLI has real, confirmed parallel multi-agent dispatch (confirmed 2026-07-27, correcting an earlier "unconfirmed at scale" note): `spawn_agent` creates a sub-agent, `send_message`/`followup_task` directs it, `wait_agent` collects its result, `close_agent` tears it down -- genuinely concurrent, not sequential. Dispatch Boardroom seats the same way this file describes; batch per `max_concurrent_threads_per_session` if this project ever needs more concurrent seats than that session cap allows.',
  },
};
