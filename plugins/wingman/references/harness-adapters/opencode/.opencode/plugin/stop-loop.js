// Wingman Stop-Loop ("ralph-loop"), ported from plugins/wingman/hooks/stop-loop.mjs to a real,
// WIRED OpenCode plugin -- superseding this file's own earlier "no confirmed analog" verdict, with
// an important, precise caveat found in this same pass (see "NOT confirmed" below) -- read that
// before assuming this behaves like a fully self-sustaining autonomous loop.
//
// Verification status (2026-07-25, real live investigation via `opencode serve`, not `opencode
// run`): CONFIRMED WORKING for exactly ONE automatic continuation per externally-driven turn. The
// earlier investigation (see ../SESSION-LIFECYCLE-FINDINGS.md's section 3) tested only `opencode
// run`'s one-shot CLI mode, where the process tears itself down before a plugin-triggered follow-up
// `client.session.prompt()` call can complete a new model turn. This time, a real `opencode serve`
// instance (v1.18.5, long-lived HTTP server, not a one-shot process) was driven directly over its
// HTTP API with a genuinely free model (`opencode/deepseek-v4-flash-free`, zero cost, zero API key):
//
//   1. POST /session created a real session; POST /session/{id}/message with a first prompt
//      returned a completed assistant message -- confirmed via the real HTTP response body.
//   2. This plugin's `event()` handler fired on `session.idle` for that session and, since the
//      configured `completionPromise` wasn't in the reply, called `client.session.prompt(...)` with
//      a real follow-up ("iteration 1/4: ... continue working toward it").
//   3. That call resolved with a genuinely NEW assistant turn -- not the stale/prior-message artifact
//      seen in the `opencode run` investigation. In one live run the model used its own tool access
//      to explore the project (reading `.wingman/loop-counter.<id>.json`, even this very plugin
//      file) across several internal steps before replying with real text that happened to include
//      the promise phrase, at which point `evaluate()` correctly decided to stop.
//   4. `GET /session/{id}/message` confirmed the full real message history in the correct order.
//
// **What is NOT confirmed, found in this same pass**: a live SSE listener on `/event` (`curl -N
// http://.../event`) watching the exact same session showed `session.idle` firing reliably for
// every turn initiated via the external HTTP API (confirmed: two `session.idle` events for one
// externally-POSTed message), but it did NOT fire again after the turn THIS PLUGIN ITSELF triggered
// via `client.session.prompt()` completed -- confirmed by watching the counter file
// (`.wingman/loop-counter.<sessionID>.json`) sit unchanged for 25+ seconds after the self-triggered
// follow-up's reply landed, then advancing the instant a second EXTERNAL message was POSTed to the
// same session. Practical conclusion: this plugin reliably gives an agent ONE automatic "keep going"
// nudge after any turn that came in from outside (a real user, the TUI, another API caller) --
// useful on its own -- but it does NOT self-sustain a multi-iteration autonomous loop purely from
// its own follow-up turns; each further iteration in the current investigation only advanced when an
// external caller sent another message. Whether this is a hard architectural limit or something
// that behaves differently in the interactive TUI (a real, continuously-driving client, unlike this
// investigation's single external POST) was not tested here -- confirming or refuting that in the TUI
// specifically is future work, not something to guess at.
//
// A real, disclosed quirk found along the way, since corrected: earlier testing (a throwaway probe
// plugin, not this file) seemed to show `session.idle` firing multiple times in rapid succession for
// a single completed turn. Root-caused, not just worked around: OpenCode's loader invokes BOTH a
// file's named export and its `default` export as separate plugin registrations when they reference
// the same factory function (the pattern every hook in this adapter uses, `export const X = ...;
// export default X;`) -- each registration gets its own closure, so a naive per-closure counter
// increments twice for one real event. This file's guards (`inFlight`, `lastReactedMessageId`) are
// therefore kept at MODULE scope, not per-closure, so both registrations converge on shared state
// and only one follow-up prompt is ever sent per completed turn regardless of how many times the
// loader instantiates the factory.
//
// A second, more serious real finding from this pass: the pure logic functions (evaluate,
// extractAssistantText, loadLoopConfig, extractLoopSignals) used to live directly in this file as
// top-level named exports. OpenCode's loader auto-discovers every top-level `*.js` file under
// `.opencode/plugin/` and calls EVERY named export as if it were its own plugin factory -- calling
// `loadLoopConfig` that way made it return `null` (a correct, intentional value for its real
// contract), but the loader then crashed the entire server trying to read `.config`/`.event` off
// that `null`, breaking every session-create and message call server-wide. The fix: those pure
// functions now live in `./lib/stop-loop-logic.js`, a nested path OpenCode's plugin discovery does
// NOT scan (confirmed in output-scanners.js's own header comment 1a) -- see that file's header for
// the full writeup and the exact error this reproduced.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import {
  evaluate,
  extractLoopSignals,
  loadLoopConfig,
  DEFAULT_MAX_ITERATIONS,
} from './lib/stop-loop-logic.js';

// Same counter-file shape as the canonical hook's loop-counter.json (count/startedAt/verifyCommand),
// but keyed per-session under `.wingman/loop-counter.<sessionID>.json` since one long-lived
// `opencode serve` process can host multiple concurrent sessions, unlike Claude Code's one-CLI-
// process-per-session model.
function counterPathFor(cwd, sessionID) {
  return join(cwd, '.wingman', `loop-counter.${sessionID}.json`);
}

function loadCounter(path) {
  if (!existsSync(path)) return { count: 0, startedAt: Date.now(), verifyCommand: undefined };
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return { count: 0, startedAt: Date.now(), verifyCommand: undefined };
  }
}

function saveCounter(path, state) {
  try {
    mkdirSync(join(path, '..'), { recursive: true });
    writeFileSync(path, JSON.stringify(state));
  } catch {
    // best-effort, same as the canonical hook
  }
}

// Module-level, not per-factory-call -- see header comment for why (both this file's named and
// default exports reference the same factory; the loader instantiates both separately).
const inFlight = new Set();
const lastReactedMessageId = new Map();

export const StopLoopPlugin = async ({ client, directory }) => {
  const cwd = directory || process.cwd();
  const loopPath = join(cwd, '.wingman', 'loop.json');

  return {
    event: async ({ event }) => {
      if (event.type !== 'session.idle') return;
      const sessionID = event.properties?.sessionID;
      if (!sessionID) return;
      if (inFlight.has(sessionID)) return;

      const config = loadLoopConfig(loopPath);
      if (!config || config.enabled !== true) return; // disabled: zero overhead, don't even fetch messages

      const promise = config.completionPromise || '';
      if (!promise) return;

      const stallThreshold =
        config.stallThreshold === 0 ? 0 : config.stallThreshold || 3;

      let messageList;
      try {
        const res = await client.session.messages({ path: { id: sessionID } });
        messageList = res?.data ?? res;
      } catch {
        return; // can't read history — do nothing rather than guess
      }

      const { lastAssistantId, lastAssistantText, recentToolSignatures } = extractLoopSignals(
        messageList,
        stallThreshold
      );

      if (!lastAssistantId || lastReactedMessageId.get(sessionID) === lastAssistantId) {
        return; // no new completed turn since we last reacted — ignore duplicate idle firing
      }
      lastReactedMessageId.set(sessionID, lastAssistantId);

      const counterPath = counterPathFor(cwd, sessionID);
      const counter = loadCounter(counterPath);
      // Cache verifyCommand once per loop run, same CISO-reviewed rationale as the canonical hook:
      // a mid-loop rewrite of loop.json's verifyCommand has no effect until the next fresh loop.
      const cachedVerifyCommand =
        counter.verifyCommand !== undefined
          ? counter.verifyCommand
          : (typeof config.verifyCommand === 'string' && config.verifyCommand) || null;

      let verifyPassed;
      if (cachedVerifyCommand && lastAssistantText.includes(promise)) {
        try {
          execSync(cachedVerifyCommand, { cwd, stdio: 'pipe', timeout: 120000 });
          verifyPassed = true;
        } catch {
          verifyPassed = false;
        }
      }

      const elapsedMinutes = (Date.now() - (counter.startedAt || Date.now())) / 60000;
      const { decision, reason } = evaluate(config, lastAssistantText, counter.count || 0, {
        elapsedMinutes,
        recentToolSignatures,
        verifyPassed,
      });

      if (decision !== 'continue') {
        saveCounter(counterPath, { count: 0, startedAt: Date.now(), verifyCommand: undefined });
        if ((counter.count || 0) > 0) {
          console.error(`Wingman stop-loop: stopping — ${reason || 'completion promise met'}.`);
        }
        return;
      }

      const newCount = (counter.count || 0) + 1;
      saveCounter(counterPath, {
        count: newCount,
        startedAt: counter.startedAt || Date.now(),
        verifyCommand: cachedVerifyCommand,
      });
      const max = config.maxIterations || DEFAULT_MAX_ITERATIONS;
      console.error(
        `Wingman stop-loop: completion promise not yet met — continuing (iteration ${newCount}/${max}).`
      );

      inFlight.add(sessionID);
      try {
        await client.session.prompt({
          path: { id: sessionID },
          body: {
            parts: [
              {
                type: 'text',
                text:
                  `Wingman stop-loop (iteration ${newCount}/${max}): the completion promise ` +
                  `("${promise}") has not been met yet. Continue working toward it.`,
              },
            ],
          },
        });
      } catch (e) {
        console.error(`Wingman stop-loop: follow-up prompt() failed: ${e?.message || e}`);
      } finally {
        inFlight.delete(sessionID);
      }
    },
  };
};

export default StopLoopPlugin;
