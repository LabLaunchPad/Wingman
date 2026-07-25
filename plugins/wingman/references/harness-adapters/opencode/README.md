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

**What's still unverified**: the `.opencode/plugin/wingman-gate.js` throw-on-reject gate's behavior
under a real live `plan_exit` invocation specifically — this test exercised a Boardroom seat
persona's live inference, not the plan-mode gate itself, which still has no configured trigger path
tested end to end.

## What's here

- `.opencode/agent/boardroom-*.md` (8 files) — the 8 Boardroom seat personas, translated from
  `plugins/wingman/agents/boardroom-*.md` into OpenCode's YAML-frontmatter markdown agent format
  (`mode: subagent`, `description`, `model`, `permission`). The review criteria and
  `## <SEAT> VERDICT` output contract are copied faithfully — the highest-confidence part of this
  adapter, same as the Codex CLI adapter.
- `.opencode/plugin/wingman-gate.js` — a genuine code port (not just documentation) of
  `boardroom-checkpoint.mjs`'s decision logic, wired to OpenCode's `tool.execute.before` plugin hook
  matched against `plan_exit` — OpenCode's own plan-mode-exit tool, which is a real structural analog
  to Claude Code's `ExitPlanMode`. This is the one gate with a genuinely strong port target across
  both harnesses this session researched; see the file's own header comment for exactly which parts
  are high-confidence (the pure `evaluateCheckpoint` logic) vs. lower-confidence (the exact plugin
  wiring shape).

## Install

1. Copy this directory's `.opencode/` folder into your project root: `cp -r .opencode /path/to/your/project/`.
2. Edit each `boardroom-*.md`'s `model:` field to a model your OpenCode install actually has
   configured (the placeholders here are guesses, not confirmed defaults).
3. Confirm `.opencode/plugin/wingman-gate.js` actually loads — this specific loading path and hook
   registration are confirmed working against OpenCode v1.18.4 (`opencode debug config` shows the
   file registered); if a different version doesn't pick it up, check that version's own plugin docs.

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
