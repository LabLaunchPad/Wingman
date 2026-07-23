# Changelog

All notable changes to the Wingman Claude Code plugin.

## [0.6.4] - 2026-07-23

### Added
- **Swarm-Intelligence Predictive Layer** (`/wingman:predict` adaptive command and `skills/swarm-predictive-layer`) — systematic multi-agent simulation model inspired by PSO/ACO/GWO/OASIS. Evaluates code connectivity, import blast radiuses, dependency cascades, and specialist-agent promotion needs in plain, consequence-first language.
- **Agent-Weakness Coverage Benchmark Fixes** — resolved the broken references and status mismatches inside `docs/AGENT-WEAKNESS-BENCHMARK.md` caused by the flat-skills-layout refactoring in `0.6.3`. Running `node scripts/wingman-metrics.mjs` now successfully reports 100% path coverage and 0 status mismatches.

## [0.6.3] - 2026-07-23

### Changed
- **Flattened `plugins/wingman/skills/<category>/<name>/SKILL.md` to `plugins/wingman/skills/<name>/SKILL.md`** for all 40 skills — the deferred follow-up named in `0.6.1`'s native-install finding. Matches the flat layout precedent multi-harness repos use and lets Codex CLI's native `codex plugin add` install cache (which reads this tree directly) mirror the real structure with zero nesting mismatch. `plugin.json`'s `skills` array, ~90 files' cross-references, `generate-harness-adapters.mjs`'s `listSkills()` (previously hardcoded to 2-level nesting), and root `AGENTS.md`'s category table (now a conceptual grouping, not folder-backed) all updated. A real regression was caught during this pass — two test files independently hardcoded category-qualified skill paths outside the original update's scope — found via a full `node --test` run and fixed. Live-install re-verified: OpenCode and Codex CLI both still discover all 40 skills under the new flat layout; Codex's plugin cache now genuinely mirrors it. See `docs/ARCHITECTURE.md` §8b and `docs/PROJECT.md`'s decisions log for the full account.

## [0.6.2] - 2026-07-23

### Fixed
- **`generate-harness-adapters.mjs`'s `ParallelDispatch` detection missed a word-order/line-break variant.** An independent code review (before merging PR #90) found `skills/response/council/SKILL.md` describes genuine parallel subagent dispatch ("Launch three independent voices in parallel... Each subagent...") but the regex required "parallel" to precede the trigger word within one line — missed both the reverse word order and the case where the gap crosses a line break (`.` doesn't match `\n` without the `s` flag). Fixed both; `council`, `boardroom`, and 3 other previously-under-flagged skills/commands now correctly carry the harness note.
- **`listCommands()` hardcoded `['pipeline', 'adaptive']`** as the only scanned command categories — silently would have skipped a new category directory with no error. Now scans all subdirectories dynamically, matching `listSkills()`'s existing pattern.
- **`generate-eval-manifest.mjs`'s `COVERS_SENTENCE_RE`** could fail to match at all on a "Tests \`a.md\` and \`b.md\`" line with no em-dash/period before EOF. Added an unconditional end-of-string fallback to the lookahead.

## [0.6.1] - 2026-07-23

### Changed
- **Documented Codex CLI's native plugin-install path as the recommended route for that harness** (`plugins/wingman/references/harness-adapters/codex-cli/README.md`), superseding the generated `.agents/skills/` copy as the primary method. Verified live against the real repo: `codex plugin marketplace add <repo>` + `codex plugin add wingman@wingman` reads Wingman's existing, unmodified `marketplace.json`/`plugin.json` directly — no adapter, no copying — and correctly discovers all ~40 skills from the cached install. Found via stress-testing the prior harness-parity work against real precedent repos (`wshobson/agents`'s shared-content-plus-manifest-pointer pattern). Also disclosed an undocumented, partial Codex behavior (auto-migrates 4 of 24 commands into synthetic skills, no confirmed selection rule) rather than relying on it. See `docs/ARCHITECTURE.md` §8b's addendum and `docs/PROJECT.md`'s decisions log for the full finding, including a real, evidence-backed, deliberately-deferred flat-skills-layout follow-up.

## [0.6.0] - 2026-07-23

### Added
- **Full Codex CLI / OpenCode command+skill parity** (`plugins/wingman/references/harness-adapters/`), expanded from the prior Boardroom-seats-only scope on explicit founder request. New `plugins/wingman/scripts/generate-harness-adapters.mjs` generates all 40 skills to a shared `.agents/skills/` path both harnesses read natively, all 24 commands to `.opencode/commands/` for OpenCode, and a `commands-as-agents-md.md` reference for Codex CLI (which has no native command-file primitive, confirmed by direct CLI inspection). Regenerate-and-diff checked in CI (`validate.yml`) so it can't silently drift. Structurally verified against real live installs (`opencode-ai@1.18.4`, `@openai/codex@0.145.0`): all 40 skills and 24 commands confirmed discovered. See `docs/ARCHITECTURE.md` §8b and `harness-adapters/README.md` for full detail, including a disclosed Codex CLI concurrency-count discrepancy (4 vs. a previously-cited 6) and the remaining gap (live model-inference verification needs founder-provided API credentials, tracked in `docs/HUMAN-TODOS.md`).

## [0.5.39] - 2026-07-23

### Fixed
- **`skills/governance/evolve-promotion/SKILL.md`** — step 3's classification rule let a subagent commit to "skill" vs. "specialist agent" via an abstract judgment call before ever checking `references/specialist-catalog.md` for a concrete matching row, even when the catalog's own worked example directly names the correct answer. Found by a real fresh-subagent simulation testing the `/wingman:evolve` command wrapper (previously untested — only the skill itself had eval coverage): given the migration-rollback fixture, it misclassified the pattern as a new skill instead of the "Migration Engineer" specialist the catalog explicitly names for this exact scenario. Fixed by making the catalog-first priority explicit; re-verified with a second independent subagent run.

## [0.5.38] - 2026-07-23

### Changed
- **`plugins/wingman/references/harness-adapters/opencode/`** — verification status upgraded from `authored, unverified` to a new `structurally verified (live install)` tier after installing real OpenCode (v1.18.4) and Codex CLI (v0.145.0) in this dev sandbox for the first time. Confirmed: all 8 Boardroom seat files are discovered/parsed/loaded correctly, `boardroom-ceo.md`'s deny-edit/deny-bash permissions are genuinely enforced, and `wingman-gate.js` is registered with its hook name/matched tool name independently confirmed against real sources. Live model inference remains unverified (no configured API key in this sandbox). Codex CLI stays `authored, unverified` at the runtime level — no config-listing command exists to confirm agent-file recognition the way OpenCode's does.

## [0.5.37] - 2026-07-22

### Fixed
- **`version-gate` CI check** — the previous commit edited `plugins/wingman/commands/pipeline/discovery.md` (a real shipped-content change: a new project-type-consult line) without bumping `plugin.json`'s version, incorrectly assuming an edit to an *existing* file didn't count. The gate is scoped to any change under `plugins/wingman/commands/**` (among other paths) regardless of whether it's a new file or an edit — bumped `0.5.36` → `0.5.37`.

## [0.5.36] - 2026-07-22

### Added
- **`plugins/wingman/references/org-template/`** — a narrow, evidence-scoped slice of a much larger "master repo blueprint" restructuring proposal: a project-type catalog + 7 short playbooks (website/freelancing/mini-saas/full-saas/ai-agent/automation/internal-tool), plus `founder-preferences.md` and `capability-map.md` guidance docs. Cited from `commands/pipeline/discovery.md` (project-type consult) and `skills/knowledge/memory` (what's worth persisting to `MEMORY.md`). An audit found the original ~60-file proposal would have violated `skills/governance/evidence-gated-catalog` (speculative bulk creation, no consumer for most files) and reversed a 2026-07-18 decision that already declined a similarly-shaped restructuring (`docs/ARCHITECTURE.md` §8a) — see `docs/PROJECT.md`'s decisions log for the full scoping trail and the founder decisions (Scope A / Placement B / Adapter A / Tools A) that bounded this to reference content only, with no new command, script, or dependency.

## [0.5.35] - 2026-07-22

### Changed
- **`plugins/wingman/skills/{mechanics/package-manager-selection,mechanics/testing-patterns,knowledge/doc-index,knowledge/token-economy}/SKILL.md`** — added `effort: low` frontmatter to four mechanical, checklist-shaped skills, per 2026 research into Claude Code's per-skill effort tiering (a token/latency-saving hint, no behavior change). `governance/security-checklist` was considered and deliberately excluded — its own description frames it as "a concrete risk hunt, not a generic checklist recitation," so tiering it down would work against its stated purpose.
- Repo-root `AGENTS.md` is now the canonical file (absorbing `CLAUDE.md`'s former content) and `CLAUDE.md` is a symlink to it, aligning with the AGENTS.md open standard's own convention (donated to the Linux Foundation's Agentic AI Foundation, December 2025) and a real multi-harness precedent (`wshobson/agents`). Dev-repo-only doc reorganization — no shipped-surface behavior change. See `docs/ARCHITECTURE.md` §8a for the accompanying re-confirmation that execution-level multi-harness portability stays out of scope, and why.

## [0.5.34] - 2026-07-22

### Fixed
- **`plugins/wingman/commands/adaptive/debt-ledger.md`** — found by a real `harvest` run in `evals/cases/debt-ledger.md`'s Run 2: the `harvest` step never reconciled `DEBT.md` after applying an upgrade, so a harvested item's ledger row silently kept showing `OPEN`/`HIT` even though the code had already been fixed. Added a 5th `harvest` step + a matching Rules-section invariant requiring the `DEBT.md` row be set to `RESOLVED` in the same pass that removes the `// minimal:` comment.

## [0.5.33] - 2026-07-22

### Changed
- **`plugins/wingman/references/harness-adapters/codex-cli/`** — a follow-up audit fetched OpenAI's official Codex hooks docs directly, confirming two previously-unconfirmed items in `.codex/hooks.json`: the `Bash` PreToolUse matcher (now confirmed a real tool name) and the Write/Edit-matcher path's matcher *values* (`apply_patch`/`Edit`/`Write`, all confirmed valid — the hook input's `tool_name` always reports `apply_patch`). `secret-guard.mjs`'s actual payload scan remains deliberately unwired, since the `tool_input` JSON field name carrying patch content still isn't confirmed by the fetched docs. Updated `codex-cli/README.md`, `.codex/hooks.json`'s inline comments, and the parent `harness-adapters/README.md`.

## [0.5.32] - 2026-07-22

### Added
- **`plugins/wingman/scripts/check-harness-adapter-drift.mjs`** — a mechanical structural check (seat coverage, `opus`-tier consistency, VERDICT-block presence) between the canonical `plugins/wingman/agents/boardroom-*.md` files and their hand-authored Codex CLI/OpenCode translations under `plugins/wingman/references/harness-adapters/`. Closes a real gap: those adapters were "authored, unverified" with no mechanism to notice future drift. Wired into `.github/workflows/validate.yml`. Adopted after studying 4 real community "agent-agnostic" plugin repos (see `docs/ARCHITECTURE.md` §8c, `ATTRIBUTIONS.md`) — the single most valuable, proportionate practice found (`wshobson/agents`' `make garden` drift detector; `fusengine/harness`'s adapter/policy-core split), deliberately in mechanical form rather than a full prose-regeneration engine.

## [0.5.31] - 2026-07-22

### Fixed
- **`plugins/wingman/scripts/okf-export.mjs`** — found by a `/wingman:audit` pass: `assertSafeToWipe` only refused the filesystem root and the user's home directory exactly, so `--out` equal to (or an ancestor of) `--project-dir` silently wiped the entire project via `rmSync` before writing the bundle. Reproduced directly (a real file was deleted from a scratch project) before fixing. Now also refuses when `--out` resolves to the project directory or any of its ancestors.
- **`plugins/wingman/hooks/secret-guard.mjs`** — the Anthropic-key pattern (`sk-[A-Za-z0-9]{20,}`) never matched a real Anthropic key's actual hyphen-delimited shape (`sk-ant-api03-<...>-<...>`) despite the inline comment claiming coverage. Added a dedicated pattern; verified with a constructed real-shaped key.
- **`plugins/wingman/commands/pipeline/{discovery,define,architecture,uxflow}.md`** — each said "Nth of Wingman's 7 planning stages," but only 5 of the 7 total pipeline stages are planning stages (build/ship are execution, not planning); `implementation-planning.md` already correctly said 5. Corrected the other four.
- **`docs/PROJECT.md`** — its own "live count" pointer had drifted within 4 days of being written (said 68 cases/68 verified/0 provisional "as of 2026-07-18"; live was 70/54/16). Corrected and reworded to stop implying a snapshot number would stay current.

### Added
- New regression tests in `tests/hooks-integration/hooks-integration.test.mjs`: "OKF Export — Wipe-Target Safety" (3 tests) and a bare-Anthropic-key test for `secret-guard`'s `decide()`.

## [0.5.30] - 2026-07-21

### Fixed
- **`plugins/wingman/hooks/dod-structural-gate.mjs`** — found by the first genuinely interactive founder-mode dogfood run (real `AskUserQuestion` calls to an actual human, exercising the real `git push` gate against live, evolving project state for the first time): the threat-register check only matched the literal substring `"OPEN"`, so any other status word (including an honestly-wrong `"PENDING"` for a genuinely unresolved risk) silently passed the gate; replaced with a real, section-scoped table parse (`extractThreatRegisterSection` + `findUnresolvedThreatRows`) that locates the Status column dynamically and flags anything other than exactly `CLOSED`. Also, `checkTestPresence` only recognized a test file matching the source file's own basename, wrongly flagging a file with full, real coverage split across several behavior-named test files; added `anyTestFileReferencesSource`, a content-based fallback checking whether any test file actually imports/requires the source module.

### Added
- New unit tests in `tests/hooks-integration/hooks-integration.test.mjs`: "DoD Gate — Threat Register Status Parsing" (5 tests) and "DoD Gate — Test Presence for Behavior-Split Suites" (2 tests).

## [0.5.29] - 2026-07-21

### Fixed
- **`plugins/wingman/scripts/install-git-hooks.mjs`** — found by a real `/wingman:audit` pass against PR #72's own just-merged content (never independently reviewed before): a shell-quoting gap (the generated pre-push hook interpolated `repoDir` into a double-quoted `/bin/sh` string with no escaping — a path containing `"`/`` ` ``/`$` could break out of the quoting), fixed with proper POSIX single-quote escaping and re-tested with a real path containing a literal `'` pushed through a real git remote; and a missing try/catch around `readFileSync` on an existing hook path, which crashed with a raw Node stack trace on a directory/unreadable hook instead of the script's own graceful-error convention.
- **`AGENTS.md`** (root) — Repository map's "references/ ... stay flat" claim was stale as of PR #72, which added the genuinely nested `references/harness-adapters/` subtree.

### Added
- **`tests/install-git-hooks/install-git-hooks.test.mjs`** — 10 real regression tests for `install-git-hooks.mjs`'s install/uninstall/idempotency/foreign-hook logic, closing a real zero-coverage gap the same audit pass found.

## [0.5.28] - 2026-07-21

### Added
- **`plugins/wingman/references/harness-adapters/`** — scoped Codex CLI / OpenCode portability adapters, built after real web research invoked `docs/ARCHITECTURE.md` §8a's own "revisit if a specific harness with this gap is actually targeted" escape hatch. 8 Boardroom seat personas translated into each harness's native agent format (Codex CLI `.codex/agents/*.toml`, OpenCode `.opencode/agent/*.md`), plus a real OpenCode plugin port of the `boardroom-checkpoint.mjs` plan-approval gate (`opencode/.opencode/plugin/wingman-gate.js`, matched against OpenCode's `plan_exit` tool — a genuine structural analog of `ExitPlanMode` that Codex CLI lacks). Every artifact is labeled by verification status (`built + tested` / `authored, unverified` / `not attempted, documented why`) rather than overclaiming — neither harness is installed in this dev repo. Full citation list and scope boundaries in that directory's own `README.md`.
- **`plugins/wingman/scripts/install-git-hooks.mjs`** — idempotent, opt-in installer wiring the existing `dod-pre-push-check.mjs` up as a real `.git/hooks/pre-push` hook. The one **built and tested** artifact from this investment: verified end-to-end in a scratch git clone (install → allow with no checkpoint → block on a real `DO NOT SHIP` checkpoint → clean uninstall). Fires under any coding-agent harness or a human, since it's git's own hook mechanism.
- **`plugins/wingman/AGENTS.md`** — nested, package-scoped `AGENTS.md` per the monorepo "nearest wins" convention (immutable-slug rules, per-file-type frontmatter schema, the 4 validators, a pointer to the harness-adapters directory), separate from root `AGENTS.md`'s cross-repo navigation content.

### Fixed
- **`docs/ARCHITECTURE.md` §8a** — corrected a partially-stale claim ("most other harnesses lack native parallel subagent dispatch"): Codex CLI's subagents went GA (6 concurrent) with the 2026 GPT-5.5 release, and OpenCode has a documented Task tool plus a parallel general-purpose agent. New §8b documents the adapters above and what was deliberately not attempted (full command/skill porting; guessing Codex's unconfirmed Write/Edit tool-name strings; a confirmed single-message N-way fan-out primitive for either harness).

## [0.5.27] - 2026-07-21

### Fixed
- **`plugins/wingman/skills/mechanics/git-pr-workflow`** — added a Step 0 ("confirm you're not on `main`" before the first edit/commit of a new round of work) and a Step 5 (the "required status checks are expected" merge-blocked-by-base-drift race: update the branch, then wait for checks to actually re-run before retrying — don't retry immediately). Both found from real, self-caught friction this session, not speculative: a commit landed directly on local `main` mid-session (caught before pushing, recovered cleanly), and the base-drift merge race recurred repeatedly across this project's real PR history (one PR needed the fix re-applied 4+ times). `LEARNINGS.md` gets a new entry (occurrence=3) cross-referencing the existing, structurally identical "pipeline stages must create the feature branch before the first commit, not after" lesson (occurrence=2) — same root cause, different context (this project's own dev-repo session workflow vs. a founder pipeline command).
- **`plugins/wingman/scripts/query-founder-knowledge.mjs`** — found via a real multi-session dogfood run (4 simulated session boundaries, each reading the tool's output cold): `state.json`'s `current_stage` could silently drift from the last checkpoint's own `next_stage` field with nothing to catch it. Checkpoint entries now expose `next_stage`; `summary()` compares it against `state.json` and returns a `state_stage_mismatch` field when they disagree. Verified both directions (no false positive on correct state; a direct catch when the drift was reintroduced for testing). See `docs/PROJECT.md`'s decisions log for the full run log — the same dogfood run also confirmed a fresh "session" correctly halts on a `DO NOT SHIP` verdict read back from `--summary` alone, closing the "not yet verified whether a later session reads this back" gap the prototype shipped with.

## [0.5.25] - 2026-07-21

### Fixed
- **Real full-pipeline maintainer-mode dogfood run** (`evals/dogfood-runs/2026-07-21T04-00-00Z-simple.json`) — Discovery through Ship, all 3 Boardroom checkpoints dispatched for real (24 Agent-tool calls), real TDD, real gate-dormancy confirmation. Found and fixed 2 real gaps: `plugins/wingman/commands/pipeline/build.md` had no proportionality carve-out for a genuinely single-task plan (2nd consecutive occurrence — always-active `dept-qa` never got created for a 1-task change); `plugins/wingman/commands/adaptive/dogfood.md` didn't require a checkpoint re-verification dispatch to include the actual on-disk file path, which caused a real spurious `NO_GO` (the CISO seat correctly refused to certify a diff it couldn't locate — the dispatch, not the seat, was the gap). A third finding (a session skipping `build.md`'s branch-creation step) deliberately got **no new hook** — `ship.md`'s existing preflight backstop caught and recovered from it exactly as designed, and `dogfood-gap-classification`'s cooling-off rule explicitly warns against hardening something that already worked. Full retro in `docs/wingman/retros.md`.

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
