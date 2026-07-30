# Wingman — System Requirements Specification

Companion to `docs/status/PRD.md` (the *why*) and `docs/status/ARCHITECTURE.md` (the *how it's organized*). This document specifies *what the system must do*, in checkable terms.

**Rewritten 2026-07-30** after a full 19-layer validation pass found this document materially stale: three functional requirements specified commands that no longer exist (`/wingman:plan`, `/wingman:secure`), the Interfaces section documented a **known-fake hook event** (`PermissionRequest`) as its contract, and the Verification section described the eval harness as a future addition when 90 eval cases and 484 tests already existed. Every requirement below was re-derived from the real plugin tree, not carried forward.

## System context

Wingman is a Claude Code plugin: markdown command/agent/skill files plus a JSON hooks config, loaded via `.claude-plugin/marketplace.json` → `plugins/wingman/.claude-plugin/plugin.json`. It has no standalone executable and does not run outside a coding-agent session. Adapters for six non-Claude-Code harnesses exist under `references/harness-adapters/` (see `ARCHITECTURE.md` §8b), honestly labeled per-artifact by verification tier.

## Assumptions

| ID | Assumption | If false |
|---|---|---|
| AS-1 | The founder can read a plain-language verdict but not a code diff. | The plain-language checkpoint layer is unnecessary overhead. |
| AS-2 | Node.js is available, because Claude Code itself bundles it. | Every `.mjs` hook and script fails; the plugin degrades to markdown-only. |
| AS-3 | `.wingman/` project state is committed to the founder's own git repo (no `.gitignore` entry excludes it), so **git is the backup and recovery mechanism**. | A separate backup mechanism becomes a real requirement. |
| AS-4 | Flat files (JSON/JSONL/Markdown) are sufficient state storage at founder-project scale. | The deferred local MCP server (`DATABASE.md`) becomes necessary. |
| AS-5 | A founder project's source tree is readable by the session driving Wingman. | `codebase-comprehension` and `context-assembly` cannot function. |

## Dependencies

- **Runtime**: Node.js (bundled with Claude Code) and POSIX shell. **Zero npm dependencies** — CI-enforced by `install-smoke.yml`, which asserts `node_modules` never appears.
- **Host harness**: Claude Code natively; six other harnesses via generated adapters.
- **External services**: none required. Optional/credential-gated items are tracked in `docs/HUMAN-TODOS.md` and never assumed present.
- **Vendored repos** (`vendor/`, 17 git submodules): design reference only, never a runtime dependency — see `ATTRIBUTIONS.md`.

## Functional requirements

Traceability-chain and pipeline requirements. Prefixes below are the 12 real prefixes in `scripts/traceability-prefixes.mjs`.

| ID | Requirement | Status |
|---|---|---|
| FR-1 | `/wingman:discovery` must mint at least one `DISC-*` findings row — the traceability chain root — alongside its prose fields. | Built |
| FR-2 | Each of the 14 pipeline stages must record its own founder-visible Boardroom checkpoint; no stage may bundle its checkpoint into another's. | Built (`ARCHITECTURE.md` §4d) |
| FR-3 | `/wingman:boardroom` must dispatch all 8 seats (CEO, CPO, CMO, CTO, CISO, CFO, Research, Design) in parallel, in independent subagent contexts, so verdicts don't bias each other. | Built |
| FR-4 | `/wingman:boardroom` must consolidate the 8 verdicts into one bottom line (`GO` / `GO WITH CHANGES` / `DO NOT SHIP`). **Any single seat's `NO_GO` blocks, unconditionally.** | Built |
| FR-5 | `/wingman:boardroom` must obtain an explicit founder decision — silence must never be treated as approval. | Built |
| FR-6 | No agent (persona) may invoke another agent; only commands may orchestrate. | Built (convention; not mechanically enforced — see NFR-6) |
| FR-7 | `/wingman:build` must not mark a task complete without fresh verification evidence (real test run or build output). | Built |
| FR-8 | `/wingman:build`'s Definition-of-Done gate must not pass while any identified threat is in an OPEN disposition; OPEN threats must be fixed or explicitly founder-accepted. (Absorbed from the retired `secure` stage.) | Built |
| FR-9 | The `boardroom-checkpoint` hook must block `ExitPlanMode` unless the plan file contains a `## Wingman Boardroom Checkpoint` section whose bottom line is not `DO NOT SHIP` **and** which carries an explicit founder decision. | Built |
| FR-10 | `/wingman:ship` must run preflight checks (verified, clean tree, feature branch, remote/auth) before pushing or opening a PR. | Built |
| FR-11 | `/wingman:evolve` must not create a department lead or specialist without presenting the promotion in plain language and obtaining explicit founder approval. | Built |
| FR-12 | Every skill must declare a "Use when…" trigger clause in its frontmatter `description`, not only in the body (the "description trap" — `ARCHITECTURE.md` §9). | Built, checked by `validate-structure.mjs` (warning) |
| FR-13 | Every agent `name` must be globally unique across the plugin. | Built, checked by `validate-structure.mjs` (error) |
| FR-14 | Department leads must be created only when their documented activation signal (`ARCHITECTURE.md` §5) is actually true for the current project. | Built (`skills/department-lead-activation`) |
| FR-15 | A build-stage change must trace back to a `DISC-*` row through the `Satisfies` chain; an orphaned requirement marker must fail. | Built, enforced by `check-traceability.mjs --chain` |
| FR-16 | Every command, skill, hook, and top-level reference must have exactly one owning engine — no orphans, no double ownership. | Built, enforced by `validate-engines.mjs` |
| FR-17 | Promotion of a memory entry to the Global or Org tier must require explicit approval; `writeTierEntry()` must throw without it. | Built (`scripts/memory-tiers.mjs`) |
| FR-18 | A deploy-class Bash action must be blocked unless the latest checkpoint carries a clean Boardroom verdict; absent/unparseable checkpoint state must fail **open** so non-Wingman projects are never blocked. | Built (`hooks/deploy-approval-gate.mjs`) |
| FR-19 | Every WKOS document must name a real producer or be an explicit template. | Built, enforced by `validate-wkos.mjs` |
| FR-20 | (Planned) The MCP state-store server must expose checkpoint history as a queryable resource surviving session boundaries. | **Planned, not yet justified** — `DATABASE.md` §"Why no server yet" |

## Non-functional requirements

| ID | Requirement |
|---|---|
| NFR-1 | **No hosted backend.** Never require the founder to deploy, pay for, or maintain infrastructure beyond their own coding-agent usage. |
| NFR-2 | **No new language runtime.** Node.js (bundled) or POSIX shell only — never assume Python, Rust, or a package-install step. |
| NFR-3 | **Founder-facing output must pass the `plain-language-checkpoint` bar** — no unexplained jargon, lead with consequence. A hard requirement on every checkpoint, error, and stage report. |
| NFR-4 | **Lazy agent population.** The always-loaded surface stays small regardless of how large the specialist candidate catalog grows. |
| NFR-5 | **Every skill self-contained** — no skill may assume another vendor repo's runtime, paid API, or infrastructure. |
| NFR-6 | **Structural consistency mechanically checkable**, not left to reviewer diligence — `scripts/validate-all.mjs`'s 9 checks must pass before any structural commit. |
| NFR-7 | **Attribution.** Content adapted from a vendored repo must trace to source, license, and the specific adaptation, in `ATTRIBUTIONS.md`. |
| NFR-8 | **Zero runtime dependencies**, CI-asserted (`install-smoke.yml`). Any capability requiring a package (embeddings, vector search) stays out of the shipped plugin. |
| NFR-9 | **Harness substitutions disclosed, never faked.** Where a harness lacks a primitive, the substitute is documented per-artifact by verification tier — parity is never silently claimed. |

## Quality attributes

| Attribute | Target | How measured |
|---|---|---|
| Correctness | All 9 validators exit 0; full test suite green | `validate-all.mjs`, `node --test` (484 tests) |
| Behavioral correctness | Instructions produce correct behavior, not just valid structure | `evals/` — 90 cases; `verified` requires a positive **and** negative scenario |
| Safety | No secret committed; no unapproved deploy-class action | `secret-guard`, `secret-scanner`, `deploy-approval-gate`, `tests/red-team/` |
| Traceability | Every build artifact reaches a `DISC-*` root | `check-traceability.mjs --chain` |
| Agent-weakness coverage | ≥92% of catalogued failure modes carry a rule; ≥92% measured by a `verified` eval | `wingman-metrics.mjs` §5, floor enforced by `check-benchmark-regression.mjs` |
| Maintainability | Every shipped file has exactly one engine owner | `validate-engines.mjs` |
| Portability | Adapter output byte-current with canonical source | `check-harness-adapter-drift.mjs` + `generate-harness-adapters.mjs --check` |

## Constraints

- Claude Code plugin model only: commands (markdown), agents (markdown + YAML frontmatter), skills (`SKILL.md` + optional `references/`/`scripts/`), hooks (`hooks.json` + scripts). No other extension mechanism may be assumed.
- No LangGraph, smolagents, or external orchestration service — evaluated and explicitly rejected (`ARCHITECTURE.md` §2). Cross-agent work uses the host harness's own dispatch.
- **No persistent runtime / always-on daemon.** File-backed state opened on demand is permitted and used (`~/.wingman/` Global/Org memory tiers); a resident process is not.
- The only persistent state is flat files (JSON/JSONL/Markdown) under `.wingman/` and `~/.wingman/`; no external database service.

## Interfaces

- **Command interface** — each `commands/<category>/<name>.md` is invoked as `/wingman:<name>` with optional `$ARGUMENTS`. Contract: `description` in frontmatter, plus `argument-hint` where it takes input. 34 commands (14 pipeline, 20 adaptive).
- **Agent interface** — each `agents/*.md` is invoked via the host's subagent dispatch and returns one structured verdict block: `## <SEAT> VERDICT: <GO | GO_WITH_CONCERNS | NO_GO>`, plus an `In plain terms:` line and a `Recommendation:`, under a 200–250 word cap. Contract: `name`, `description`, optional `tools`/`model`/`permissions`.
- **Skill interface** — auto-triggered on frontmatter `description` matching. 46 skills, flat layout (`skills/<name>/SKILL.md`).
- **Hook interface** — `hooks/hooks.json` wires **six real Claude Code events**: `PreToolUse`, `PostToolUse`, `SessionStart`, `Stop`, `UserPromptSubmit`, `PreCompact`. Each hook reads a stdin JSON payload and writes a stdout JSON decision.
  > **Corrected 2026-07-30.** An earlier revision of this document specified the contract as `PermissionRequest`/`ExitPlanMode`. **`PermissionRequest` is not a real Claude Code event** — an earlier `hooks.json` used it and the plan-mode safety gate was **silently inert** as a result, with no error anywhere. `validate-structure.mjs` now mechanically rejects any non-real event name (`VALID_HOOK_EVENTS`). `ExitPlanMode` is a **matcher** on `PreToolUse`, not an event.
- **State interface** — `.wingman/` (per project: `checkpoints.jsonl`, `state.json`, `traceability.json`, `memory/`, plus the paths in `DATABASE.md`'s tree) and `~/.wingman/` (Global/Org memory tiers, outside any repo). Schema evolution is tracked by `schema_version` (currently 5).
- **Engine interface** — 17 `engines/<name>/ENGINE.md` manifests, each declaring purpose, inputs, output artifacts, members, state read/written, escalation, and permitted tool tiers.

## Acceptance criteria

A change to this plugin is acceptable only when all of the following hold:

1. `node scripts/validate-all.mjs` exits 0 — all 9 checks.
2. `node --test tests/*/*.test.mjs` passes with zero failures.
3. Any behavioral change to a command/skill/agent has an `evals/cases/*.md` case with a real run log — never a simulated or asserted one.
4. Any shipped-content change bumps `plugin.json`'s `version` **and** adds a matching `CHANGELOG.md` entry (CI-enforced by `version-gate`).
5. Any new mechanical check has caught at least one real defect, or has a test proving it catches a deliberately introduced one.
6. Any founder-facing output clears the `plain-language-checkpoint` bar.
7. Any structural change is recorded in `docs/status/PROJECT.md`'s decisions log, including declined alternatives.

## Traceability

| Layer | Artifact | Mechanism |
|---|---|---|
| Vision → requirement | `DISC-*` → `RS`/`PJ`/`JM`/`DEF`/`IA`/`UX`/`WF`/`VS`/`PT`/`ARCH`/`IP` | `Satisfies` column; 12 prefixes in `scripts/traceability-prefixes.mjs` |
| Requirement → code | `wingman:req <ID>` markers | `check-traceability.mjs` (orphan marker = hard failure) |
| Requirement → root | transitive `Satisfies` walk | `check-traceability.mjs --chain <ID>` |
| Document → producer | WKOS producer map | `validate-wkos.mjs` |
| File → owner | 17 engine manifests | `validate-engines.mjs` |
| Rule → enforcement | `constitution.md`'s `**Enforced by:**` paths | `constitution-check.mjs` |
| Decision → rationale | `PROJECT.md` decisions log + `wingman:log` markers | `query-wingman-knowledge.mjs` |

## Verification

`node scripts/validate-all.mjs` is the single entry point for the **9** mechanical checks: `validate-structure`, `check-repo-consistency`, `check-fixtures`, `check-traceability`, `validate-wkos`, `validate-engines`, `check-harness-adapter-drift`, `generate-harness-adapters --check`, and `node --test`. All are enforced in CI by `.github/workflows/validate.yml`.

Behavioral requirements are verified by the **eval harness** (`evals/`, 90 cases) — not by manual walkthrough. Grading stays human/independent by design: a case reaches `verified` only after a real run plus a differently-shaped negative scenario. `evals/run-headless.mjs --dry-run` checks fixture integrity with no API key.

Layer coverage and known gaps are tracked in `docs/status/REGRESSION-CHECKLIST.md` (Layer 0 dogfooding / Layer 1 mechanical / Layer 2 semantic).
