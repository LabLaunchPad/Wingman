// Wingman secret-guard, ported to an OpenCode plugin -- the same PreToolUse gate the shipped
// Claude Code plugin runs on Bash/Write/Edit/NotebookEdit (plugins/wingman/hooks/secret-guard.mjs).
//
// Verification status (2026-07-25, real live investigation, not assumed): the exact `decide()`
// logic below is a byte-for-byte port of the canonical hook's DESTRUCTIVE/SECRET regex lists and
// decision function. The WIRING -- `tool.execute.before` matched against real tool names -- is
// CONFIRMED WORKING, unlike `wingman-gate.js`'s `plan_exit` match (see that file's own header
// comment for the negative finding). Confirmed via a real live test using a genuinely free
// OpenCode model (`opencode/deepseek-v4-flash-free`, zero cost, zero API key):
//
// 1. `opencode debug agent <name> --tool <id> --params <json>` does NOT fire plugin hooks at all
//    (it's a raw debugging bypass around the whole agent/hook pipeline) -- a real, disclosed
//    finding, not something to rely on for testing plugin wiring.
// 2. A REAL tool call, driven by a live model through `opencode run`, DOES fire `tool.execute.before`
//    with the exact payload shape used below: `input.tool` is the real lowercase tool name
//    (`bash`, `write`, `edit`), and `output.args` carries the tool's real arguments
//    (`command` for bash; `filePath`/`content` for write; `filePath`/`oldString`/`newString` for
//    edit -- OpenCode's own camelCase field names, confirmed live, not Claude Code's snake_case).
// 3. Throwing an `Error` inside `tool.execute.before` genuinely BLOCKS the tool call -- confirmed
//    by a real live test where a deliberately-thrown error stopped `echo BLOCK_ME_test` from
//    running, and the model's own final response correctly reported the block.
//
// This is the one gate in this adapter confirmed to actually fire and actually block, as opposed
// to `wingman-gate.js`'s `plan_exit` match, which is confirmed NOT to fire via the standard
// tool-call path (see that file's header comment).

const DESTRUCTIVE = [
  /rm\s+-rf\s+\//i,
  /git\s+push\s+(--force|-f)\b/i,
  /git\s+clean\s+-[fF]\w*x/i,
  /\bmkfs\b/i,
  /\bdd\s+if=/i,
  /:\s*\(\s*\)\s*\{/i,
];

// Byte-for-byte the same list plugins/wingman/hooks/secret-guard.mjs exports as SECRET -- a floor,
// not a ceiling (no entropy-based detection), see that file's own comment for the full rationale.
const SECRET = [
  /AKIA[0-9A-Z]{16}/,
  /\bghp_[A-Za-z0-9]{36}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
  /\bgh[soru]_[A-Za-z0-9]{20,}\b/,
  /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/,
  /\bsk_live_[A-Za-z0-9]{20,}\b/,
  /\bAIzaSy[A-Za-z0-9_-]{33}\b/,
  /\bsk-[A-Za-z0-9]{20,}\b/,
  /\bsk-ant-[A-Za-z0-9_-]{20,}\b/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\bANTHROPIC_API_KEY\s*=\s*\S+/i,
  /(?:password|passwd|secret|token|api[_-]?key)\s*[:=]\s*['"]?[A-Za-z0-9\/+_]{20,}/i,
];

// SECRET is reachable (not just used locally) so a sibling PostToolUse-shaped plugin file
// (output-scanners.js -- the port of secret-scanner.mjs/content-injection-scanner.mjs) can import
// this exact list rather than keeping its own byte-identical copy that could silently drift, the
// same reasoning plugins/wingman/hooks/secret-guard.mjs already applies for secret-scanner.mjs.
//
// Deliberately exported through a FUNCTION (getSecretPatterns()) rather than a bare
// `export { SECRET }`. Real, live finding (2026-07-25): OpenCode's plugin loader auto-discovers
// every top-level *.js file directly under .opencode/plugin/ and rejects the whole module --
// "Plugin export is not a function" -- if it has ANY named export that isn't itself a function,
// even when `export default` is a perfectly valid async plugin function. Confirmed by a live A/B
// test: a module with `export default asyncFn; export const FOO = [1,2,3];` failed to load, while
// the same shape with FOO replaced by another function loaded fine. A bare `export { SECRET }`
// (an array of regexes) tripped exactly this bug and silently broke this file's own plugin
// registration -- caught only by checking ~/.local/share/opencode/log/opencode.log during this
// port, not by any error surfaced in `opencode run`'s own stdout/stderr.
export function getSecretPatterns() {
  return SECRET;
}

// Pure decision function, exported separately from the plugin wiring below so it can be
// unit-tested without a live OpenCode session -- same discipline as the canonical hook's own
// exported `decide()`.
export function decide(toolName, args = {}) {
  const haystacks = [];
  if (toolName === 'bash') haystacks.push(String(args.command || ''));
  if (toolName === 'write') haystacks.push(String(args.content || ''));
  if (toolName === 'edit') haystacks.push(String(args.newString || ''));

  const combined = haystacks.join('\n');

  for (const re of DESTRUCTIVE) {
    if (re.test(combined)) {
      return {
        allow: false,
        reason:
          `Wingman secret-guard: a destructive command matched (${re}). This can irreversibly ` +
          `delete or corrupt your project. If you really intend it, run it yourself in a terminal.`,
      };
    }
  }
  for (const re of SECRET) {
    if (re.test(combined)) {
      return {
        allow: false,
        reason:
          `Wingman secret-guard: a possible secret was detected in the input. Never let a live ` +
          `key/token be written to a file or passed on the command line. Store it via the repo ` +
          `secret manager (e.g. \`gh secret set\`) instead.`,
      };
    }
  }
  return { allow: true };
}

export const SecretGuardPlugin = async () => {
  return {
    'tool.execute.before': async (input, output) => {
      if (!['bash', 'write', 'edit'].includes(input.tool)) return;
      const result = decide(input.tool, output?.args || {});
      if (!result.allow) {
        throw new Error(result.reason);
      }
    },
  };
};

export default SecretGuardPlugin;
