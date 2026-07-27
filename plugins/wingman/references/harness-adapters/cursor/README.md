# Wingman for Cursor

Added 2026-07-27, Phase 5 (and last) of the founder-directed 6-harness build (Phase 1:
descriptor-driven generator refactor, `0.7.12`; Phase 2: Gemini CLI, `0.7.13`; Phase 3: OpenHands,
`0.7.14`-`0.7.15`; Phase 4: Cline, `0.7.17`). Sequenced last on purpose — of the 6 harnesses, Cursor
has the **weakest capability match**: only 3 narrow hook lifecycle points (no generic PreToolUse
equivalent), a Plan Mode whose exit is UI-click-only with no interceptable event, and no question
tool at all. Like OpenHands/Cline, capability findings come from the general capability-matrix pass,
not a dedicated field-level schema-verification pass.

## Verification-status legend

Same 4-tier legend used throughout `references/harness-adapters/`:
- **built + tested** — created and confirmed working in this repo's own sandbox.
- **structurally verified (live install)** — confirmed against a real, installed instance of the
  target harness.
- **authored, unverified** — a faithful, best-effort translation checked against public
  documentation, never run against a live install.
- **not attempted, documented why** — deliberately skipped, with the concrete reason stated inline.

## What's here

- `.cursor/commands/*.md` (24) — **built + tested** (generated, `--check`-verified in this sandbox;
  the file-writing mechanism is real and repeatable, though no live Cursor install has loaded the
  output). Cursor's real, documented custom-command convention — each file invocable as a slash
  command — using the existing `'perFile'` commands mode, same shape as OpenCode's/Cline's own
  adapters.
- `shared/.agents/skills/` — see `references/harness-adapters/README.md`'s top-level entry; Cursor
  is a contributor to the same generated shared output. Cursor's real skill-adjacent mechanism is
  `.cursor/rules/*.mdc` — a **different frontmatter shape** (`description`/`globs`/`alwaysApply`)
  than Wingman's own `SKILL.md` (`name`/`description`), so a faithful port would mean translating all
  40 files' frontmatter, not a verbatim copy. Left out of scope for this pass (no evidenced need to
  prioritize it over the gaps this phase actually closes) — offered here for manual
  reference/translation only, not claimed as a drop-in port.

## Capability profile

| Primitive | Status | Disclosed substitute |
|---|---|---|
| Hooks | ⚠️ only 3 narrow lifecycle points (`beforeShellExecution`/`beforeMCPExecution`/`afterFileEdit`), no generic PreToolUse equivalent | not built this pass — see "Deliberately not attempted" below |
| Plan-gate | ⚠️ real Plan Mode exists, but the transition out of it is UI-click-only — no hook fires | `plugins/wingman/scripts/install-git-hooks.mjs` + `dod-pre-push-check.mjs` (git-push backstop) — same fallback every other gapped harness in this build uses |
| Parallel dispatch | ✅ confirmed genuine: up to 8 parallel, worktree-isolated background agents | n/a — real capability; an 8-seat Boardroom (7 core + Design) fits in one batch exactly |
| Question tool | ❌ none — forum feature requests only, not shipped | plain conversational text, options listed in prose |

## Deliberately not attempted here (and why)

- **A hooks-config wiring file for the 3 real lifecycle points.** The capability-matrix pass
  confirmed the 3 event names exist, but not the exact payload schema each carries — building a
  wrapper now would be a guess dressed up as a port, the same reasoning OpenHands' and Cline's
  adapters already apply. Left for a follow-up dedicated schema-verification pass.
- **A `.cursor/rules/*.mdc` translation of all 40 skills.** The frontmatter shape genuinely differs
  from `SKILL.md`'s — this is a real translation task, not a verbatim copy, and wasn't evidenced as
  higher-priority than the other 4 harnesses' gaps this build closed first.
- **A Boardroom-persona adapter.** No confirmed persona-definition file format exists for Cursor's
  background agents.
- **Live model inference / live install confirmation.** No Cursor account or credential exists in
  this sandbox (`docs/HUMAN-TODOS.md`'s open item, same class of gap as every other harness in this
  build).
