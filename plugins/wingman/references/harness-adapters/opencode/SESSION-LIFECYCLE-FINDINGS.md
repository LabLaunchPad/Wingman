# OpenCode session-lifecycle hooks — live investigation findings (2026-07-25)

This documents a real, live investigation into porting Wingman's 3 remaining Claude Code
lifecycle hooks (`pre-compact-guard.mjs`, `session-start.mjs`, `stop-loop.mjs`) to OpenCode plugin
equivalents. All testing used `opencode/deepseek-v4-flash-free` (zero cost, zero API key) via real
`opencode run` invocations and a real `opencode serve` instance (v1.18.5) — nothing here is
inferred from documentation alone. `opencode debug agent --tool` was deliberately NOT used for this
testing, since it bypasses the whole plugin/hook pipeline (confirmed separately, same as the
`plan_exit` investigation in `wingman-gate.js`'s own header comment).

## Summary

| Canonical hook | OpenCode analog | Verdict | Where |
|---|---|---|---|
| `pre-compact-guard.mjs` | `experimental.session.compacting` | **CONFIRMED WORKING** | `.opencode/plugin/pre-compact-guard.js` |
| `session-start.mjs` | `config()` | **CONFIRMED WORKING** (with a disclosed one-shot-CLI caveat) | `.opencode/plugin/session-start.js` |
| `stop-loop.mjs` | `event()` on `session.idle` + `client.session.prompt()` | **UNCLEAR / NOT CONFIRMED** | `.opencode/plugin/stop-loop.js` (pure logic only, unwired) |

## 1. `pre-compact-guard.mjs` → `experimental.session.compacting` — CONFIRMED WORKING

A probe plugin registered `experimental.session.compacting` alongside `config`, `event`, and
`experimental.compaction.autocontinue`. Both experimental hook names were confirmed to exist as
real strings in the installed `opencode-linux-x64` binary before testing (not just assumed from a
hook-name list): `experimental.session.compacting` and `experimental.compaction.autocontinue`.

Real compaction was triggered live — not simulated — by finding the server's actual HTTP route.
`opencode debug config`/binary strings surfaced `/session/{id}/compact` as a route name, but a live
`curl -X POST .../compact` returned the SPA's catch-all HTML (200, but the wrong page) — a real,
disclosed dead end. The genuinely working route, found by testing `/session/{id}/summarize`
instead (the same route the TUI's `/compact` command calls under the hood), returned `true` and
produced a real `session.compacted` bus event moments later.

That real compaction caused `experimental.session.compacting` to fire exactly once, with
`input = { sessionID }` and `output = { context: [] }` (an empty, mutable array; a `prompt` key was
also observed present-but-unused on a separate run). A live A/B test confirmed pushing a plain
warning string onto `output.context` neither throws nor breaks the compaction call (the
`/summarize` request still returned `true` with the mutation in place).

`pre-compact-guard.js` wires `countRelevantChanges()` (byte-for-byte port) to this hook, pushing a
warn-only note onto `output.context` when real uncommitted git changes exist outside `.wingman/`.
Live-tested end-to-end against a real git repo with an uncommitted change — the hook correctly
detected the changes and produced the expected note (verified by invoking the exported plugin
function directly against the real fixture directory, not just unit-tested in isolation).

## 2. `session-start.mjs` → `config()` — CONFIRMED WORKING (with a disclosed caveat)

Two real, live-tested facts drove this choice over the alternative candidate (`event()` on
`session.created`):

- `config()` fires on **every** `opencode run` invocation, confirmed for both a brand-new session
  and one resumed with `--continue`.
- `session.created` (the bus event a naive port might reach for) only fires for the brand-new
  case — it does NOT fire on `--continue`. `config()` is the more universal of the two signals.

Also confirmed live: `console.log`/`console.error` calls made from inside `config()` are genuinely
printed to the real terminal, appearing before the CLI's own `> build · <model>` banner — a real,
visible analog to Claude Code's SessionStart hook printing a previous-session summary.

`session-start.js` wires the canonical hook's `.wingman/state.json` init + rolling
`.wingman/session-state.json` log (last 20 sessions) to `config()`. Live-tested with two
consecutive `opencode run` invocations in the same fixture directory: the first printed
`Wingman: Initialized .wingman/state.json` + `Wingman session #1 started.`; the second correctly
printed `Wingman session #2 started. Previous session (...) had 0 tool call(s), ended unknown.` —
the exact previous-session-summary behavior the canonical hook implements, observed live, not
assumed.

**Disclosed caveat**: `opencode run` is one-shot — each invocation is its own process. There is no
distinct "resume this long-lived session" lifecycle event to test the way Claude Code's
`SessionStart` fires on both `startup` and `resume` within one long-lived session. What's confirmed
is that `config()` fires reliably once per process bootstrap, which is the closest real equivalent
available in this CLI mode — not a claim that OpenCode's interactive TUI behaves identically
(untested here; driving the interactive TUI is outside what this sandbox can automate).

## 3. `stop-loop.mjs` → no confirmed analog — UNCLEAR

This is the weakest of the three, and is reported as such rather than built as a working
integration.

**What's real:**
- OpenCode's `event()` hook fires a `session.idle` bus event when a model turn finishes — a real
  structural analog to Claude Code's `Stop` (a turn ended; something outside the model gets to
  decide whether to let it end there).
- The plugin factory's context exposes a real `client` (an SDK client for the same OpenCode
  server), and `client.session.prompt({ path: { id }, body: {...} })` is a real, callable method.
  Calling it from inside an `event()` handler on `session.idle` did not throw, and DID persist a
  genuine new `role: "user"` message into the session's real message history (verified via
  `GET /session/{id}/message` after the call).

**What's NOT confirmed:**
- In `opencode run`'s one-shot CLI mode, the process tears itself down as soon as the ORIGINAL
  prompt's turn finishes. It does not wait for a plugin-triggered follow-up `prompt()` call to
  actually complete a new model turn. Two live tests confirmed this: the injected user message was
  persisted, but no assistant reply to it ever appeared — even after adding an explicit 15-second
  `await` inside the hook specifically to give the follow-up turn time to finish before the hook
  (and process) returned. The "result" object the `prompt()` call resolved with looked
  superficially like a completed turn but on inspection was actually the PRIOR (already-completed)
  assistant message, not a new one — so that resolved value is not reliable evidence of anything.

**Practical conclusion**: the pieces exist (a Stop-like event, a callable "send another prompt"
API), but this sandbox could not confirm they compose into an actual working loop within
`opencode run`'s one-shot process lifecycle. It's plausible this works differently in OpenCode's
long-lived TUI or `serve` mode (where the server process outlives any single CLI invocation), but
that was not tested here. Confirming or refuting that is future work, not something to guess at —
per this task's own instruction, no speculative wiring was built for this one. `stop-loop.js`
in this adapter contains only the ported, tested pure logic (`evaluate()`, `extractAssistantText()`,
`loadLoopConfig()`) with no plugin export.
