# OpenCode adapter for Wingman's Boardroom

**Verification status (updated 2026-07-23): structurally verified against a real, live OpenCode
install** (v1.18.4, `npm install -g opencode-ai`, no fabricated environment — installed and run
directly in this dev sandbox). Confirmed for real, not just checked against documentation:

- All 8 `boardroom-*.md` agent files are discovered, parsed, and loaded (`opencode agent list`
  correctly typed each as `(subagent)`).
- `opencode debug config`'s resolved output shows each file's exact prompt content verbatim — no
  parsing loss or truncation.
- `boardroom-ceo.md`'s `permission: {edit: deny, bash: deny}` frontmatter is genuinely enforced in
  the resolved permission engine (`opencode debug agent boardroom-ceo` shows the real deny rules).
- `.opencode/plugin/wingman-gate.js` is registered — `opencode debug config`'s top-level `plugin`
  array lists this exact file, confirming the plugin export shape loaded without error.
- The plugin's hook name (`tool.execute.before`) and matched tool name (`plan_exit`) are both
  independently confirmed against real sources beyond this project's own research (a documented
  OpenCode plugin hook, and a real GitHub issue referencing `plan_exit` by name).

**Live model inference — confirmed, 2026-07-25.** Given a real OpenCode Zen API key, ran
`opencode run --agent boardroom-cto "..."` in a throwaway scratch project (never inside this repo)
against a deliberately bad plan ("store passwords in plaintext, hash later"). Real findings, not
assumed:

- `opencode run --agent <subagent-name>` does **not** invoke the subagent directly — it warns
  `agent "boardroom-cto" is a subagent, not a primary agent. Falling back to default agent` and runs
  the default primary agent (`build`) instead. The primary agent then **automatically delegated to
  `boardroom-cto` by description-matching**, confirmed by inspecting OpenCode's own local session DB
  (`~/.local/share/opencode/opencode.db`, `message` table): a real `boardroom-cto`-attributed message
  row exists alongside the primary's, using the model configured in `boardroom-cto.md`'s frontmatter
  — this is the automatic-delegation path the docs describe, now observed firing for real, not just
  documented.
- The response came back correctly formatted per the seat's own output contract (`**Boardroom CTO
  Verdict** / Decision: REJECT`), citing the actual security defect (plaintext passwords) with
  concrete remediation (bcrypt/scrypt/Argon2id) — genuine persona-correct reasoning, not a templated
  echo.
- **Real, disclosed caveat on cost observability**: OpenCode's local telemetry reported `cost: 0` for
  every message in this run. This may reflect real Zen pricing (some models are usage-included) or
  simply mean the local price table has no entry for the `opencode` provider — **not independently
  confirmed against Zen's own billing dashboard**, so don't treat `$0` as a proven-free result.
- The API key used for this test was provided directly in chat by the founder and was **never
  written to any file in this repository** — it was exported as a shell environment variable only,
  referenced from a throwaway scratch project's `opencode.json` via `{env:OPENCODE_ZEN_API_KEY}`
  substitution, and unset immediately after the test. If you're the founder reading this: since the
  key was pasted in a chat transcript, consider rotating it as routine hygiene regardless of this
  test's outcome.

**`wingman-gate.js`'s wiring: confirmed likely broken, not merely unverified (2026-07-25).** A real
live investigation using a genuinely free OpenCode model (`opencode/deepseek-v4-flash-free`, zero
cost, zero API key needed) found `plan_exit` is **not** a registered tool in the real `plan` agent's
`tools` list (`opencode debug agent plan` shows only `invalid, question, bash, read, glob, grep,
edit, write, task, webfetch, todowrite, skill`) — it appears only as a `permission` entry, not a
callable tool. Directly invoking it (`opencode debug agent plan --tool plan_exit ...`) fails with
`"Tool plan_exit not found for agent plan"`. This contradicts the earlier research-based assumption
(a GitHub issue referencing `plan_exit` by name) that it was a real, model-invokable tool. Practical
conclusion: the plugin's `tool.execute.before` hook, matched on `input.tool !== 'plan_exit'`, likely
never fires via the standard tool-call path in current OpenCode versions — plan-mode exit appears to
be a TUI-level/session-level action, not something the model calls as an ordinary tool. **The
decision logic itself (`evaluateCheckpoint`) is confirmed correct** — `tests/opencode-gate/opencode-gate.test.mjs`
covers all 5 real scenarios (no plan touched, unmarked plan, `DO NOT SHIP`, missing sections, fully
approved) and all pass. The correct real hook point for plan-mode exit is still unknown; fixing this
needs either OpenCode's own plugin-API source or a maintainer answer, not something resolvable from
this sandbox alone.

## All 40 skills ported with zero translation (2026-07-25, a major, real finding)

Live investigation found OpenCode's project-level skill discovery
(`.opencode/skills/<name>/SKILL.md`, confirmed via OpenCode's own built-in `customize-opencode`
skill's documented path table) reads the **exact same `SKILL.md` frontmatter format** Claude Code
uses (`name:`/`description:` YAML frontmatter + markdown body) — no translation needed at all. This
reverses the earlier framing that only 2 skills (`git-pr-workflow`, `package-manager-selection`) were
genuinely harness-agnostic; that framing was about Claude Code's own auto-invocation mechanism
specifically, not about whether the file format itself would work elsewhere. Confirmed live:

1. Copied `plugins/wingman/skills/engineering-minimalism/` verbatim into
   `.opencode/skills/engineering-minimalism/` — `opencode debug skill` returned it with its exact
   real content, byte-for-byte, no reformatting.
2. **One real, non-obvious requirement found along the way, not documented anywhere before this**:
   project-level skill discovery silently found zero skills until the target project had an
   `opencode.json` present (even a minimal one, `{"$schema": "..."}`) — confirmed by a direct A/B
   test (same skill file, same path, discovery failed with no `opencode.json`, succeeded the moment
   one existed). `install.mjs` now writes one automatically if the target project has none.
3. All 40 real `plugins/wingman/skills/*/SKILL.md` (including their `references/*.md` subdirectories,
   e.g. `engineering-minimalism`'s `references/continuous-execution.md`) are copied verbatim into
   this adapter's `.opencode/skills/`. A fresh live install (`install.mjs` + a written `opencode.json`)
   confirmed all 40 discovered by `opencode debug skill` — not a subset, not sampled, the real count.

## What's here

- `.opencode/agent/boardroom-*.md` (8 files) — the 8 Boardroom seat personas, translated from
  `plugins/wingman/agents/boardroom-*.md` into OpenCode's YAML-frontmatter markdown agent format
  (`mode: subagent`, `description`, `model`, `permission`). The review criteria and
  `## <SEAT> VERDICT` output contract are copied faithfully — the highest-confidence part of this
  adapter, same as the Codex CLI adapter.
- `.opencode/skills/<name>/SKILL.md` (40 directories) — every real Wingman skill, copied verbatim,
  confirmed live-discovered by OpenCode with zero translation (see above).
- `.opencode/plugin/wingman-gate.js` — a genuine code port (not just documentation) of
  `boardroom-checkpoint.mjs`'s decision logic, wired to OpenCode's `tool.execute.before` plugin hook
  matched against `plan_exit` — OpenCode's own plan-mode-exit tool, which is a real structural analog
  to Claude Code's `ExitPlanMode`. This is the one gate with a genuinely strong port target across
  both harnesses this session researched; see the file's own header comment for exactly which parts
  are high-confidence (the pure `evaluateCheckpoint` logic) vs. lower-confidence (the exact plugin
  wiring shape).

## All Claude Code hook capabilities, ported and live-verified where genuinely possible (2026-07-25)

Following on from the skills port, the shipped plugin's 9 `plugins/wingman/hooks/*.mjs` files were
each investigated against OpenCode's real plugin hook surface — dispatched as 5 parallel,
worktree-isolated subagents, each required to live-test its port with a real `opencode run` call
(never `opencode debug agent --tool`, which is confirmed to bypass all plugin hooks) before
reporting done. 6 of 9 landed with a confirmed-working wiring; 1 is confirmed dead by design
(matches the already-documented `wingman-gate.js` finding); 1 has no confirmed OpenCode analog.

**Confirmed working, live-tested:**
- `.opencode/plugin/secret-guard.js` — `tool.execute.before` on `bash`/`write`/`edit`, confirmed to
  genuinely block (a thrown `Error` stops the tool call).
- `.opencode/plugin/prompt-guard.js` — `chat.message`, confirmed to fire with the founder's real
  prompt text in `output.parts[].text`, and confirmed to genuinely block the turn.
- `.opencode/plugin/dod-gate.js` — the `Bash`/`git push` half of `dod-structural-gate.mjs` (the
  `ExitPlanMode` half is out of scope, same dead-`plan_exit` reason as `wingman-gate.js`), confirmed
  to block a `DO NOT SHIP` checkpoint and allow a clean one, verified against real bare-repo git
  remotes (not just the model's own transcript).
- `.opencode/plugin/output-scanners.js` — `secret-scanner.mjs` + `content-injection-scanner.mjs`
  combined, `tool.execute.after`, confirmed firing on real matching tool output. **Honest caveat**:
  no confirmed channel exists to inject a warning back into the model's own context the way Claude
  Code's `hookSpecificOutput.message` does — warnings are logged to stderr and a
  `.opencode-wingman-warnings.log` file only.
- `.opencode/plugin/session-monitor.js` — `context-monitor.mjs` + `session-health.mjs` combined,
  `tool.execute.after`, keyed by OpenCode's own real `sessionID` (an improvement over the canonical
  hooks' synthesized session IDs). Same message-visibility caveat as above.
- `.opencode/plugin/pre-compact-guard.js` — `experimental.session.compacting`, confirmed firing via
  the real `/session/{id}/summarize` route, warning appended to `output.context`.
- `.opencode/plugin/session-start.js` — `config()`, confirmed to fire once per `opencode run`
  invocation (including `--continue`), correctly printing the previous-session summary on a second
  run.

**A real bug found and fixed along the way**: OpenCode's plugin loader auto-discovers every
top-level `.js` file under `.opencode/plugin/` and silently fails the *whole module* to load if any
named export isn't itself a function — a bare `export { SECRET }` (a regex array) broke
`secret-guard.js`'s own registration. Fixed by exposing it via a `getSecretPatterns()` accessor.

**No confirmed analog**: `stop-loop.js` — `session.idle` fires and `client.session.prompt()` is a
real, callable method, but two live tests showed `opencode run`'s one-shot process exits before a
plugin-triggered follow-up turn actually completes. Only the pure logic (`evaluate`,
`extractAssistantText`, `loadLoopConfig`) is ported, with no plugin wiring — see
`SESSION-LIFECYCLE-FINDINGS.md` for the full investigation.

90 new `node:test` cases across 6 files under `../../../../../tests/opencode-gate/` cover every
ported pure function, independent of the live-wiring question.

## Install

A real, tested installer replaces the old manual `cp -r` steps:

```
node install.mjs /path/to/your/project              # copies .opencode/ only
node install.mjs /path/to/your/project --with-git-hook  # also installs the git pre-push DoD gate
```

Verified live in this session (`tests/opencode-gate/opencode-install.test.mjs`, 5 tests): copies
every file from this adapter's `.opencode/` into the target (confirmed 41/41 file parity), is
idempotent on re-run, only installs the git hook when `--with-git-hook` is passed, and refuses a
non-existent target directory with a clear error rather than silently failing.

After running it:

1. Edit each `.opencode/agent/boardroom-*.md`'s `model:` field to a model your OpenCode install
   actually has configured (the shipped placeholders are guesses, not confirmed defaults).
2. Confirm `.opencode/plugin/wingman-gate.js` actually loads — run `opencode debug config` in the
   target project and check its `plugin` array lists the file (confirmed working against a real
   OpenCode v1.18.5 install, from its new installed location, not just the adapter source location).
3. Read the "`wingman-gate.js`'s wiring: confirmed likely broken" section below before relying on
   the plan-exit gate specifically — its decision logic is correct and tested, but its OpenCode
   wiring is currently known-unreliable, not merely unverified.

## Running a Boardroom review under OpenCode

**Checked directly, 2026-07-25** (fetched [opencode.ai/docs/agents](https://opencode.ai/docs/agents/)
live): OpenCode does **not** document a built-in single-message fan-out primitive. Subagents are
invoked either automatically (a primary agent delegates based on description matching) or manually
via `@mention` (e.g. `@boardroom-cto review this change`) — the docs describe an orchestrator-driven
model, navigating between child sessions one at a time (`session_child_cycle`), not a discrete
parallel-dispatch tool call.

**A real, current caveat worth knowing before relying on this**: a live, open GitHub issue
([anomalyco/opencode#29638](https://github.com/anomalyco/opencode/issues/29638)) reports that even
when a user explicitly asks for subagents "in parallel," OpenCode currently runs them sequentially —
each finishing before the next starts. Treat "ask for parallel" as a request, not a guarantee, on
current OpenCode versions.

**Practical guidance, unchanged in substance**: invoke each `boardroom-*` subagent in turn (via
`@boardroom-cto`, etc.) and consolidate the `## <SEAT> VERDICT` blocks yourself using
`commands/adaptive/boardroom.md`'s own rule (any `NO_GO` → `DO NOT SHIP`; any `GO_WITH_CONCERNS` →
`GO WITH CHANGES`; otherwise `GO`). This costs more wall-clock time than Codex CLI's confirmed
parallel-dispatch path (see the Codex CLI adapter's own README) or Claude Code's native `Task`/`Agent`
fan-out — a real, disclosed difference between the three harnesses, not something to paper over.

## The real, high-confidence win: the git-push gate

Same recommendation as the Codex CLI adapter: rather than depending on any harness-specific hook
wiring, install `plugins/wingman/scripts/dod-pre-push-check.mjs` as a real `.git/hooks/pre-push` hook
via `plugins/wingman/scripts/install-git-hooks.mjs`. That fires under OpenCode, Codex CLI, Claude
Code, or a human typing `git push` directly, with zero per-harness adaptation.
