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

## 3. `stop-loop.mjs` → `session.idle` + `client.session.prompt()` under `opencode serve` — UPDATE 2026-07-25: PARTIALLY CONFIRMED (superseding the "UNCLEAR" verdict below)

The original investigation (kept below for the record) tested only `opencode run`'s one-shot CLI
mode and could not confirm a working loop there. A follow-up pass tested `opencode serve` (v1.18.5,
a real long-lived HTTP server process, started via `opencode serve --port <N>` and driven directly
over its HTTP API with `curl`, plus a live SSE listener on `/event`) instead, and found a more
precise, two-part answer:

**CONFIRMED WORKING** — exactly one automatic continuation per externally-driven turn:
1. `POST /session` created a real session; `POST /session/{id}/message` with a first prompt
   returned a completed assistant reply.
2. This adapter's (now wired) `stop-loop.js` reacted to the `session.idle` event, found the
   configured `completionPromise` missing from the reply, and called
   `client.session.prompt({ path: { id }, body: {...} })` with a real follow-up instruction.
3. That call produced a genuinely NEW, complete assistant turn — confirmed via `GET /session/{id}/
   message` showing 4 real messages in order (user/assistant/user/assistant), the second assistant
   reply's own text distinct from and responsive to the follow-up, not a stale artifact.
4. Wired end-to-end (not just a probe): a session instructed to never say the completion phrase
   drove one real automatic continuation, and the loop-counter file
   (`.wingman/loop-counter.<sessionID>.json`) correctly advanced from 0 to 1.

**NOT CONFIRMED** — a self-sustaining MULTI-iteration loop from the plugin's own follow-ups alone:
a live SSE listener on `/event` (`curl -N http://127.0.0.1:<port>/event`) watched the exact same
session throughout. `session.idle` fired reliably for every turn initiated via the external HTTP
API (2 events observed for 1 externally-POSTed message) but did **not** fire again after the turn
THIS PLUGIN ITSELF triggered via `client.session.prompt()` completed — confirmed by the loop-counter
file sitting unchanged for 25+ seconds after the self-triggered follow-up's reply landed, then
advancing the instant a second EXTERNAL message was POSTed to the same session. Practical
conclusion: this plugin reliably gives an agent one automatic "keep going" nudge after any
externally-driven turn — a real, useful capability on its own — but does not chain further
iterations purely from its own follow-up turns in this sandbox's testing. Whether OpenCode's
interactive TUI (a continuously-driving real client, unlike this investigation's single external
POST) behaves differently was not tested here.

See `.opencode/plugin/stop-loop.js`'s own header comment for the exact commands and the
`.opencode/plugin/lib/stop-loop-logic.js` split this pass also introduced (see finding 3a below).

### 3a. New finding this pass: the plugin loader's "every named export is a factory" rule has a sharper failure mode than previously documented

The existing finding (see `.opencode/plugin/output-scanners.js`'s header, item 1a) already
documented that OpenCode's plugin loader auto-discovers every top-level `*.js` file under
`.opencode/plugin/` and invokes every named export as if it were its own plugin factory, and that a
non-function export crashes the whole file's registration. This pass found a SHARPER version:
**a function export that returns `null` when called with a bogus single argument is just as fatal
as a non-function export**, even though the "every export must be a function" rule is satisfied.

Concretely: `stop-loop.js` used to export `loadLoopConfig` directly. Calling it (as the loader does,
with a plugin-context object, not a real file path) made it return `null` — a correct, intentional
value for its real contract ("missing or corrupt loop.json"). But the loader then tried to read
`.config`/`.event` off that `null` later, crashing with `"plugin config hook failed" ... "null is
not an object (evaluating 'N.config')"` — confirmed via `opencode serve`: every `POST /session` and
`POST /session/{id}/message` call failed with a bare `UnknownError` the instant this file was
present unmodified. Wrapping the function body in try/catch (to stop it from *throwing*) did NOT
fix this, since a clean `null` return is exactly as fatal to the loader as a thrown error.

The fix: the pure logic functions (`evaluate`, `extractAssistantText`, `loadLoopConfig`, and the new
`extractLoopSignals`) now live in `.opencode/plugin/lib/stop-loop-logic.js` — a nested path
OpenCode's plugin discovery does not scan (confirmed in `output-scanners.js`'s own header, same
item 1a). `stop-loop.js` itself now only exports the plugin factory (`StopLoopPlugin`/`default`),
both of which are confirmed to always return a proper `{ event: fn }` hooks object, never `null`,
regardless of how they're called.

A second, related finding from the same pass: OpenCode's loader invokes BOTH a file's named export
and its `default` export as separate registrations when they reference the same factory function
(the pattern every hook in this adapter uses). Each registration gets its own closure — this is the
real, root-caused explanation for what earlier testing (a throwaway probe plugin) reported as
"`session.idle` firing multiple times for one completed turn": it was two independent closures each
reacting once to the same real event, not OpenCode double-firing the bus event. `stop-loop.js`'s
de-dupe guards (`inFlight`, `lastReactedMessageId`) are therefore kept at MODULE scope, shared by
every registered instance, not per-closure.

### Original investigation (2026-07-25, `opencode run` one-shot mode) — kept for the record

This was the weakest of the three findings in the original pass, and was reported as such rather
than built as a working integration at the time.

**What's real:**
- OpenCode's `event()` hook fires a `session.idle` bus event when a model turn finishes — a real
  structural analog to Claude Code's `Stop` (a turn ended; something outside the model gets to
  decide whether to let it end there).
- The plugin factory's context exposes a real `client` (an SDK client for the same OpenCode
  server), and `client.session.prompt({ path: { id }, body: {...} })` is a real, callable method.
  Calling it from inside an `event()` handler on `session.idle` did not throw, and DID persist a
  genuine new `role: "user"` message into the session's real message history (verified via
  `GET /session/{id}/message` after the call).

**What's NOT confirmed (in `opencode run` specifically):**
- In `opencode run`'s one-shot CLI mode, the process tears itself down as soon as the ORIGINAL
  prompt's turn finishes. It does not wait for a plugin-triggered follow-up `prompt()` call to
  actually complete a new model turn. Two live tests confirmed this: the injected user message was
  persisted, but no assistant reply to it ever appeared — even after adding an explicit 15-second
  `await` inside the hook specifically to give the follow-up turn time to finish before the hook
  (and process) returned. The "result" object the `prompt()` call resolved with looked
  superficially like a completed turn but on inspection was actually the PRIOR (already-completed)
  assistant message, not a new one — so that resolved value is not reliable evidence of anything.

**Practical conclusion at the time**: the pieces exist (a Stop-like event, a callable "send another
prompt" API), but that sandbox could not confirm they compose into an actual working loop within
`opencode run`'s one-shot process lifecycle — since superseded by the `opencode serve` finding
above, which confirms single-hop continuation works outside `opencode run` specifically.

## 4. `permission.ask` as an `AskUserQuestion`-style risk-acceptance gate — CONFIRMED NOT REACHABLE in `opencode run`'s non-interactive mode

Investigated as candidate gap-3 material: could `permission.ask` implement something structurally
similar to Claude Code's `AskUserQuestion`-driven Boardroom risk-acceptance flow, or at minimum
auto-deny a configurable list of dangerous tool/arg combinations beyond what `secret-guard.js`
already covers?

A probe plugin registered `permission.ask` and logged every firing to a file. Three real scenarios
were tested against it, each via `opencode run -m opencode/deepseek-v4-flash-free`:

1. A destructive `rm -rf` command that `secret-guard.js`'s own `tool.execute.before` hook already
   blocks — removed `secret-guard.js` and `output-scanners.js` (which imports from it) from the test
   project first, to isolate the variable.
2. The same `rm -rf` command targeting a path outside the project directory, with no other hooks
   present. The CLI itself printed `permission requested: external_directory (/tmp/*);
   auto-rejecting` and the tool call failed with `"The user rejected permission to use this specific
   tool call."` — a real permission decision genuinely happened.
3. A completely benign `echo` command run inside the project directory (the normal, allowed case).

**In all three cases, `permission.ask` never fired** — the probe's log file was never created. This
matches the same category of finding already documented for `plan_exit` in `wingman-gate.js`'s own
header and for the `stop-loop.js` self-triggered-turn gap above: OpenCode's own internal permission
engine has an auto-allow/auto-reject fast path for `opencode run`'s non-interactive mode that
appears to bypass the plugin hook layer entirely, rather than consulting it and then applying a
default. This is a genuine, disclosed negative finding, not a configuration mistake — no plugin
wiring was built for this hook, since there is nothing to wire it to in the one mode this sandbox
can drive. Whether `permission.ask` fires differently in OpenCode's interactive TUI (where a human,
not an auto-reject default, is the normal recipient of a permission prompt) was not tested here and
is a reasonable candidate for future investigation, not something to guess at.

## 5. `tool.definition` vs. a real custom-tool registration — investigated, see `boardroom-verdict-tool.js`

`tool.definition` (documented to modify an *existing* tool's description/parameters, not register a
new one) turned out to be the wrong primitive for exposing `.wingman/checkpoints.jsonl` data
directly to the model. The real mechanism — a plugin's returned hooks object having a `tool` key,
`{ tool: { <name>: ToolDefinition } }`, built via `@opencode-ai/plugin`'s own `tool()` helper — is a
genuinely new, CONFIRMED WORKING capability. See `.opencode/plugin/boardroom-verdict-tool.js`'s own
header comment and the adapter README's dated section for the full write-up and exact transcript.
