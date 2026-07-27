// Wingman Warning Relay -- closes the "warnings never reach the model's own context" gap disclosed
// in output-scanners.js's and session-monitor.js's own header comments (both confirmed there that
// their `console.error`/log-file warnings are invisible to the model itself).
//
// Verification status (2026-07-25, real live investigation via `opencode run
// -m opencode/deepseek-v4-flash-free`, zero cost, zero API key): CONFIRMED WORKING.
//
// `experimental.chat.system.transform` was investigated as the candidate fix. A probe plugin
// registered the hook and unconditionally pushed a marker string onto `output.system` (a real,
// mutable `string[]` the framework builds the actual system prompt from). Confirmed live:
//
//   1. The hook fires on EVERY real model call, `input = { sessionID, model }` -- including twice
//      per `opencode run` invocation (once for OpenCode's own internal small-model title-generation
//      call, once for the real "build" agent call) -- the same title-call caveat already documented
//      in prompt-guard.js's header for `chat.message`.
//   2. Pushing a string onto `output.system` (which arrived as a real array of length 1, the
//      framework's own base system prompt entry, and became length 2 after the push) does not throw
//      and does not break the call.
//   3. Most importantly -- asking the model directly, in the SAME turn, "do you see a system note
//      containing the exact string WINGMAN_PENDING_WARNING_MARKER_77? Quote it verbatim if yes" --
//      it replied: "Yes, I see it verbatim at the end of my system prompt:
//      `WINGMAN_PENDING_WARNING_MARKER_77: ...`" -- a real, direct confirmation that this channel
//      reaches the model's own reasoning, not just a side channel a human operator might notice. This
//      is the first confirmed channel in this adapter that actually closes the gap output-scanners.js
//      and session-monitor.js both disclosed, rather than falling back to a log file.
//
// Design: rather than have output-scanners.js and session-monitor.js each register their own
// `experimental.chat.system.transform` hook (OpenCode's loader would then invoke this hook multiple
// times per turn, once per registered plugin -- harmless but wasteful, and it would scatter "what
// gets shown to the model" logic across three files), those two files now ALSO push onto a shared
// `.wingman/pending-warnings.json` queue (see `./lib/pending-warnings.js`) in addition to their
// existing console.error/log-file behavior (kept as-is -- a human operator watching the terminal, or
// tooling that reads the log file, still gets the same signal as before; this is additive, not a
// replacement). This one file drains that queue once per turn and surfaces it to the model. Draining
// (not just reading) means each warning surfaces exactly once -- on the next real turn after it was
// recorded -- rather than repeating on every subsequent turn for the rest of the session.
//
// A real, costly finding from testing THIS specific queue-based design (found after the marker-probe
// above already looked confirmed): the two `experimental.chat.system.transform` firings per turn are
// NOT interchangeable. Debug logging every call's `output.system` content showed the title-generation
// call fires FIRST, with its own throwaway system prompt ("You are a title generator. You output ONLY
// a thread title...") -- and it fires BEFORE the real "build" agent's own system.transform call for
// the same turn. A naive drain-on-first-call implementation (this file's first version) drained the
// queue into the TITLE GENERATOR's system prompt -- invisible to the founder and irrelevant to the
// actual conversation -- leaving nothing for the real agent call moments later. Confirmed via a live
// A/B: asking the model directly "do you see a note mentioning <marker>?" reliably answered
// NO_WARNING_SEEN even though the queue file showed the warning had been drained (i.e. SOME call
// consumed it, just not the one that mattered). The fix: skip the drain entirely when
// `output.system` looks like the title-generator's own prompt (a stable content check, not a
// documented field -- neither `input` nor `output` expose an explicit "is this the title call" flag
// in the current `@opencode-ai/plugin` type definitions) -- confirmed live afterward: the same
// marker question now correctly quotes the injected note back.

import { drainWarnings } from './lib/pending-warnings.js';

// Heuristic, not a documented API: OpenCode's internal title-generation call uses a system prompt
// that (confirmed live, 2026-07-25) always starts with this literal phrase. There is no `agent` or
// `small` field on `experimental.chat.system.transform`'s `input` to check instead -- see this file's
// header for the exact type signature this was checked against.
export function isTitleGenerationCall(system) {
  return Array.isArray(system) && system.some((s) => typeof s === 'string' && s.includes('title generator'));
}

export const WarningRelayPlugin = async ({ directory }) => {
  const cwd = directory || process.cwd();

  return {
    'experimental.chat.system.transform': async (_input, output) => {
      if (!Array.isArray(output?.system)) return;
      if (isTitleGenerationCall(output.system)) return; // don't let the throwaway title call steal the queue

      const warnings = drainWarnings(cwd);
      if (warnings.length === 0) return;

      output.system.push(
        `Wingman: ${warnings.length} pending warning(s) from earlier tool activity this session, ` +
          `not yet surfaced to you:\n` +
          warnings.map((w, i) => `${i + 1}. ${w}`).join('\n')
      );
    },
  };
};

export default WarningRelayPlugin;
