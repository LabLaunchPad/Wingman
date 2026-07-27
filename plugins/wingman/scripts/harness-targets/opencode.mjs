// Harness target descriptor: OpenCode.
//
// Extracted from the previously-hardcoded HARNESS_NOTES/HARNESS_LABELS tables and inline
// buildTargets() branch in generate-harness-adapters.mjs, plus the hardcoded opencodeDir/
// opencodeSkillsDir constants in check-harness-adapter-drift.mjs. See docs/ARCHITECTURE.md §8f.

export default {
  id: 'opencode',
  label: 'OpenCode',

  // --- generator config (generate-harness-adapters.mjs) ---
  commands: {
    // OpenCode reads .opencode/commands/<name>.md natively (confirmed via `opencode debug config`,
    // byte-identical template content) -- one file per command.
    mode: 'perFile',
    outDir: 'opencode/.opencode/commands',
  },
  skills: {
    sharedOutDir: 'shared/.agents/skills',
  },

  // --- drift-check config (check-harness-adapter-drift.mjs) ---
  agents: {
    dir: 'opencode/.opencode/agent',
    ext: '.md',
    modelFieldName: 'model',
  },
  // OpenCode also carries its own separately-ported, byte-verbatim skills copy (distinct from the
  // shared/.agents/skills/ the generator emits) -- pre-existing, not touched by this refactor.
  portedSkillsDir: 'opencode/.opencode/skills',

  // --- capability profile (§8f) ---
  capabilities: {
    hasHooks: true, // .opencode/plugin/*.js, several confirmed working live
    hasPlanGate: 'weak', // OPENCODE_EXPERIMENTAL_PLAN_MODE flag, undocumented strength, likely just defaults permissions to "ask"
    hasParallelDispatch: false, // confirmed still sequential (anomalyco/opencode#29638, tasks.pop() in src/session/prompt.ts)
    hasQuestionTool: false, // permission.ask confirmed hangs in non-interactive mode
  },

  notes: {
    AskUserQuestion:
      'OpenCode has no structured multi-choice question UI reachable in non-interactive mode (`permission.ask` confirmed to hang indefinitely in `opencode run`/`opencode serve`). Ask the same question as plain conversational text, listing the options in prose, and take the reply as free-form text.',
    ExitPlanMode:
      "OpenCode's real analog is the `plan_exit` tool (confirmed: opencode.ai/docs) plus an experimental, undocumented `OPENCODE_EXPERIMENTAL_PLAN_MODE` flag of unclear strength. The gating logic this canonical file assumes (`boardroom-checkpoint.mjs`'s ExitPlanMode hook) is ported as a real OpenCode plugin at `references/harness-adapters/opencode/.opencode/plugin/wingman-gate.js` -- wire that plugin in rather than re-deriving the gate.",
    ParallelDispatch:
      'OpenCode confirmed **still sequential**, not genuinely concurrent (open bug anomalyco/opencode#29638, root-caused to `tasks.pop()` + blocking `handleSubtask` in `src/session/prompt.ts`; an experimental `background` param exists but is hidden from the model). Dispatch Boardroom seats one at a time and consolidate the same way this file describes -- disclose this plainly in the founder-facing summary rather than silently pretending parallel review happened.',
  },
};
