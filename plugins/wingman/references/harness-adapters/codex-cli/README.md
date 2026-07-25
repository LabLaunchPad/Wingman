# Codex CLI adapter for Wingman's Boardroom

**Verification status: schema-confirmed via direct primary-source research, not yet against a live
Codex CLI install.** No configured model provider exists in the Wingman dev sandbox this was built
in (see `docs/HUMAN-TODOS.md`). Everything below is checked directly against OpenAI's official Codex
CLI docs (fetched live, not recalled from training data — see "2026-07-25 research pass" below), not
against a real running session. Treat it as a schema-verified starting point, not a live-tested one.

## What's here

- `.codex/agents/boardroom-*.toml` (8 files) — the 8 Boardroom seat personas (CEO, CPO, CMO, CTO,
  CISO, CFO, Research, Design), translated from `plugins/wingman/agents/boardroom-*.md` into Codex
  CLI's custom-agent TOML schema. The review criteria and `## <SEAT> VERDICT` output contract are
  copied faithfully — that content is harness-agnostic prose, so this is the highest-confidence part
  of this adapter.
- `.codex/hooks.json` — the git-push safety gate (command-text pattern-matching, harness-agnostic)
  plus, as of the 2026-07-25 research pass, a real `secret-guard.mjs` port wired to both `Bash` and
  `apply_patch` matchers. Deliberately excludes the `boardroom-checkpoint.mjs` plan-approval gate:
  Codex CLI has no plan-mode tool to gate — it uses `approval_policy` instead; this is a genuine
  capability gap, not an oversight.
- `.codex/hooks/secret-guard.mjs` — a real, schema-verified port of
  `plugins/wingman/hooks/secret-guard.mjs`. Not just written and assumed: tested with a real
  stdin/stdout JSON round-trip (destructive command → `deny`, secret pattern → `deny`, clean input →
  `allow`), matching Codex's confirmed hook contract exactly.
- `.codex/hooks/{prompt-guard,secret-scanner,content-injection-scanner,context-monitor,session-health,
  session-start,pre-compact-guard,stop-loop}.mjs` — 8 more ports, added in the 2026-07-25
  hook-porting pass below. Each has a passing unit-test file under
  `tests/opencode-gate/codex-*.test.mjs` and a real stdin/stdout round-trip was manually checked for
  several of them (see that section for exactly what's wired vs. disclosed as a gap).

## 2026-07-25 hook-porting pass — 8 more canonical hooks, real ports plus honest limits

A follow-up session (same day as the research pass below, after PR #118 finished porting 6 of
Wingman's 9 shipped hooks to a real OpenCode plugin adapter) ported as many of the remaining 8
canonical `plugins/wingman/hooks/*.mjs` files to this Codex CLI adapter as the confirmed hook
surface actually supports. Two fresh direct fetches of
[learn.chatgpt.com/docs/hooks](https://learn.chatgpt.com/docs/hooks) resolved several previously-open
questions before any of this was built — see the exact citations in each new file's own header
comment. **No live Codex CLI install exists in this sandbox** (same constraint as the rest of this
adapter) — everything below is schema-confirmed, not live-tested, and one fetch specifically used
WebFetch's AI-summarization pass over the page rather than a raw text dump, which is disclosed as a
slightly weaker citation than a raw fetch where it matters (see the `UserPromptSubmit`/`SessionStart`
entries below).

**New files, all under `.codex/hooks/`, all with `node --check`-clean syntax and a passing
`node --test` suite under `tests/opencode-gate/codex-*.test.mjs`** (that directory's existing name,
even though these are Codex CLI ports, not OpenCode — it's simply where this project's harness-adapter
hook tests already live):

| Canonical hook | Codex event | Status | Genuine gap disclosed |
|---|---|---|---|
| `prompt-guard.mjs` | `UserPromptSubmit` — **CONFIRMED to exist**, fires "before model processes user input", prompt text in field `prompt` (same name Claude Code uses) | Wired | Exact output JSON nesting for a block decision not independently re-verified (field names only) |
| `secret-scanner.mjs` | `PostToolUse`, no matcher — tool output in field `tool_response` (**CONFIRMED**, same name Claude Code uses) | Wired, warn-only | Same output-nesting caveat as above |
| `content-injection-scanner.mjs` | `PostToolUse`, no matcher — same `tool_response` field | Wired, warn-only | Same caveat; reuses `prompt-guard.mjs`'s `INJECTION` list via import, no duplicate |
| `context-monitor.mjs` | `PostToolUse`, no matcher | Wired | Scope-creep half is a real ADAPTATION, not a field-name translation: apply_patch has no `file_path` field, so file paths are parsed from apply_patch's own V4A patch-header lines (`*** Update File: ...`) — a reasonable inference, not an independently-cited field mapping |
| `session-health.mjs` | `PostToolUse`, no matcher | Wired | Only the output-nesting caveat; call-count logic is a clean, direct port |
| `session-start.mjs` | `SessionStart` — **CONFIRMED to exist**, matcher values `startup`/`resume`/`clear`/`compact` (superset of Claude Code's own 3), input fields include `cwd` | Wired | Output-nesting caveat only |
| `pre-compact-guard.mjs` | `PreCompact` — **CONFIRMED to exist**, matcher `manual`/`auto` | Wired | Documented input fields (`trigger`, `turn_id`, `session_id`) do **not** list `cwd` — falls back to `process.cwd()` |
| `stop-loop.mjs` | `Stop` — **CONFIRMED to exist**, no matcher, input `turn_id`/`stop_hook_active`/`last_assistant_message` | Wired | No documented tool-call-history field for this event, so `evaluate()`'s stall-detection check is wired as a permanent no-op (always passed `[]`) until such a field is confirmed; also no `cwd` field, same `process.cwd()` fallback |

**Deliberately NOT ported as a new Codex-specific hook**: `dod-structural-gate.mjs`'s `Bash`/`git push`
half. Its exact PreToolUse schema (`Bash` matcher, `tool_input.command`) is now just as confirmed as
`secret-guard.mjs`'s own wiring above — but `plugins/wingman/scripts/dod-pre-push-check.mjs` already
reuses this hook's pure functions (`checkBoardroomVerdictClean`,
`checkVerdictTranscriptionMatchesDetails`, `checkTestPresence`, `detectTestCommand`, `runTestSuite`,
`checkThreatRegisterCleanAcrossArtifacts`) as a real git pre-push hook — which fires at the git level
under any harness, including this one, with zero Codex-specific wiring, and additionally catches a
human typing `git push` directly, which a `hooks.json` entry never would. Adding a second,
Codex-hooks.json-specific wrapper around the identical pure functions would be pure duplication with
no behavioral gain. See `hooks.json`'s own `_dod_structural_gate_decision` entry for the same
reasoning inline.

This pass exceeded what earlier research assumed was possible: the equivalent OpenCode investigation
(`../opencode/SESSION-LIFECYCLE-FINDINGS.md`) found `stop-loop.mjs` genuinely **UNCLEAR** after real
live testing, because OpenCode's one-shot CLI process tears down before a plugin-triggered follow-up
turn can complete. Codex CLI's situation is structurally different (a real, documented `Stop` event
with its own input/output schema exists), so its port is wired here rather than left unwired — but
"documented to exist" is still a materially weaker claim than OpenCode's "live-tested end to end",
and this file says so rather than blurring the two together.

## 2026-07-25 research pass — every previously-open question resolved or narrowed, sourced directly

A fresh round of research, fetching primary sources directly rather than trusting summaries,
resolved every question the earlier passes below had to leave open:

- **Hooks are enabled by default — confirmed, and a prior secondary source was wrong.** Direct fetch
  of [learn.chatgpt.com/docs/hooks](https://learn.chatgpt.com/docs/hooks) (redirected from
  `developers.openai.com/codex/hooks`): "Hooks are enabled by default in Codex. To disable them...
  set `[features] hooks = false`" (`codex_hooks` is a deprecated alias for the same flag). A
  secondary blog source claiming the opposite (opt-in required) was checked directly against this
  primary source and found incorrect — don't trust it.
- **The `apply_patch` field name is resolved: `tool_input.command`, the same field Bash uses.** This
  was the one detail the earlier pass explicitly declined to guess at (wiring a secret scanner
  against a wrong field name would silently never catch anything, worse than not porting it). Now
  confirmed directly: `secret-guard.mjs` is wired into `hooks.json` above, using this exact field.
- **Real, current caveat found alongside the resolution, not smoothed over**: two open GitHub issues
  ([openai/codex#16732](https://github.com/openai/codex/issues/16732),
  [#20204](https://github.com/openai/codex/issues/20204)) report `apply_patch` hook events not
  firing consistently in practice across all Codex CLI versions, despite being documented as
  supported. Treat this hook as "should fire per the spec," not "confirmed firing on your specific
  install" — verify with one trivial known-bad edit before trusting it silently.
- **Single-message parallel Boardroom dispatch is a real, confirmed capability** — see "Running a
  Boardroom review" below for the resolved guidance (previously an open question).
- **`gpt-5.5` is a confirmed real current default model**, not an unverified guess — "GPT-5.5 is the
  default for ChatGPT-authenticated sessions (Codex CLI, app, IDE), GPT-5.4 is a fallback" per
  [Codex CLI's 2026 model-config guidance](https://qcode.cc/en/codex-enable-gpt-5-5). Still verify
  your own account's actual model-catalog access — a confirmed *default* isn't a confirmed
  *guarantee* for every account.

## 2026-07-23 update — the recommended install path is actually native, zero-maintenance

A later research pass, live-tested against the real Wingman repo (not docs prose), found Codex CLI
**natively installs Wingman's existing, unmodified `.claude-plugin/marketplace.json` + `plugin.json`**
— no `.codex-plugin/` manifest, no copying, nothing in this directory required for skills specifically:

```
codex plugin marketplace add /path/to/Wingman   # or a git URL / owner/repo
codex plugin add wingman@wingman
```

Verified directly: this cached the real plugin to `~/.codex/plugins/cache/wingman/wingman/<version>/`,
and a subsequent `codex debug prompt-input` in a fresh project showed **all ~40 skills** genuinely
discovered (name, description, and a real file pointer into the cache) — no adapter, no generator, no
translation. **This is the recommended install path for Codex CLI users going forward**, ahead of the
generated `.agents/skills/` copies in `../shared/.agents/skills/` (which still work, and remain useful
for a project that wants the files present without going through Codex's plugin-cache mechanism).

**One partial, undocumented behavior worth knowing about, not relying on**: Codex's install step also
auto-migrates *some* commands into synthetic skill files under a path it generates itself
(`.codex-plugin/migrated-command-skills/source-command-<name>/SKILL.md`, inside its own cache) — but
only 4 of Wingman's 24 commands did this in testing (`advisory`, `harness`, `incident`, `research`),
with no confirmed rule for which commands qualify. Don't rely on it for command coverage — use
`../codex-cli/commands-as-agents-md.md` (pasted into your project's `AGENTS.md`) for the reliable,
complete path to all 24 commands instead.

## 2026-07-22 research update — Bash matcher confirmed, Write/Edit matcher partially confirmed

A follow-up platform-conventions audit fetched OpenAI's official Codex hooks reference
(`learn.chatgpt.com/docs/hooks`, redirected from `developers.openai.com/codex/hooks`) directly,
resolving two things this adapter previously flagged as unconfirmed:

- **The `Bash` matcher is now confirmed, not a guess.** The official docs state PreToolUse/
  PostToolUse intercept "Bash, file edits performed through `apply_patch`, MCP tool calls, and
  other local function tools" — `Bash` is a real, documented tool name.
- **The Write/Edit matcher shape is confirmed.** The same docs confirm matcher values `apply_patch`,
  `Edit`, or `Write` all work for the file-edit hook path — the hook input's own `tool_name` field
  always reports `apply_patch` regardless of which matcher value is configured.
- The payload field name and the hooks-enabled-by-default question this section originally left open
  were both resolved in the 2026-07-25 research pass above — see there for the confirmed answers and
  the real `secret-guard.mjs` port now wired into `hooks.json`.

## Install

1. Copy this directory's `.codex/` folder into your project root: `cp -r .codex /path/to/your/project/`.
2. Edit each `boardroom-*.toml`'s `model` field to a model your Codex CLI install actually has access
   to (the placeholder `"gpt-5.5"` is a guess, not a confirmed default).
3. Fix `.codex/hooks.json`'s command path (see its own inline `_command_comment`) — or skip it
   entirely and use the git-level installer instead (next section), which is more robust.

## Running a Boardroom review under Codex CLI

**Resolved, 2026-07-25**: Codex CLI genuinely supports single-message parallel dispatch, confirmed
directly against [developers.openai.com/codex/subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents)
(fetched live). There's no discrete "spawn 8 named agents" tool call — dispatch is natural-language
driven: ask directly in one message, e.g. *"Review this change with the boardroom-cto, boardroom-ciso,
boardroom-cfo, ... agents in parallel, then consolidate their verdicts."* Codex's own orchestrator
handles spawning, routing, waiting, and collecting results. Concurrency is capped by
`agents.max_concurrent_threads_per_session` in `config.toml` (unset picks a Codex-chosen default;
example configs in the wild use `8`, matching Wingman's own 8-seat Boardroom exactly). **Real
tradeoff, disclosed not hidden**: each subagent does its own full model/tool work, so this consumes
meaningfully more tokens than Claude Code's own parallel `Task`/`Agent` dispatch for the same
8-seat review — per the official docs' own stated caveat.

**Practical recipe**: prompt Codex with something like *"Dispatch boardroom-ceo, boardroom-cpo,
boardroom-cmo, boardroom-cto, boardroom-ciso, boardroom-cfo, boardroom-research, and boardroom-design
in parallel to review [the change]. Each returns its own `## <SEAT> VERDICT` block. After all 8
return, consolidate using this rule: any `NO_GO` → overall `DO NOT SHIP`; any `GO_WITH_CONCERNS` →
overall `GO WITH CHANGES`; otherwise `GO`."* — the exact same consolidation rule
`commands/adaptive/boardroom.md` already uses, just invoked via natural language instead of a tool
call.

## The real, high-confidence win: the git-push gate

Rather than depending on this adapter's `hooks.json` (whose exact tool-name matcher is an unconfirmed
guess), install `plugins/wingman/scripts/dod-pre-push-check.mjs` as a real `.git/hooks/pre-push` hook
via `plugins/wingman/scripts/install-git-hooks.mjs`. That fires at the `git` level — under Codex CLI,
under Claude Code, under a human typing `git push` directly — with zero per-harness adaptation and
zero guessing about tool names. See the repo root's own use of this (item 3 of the parent plan) for
a real, tested example.
