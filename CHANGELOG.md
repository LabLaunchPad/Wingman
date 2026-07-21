# Changelog

All notable changes to the Wingman Claude Code plugin.

## [0.5.26] - 2026-07-21

### Fixed
- **`plugins/wingman/skills/mechanics/git-pr-workflow`** — added a Step 0 ("confirm you're not on `main`" before the first edit/commit of a new round of work) and a Step 5 (the "required status checks are expected" merge-blocked-by-base-drift race: update the branch, then wait for checks to actually re-run before retrying — don't retry immediately). Both found from real, self-caught friction this session, not speculative: a commit landed directly on local `main` mid-session (caught before pushing, recovered cleanly), and the base-drift merge race recurred repeatedly across this project's real PR history (one PR needed the fix re-applied 4+ times). `LEARNINGS.md` gets a new entry (occurrence=3) cross-referencing the existing, structurally identical "pipeline stages must create the feature branch before the first commit, not after" lesson (occurrence=2) — same root cause, different context (this project's own dev-repo session workflow vs. a founder pipeline command).

### Fixed
- **`plugins/wingman/scripts/query-founder-knowledge.mjs`** — found via a real multi-session dogfood run (4 simulated session boundaries, each reading the tool's output cold): `state.json`'s `current_stage` could silently drift from the last checkpoint's own `next_stage` field with nothing to catch it. Checkpoint entries now expose `next_stage`; `summary()` compares it against `state.json` and returns a `state_stage_mismatch` field when they disagree. Verified both directions (no false positive on correct state; a direct catch when the drift was reintroduced for testing). See `docs/PROJECT.md`'s decisions log for the full run log — the same dogfood run also confirmed a fresh "session" correctly halts on a `DO NOT SHIP` verdict read back from `--summary` alone, closing the "not yet verified whether a later session reads this back" gap the prototype shipped with.

## [0.5.24] - 2026-07-21

### Added
- **`plugins/wingman/scripts/query-founder-knowledge.mjs`** — prototype (not yet wired into any skill/command) unifying a founder project's 4 fragmented `.wingman/` state formats (`checkpoints.jsonl`, `state.json`, `traceability.json`, `memory/*.md`) into one queryable, chronologically-sortable surface, plus a `--summary` mode answering `docs/DATABASE.md`'s named "what has this project decided and why" gap in one call. Reuses `okf-export.mjs`'s existing parsers rather than duplicating them. Built per `docs/wingman/architecture-audit-2026-07-15.md`'s Emerging finding #6, as a bounded, evidence-gated experiment — see `docs/PROJECT.md`'s decisions log for the real run log and honest grading.

## [0.5.23] - 2026-07-21

### Changed
- **`plugins/wingman/skills/` and `plugins/wingman/commands/`** — reorganized into category subfolders (40 skills into `discipline/`, `mechanics/`, `governance/`, `output/`, `knowledge/`, `personas/`, `response/`; 24 commands into `pipeline/`, `adaptive/`) for browsability at the plugin's current size. Path-only change: skill identity comes from the `name:` frontmatter field and command identity from the filename, so no `/wingman:*` invocation changed. `plugin.json`'s 64 path entries updated; `validate-structure.mjs`'s orphan detection rewritten to walk recursively instead of a flat, basename-only scan. `agents/` (8, homogeneous) and `references/` (15) stay flat. See `AGENTS.md`'s new "Skills and commands, by category" section for the full taxonomy.
- **Backlinks, computed from actual citations (not hand-curated)**: each `references/*.md` gets a "Cited by" section listing every skill/command/agent that cites it (15 files, complementing `doc-index`'s existing one-directional owner→reference rule); each skill gets a "Referenced by" section listing every other skill/command that names its path (20 of 40 skills had at least one real citer); every skill/command already named in `docs/ARCHITECTURE.md` gets a one-line pointer back to it (17 files); the 9 new category folders each get a one-line `README.md` pointing back to `AGENTS.md`'s categorized index.

## [0.5.22] - 2026-07-20

### Fixed
- **7 `SKILL.md` files** (`engineering-minimalism`, `subagent-driven-development`, `systematic-auditing`, `systematic-debugging`, `test-driven-development`, `verification-loop`, `writing-plans`) — the `## Continuous Execution` block was byte-identical across all 7; extracted to `references/continuous-execution.md`, each skill now cites it.
- **`scripts/check-fixtures.mjs`** — 46+ independent eval fixtures ran strictly sequentially; now run through a bounded-concurrency worker pool (min(cpus, 6)), each fixture still gets its own tmpdir so this is safe.
- **`plugins/wingman/scripts/okf-export.mjs`** — `rmSync(outDir, {recursive:true,force:true})` had no path containment check; added a guard refusing to wipe the filesystem root or the user's home directory.
- **`plugins/wingman/hooks/stop-loop.mjs`** — stall-detection logic was computed twice (once in `evaluate()` to decide, once in the CLI to report why); `evaluate()` now returns `{decision, reason}` and the CLI uses the derived reason directly instead of recomputing it.
- **`.github/workflows/claude.yml`, `.github/workflows/claude-code-review.yml`** — `anthropic_api_key` was passed via `with:`; confirmed `claude-code-action` supports reading `ANTHROPIC_API_KEY` from `env:` when the input is omitted, converted both workflows.
- **`evals/fixtures/setup-existing-npm-project.sh`** — pinned `kleur` from `^4.1.5` to `4.1.5` (disposable fixture, but unpinned semver is still avoidable).

### Won't fix (documented)
- **SEC1** (`stop-loop.mjs` `verifyCommand` cache re-arm window) — the audit's proposed optional founder-ack hardening was surfaced to the founder directly and declined: a same-file ack token wouldn't meaningfully close a threat model where the attacker can already rewrite `loop.json`. The existing CISO-reviewed disclosure stands.
- **CQ3** (`dod-structural-gate.mjs`'s 80-line orchestration block) — same precedent as CQ2 (Wave 3): low-risk style judgment, not a correctness issue.

Wave 4 (structural) of the audit remediation loop — see `FIXLOG.md`, now fully closed across all 4 waves.

## [0.5.21] - 2026-07-20

### Fixed
- **`secret-guard.mjs`/`secret-scanner.mjs`** — the two hooks' `SECRET` regex lists were byte-identical copies (drift risk) and missing 4 common credential shapes (GitHub fine-grained PAT, Slack tokens, Stripe live keys, Google API keys). De-duplicated (`secret-scanner.mjs` now imports `SECRET` from `secret-guard.mjs`, mirroring the existing `INJECTION` sharing pattern) and added the missing patterns, each verified against real-shaped test strings.
- **`validate-structure.mjs`** — read every skill's `SKILL.md` from disk twice (once for frontmatter, once for the discipline-triad scan); now reads once.
- **`skills/governance/security-checklist`, `skills/governance/evolve-promotion`** — added `## References` entries for `references/secrets-policy.md` and `references/persona-template.md`, which had zero citations anywhere in the plugin.

Part of Wave 3 of the audit remediation loop — see `FIXLOG.md` and `docs/PROJECT.md`'s decisions log.

## [0.5.20] - 2026-07-20

### Added
- **`skills/knowledge/prompt-diff-check`** — checks whether a changed command/agent/skill's existing eval case actually exercises the changed section, rather than assuming a case existing means the change is covered. Wired into `/wingman:harness`'s self-audit. Narrow, evidence-gated addition following an assessment of an externally-pasted "deep research report" — see `docs/PROJECT.md`'s decisions log for the full assessment (2 of the report's other 4 proposals were declined as architecturally incompatible with Wingman's zero-dependency/no-runtime design, 2 were found already built).

## [0.5.19] - 2026-07-20

### Added
- **`/wingman:knowledge-export`** — exports `.wingman/checkpoints.jsonl` and `memory/*.md` into a Google Open Knowledge Format (OKF v0.1) bundle at `.wingman/okf-export/`, so other AI tools can read a founder's Wingman-tracked decisions without a Wingman-specific reader. Opt-in, never runs automatically. New shipped script `plugins/wingman/scripts/okf-export.mjs` (dependency-free, read-only on source data, runnable standalone — see `docs/ARCHITECTURE.md` §8a). New eval case `evals/cases/knowledge-export.md` with fixture `evals/fixtures/setup-knowledge-export-fixture.sh`, run for real during implementation.

### Maintenance
- `plugin.json` bumped `0.5.18` → `0.5.19`. (Note: entries `0.5.13`–`0.5.18` were not backfilled here — out of scope for this change.)

## [0.5.12] - 2026-07-18

### Fixed
- **Multi-persona wiring/connections audit** — 5 parallel narrowly-scoped audits (manifest/hooks wiring, cross-reference consistency, evolve/specialist-promotion mechanics, department-lead/Management-Board activation logic, checkpoints.jsonl/state.json schema-safety), every finding independently re-verified against the real repo before acting. Real gaps fixed:
  - Stale `boardroom-security`/`boardroom-founder` agent references (renamed to `boardroom-ciso`/`boardroom-ceo` during the 7-seat rearchitecture) in `skills/governance/security-checklist`, `skills/discipline/engineering-minimalism`, `skills/governance/department-lead-activation`'s worked example, `docs/AGENT-ROSTER.md`, and `hooks/boardroom-checkpoint.mjs` — the same bug class already caught once this session in `.github/workflows/claude-code-review.yml`, now swept more broadly.
  - **`launch.md` and `hotfix.md` never called `management-board-activation`** despite each being able to create a conditionally-activated department lead (`dept-growth`, `dept-devops`) that could cross the Management Board's 3+ threshold — a real logic gap with a concrete failure scenario (a manager silently never gets created if the threshold is crossed via either command). Wired both, updated `management-board-activation/SKILL.md`'s own trigger list, and corrected `docs/ARCHITECTURE.md`'s stale "six delegating commands" inventory (it never even listed `hotfix.md` as one of the commands that creates department leads).
  - `department-lead-activation/SKILL.md`'s DevOps ship-detection instruction had no schema-version guidance — a `bundle === "ship"` implementation would silently miss every ship checkpoint recorded before the `schema_version: 3` migration (which introduced the `bundle` field). Now explicit: match on scalar `stage === "ship"`.
  - `evolve-promotion/SKILL.md`: (1) its own worked example used the pre-rename seat name `security` with no note that it's the same concern as `ciso` on newer entries — could under-count occurrences across the schema migration; (2) no instruction to treat two log entries citing the same underlying incident as one occurrence, not two — both now explicit.
  - `plugins/wingman/skills/governance/evolve-promotion/references/specialist-catalog.md` (the shipped runtime copy) was missing the `Status` column entirely, despite both it and `docs/AGENT-ROSTER.md` explicitly declaring they must stay in sync — resynced, including fixing stale status annotations in `AGENT-ROSTER.md` itself (`/wingman:plan`, `/wingman:secure`, `boardroom-security` — all retired/renamed).
  - README.md and `docs/PROJECT.md` both undercounted skills as 38; actual count is 39.
  - Tightened `architecture.md`/`uxflow.md`'s inline `management-board-activation` reminders from naming a single manager to "every currently-missing manager whose department lead is active," matching `build.md`'s already-correct phrasing.

### Maintenance
- `plugin.json` bumped `0.5.11` → `0.5.12`.

## [0.5.11] - 2026-07-18

### Added
- **Reversible compression for Boardroom checkpoints** (`checkpoints.jsonl` schema_version 3 → 4): reverse-engineered the genuinely portable half of `opencode-dynamic-context-pruning`'s design — not its `compress`/`decompress` tool-calling mechanism (OpenCode's own tool surface, not something a Claude Code plugin can add) but the underlying *principle*, that a compression scheme should never destroy the ability to recover the original. `/wingman:boardroom` now writes a companion file (`.wingman/checkpoint-details/<checkpoint_id>.md`) holding every seat's full, unabridged verdict alongside each `checkpoints.jsonl` append, and gains a new `expand <checkpoint_id> [seat]` retrieval mode that reads it back verbatim — a pure retrieval, no new dispatch or checkpoint recorded. Closes a gap `docs/DATABASE.md` had named explicitly: `checkpoints.jsonl` previously had "no rationale beyond a one-line seat summary," with the full reasoning lost the moment the session ended.
- **`skills/output/plain-language-checkpoint`** gains a new rule: compression must be reversible — whenever this skill's own translation drops real detail to keep a founder-facing message short, the untranslated original must be persisted somewhere retrievable, with a pointer back to it named in the summary.
- **`evals/cases/boardroom-expand.md`** (new, `provisional`): real 3-subagent dispatch (write, retrieve, negative-case) against the reused `setup-boardroom-gate-fixture.sh` fixture, independently verified against the real filesystem — confirmed the companion file preserves full seat reasoning a one-liner summary would have dropped, confirmed `expand` returns the original rather than re-summarizing it, and confirmed a nonexistent `checkpoint_id` is reported plainly rather than guessed at.

### Changed
- `docs/DATABASE.md`: documents `checkpoint-details/` in the file tree, the `schema_version: 4` / `details_ref` field, and a new "reversible compression" migration note; reworded the `memory/` section's now-stale claim that `checkpoints.jsonl` has "no rationale beyond a one-line seat summary."
- `docs/ARCHITECTURE.md` §4: brief mention of the `schema_version: 4` companion-file mechanism and `expand`.

### Maintenance
- `plugin.json` bumped `0.5.10` → `0.5.11`.

## [0.5.10] - 2026-07-18

### Added
- **`hooks/pre-compact-guard.mjs`** (new `PreCompact` registration): warn-only hook (never blocks, matching `secret-scanner.mjs`'s discipline) that flags real uncommitted project changes right before Claude Code's native context compaction fires — the files themselves survive compaction (git already has them), but the reasoning behind them doesn't. Explicitly excludes `.wingman/` itself from the check, since Wingman's own bookkeeping files (`state.json`, `checkpoints.jsonl`) change on every routine checkpoint and would otherwise make the warning fire constantly. Researched and rejected porting two external "context compression" tools first (`opencode-dynamic-context-pruning`'s model-callable `compress` tool — OpenCode's own tool-calling surface, not something a Claude Code plugin can add; `claude-rolling-context`'s transparent `ANTHROPIC_BASE_URL` proxy — a persistent background server rewriting the API transport layer, exactly the class of infrastructure `docs/ARCHITECTURE.md` §2 already rejects). Wingman's flat-file-state architecture (`subagent-driven-development`) already avoids the underlying problem those tools solve; this hook is the one genuinely portable, safe piece of the idea.

### Maintenance
- `plugin.json` bumped `0.5.9` → `0.5.10`.

## [0.5.9] - 2026-07-18

### Added
- **`skills/output/visual-founder-output` extended to the remaining pipeline commands**: `architecture.md` gets a DEF→ARCH traceability graph (a mapping, not a sequence — additive to the existing `ARCH-*` table); `implementation-planning.md` gets a task-dependency diagram appended to the internal plan document itself (defaults to Tier B regardless of session capability, since the plan is never shown to the founder directly); `discovery.md`, `define.md`, `build.md`, and `ship.md` each get the generic "Where you are" pipeline-status tree, including a new mid-planning variant (naming which of the 5 planning sub-stages is current) for the 4 stages that run before the Planning Milestone checkpoint exists. `discovery.md`/`define.md`/`build.md`/`ship.md` deliberately get no forced diagram — their content (a problem statement, an independent-requirement table, a threat register, a field list) has no real diagram shape, per the skill's own Red Flag against decorating flat content.
- **`references/visual-output-templates.md`** §4 (DEF→ARCH traceability graph) and §5 (task-dependency diagram) added; §2 (pipeline-status tree) extended with the mid-planning variant.

### Maintenance
- `plugin.json` bumped `0.5.8` → `0.5.9`. (Originally authored as `0.5.7`; renumbered during merge reconciliation as PR #30 landed `0.5.8` first.)

## [0.5.8] - 2026-07-18

### Fixed
- `validate-structure.mjs`'s hook-event whitelist had a fake event (`StopFailure`) and was missing 3 real ones (`Notification`/`SubagentStop`/`PreCompact`).
- `context-monitor.mjs`'s scope-creep detector read `toolInput.filePath` instead of Claude Code's real snake_case `file_path` field, so it never fired.
- `council`/`verification-loop` skills still pointed at the retired `wingman:secure` command; repointed to `build.md`'s Definition-of-Done gate.
- Removed an exact duplicated section in `verification-before-completion/SKILL.md`; minor consistency fixes in `engineering-minimalism`, `ponytail-debt-harvesting`, and `traceability-linking`.
- Retired `evals/cases/plan.md` (tested a command that no longer exists), matching the existing `secure.md` pattern.

### Maintenance
- `plugin.json` bumped `0.5.7` → `0.5.8`. (Originally authored against `0.5.5`; renumbered twice during merge reconciliation as other PRs landed `0.5.6` and `0.5.7` first — see decisions log.)

## [0.5.7] - 2026-07-18

### Fixed
- `secret-scanner.mjs`: added a generic key/token/secret-assignment detection pattern, alongside the existing named-provider patterns.
- `stop-loop.mjs`: added a `maxIterations` cap (default 50, persisted per-project in `.wingman/loop-counter.json`) so an unmet completion promise can no longer drive an unbounded loop.
- `parse-wingman-logs.mjs`: fixed Windows CRLF line-ending handling.
- `check-fixtures.mjs`/`run-headless.mjs`: detect bash availability and skip cleanly with an actionable message on Windows, instead of a cryptic exec failure — closes the environmental gap noted in the `0.1.3` entry below.
- `evals/cases/traceability-linking.md`'s two pre-existing "unlinked requirement" warnings (`ARCH-001`/`UX-001` — illustrative template IDs in `architecture.md`/`uxflow.md`'s own instructions, not real project data) resolved by adding a downstream `wingman:req` marker in `implementation-planning.md`; re-verified via a real re-run of `check-traceability.mjs` (0 warnings).

### Added
- 5 new eval cases + fixtures for the pipeline-stage commands (`discovery`, `define`, `architecture`, `uxflow`, `implementation-planning`).
- `docs/audit/` — a 9-document deep audit dossier (strategic, operational, governance, architecture/data, user flows, security/compliance, operational playbooks, testing/quality, artifacts glossary).

### Maintenance
- `plugin.json` bumped `0.5.6` → `0.5.7`. (Backfilled here — the merging PR bumped the version without a matching CHANGELOG entry, the same drift pattern the `0.5.8` entry above independently fixed elsewhere in this file.)

## [0.5.6] - 2026-07-17

### Added
- **`skills/output/visual-founder-output`** (38 → 39 skills): adaptive visual layer on top of `plain-language-checkpoint` — detects the current session's rendering capability (an Artifact-capable surface vs. a plain terminal) before choosing between a real rendered wireframe/dashboard (Tier A) or a universal Mermaid/ASCII fallback (Tier B), never assumes. Extends `commands/pipeline/uxflow.md` (a real flow diagram alongside the existing `UX-*` table) and `commands/adaptive/boardroom.md` (a "Where you are" pipeline-status view rendered fresh from `.wingman/state.json`/`checkpoints.jsonl`, plus an optional seat-verdict grid).
- **`references/visual-output-templates.md`**: the concrete Mermaid/ASCII/Tier-A templates the new skill uses.

### Maintenance
- `plugin.json` bumped `0.5.5` → `0.5.6` (39 skills).

## [0.5.4] - 2026-07-15

### Fixed
- Architecture audit + full remediation loop: closed all findings (Proven + Emerging) from a self-audit pass. See `docs/ARCHITECTURE.md`'s version history and `docs/PROJECT.md`'s decisions log for details.

## [0.5.1] - 2026-07-15

### Added
- Promoted `git-pr-workflow` skill; closed idle pnpm proposal; closed a 12-case eval-coverage backlog.

## [0.5.0] - 2026-07-15

### Added
- Dogfooding as a first-class mechanism (`commands/adaptive/dogfood.md`, `skills/governance/dogfood-gap-classification`).
- AI-native structured logging (`wingman:log` markers across `LEARNINGS.md`/`docs/wingman/retros.md`/decisions log/`docs/HUMAN-TODOS.md`).
- `git-pr-workflow` skill (draft-PR/CI-poll/squash-merge-resync procedure, built on plain `git` + `gh`).

## [0.3.1] - 2026-07-15

### Fixed
- Management Board activation threshold was miscounting the always-active Product/Engineering/QA departments toward its 3+ conditionally-activated-department gate; now only Design/Data/Legal-Security/DevOps/Growth count.

## [0.3.0] - 2026-07-15

### Changed — MVP1 + MVP2 rearchitecture
- **MVP1**: Boardroom rearchitected from 5 seats to 7 + Design — `boardroom-founder`/`boardroom-engineer`/`boardroom-security`/`boardroom-cost` replaced by `boardroom-ceo`/`boardroom-cto`/`boardroom-ciso`/`boardroom-cfo`, plus new `boardroom-cpo`/`boardroom-cmo`/`boardroom-research` seats. New Management Board layer (9 manager roles, complexity-gated). New Agent Permission Model (`permissions:` frontmatter field on every agent template).
- **MVP2**: replaced the 4-stage `plan`/`build`/`secure`/`ship` pipeline with 7 named stages (`discovery`/`define`/`architecture`/`uxflow`/`implementation-planning`/`build`/`ship`), while reducing founder-visible checkpoints from 4 to 3 (5 planning stages bundle into one Planning Milestone checkpoint). `secure.md` retired as a standalone command; its threat-register discipline moved into `build.md`'s Definition-of-Done gate. New traceability engine (`skills/governance/traceability-linking`, `scripts/check-traceability.mjs`) and deterministic Definition-of-Done structural gate (`hooks/dod-structural-gate.mjs`).
- Closed 15 eval-coverage gaps flagged by `wingman-health.mjs`.

See `docs/ARCHITECTURE.md` §10 (v13-v16) and `docs/PROJECT.md`'s decisions log for full detail on this and the following three releases.

## [0.1.8] - 2026-07-13

### Added — gap-closure batch 6 (cross-cutting: secrets policy + persona library, gap G12)
- **`references/secrets-policy.md`**: the single secrets-handling reference — never persist live keys, use a secret manager, the `secret-guard`/`secret-scanner`/`prompt-guard` hooks enforce at runtime, rotate-on-exposure (pairs with `/wingman:incident`), `gh secret set` guidance.
- **`references/persona-template.md`**: copy-paste scaffold for adding future advisor personas (legal/ops/product) with the required anatomy (`name` + `Use when` + Rationalizations/Red Flags/Verification) and the parallel-fan-out command pattern from `/wingman:advisory`.
- Closes the **last gap (G12)** in the original G1–G12 ledger. `plugin.json` bumped `0.1.7` → `0.1.8`.

### Maintenance
- 112/112 → 114/114 tests pass (added G12 reference-doc tests); `validate-structure` → 0 warnings; `check-repo-consistency` → PASS.

## [0.1.7] - 2026-07-13

### Added — gap-closure batch 5 (incident-response skill + command, gap G11)
- **`skills/response/incident-response`** + **`commands/adaptive/incident.md`** (`/wingman:incident`): a calm, ordered runbook for when production is broken or a security event is underway — stabilize, contain (rotate exposed keys), triage, diagnose, communicate, then fix + prevent. Sequencing is the point: stabilize before debugging. Meets the project skill standard.
- `GAPS.md` (G11) marked shipped; `plugin.json` bumped `0.1.6` → `0.1.7` (33 skills, 19 commands); `CLAUDE.md` command list updated.

### Maintenance
- 108/108 → 112/112 tests pass (added incident-response skill anatomy + command tests); `validate-structure` → 0 warnings; `check-repo-consistency` → PASS.

## [0.1.6] - 2026-07-13

### Added — gap-closure batch 4 (simplify skill, gap G10)
- **`skills/discipline/simplify`**: a post-change tidy-up pass — remove duplication, collapse indirection, delete dead branches, and undo needless cleverness before code sets. Renders a simplification *plan* and never edits working code silently; pairs with `engineering-minimalism` and `/wingman:harness`'s bloat checks. Adapted from `obra/superpowers`' simplify discipline (MIT), restated in Wingman's own words. Meets the project skill standard.
- `GAPS.md` (G10) marked shipped; `plugin.json` bumped `0.1.5` → `0.1.6` (32 skills).

### Maintenance
- 105/105 → 108/108 tests pass (added simplify anatomy tests); `validate-structure` → 0 warnings; `check-repo-consistency` → PASS.

## [0.1.5] - 2026-07-13

### Added — gap-closure batch 3 (code-review skill, gap G9)
- **`skills/mechanics/code-review`**: a plain-language second pass on code quality before ship — correctness, security, simplicity, and test coverage called out in founder terms. Reviews the diff only, rates findings (Blocker / Should-fix / Nit), and returns a one-line bottom line; it never edits code itself. Complements the engineering Boardroom seat and `/wingman:audit`. Meets the project skill standard (name + `Use when` description + Rationalizations/Red Flags/Verification).
- `GAPS.md` (G9) marked shipped; `plugin.json` bumped `0.1.4` → `0.1.5` (31 skills).

### Maintenance
- 102/102 → 105/105 tests pass (added code-review anatomy tests); `validate-structure` → 0 warnings; `check-repo-consistency` → PASS.

## [0.1.4] - 2026-07-13

### Added — gap-closure batch 2 (output secret-scanner, gap G4)
- **`hooks/secret-scanner.mjs`** (`PostToolUse`, matchers Bash/Read/Write/Edit/NotebookEdit): defense-in-depth companion to `secret-guard` (G1). Scans a tool's *response* for surfaced secrets (AWS keys, GitHub PATs, `sk-` keys, PEM private keys, `ANTHROPIC_API_KEY=`) and warns the founder via stderr. **Warn-only by design** — it never blocks legitimate reads, avoiding the over-block trap fixed in v12. Pure `scan()`/`redact()`/`findSecrets()` are unit-tested.
- Wired into `hooks/hooks.json` `PostToolUse`.
- `GAPS.md` (G4) marked shipped; `plugin.json` bumped `0.1.3` → `0.1.4`.

### Maintenance
- 97/97 → 102/102 tests pass (added secret-scanner hook assertion + unit + integration tests); `validate-structure` → 0 warnings; `check-repo-consistency` → PASS.

## [0.1.3] - 2026-07-13

### Added — gap-closure batch 1 (curated founder-lens vendor mining)
- **Founder Intelligence**: `skills/knowledge/memory` (durable cross-session memory) and `skills/knowledge/research` + `commands/adaptive/research.md` (source-grounded, cited briefs).
- **Business Advisory**: `skills/personas/founder-cfo` / `founder-cmo` / `founder-cro` (plain-language finance/marketing/revenue verdicts) and `commands/adaptive/advisory.md` (parallel fan-out-merge of all three, mirroring `/wingman:boardroom`).
- **Safety Hooks (gaps G1–G3)**: `hooks/secret-guard.mjs` (`PreToolUse` Bash/Write/Edit/NotebookEdit — blocks destructive commands and secret writes), `hooks/stop-loop.mjs` (`Stop`, opt-in autonomous loop via `.wingman/loop.json`), `hooks/prompt-guard.mjs` (`UserPromptSubmit`, prompt-injection defense). All three wired into `hooks/hooks.json`.
- **Gap catalog**: `docs/wingman/GAPS.md` — living, founder-lens gap ledger (G1–G12) produced by the vendor-mining loop; drives future batches.
- **Vendors added** (reference-only submodules): `alirezarezvani/claude-skills`, `jeremylongshore/claude-code-plugins-plus-skills`, `ComposioHQ/awesome-claude-skills`, `avelikiy/great_cto`. `ATTRIBUTIONS.md` updated.

### Maintenance
- 30 skills, 18 commands, 5 agents. `plugin.json` bumped `0.1.2` → `0.1.3`.
- 97/97 tests pass (added secret-guard / stop-loop / prompt-guard unit + integration tests); `validate-structure` → 0 warnings; `check-repo-consistency` → PASS.
- **Known (pre-existing, environmental) failure**: `scripts/check-fixtures.mjs` errors on Windows because it shells out to `/bin/bash` for `evals/fixtures/*.sh`; unrelated to this change and not part of CI (CI runs validate/actionlint/install-smoke/version-gate only).

## [0.1.2] - 2026-07-13

### Added — vendor pattern integration (v9–v12)
- **v9 — Subagent-Driven Development**: fresh subagent per task with a post-task spec + quality review (`commands/pipeline/build.md`, `skills/discipline/subagent-driven-development`).
- **v10 — Doc-Index**: discoverable index discipline so `references/*.md` stay findable and cited (`skills/knowledge/doc-index`).
- **v11 — Council**: four-voice decision council for ambiguous calls (`commands/council.md`, `skills/response/council`).
- **v12 — TDD + Maintenance**:
  - Red-green-refactor TDD (`skills/discipline/test-driven-development`, `skills/mechanics/testing-patterns`, `references/testing-patterns.md`) with an 80% coverage floor.
  - 5 skill descriptions rephrased to the `Use when...` trigger form (ponytail-debt-harvesting, platform-native-reference, verification-loop, interview-one-question-at-a-time, evidence-gated-catalog); `## Verification` added to `interview-one-question-at-a-time`.
  - Security/threat-register re-schematization (`commands/secure.md`, `skills/governance/security-checklist`) with a mandated `Disposition / Acceptance` column.
  - Over-engineering 5-tag taxonomy (`commands/adaptive/over-engineering-review.md`), whole-repo bloat audit (`commands/adaptive/bloat-audit.md`), and a debt ledger (`commands/adaptive/debt-ledger.md`).
  - Ponytail-derived minimalism tooling: `engineering-minimalism`, `platform-native-reference`, `ponytail-debt-harvesting`, `verification-before-completion` enhancements, `definition-of-done`.

### Fixed
- **Critical (found by `/wingman:audit`)**: `boardroom-checkpoint.mjs`'s `ExitPlanMode` gate over-blocked — it validated required sections against *every* source including inline plan text (which has no section headers), denying every ExitPlanMode. Now each source is judged independently and an approved checkpoint requires the marker **+** `ship it` **+** all 7 sections. Regression test added in `tests/hooks-integration/hooks-integration.test.mjs`.

### Security
- `/wingman:secure` threat register re-schematized; `threats_open = 0` at release.
- `/wingman:harness` gained bloat (files >200 lines, functions >50 lines) and debt-ceiling (`// minimal:` ceiling hits) checks.

### Maintenance
- 85/85 tests pass (84 + 1 regression); `validate-structure` → 0 warnings; `check-repo-consistency` → PASS.
- `/wingman:audit` (systematic-auditing, 4 parallel subagents), `/wingman:retro`, and `/wingman:learn` artifacts written under `docs/wingman/`.
- `ATTRIBUTIONS.md` provenance record covers all 16 vendor repos.

## [0.1.1] - 2026-07-08
- Initial shipped plugin: 13 `wingman:*` pipeline/adaptive commands, 5 `boardroom-*` agents, 10 skills, the `boardroom-checkpoint.mjs` hook, and the mechanical validators. (See `docs/PROJECT.md` decisions log for the full history.)
