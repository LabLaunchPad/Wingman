# Artifacts & Glossary

## File Inventory (Top-Level)

```
C:\Users\SR Creative Hub\Documents\Wingman\
├── ATTRIBUTIONS.md              # MIT-licensed vendor provenance
├── CLAUDE.md                    # Working instructions for Claude Code
├── LEARNINGS.md                 # Append-only learning log (7 entries)
├── README.md                    # Project overview
├── plugins/wingman/             # Plugin root
│   ├── .claude-plugin/
│   │   ├── plugin.json          # Manifest (23 commands, 8 agents, 39 skills)
│   │   └── marketplace.json     # Marketplace listing
│   ├── commands/                # 23 markdown command files
│   ├── agents/                  # 8 agent files (Boardroom seats)
│   ├── skills/                  # 39 skill directories (each with SKILL.md + optional refs)
│   ├── hooks/                   # 9 hook scripts (.mjs)
│   │   ├── hooks.json           # Lifecycle wiring
│   │   ├── boardroom-checkpoint.mjs
│   │   ├── context-monitor.mjs
│   │   ├── dod-structural-gate.mjs
│   │   ├── prompt-guard.mjs
│   │   ├── secret-guard.mjs
│   │   ├── secret-scanner.mjs
│   │   ├── session-health.mjs
│   │   ├── session-start.mjs
│   │   └── stop-loop.mjs
│   └── scripts/                 # Plugin-internal validators
│       ├── validate-structure.mjs
│       ├── check-traceability.mjs
│       └── [other support scripts]
├── evals/
│   ├── README.md                # Eval harness documentation
│   ├── cases/                   # 62 eval case files (.md)
│   ├── fixtures/                # 36 setup-*.sh scripts
│   ├── .artifacts/              # Run transcripts (gitignored)
│   └── run-headless.mjs         # Eval runner (150 lines, stdlib)
├── scripts/                     # Repo-root tooling
│   ├── check-repo-consistency.mjs
│   ├── check-fixtures.mjs
│   ├── parse-wingman-logs.mjs
│   ├── wingman-health.mjs
│   └── query-wingman-knowledge.mjs
├── tests/
│   └── hooks-integration/
│       └── hooks-integration.test.mjs  # 72 tests
├── docs/
│   ├── ARCHITECTURE.md
│   ├── AGENT-ROSTER.md           # 56-role specialist catalog
│   ├── REGRESSION-CHECKLIST.md
│   ├── PROJECT.md                # Version history (v1-v16)
│   ├── HUMAN-TODOS.md
│   ├── SRS.md                    # FR-1..FR-15, NFR-1..NFR-7
│   ├── PRD.md
│   ├── DATABASE.md               # Planned MCP state-store spec
│   └── audit/                    # This dossier (9 documents)
├── vendor/                      # MIT-licensed upstream references (empty submodules)
└── .github/workflows/           # CI (exists only on GitHub, not locally)
```

## State File Schemas

### `.wingman/state.json`

| Field | Type | Description |
|---|---|---|
| `pipelineStage` | string | Current stage: discovery/define/architecture/uxflow/implementation-planning/build/ship |
| `departmentLeads` | string[] | Activated department lead agent names |
| `activeSpecialists` | string[] | Promoted specialist agent names |
| `lastCheckpoint` | string|null | ISO 8601 timestamp of last Boardroom checkpoint |
| `sessionStarted` | string | ISO 8601 timestamp of session start |

### `.wingman/checkpoints.jsonl`

One JSON object per line:
```json
{
  "timestamp": "ISO 8601",
  "stage": "build",
  "verdict": "GO|GO_WITH_CHANGES|DO_NOT_SHIP",
  "seats": [
    {
      "seat": "CEO|CPO|CMO|CTO|CISO|CFO|Research|Design",
      "verdict": "GO|GO_WITH_CONCERNS|NO_GO",
      "rationale": "plain-language summary"
    }
  ]
}
```

### `.wingman/session-state.json`

Max 20 sessions, FIFO eviction:
```json
{
  "sessions": [
    {
      "id": "uuid",
      "timestamp": "ISO 8601",
      "pipelineStage": "stage name",
      "summary": "brief description"
    }
  ],
  "previousSessionSummary": "last session condensed"
}
```

### `.wingman/loop-counter.json`

```json
{
  "iterationCount": 0
}
```
Resets to 0 on stop, incremented on continue. Default max: 50.

## Plugin Manifest Structure

### `plugin.json`

| Section | Count | Description |
|---|---|---|
| `commands` | 23 | `/wingman:<name>` invocable markdown files |
| `agents` | 8 | Task-tool-callable agent definitions |
| `skills` | 39 | Auto-routed skill directories |
| `hooks` | 9 | Lifecycle event → script mappings |

### `hooks.json`

| Hook Event | Matchers | Scripts |
|---|---|---|
| `PreToolUse` | 4 matchers (ExitPlanMode, git push, Anthropic/OpenAI values, user_prompt) | boardroom-checkpoint.mjs, dod-structural-gate.mjs, secret-guard.mjs, prompt-guard.mjs |
| `PostToolUse` | always | context-monitor.mjs |
| `SessionStart` | always | session-start.mjs |
| `Stop` | always | stop-loop.mjs |
| `UserPromptSubmit` | always | secret-scanner.mjs, prompt-guard.mjs |

## Glossary

| Term | Definition |
|---|---|
| **Boardroom** | 7+1 fixed agent seats (CEO, CPO, CMO, CTO, CISO, CFO, Research, Design) that render plain-language verdicts |
| **Checkpoint** | A founder-visible gate where Boardroom verdicts are presented and explicit approval is obtained |
| **Plain-Language Bar** (NFR-3) | The requirement that founder-facing output contains no unexplained jargon and leads with consequence |
| **Department Lead** | A build-time worker subagent created per-project when a department's activation signal is true (none exist at fresh install) |
| **Specialist** | A 56-role candidate cataloged in AGENT-ROSTER.md, promoted only via `/wingman:evolve` on evidenced need |
| **Management Board** | 9 manager roles activated only when 3+ department leads are active |
| **Pipeline Stages** | 7 named SDLC stages: discovery → define → architecture → uxflow → implementation-planning → build → ship |
| **DoD Gate** | Definition-of-Done gate: checks tests pass, threat register clean, requirements met before push |
| **Eval Case** | Behavioral test case under `evals/cases/` documenting a scenario, expectations, and run log |
| **Eval Fixture** | Shell script under `evals/fixtures/` that creates a temporary project with deliberate signals |
| **Trust Level** | Eval case maturity: `provisional` (one pass) → `verified` (multiple scenarios, incl. negative) |
| **`wingman:log`** | Structured metadata marker in markdown comments for LEARNINGS.md and decision logs |
| **`wingman:req`** | Traceability marker linking commands/skills to requirements or other artifacts |
| **Hook** | Lifecycle event handler in `hooks/` registered via `hooks.json` |
| **ExitPlanMode Gate** | Hook that blocks plan-mode exit unless a Boardroom verdict is recorded in the plan file |
| **PreToolUse** | Hook event fired before each Claude Code tool execution |
| **UserPromptSubmit** | Hook event fired when the user submits a prompt |
| **Feature Branch** | A git branch created by build.md before any commits, confirmed by ship.md before push |
| **TDD Cycle** | Test → Code → Verify loop in build.md with fresh verification evidence |
| **Squash-Merge** | Merge strategy used by ship.md's git-pr-workflow |
| **Self-Contained Skill** (NFR-5) | A skill that does not depend on any other vendor's runtime, API, or infrastructure |

## Key Markers and Annotations

| Marker | Location | Purpose |
|---|---|---|
| `<!-- wingman:log type=... category=... status=... -->` | LEARNINGS.md, docs/PROJECT.md, docs/HUMAN-TODOS.md | Structured metadata for queries |
| `<!-- wingman:req ... -->` | Command/skill markdown files | Traceability links between artifacts |
| `<!-- eval:no-fixture-needed: ... -->` | Eval case files | Declares that a case does not need a synthetic fixture |
| `<!-- wingman:boardroom-checkpoint -->` | Plan files | Marks the checkpoint section in plan documents |
