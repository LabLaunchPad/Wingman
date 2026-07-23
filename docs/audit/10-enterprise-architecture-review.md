# Enterprise Architecture Review — Evidence-First Structural Audit

**Date**: 2026-07-23
**Scope**: Repository-wide structural audit against an evidence-first, harness-agnostic, enterprise-grade target model.
**Verdict up front**: the repo already implements most of the requested separation. The one big-bang move implied by a naive read of the brief — flatten everything into top-level `core/` + `adapters/` — is **not evidenced** and would violate this document's own truth rules (CLAUDE.md is explicit: *"Wingman ships as a Claude Code plugin specifically"*; a rename to a harness-neutral `core/` would fight that stated identity for zero recorded friction). This review therefore separates **what to keep** (already correct, would be pure churn to change) from **what to actually fix** (real boundary violations with evidence).

---

## 1. Architectural diagnosis

### 1.1 What the repo already gets right (verified against source, not assumed)

| Requirement from the brief | Current implementation | Evidence |
|---|---|---|
| Shipped vs. never-ships boundary | `plugins/wingman/` ships; root `scripts/`, `docs/`, `evals/`, `tests/`, `vendor/` never ship | `check-repo-consistency.mjs` + `install-smoke.yml` CI proves no `node_modules`/dev files leak into the installable surface |
| Adapter isolation | `plugins/wingman/references/harness-adapters/` holds Codex CLI / OpenCode bindings, mirrored 1:1 against canonical `agents/boardroom-*.md` | `plugins/wingman/scripts/check-harness-adapter-drift.mjs` mechanically checks drift on every change |
| Governance separately located, maintainer-visible | `docs/GOVERNANCE.md` is a pure cross-reference index; actual rules live with their enforcement (promotion in `skills/governance/evolve-promotion`, security in `skills/governance/security-checklist`) | Read directly |
| Evidence-gated promotion | `skills/governance/evidence-gated-catalog`, `skills/governance/dogfood-gap-classification`, occurrence-threshold logic in `query-wingman-knowledge.mjs --recurring` | Read directly |
| Reference-only vendor material | `vendor/` = 16 pinned git submodules, `ATTRIBUTIONS.md` documents provenance, CLAUDE.md states "nothing depends on their runtime infra" | Read directly |
| Zero-dependency validators | `plugins/wingman/scripts/*.mjs` and root `scripts/*.mjs` — no `node_modules` in this repo at all | Confirmed by `install-smoke.yml`'s stated purpose |
| Evals/benchmarks separated from shipped runtime | `evals/{cases,fixtures,dogfood-runs}` — 100+ cases, never referenced from `plugins/wingman/.claude-plugin/plugin.json` | Read directly |
| Dev-only architecture reasoning kept out of shipped paths | `docs/ARCHITECTURE.md`, `docs/PROJECT.md`, `docs/audit/*` — all root-level, none under `plugins/wingman/` | Read directly |

This is, structurally, already a **7-layer model** matching the brief's target almost exactly — it's just named differently (`plugins/wingman/` instead of `core/` + a Claude-specific top adapter, `references/harness-adapters/` instead of top-level `adapters/`). Renaming it would not fix a defect; it would break the one thing CI currently guarantees (`install-smoke.yml`'s path assumptions, `plugin.json`'s `commands`/`agents`/`skills` path fields, every skill's internal cross-references) for a purely cosmetic alignment with a generic template. **That is exactly the "clever structure over proven structure" anti-pattern the brief itself warns against.**

### 1.2 Real boundary violations found (with evidence, not speculation)

1. **Root-level narrative files with no governance home.** `ANNOUNCEMENT.md`, `AUDIT_REORG.md`, `FIXLOG.md` sit at repo root alongside governance files (`SECURITY.md`, `CONTRIBUTING.md`) but are not indexed in `docs/GOVERNANCE.md`'s cross-reference, and `AUDIT_REORG.md` in particular looks like a stale one-off migration note rather than a durable artifact. This is an ownership-ambiguity violation ("No folder without a clear scope" / "No ambiguous ownership") — nobody's `AGENTS.md` describes what these three files are for or when they get updated. **[Resolved in this PR, see §8 action 1]**: `ANNOUNCEMENT.md` was already owned (`docs/HUMAN-TODOS.md` tracks it as a pending founder submission action) — no move needed, just cross-indexed. `FIXLOG.md` is a closed, root-referenced ledger (cited by path from `CHANGELOG.md`) — kept at root, cross-indexed with an explicit "closed, historical" status. `AUDIT_REORG.md` was genuinely orphaned (zero inbound references anywhere in the repo, all its Phase-1 items already completed as of 2026-07-21) — moved to `docs/wingman/audit-reorg-2026-07-20.md`, matching the existing point-in-time audit convention in that directory (`architecture-audit-2026-07-15.md`, `enhancement-review-2026-07-15.md`).
2. **Two independent script inventories with no cross-check.** Root `scripts/` (7 files) and `plugins/wingman/scripts/` (7 files) both exist, correctly split by ship/never-ship, but there is no automated check that a script *doesn't* get added to the wrong side (e.g., a future contributor adding a dev-only health script directly under `plugins/wingman/scripts/` because that's where they were already looking). `check-repo-consistency.mjs` should be confirmed to assert this boundary explicitly, not just check attribution/doc consistency as its name implies.
3. **`tests/` vs `evals/` overlap is not documented.** `tests/hooks-integration`, `tests/install-git-hooks`, `tests/ponytail-integration` are conventional integration tests; `evals/` is the *behavioral* (LLM-graded) harness. The repo map in CLAUDE.md lists them both under "Tests + evals" as one row — collapsing a real distinction (deterministic assertions vs. human-graded behavioral cases) that a new contributor or new AI agent has no way to discover except by reading both directories.

None of these three rise to "rewrite the directory tree" — they're doc/CI gaps, fixable without moving a single shipped file.

---

## 2. Proposed target directory tree

**No top-level rename.** The tree below is the *current* tree with the three gaps above closed and nothing else touched — this is the evidence-respecting version of the brief's 8-layer model, mapped onto what's already here:

```
Wingman/
├── plugins/wingman/          # LAYER 1: shipped runtime surface (Claude Code plugin)
│   ├── agents/                #   boardroom-*.md — canonical seat definitions
│   ├── commands/               #   pipeline/ + adaptive/
│   ├── skills/                 #   discipline/ mechanics/ governance/ output/ knowledge/ personas/ response/
│   ├── hooks/                  #   lifecycle-bound, Claude Code-specific (see §7)
│   ├── scripts/                #   LAYER 8 (shipped subset): zero-dep validators that must run inside a founder's project
│   └── references/
│       └── harness-adapters/   # LAYER 3: adapter/harness-specific bindings (Codex CLI, OpenCode)
├── governance/  → docs/GOVERNANCE.md + skills/governance/*   # LAYER 4 (kept as index + enforcement, not moved — see §4)
├── evals/                     # LAYER 5: behavioral cases, fixtures, dogfood evidence
├── tests/                     # LAYER 5b: deterministic integration tests (NEW: distinguished from evals/ explicitly, see action 3)
├── docs/                      # LAYER 6: architecture, decisions, audits, retros, dev-only reasoning
│   └── audit/                 #   numbered dossier — this document is 10-*
├── vendor/                    # LAYER 7: reference-only, pinned submodules
├── scripts/                   # LAYER 8 (dev-only subset): health/consistency/metrics, never ships
├── .github/                   # CI, release automation, templates, enforcement workflows
├── .claude/                   # local working-repo config (session-start hook, settings)
├── AGENTS.md / CLAUDE.md      # root governance entrypoint (symlinked, single source of truth)
├── SECURITY.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md, LICENSE   # standard OSS governance
├── LEARNINGS.md               # evidence source #1 for promotion (see §4)
└── [ACTION NEEDED] ANNOUNCEMENT.md, AUDIT_REORG.md, FIXLOG.md → resolve per action 1 below
```

`core/` and `adapters/` as literal top-level folder names are rejected as a **hypothesis, not adopted**: they would require touching `plugin.json`'s path-relative manifest fields, `validate-structure.mjs`'s path assumptions, `install-smoke.yml`, every skill's relative cross-reference, and the marketplace listing — a blast radius with no corresponding entry in `LEARNINGS.md`, `docs/wingman/retros.md`, or any dogfood run. Per the brief's own promotion policy, that disqualifies it.

---

## 3. File/folder purpose map

| Path | Ships? | Owner | Purpose | Evidence it's correctly placed |
|---|---|---|---|---|
| `plugins/wingman/{agents,commands,skills,hooks}` | Yes | Maintainer | Installable runtime surface | `plugin.json` manifest references these paths; `install-smoke.yml` proves clean install |
| `plugins/wingman/scripts/*.mjs` | Yes | Maintainer | Validators that must run **inside a founder's installed project** (e.g., `dod-pre-push-check.mjs`, `okf-export.mjs`) | Cited by `CLAUDE.md` as "also shippable" |
| `plugins/wingman/references/harness-adapters/` | Yes | Maintainer | Codex CLI / OpenCode drop-in bindings, honestly labeled by verification status | `check-harness-adapter-drift.mjs` enforces parity |
| `plugins/wingman/references/org-template/` | Yes | Maintainer | Static founder-facing reference content | Cited from `discovery.md`, scoped down per `PROJECT.md` decision log 2026-07-22 |
| root `scripts/*.mjs` | No | Maintainer | Dev-repo-only health/consistency/metrics tooling | CLAUDE.md explicit: "never ships" |
| `evals/{cases,fixtures,dogfood-runs}` | No | Maintainer | Behavioral (LLM-graded) verification of skill instructions | `evals/README.md`; graded by hand, not scripted |
| `tests/` | No | Maintainer | Deterministic integration tests (hook behavior, git-hook install) | Distinct grading model from `evals/` — assertion-based, not human-graded |
| `docs/` (incl. `docs/audit/`, `docs/wingman/`) | No | Maintainer | Architecture reasoning, decision log, retros, audit dossiers | CLAUDE.md: "docs/ isn't installed" |
| `vendor/` | No | Maintainer | Pinned MIT-licensed inspiration repos | `ATTRIBUTIONS.md`; git submodules, no runtime dependency |
| `.github/` | No (CI-only) | Maintainer | CI enforcement: validate, actionlint, install-smoke, version-gate, evals, codeql | Read directly |
| `.claude/` | No | Working-repo | Session-start hook + local settings for this dev repo specifically | Distinguished from `plugins/wingman/hooks/` (shipped) by CLAUDE.md's "portability" section |
| `ANNOUNCEMENT.md`, `FIXLOG.md`, `AUDIT_REORG.md` | No | **Unowned — fix in action 1** | Unclear: launch note? running fix log? historical reorg record? | No governance doc assigns these an owner or update cadence |

---

## 4. Governance and promotion rules (as they already exist — audited, not redesigned)

The repo's actual promotion chain, traced through real files:

1. **Friction observed** → logged as `wingman:log` marker in `LEARNINGS.md`, `docs/wingman/retros.md`, or `docs/PROJECT.md`'s decision log (via `/wingman:retro` or `/wingman:learn`).
2. **Occurrence threshold** → `scripts/query-wingman-knowledge.mjs --recurring` mechanically counts *independent* occurrences (category+type), consistent with the brief's "same-incident duplicate logging does not count as two sources" rule — this is enforced, not aspirational.
3. **Promotion decision** → `/wingman:evolve` reads the roster (`docs/AGENT-ROSTER.md`) or skill catalog, applies `skills/governance/evidence-gated-catalog` and `skills/governance/evolve-promotion` to decide shipped-surface vs. keep-as-doc.
4. **Structural validation gate** → all four Layer-1 validators must exit 0 before commit: `validate-structure.mjs`, `check-repo-consistency.mjs`, `check-fixtures.mjs`, `check-traceability.mjs`. `check-harness-adapter-drift.mjs` gates adapter parity specifically.
5. **Semantic gate (Layer 2)** → `/wingman:audit`, per `docs/REGRESSION-CHECKLIST.md`, for the checks that can't be mechanized.
6. **Dogfood-only promotion path** → gaps found by `/wingman:dogfood` promote via `skills/governance/dogfood-gap-classification` — the mirror image of `evolve-promotion`, and (correctly) the *only* path that can write into `plugins/wingman/` itself rather than a founder's own project.

This already satisfies every rule in the brief's "Governance rules" and "Promotion policy" sections. No redesign needed here — only the doc-indexing gap (action 1) needs closing.

---

## 5. Evidence and benchmark framework (audited against brief's requirements)

| Validator/benchmark | Question it proves | Input | Output | Failure means | Blocks promotion? |
|---|---|---|---|---|---|
| `validate-structure.mjs` | Do all commands/agents/skills have correct frontmatter and valid cross-refs? | `plugins/wingman/**` | pass/fail + line-level errors | A shipped artifact is malformed | Yes |
| `check-repo-consistency.mjs` | Do root docs/attribution stay internally consistent? | Root docs, `ATTRIBUTIONS.md` | pass/fail | Doc drift (e.g. stale counts) | Yes |
| `check-fixtures.mjs` | Does every eval fixture still run clean, all at once? | `evals/fixtures/*.sh` | pass/fail | A fixture is broken, silently invalidating whatever case depends on it | Yes |
| `check-traceability.mjs` | Do requirement markers cross-reference correctly? | Traceability markers repo-wide | pass/fail | Orphaned or dangling requirement links | Yes |
| `check-harness-adapter-drift.mjs` | Have Codex CLI/OpenCode adapters drifted from canonical `boardroom-*.md`? | `references/harness-adapters/` vs. `agents/` | pass/fail + diff | Adapter parity broken — a non-Claude harness gets stale seat behavior | Yes |
| `wingman-health.mjs` | What's built vs. verified vs. gap, right now? | Flat files only, read-only | Snapshot report | N/A (informational) | No — informs `/wingman:evolve` decisions |
| `wingman-metrics.mjs` | Real cost/quality/debt signals + agent-weakness benchmark coverage | Eval results, `wingman:log` markers | Metrics report | N/A (informational) | No — informs promotion priority |
| `query-wingman-knowledge.mjs --recurring` | Which frictions have crossed the 2+-occurrence promotion threshold? | `wingman:log` markers | Filtered list | N/A (informational) | Gates *whether a promotion PR is even proposed* |
| `evals/run-headless.mjs` | Do skill instructions actually produce correct behavior when run? | `evals/cases/*.md` via `claude -p` | Graded transcript | A skill's instructions don't hold up under real execution | No (human-graded, not CI-blocking today — see action 4) |

**Gap identified**: `evals/run-headless.mjs` results are not wired into a CI gate (per `evals.yml`, it needs `ANTHROPIC_API_KEY` and appears advisory). This is honestly documented in `docs/HUMAN-TODOS.md` already rather than silently assumed — consistent with the brief's truth rules, not a violation.

---

## 6. Migration phases (minimal-churn, evidence-respecting)

**Phase 0 (this document)** — audit committed to `docs/audit/10-enterprise-architecture-review.md`, no code touched.

**Phase 1 (implemented in this PR)**:
- Added a "Root narrative & historical-ledger files" table to `docs/GOVERNANCE.md` giving `ANNOUNCEMENT.md`, `FIXLOG.md`, and `docs/wingman/`'s point-in-time audit docs an explicit owner, status, and update-cadence line.
- Moved `AUDIT_REORG.md` → `docs/wingman/audit-reorg-2026-07-20.md`: confirmed zero inbound references anywhere in the repo and all its Phase-1 action items already completed (2026-07-21), so it is historical, not active guidance — placed alongside the existing point-in-time audit docs in that directory rather than invented a new home.
- Left `ANNOUNCEMENT.md` at root (it's an active, pending-founder-action draft already tracked twice in `docs/HUMAN-TODOS.md` — moving it would break that path reference for no benefit) and `FIXLOG.md` at root (closed ledger, referenced by relative path from `CHANGELOG.md`; moving it would require updating that reference for a file whose location was never actually the problem — only its lack of an index entry was).
- Added an explicit script-boundary assertion to `scripts/check-repo-consistency.mjs`: fails if any file under `plugins/wingman/**` references a path outside `plugins/wingman/` (the shipped surface must never depend on dev-only tooling) — closing gap #2 mechanically instead of by convention.

**Phase 2 (next structural PR, still no directory renames)**:
- Split the repo-map row "Tests + evals" in `CLAUDE.md` into two rows (`tests/` = deterministic integration, `evals/` = behavioral/LLM-graded) so the distinction that already exists in practice is discoverable without reading both READMEs.

**Phase 3 (only if evidence accumulates)**:
- If `LEARNINGS.md`/retros ever record *repeated, independent* friction from AI agents or contributors misplacing files because of the `plugins/wingman/` vs. root `scripts/`/`docs/` naming (not hypothesized here — no such entries exist today), revisit a rename. Until then this stays a documented hypothesis, not a task.

No phase touches `plugin.json`, `marketplace.json`, or any shipped path's location.

**Separately, `docs/wingman/audit-reorg-2026-07-20.md`'s own action-item list (a prior, independent audit, referenced in §1.2 finding #3) is now closed out**: items #1/#6/#8/#10 turned out already implemented, #2 was superseded by a better fix (dropping hardcoded counts rather than drift-checking them), #3 and #5 were newly built this session, and #9 was checked and confirmed non-actionable. #4 and #7 remain correctly deferred, evidence-gated. See `docs/PROJECT.md`'s decisions log (category=eval) for the full account.

---

## 7. Security and coupling risks

- **Hooks are correctly lifecycle-specific and Claude Code-bound** (`plugins/wingman/hooks/hooks.json` → `session-start.mjs`, `prompt-guard.mjs`, `secret-guard.mjs`, `content-injection-scanner.mjs`, `pre-compact-guard.mjs`, `dod-structural-gate.mjs`, `stop-loop.mjs`, `context-monitor.mjs`, `session-health.mjs`). These are **not** assumed portable — CLAUDE.md's Portability section explicitly scopes only `git-pr-workflow` and `package-manager-selection` as harness-agnostic, and the Codex/OpenCode adapter docs are honestly labeled by verification status rather than claiming full parity. This is the correct posture: no universal-logic/adapter-coupling violation found.
- **Secret handling**: `secret-guard.mjs` + `secret-scanner.mjs` + `references/secrets-policy.md` — dual mechanism (hook + reference doc) is intentional defense-in-depth, not duplication, per `references/prompt-defense-baseline.md`.
- **No duplicated source of truth for manifests**: confirmed only two manifests exist (`marketplace.json`, `plugin.json`), and CLAUDE.md explicitly documents why that's a correct split, not an accident.
- **Vendor submodules are pinned, MIT-licensed, and inspiration-only** — no runtime import from `vendor/` was found anywhere in `plugins/wingman/`.

No critical or high security findings from this pass. The main residual risk is process, not code: the three unowned root docs (action 1) are exactly the kind of ambiguity that, left long enough, becomes a place someone pastes secrets or stale credentials because "nobody's watching that file."

---

## 8. First actions to take immediately

1. Resolve `ANNOUNCEMENT.md` / `FIXLOG.md` / `AUDIT_REORG.md` ownership (delete-if-stale, or add an owner + cadence line to `docs/GOVERNANCE.md`).
2. Add the shipped/dev-only script-boundary assertion to `check-repo-consistency.mjs`.
3. Split the `tests/` vs `evals/` row in `CLAUDE.md`'s repository map.
4. Re-run all four Layer-1 validators (`validate-structure.mjs`, `check-repo-consistency.mjs`, `check-fixtures.mjs`, `check-traceability.mjs`) plus `check-harness-adapter-drift.mjs` after each of the above to confirm zero regressions — each is a $0-risk, single-file change with an existing mechanical gate.

Nothing above requires founder approval to *investigate*; per this repo's own promotion policy, items 1–3 are the kind of small, evidenced, non-shipped-surface fixes that don't need a Boardroom checkpoint — only a structural-change flag if they end up touching `plugins/wingman/` (they don't).
