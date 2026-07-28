# Operational Assessment

## Surface Area

### Commands (23)

**Pipeline stages (7):**
| Command | Eval Coverage | Notes |
|---|---|---|
| `/wingman:discovery` | Covered by seven-stage-pipeline-e2e.md | No individual eval case |
| `/wingman:define` | Covered by seven-stage-pipeline-e2e.md | No individual eval case |
| `/wingman:architecture` | Covered by seven-stage-pipeline-e2e.md | No individual eval case |
| `/wingman:uxflow` | Covered by seven-stage-pipeline-e2e.md | No individual eval case |
| `/wingman:implementation-planning` | Covered by seven-stage-pipeline-e2e.md | No individual eval case |
| `/wingman:build` | ✅ Has dedicated eval case | TDD execution flow, DoD gate, Boardroom checkpoint |
| `/wingman:ship` | ✅ Has dedicated eval case | 4 preflight checks, git-pr-workflow, GCIP/MCP-friendly |

**Adaptive commands (16):**
| Command | Eval Coverage | Notes |
|---|---|---|
| `/wingman:boardroom` | ✅ Boardroom-7-seat + gate-rule | Parallel dispatch, consolidated verdict |
| `/wingman:secure` | ✅ secure.md (eval) | Threat register, STRIDE/OWASP |
| `/wingman:retro` | ✅ Has eval case | |
| `/wingman:learn` | ✅ Has eval case | |
| `/wingman:evolve` | ✅ evolve-promotion.md | Promotion process, evidence-gated |
| `/wingman:harness` | ✅ Has eval case | |
| `/wingman:dogfood` | ✅ Has eval case | |
| `/wingman:telemetry` | ✅ Has eval case | |
| `/wingman:launch` | ✅ Has eval case | |
| `/wingman:hotfix` | ✅ Has eval case | |
| `/wingman:audit` | ✅ systematic-auditing.md | |
| `/wingman:over-engineering-review` | ✅ Has eval case | |
| `/wingman:bloat-audit` | ✅ Has eval case | |
| `/wingman:debt-ledger` | ✅ Has eval case | |
| `/wingman:research` | ✅ Has eval case | Uses `no-fixture-needed` |
| `/wingman:advisory` | ✅ Has eval case | |
| `/wingman:incident` | ✅ incident-response.md | |

**Total**: 20/23 commands have dedicated eval coverage (87%). The 5 pipeline-stage commands without individual cases are exercised by the shared `seven-stage-pipeline-e2e.md`.

### Agents (8)

| Agent | Type | Tools | Eval |
|---|---|---|---|
| CEO | Boardroom seat | none by default | boardroom-7-seat.md |
| CPO | Boardroom seat | none by default | boardroom-7-seat.md |
| CMO | Boardroom seat | none by default | boardroom-7-seat.md |
| CTO | Boardroom seat | none by default | boardroom-7-seat.md |
| CISO | Boardroom seat | none by default | boardroom-7-seat.md |
| CFO | Boardroom seat | none by default | boardroom-7-seat.md |
| Research | Boardroom seat | WebFetch | boardroom-7-seat.md |
| Design | Boardroom seat | none by default | boardroom-7-seat.md |

All 8 agents are fixed, always-loaded Boardroom seats. They render plain-language verdicts only, never write code. Department leads (worker subagents) do not exist at fresh install — created lazily per NFR-4.

### Skills (39)

All 39 skills have dedicated eval cases (100% coverage). Key categories:

**Quality discipline (9):**
- verification-before-completion, writing-plans, engineering-minimalism, design-taste, token-economy, systematic-debugging, test-driven-development, systematic-auditing, verification-loop

**Security (3):**
- security-checklist, doubt-driven-development, anti-rationalization

**Pipeline integration (7):**
- plain-language-checkpoint, definition-of-done, interview-one-question-at-a-time, subagent-driven-development, platform-native-reference, spec-handler, traceability-validator

**Management (3):**
- management-board-activation, evidence-gated-catalog, evolve-promotion

**Workflow (5):**
- git-pr-workflow, department-lead-activation, dogfood-gap-classification, visual-founder-output, traceability-linking

**Specialized (12):**
- memory, council, plan, simplify, doc-index, code-review, package-manager-selection, testing-patterns, founder-cfo, founder-cmo, founder-cro, wingman-knowledge-query, secure

### Hooks (9 scripts across 6 lifecycle events)

| Lifecycle Event | Matcher | Script | Purpose |
|---|---|---|---|
| PreToolUse | ExitPlanMode | boardroom-checkpoint.mjs | Blocks exit unless Boardroom verdict recorded |
| PreToolUse | git push (regex) | dod-structural-gate.mjs | Checks artifact presence before push |
| PreToolUse | Anthropic/OpenAI key values | secret-guard.mjs | Destructive pattern detection |
| PreToolUse | user_prompt * | prompt-guard.mjs | Prompt injection detection |
| PostToolUse | always runs | context-monitor.mjs | Context window health check |
| SessionStart | always runs | session-start.mjs | Init state.json, session history |
| Stop | always runs | stop-loop.mjs | Max iteration guard (50 default) |
| UserPromptSubmit | always runs | secret-scanner.mjs | Scans user input for leaked secrets |
| UserPromptSubmit | always runs | prompt-guard.mjs | Prompt injection defense |

### Scripts Inventory

| Script | Lines | Dependencies | Purpose |
|---|---|---|---|
| `plugins/wingman/scripts/validate-structure.mjs` | ~150 | Node stdlib | Frontmatter/ref structural checks |
| `plugins/wingman/scripts/check-traceability.mjs` | ~120 | Node stdlib | `wingman:req`/`wingman:log` marker verification |
| `scripts/check-repo-consistency.mjs` | ~90 | Node stdlib | Repo-root doc/attribution invariants |
| `scripts/check-fixtures.mjs` | 82 | Node stdlib | Eval fixture runnability |
| `scripts/wingman-health.mjs` | ~200 | Node stdlib | Plugin health snapshot (read-only) |
| `scripts/query-wingman-knowledge.mjs` | ~180 | Node stdlib | `wingman:log` marker queries |
| `evals/run-headless.mjs` | 150 | Node stdlib | Behavioral eval runner |
| `tests/hooks-integration/hooks-integration.test.mjs` | ~600 | Node assert | Hook script unit tests |

### Version History (PROJECT.md v1-v16)

| Version | Date | Key Change |
|---|---|---|
| v1 | 2026-07-09 | Initial scaffolding — 3 commands, no hooks |
| v2 | 2026-07-10 | Boardroom agents defined |
| v3 | 2026-07-10 | Hooks architecture |
| v4 | 2026-07-11 | Pipeline commands |
| v5 | 2026-07-11 | Eval infrastructure |
| v6 | 2026-07-12 | Framework choice decisions |
| v7 | 2026-07-12 | Build.md + ship.md implementation |
| v8 | 2026-07-13 | Full Boardroom checkpoint pipeline |
| v9 | 2026-07-13 | Audit pass + bugfixes |
| v10 | 2026-07-14 | Eval expansion |
| v11 | 2026-07-15 | Pipeline refinement |
| v12 | 2026-07-16 | Architecture docs update |
| v13 | 2026-07-16 | CI/CD setup |
| v14 | 2026-07-17 | Eval coverage improvements |
| v15 | 2026-07-17 | Governance docs finalization |
| v16 | 2026-07-18 | Current — audit + fixes |

## Coverage Gaps

1. 5 pipeline-stage commands lack individual eval cases (discovery, define, architecture, uxflow, implementation-planning) — covered by shared e2e case
2. ARCH-001 and UX-001 traceability markers linked (resolved during this audit)
3. `check-fixtures.mjs` skips on Windows (no bash) — CI-only by design
4. 62 eval cases vs 36 fixtures — 26 cases share fixtures or use `no-fixture-needed`
5. No per-skill unit tests — hooks integration tests cover script-level behavior
