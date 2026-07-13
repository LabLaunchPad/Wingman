# Changelog

All notable changes to the Wingman Claude Code plugin.

## [0.1.4] - 2026-07-13

### Added — gap-closure batch 2 (output secret-scanner, gap G4)
- **`hooks/secret-scanner.mjs`** (`PostToolUse`, matchers Bash/Read/Write/Edit/NotebookEdit): defense-in-depth companion to `secret-guard` (G1). Scans a tool's *response* for surfaced secrets (AWS keys, GitHub PATs, `sk-` keys, PEM private keys, `ANTHROPIC_API_KEY=`) and warns the founder via stderr. **Warn-only by design** — it never blocks legitimate reads, avoiding the over-block trap fixed in v12. Pure `scan()`/`redact()`/`findSecrets()` are unit-tested.
- Wired into `hooks/hooks.json` `PostToolUse`.
- `GAPS.md` (G4) marked shipped; `plugin.json` bumped `0.1.3` → `0.1.4`.

### Maintenance
- 97/97 → 102/102 tests pass (added secret-scanner hook assertion + unit + integration tests); `validate-structure` → 0 warnings; `check-repo-consistency` → PASS.

## [0.1.3] - 2026-07-13

### Added — gap-closure batch 1 (curated founder-lens vendor mining)
- **Founder Intelligence**: `skills/memory` (durable cross-session memory) and `skills/research` + `commands/research.md` (source-grounded, cited briefs).
- **Business Advisory**: `skills/founder-cfo` / `founder-cmo` / `founder-cro` (plain-language finance/marketing/revenue verdicts) and `commands/advisory.md` (parallel fan-out-merge of all three, mirroring `/wingman:boardroom`).
- **Safety Hooks (gaps G1–G3)**: `hooks/secret-guard.mjs` (`PreToolUse` Bash/Write/Edit/NotebookEdit — blocks destructive commands and secret writes), `hooks/stop-loop.mjs` (`Stop`, opt-in autonomous loop via `.wingman/loop.json`), `hooks/prompt-guard.mjs` (`UserPromptSubmit`, prompt-injection defense). All three wired into `hooks/hooks.json`.
- **Gap catalog**: `docs/wingman/GAPS.md` — living, founder-lens gap ledger (G1–G12) produced by the vendor-mining loop; drives future batches.
- **Vendors added** (reference-only submodules): `alirezarezvani/claude-skills`, `jeremylongshore/claude-code-plugins-plus-skills`, `ComposioHQ/awesome-claude-skills`, `avelikiy/great_cto`. `ATTRIBUTIONS.md` updated.

### Maintenance
- 30 skills, 18 commands, 5 agents. `plugin.json` bumped `0.1.2` → `0.1.3`.
- 97/97 tests pass (added secret-guard / stop-loop / prompt-guard unit + integration tests); `validate-structure` → 0 warnings; `check-repo-consistency` → PASS.
- **Known (pre-existing, environmental) failure**: `scripts/check-fixtures.mjs` errors on Windows because it shells out to `/bin/bash` for `evals/fixtures/*.sh`; unrelated to this change and not part of CI (CI runs validate/actionlint/install-smoke/version-gate only).

## [0.1.2] - 2026-07-13

### Added — vendor pattern integration (v9–v12)
- **v9 — Subagent-Driven Development**: fresh subagent per task with a post-task spec + quality review (`commands/build.md`, `skills/subagent-driven-development`).
- **v10 — Doc-Index**: discoverable index discipline so `references/*.md` stay findable and cited (`skills/doc-index`).
- **v11 — Council**: four-voice decision council for ambiguous calls (`commands/council.md`, `skills/council`).
- **v12 — TDD + Maintenance**:
  - Red-green-refactor TDD (`skills/test-driven-development`, `skills/testing-patterns`, `references/testing-patterns.md`) with an 80% coverage floor.
  - 5 skill descriptions rephrased to the `Use when...` trigger form (ponytail-debt-harvesting, platform-native-reference, verification-loop, interview-one-question-at-a-time, evidence-gated-catalog); `## Verification` added to `interview-one-question-at-a-time`.
  - Security/threat-register re-schematization (`commands/secure.md`, `skills/security-checklist`) with a mandated `Disposition / Acceptance` column.
  - Over-engineering 5-tag taxonomy (`commands/over-engineering-review.md`), whole-repo bloat audit (`commands/bloat-audit.md`), and a debt ledger (`commands/debt-ledger.md`).
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
