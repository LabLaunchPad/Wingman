// Wingman prompt-guard, ported to an OpenCode plugin -- the same UserPromptSubmit-equivalent gate
// the shipped Claude Code plugin runs on the founder's own incoming prompt text
// (plugins/wingman/hooks/prompt-guard.mjs).
//
// Verification status (2026-07-25, real live investigation, not assumed): the exact `INJECTION`
// regex list and `evaluate()` decision function below are a byte-for-byte port of the canonical
// hook's own exports. The WIRING -- OpenCode's `chat.message` plugin hook -- is CONFIRMED WORKING,
// the same tier of confidence as `secret-guard.js`'s `tool.execute.before` finding (see that file's
// own header for the sibling result). Confirmed via a real live test using a genuinely free
// OpenCode model (`opencode/deepseek-v4-flash-free`, zero cost, zero API key):
//
// 1. `chat.message` is a documented hook in the installed `@opencode-ai/plugin` type definitions
//    (`node_modules/@opencode-ai/plugin/dist/index.d.ts`), described as "Called when a new message
//    is received." Its real signature is `(input: { sessionID, agent?, model?, messageID?,
//    variant? }, output: { message: UserMessage, parts: Part[] }) => Promise<void>` -- notably
//    `output.parts` is where the founder's actual prompt text lives (`parts[].text`), not
//    `input`, and there is no `input.prompt` field the way Claude Code's `UserPromptSubmit` payload
//    has one.
// 2. A REAL debug-probe plugin (same pattern as `secret-guard.js`'s own confirmation, logging to a
//    scratch file) confirmed `chat.message` genuinely FIRES on every real user turn driven through
//    `opencode run -m opencode/deepseek-v4-flash-free "<prompt>"` -- not just registered, observed
//    firing with the real payload shape above (`output.parts[0].text` held the exact prompt string
//    passed on the command line, e.g. `"say hello in one word"`).
// 3. Throwing an `Error` inside `chat.message` genuinely BLOCKS the turn before any assistant
//    response is produced -- confirmed by a real live A/B test: an unmodified prompt ("say hello in
//    one word") completed normally and printed the model's real text response ("hello"); the same
//    plugin with a throw guarded on a marker string, given a prompt containing that marker, instead
//    produced only `opencode run`'s own thrown-error output (`UnknownError` / "Unexpected server
//    error") and no assistant text at all, run twice for reproducibility. This is the same
//    throw-to-block mechanism `secret-guard.js` and `wingman-gate.js` both rely on for
//    `tool.execute.before`, now independently confirmed for `chat.message` too.
//
// Honest caveat, not smoothed over: OpenCode fires a separate small-model call to generate the
// session's title (`stream ... small=true agent=title`) as routine housekeeping on a new session --
// that call is unrelated to `chat.message` and is not gated by this plugin. This port blocks the
// founder-facing turn (the `small=false agent=build` completion), the same scope Claude Code's
// `UserPromptSubmit` hook covers; it does not (and structurally cannot, since it fires from a
// different code path) prevent that small title-generation call. Exact precedence of `chat.message`
// relative to that title call was not independently re-verified byte-for-byte against server logs in
// this pass (the global OpenCode log did not reliably capture every ephemeral `opencode run`
// invocation in this sandbox) -- what IS directly confirmed, by comparing real stdout across two
// live runs, is that the founder-facing model response never appears once the throw fires.
//
// This is the second gate in this adapter (after secret-guard.js's tool.execute.before) confirmed
// to actually fire and actually block, as opposed to wingman-gate.js's plan_exit match, which is
// confirmed NOT to fire via the standard tool-call path (see that file's header comment).

const INJECTION = [
  /ignore\s+(all|previous|your|the)\s+(instructions|prompt|system)/i,
  /(disregard|forget)\s+(all\s+|previous\s+|your\s+|the\s+){1,2}(instructions|prompt|rules)/i,   // common paraphrase of "ignore previous instructions"
  /you\s+are\s+now\s+[a-z][a-z\s]{0,20}/i,               // role hijack
  /(act\s+as\s+if|pretend\s+(that\s+)?you\s+are|from\s+now\s+on\s+you\s+are)\s+[a-z][a-z\s]{0,20}/i, // role-hijack paraphrases
  /(reveal|print|show|dump).{0,20}(your\s+)?(system\s+prompt|hidden\s+instructions|internal\s+prompt)/i,
  /(override|bypass|disable)\s+(your\s+)?(safety|guardrails?|guidelines?|restrictions?)/i,           // guardrail-override phrasing
  /(send|email|post|exfiltrate|forward).{0,30}(to\s+https?:\/\/|to\s+[\w.]+@)/i,
];

export { INJECTION };

// Pure decision function, byte-for-byte the same shape as the canonical hook's own `evaluate()` --
// exported separately from the plugin wiring below so it can be unit-tested without a live OpenCode
// session (tests/opencode-gate/opencode-prompt-guard.test.mjs).
// Returns { decision: 'allow' | 'deny', risk, reason }.
export function evaluate(prompt = '') {
  const text = String(prompt);
  for (const re of INJECTION) {
    if (re.test(text)) {
      return {
        decision: 'deny',
        risk: 'high',
        reason:
          `Wingman prompt-guard: this prompt looks like a prompt-injection ` +
          `attempt (matched ${re}). Attackers hide these in pasted docs or web ` +
          `pages to hijack the agent. Rephrase as a normal instruction, or ask ` +
          `the founder (not the pasted text) what to do.`,
      };
    }
  }
  return { decision: 'allow', risk: 'low', reason: '' };
}

// OpenCode plugin export. The founder's actual prompt text lives in `output.parts` (an array of
// message parts), not `input` -- confirmed live, see header comment. Only text parts are scanned;
// non-text parts (file attachments, etc.) are ignored, matching the canonical hook's own scope
// (it only ever sees `prompt`, a string).
export const PromptGuardPlugin = async () => {
  return {
    'chat.message': async (input, output) => {
      const text = (output?.parts || [])
        .filter((p) => p && p.type === 'text' && typeof p.text === 'string')
        .map((p) => p.text)
        .join('\n');
      const result = evaluate(text);
      if (result.decision === 'deny') {
        throw new Error(result.reason);
      }
    },
  };
};

export default PromptGuardPlugin;
