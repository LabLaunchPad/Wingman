# Wingman for Cline

Added 2026-07-27, Phase 4 of the founder-directed 6-harness build (Phase 1: descriptor-driven
generator refactor, `0.7.12`; Phase 2: Gemini CLI, `0.7.13`; Phase 3: OpenHands, `0.7.14`-`0.7.15`).
Like OpenHands, this adapter's capability findings come from the 2026-07-27 general capability-matrix
pass, not a dedicated field-level schema-verification pass the way Gemini CLI got — see
`harness-targets/cline.mjs`'s own header comment. Cline's `.clinerules/workflows/*.md` slash-command
convention and `ask_followup_question` tool are well-documented, stable public conventions used here
with reasonable confidence; the exact hooks-config file schema (introduced v3.36) was **not**
independently re-verified at the field level, so no hooks wiring file is authored here.

## Verification-status legend

Same 4-tier legend used throughout `references/harness-adapters/`:
- **built + tested** — created and confirmed working in this repo's own sandbox.
- **structurally verified (live install)** — confirmed against a real, installed instance of the
  target harness.
- **authored, unverified** — a faithful, best-effort translation checked against public
  documentation, never run against a live install.
- **not attempted, documented why** — deliberately skipped, with the concrete reason stated inline.

## What's here

- `.clinerules/workflows/*.md` (24) — **built + tested** (generated, `--check`-verified in this
  sandbox; the file-writing mechanism is real and repeatable, though no live Cline install has
  loaded the output). Cline's real, documented per-file slash-command convention — each file
  invocable as `/<filename>` in chat — so this uses the existing `'perFile'` commands mode, the same
  mode OpenCode's adapter uses, rather than Codex CLI/OpenHands' folded-file fallback.
- `shared/.agents/skills/` — see `references/harness-adapters/README.md`'s top-level entry; Cline is
  a contributor to the same generated shared output. Cline's own `.clinerules/*.md` files are
  **always-active context**, not an on-demand per-skill invocation mechanism — bulk-copying all 40
  skills into a project's `.clinerules/` would load every one of them on every turn regardless of
  relevance, burning context for no benefit. Offered here for manual, selective copying only, not
  claimed as a drop-in port.

## Capability profile

| Primitive | Status | Disclosed substitute |
|---|---|---|
| Hooks | ⚠️ confirmed new in v3.36 (tool-call-scoped, macOS/Linux only) at the capability-matrix level — exact config schema not independently re-verified this pass | not built this pass — see "Deliberately not attempted" below |
| Plan-gate | ❌ Plan/Act toggle is manual-only, no interception point (Cline's own docs are explicit) | `plugins/wingman/scripts/install-git-hooks.mjs` + `dod-pre-push-check.mjs` (git-push backstop) — same fallback Codex CLI/OpenHands use |
| Parallel dispatch | ❌ confirmed none — `/newtask` is a sequential context-reset, not concurrency, and Cline has no subagent-dispatch primitive at all | dispatch seats one at a time, disclose plainly in the founder-facing summary |
| Question tool | ✅ real `ask_followup_question` (single-select, not Claude Code's up-to-4-option multi-select) | adapt a multi-option ask into single-select shape (numbered list, or ask one option at a time) |

## Deliberately not attempted here (and why)

- **A hooks-config wiring file.** The capability-matrix pass confirmed Cline gained hooks in v3.36
  (tool-call-scoped, macOS/Linux only per public release notes), but not the exact config file
  location, field names, or command-invocation shape a real hook definition needs — the same gap
  disclosed for OpenHands. Left for a follow-up dedicated schema-verification pass.
- **A Boardroom-persona adapter.** Cline has no subagent/persona-definition concept at all (confirmed
  by `hasParallelDispatch: false` above) — there's nothing to translate into.
- **Live model inference / live install confirmation.** No Cline account or credential exists in this
  sandbox (`docs/HUMAN-TODOS.md`'s open item, same class of gap as every other harness in this build).
