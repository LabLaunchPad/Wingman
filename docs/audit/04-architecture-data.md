# Architecture & Data Assessment

## Component Model

```mermaid
graph TB
    subgraph "Claude Code Session"
        CC[Claude Code]
        PL[Plugin Loader]
    end

    subgraph "Wingman Plugin"
        PM[plugin.json\n23 commands\n8 agents\n39 skills]
        HM[hooks.json\n6 lifecycle events]
        
        subgraph "Commands"
            PC[Pipeline: discovery, define,\narchitecture, uxflow,\nimplementation-planning,\nbuild, ship]
            AC[Adaptive: boardroom, retro,\nlearn, evolve, harness,\ndogfood, telemetry, launch,\nhotfix, audit, over-engineering,\ndebt-ledger, research, advisory,\nincident]
        end

        subgraph "Agents"
            BR[Boardroom 7+1:\nCEO, CPO, CMO, CTO,\nCISO, CFO, Research,\nDesign]
        end

        subgraph "Skills"
            SK[39 skills -- quality,\nsecurity, pipeline,\nmanagement, workflow,\nspecialized]
        end

        subgraph "Hooks"
            BC[boardroom-checkpoint\nExitPlanMode gate]
            DG[dod-structural-gate\ngit push gate]
            SG[secret-guard\ndestructive pattern block]
            PG[prompt-guard\ninjection defense]
            SS[secret-scanner\nuser input scan]
            CM[context-monitor\nwindow health]
            SZ[session-start\nstate init]
            SL[stop-loop\niteration cap]
        end

        subgraph "State Files"
            ST[.wingman/state.json\npipelineStage,\ndepartmentLeads,\nactiveSpecialists,\nlastCheckpoint,\nsessionStarted]
            CP[.wingman/checkpoints.jsonl\ncheckpoint history]
            SH[.wingman/session-state.json\n20-session rolling window]
            LC[.wingman/loop-counter.json\niteration count]
        end
    end

    CC --> PL
    PL --> PM
    PM --> HM
    HM --> BC
    HM --> DG
    HM --> SG
    HM --> PG
    HM --> CM
    HM --> SZ
    HM --> SL
    HM --> SS
    BC --> ST
    SZ --> ST
    SZ --> SH
    SL --> LC
```

## Data Flow — Boardroom Checkpoint

```mermaid
sequenceDiagram
    participant F as Founder
    participant C as Command
    participant BC as boardroom-checkpoint Hook
    participant B as Boardroom (8 agents)
    participant SF as State Files

    F->>C: /wingman:boardroom
    C->>B: Dispatch 8 seats in parallel (Task tool)
    B->>B: Each seat produces independent verdict
    B-->>C: 8 verdicts collected
    C->>C: Consolidate into grouped summary
    C->>C: AskUserQuestion for explicit decision
    F->>C: GO / GO WITH CHANGES / DO NOT SHIP
    C->>SF: Write checkpoint to .wingman/checkpoints.jsonl
    C->>SF: Write to .wingman/state.json
    C->>F: Display plain-language summary

    Note over F,SF: On ExitPlanMode attempt:
    BC->>SF: Read plan file for ## Wingman Boardroom Checkpoint
    BC->>BC: Block if missing or DO NOT SHIP
```

## Data Flow — Build Pipeline (build.md)

```mermaid
sequenceDiagram
    participant F as Founder
    participant B as /wingman:build
    participant D as DoD Gate
    participant T as Test Runner
    participant H as dod-structural-gate Hook
    participant R as Git Remote

    F->>B: Describe feature
    B->>B: TDD cycle (test → code → verify)
    B->>D: Check Definition of Done
    D->>D: Verify: tests pass, threat register clean, coverage
    D-->>B: Pass/Fail
    B->>B: Boardroom checkpoint (build variant)
    F->>F: Approve checkpoint
    B->>B: git commit
    B->>B: git push

    Note over B,R: On git push:
    H->>H: Check artifact presence
    H->>H: Verify tests exist, threat register clean
    H->>H: Block push if missing
    H->>R: Allow push if clean
```

## State Persistence Schema

### `.wingman/state.json`
```json
{
  "pipelineStage": "discovery|define|architecture|uxflow|implementation-planning|build|ship",
  "departmentLeads": [],
  "activeSpecialists": [],
  "lastCheckpoint": null,
  "sessionStarted": "ISO 8601 timestamp"
}
```

### `.wingman/checkpoints.jsonl`
```jsonl
{"timestamp":"...", "stage":"build", "verdict":"GO", "seats":[{"seat":"CEO","verdict":"GO","rationale":"..."}, ...]}
```

### `.wingman/session-state.json`
```json
{
  "sessions": [
    {"id":"...", "timestamp":"...", "pipelineStage":"...", "summary":"..."}
  ],
  "previousSessionSummary": "..."
}
```
Max 20 sessions, FIFO eviction.

### `.wingman/loop-counter.json`
```json
{"iterationCount": 0}
```
Reset to 0 on stop, incremented on continue. Max 50 by default.

## Agent Topology

```mermaid
graph LR
    subgraph "Always Loaded (8)"
        CEO[CEO]
        CPO[CPO]
        CMO[CMO]
        CTO[CTO]
        CISO[CISO]
        CFO[CFO]
        R[Research]
        D[Design]
    end

    subgraph "Lazy — Activation-Gated (0 exist)"
        DL["Department Leads:\nProduct, Engineering, QA,\nDesign, Data, Legal/Security,\nDevOps, Growth"]
    end

    subgraph "Evolve-Gated (0 exist)"
        SP["Specialists:\n56 roles in AGENT-ROSTER.md"]
    end

    subgraph "Management Board (Conditional)"
        MB["9 managers:\nmgr-product, mgr-engineering,\nmgr-qa, mgr-design,\nmgr-data, mgr-legal-security,\nmgr-devops, mgr-growth,\nmgr-cfo"]
    end

    CEO -.-> DL
    CTO -.-> DL
    DL -.-> SP
    MB -.-> DL
```

**Key rule (FR-6)**: No agent may invoke another agent. Only commands orchestrate/dispatch via the Task tool.

## Command Dispatch Architecture

```mermaid
graph TB
    subgraph "Founder Input"
        F[/wingman:command\n$ARGUMENTS]
    end

    subgraph "Plugin Loader"
        PR[plugin.json frontmatter]
        AG[argument-hint parsing]
    end

    subgraph "Lifecycle Hooks"
        PH[PreToolUse matchers]
        PO[PostToolUse]
        SS[SessionStart]
        SP[Stop]
        UP[UserPromptSubmit]
    end

    subgraph "Command Execution"
        C[Command markdown\nruns inline]
        C -->|Task tool| A[Agents]
        C --> S[Skills auto-trigger\nby description]
    end

    F --> PR
    PR --> C
    C --> PH
    C --> PO
    SS --> SZ[session-start.mjs]
    SP --> SL[stop-loop.mjs]
    UP --> SS2[secret-scanner.mjs]
    UP --> PG[prompt-guard.mjs]
```

## Key Architecture Constraints

1. **No circular dispatch**: Agents never invoke other agents; commands invoke agents
2. **Hooks fire on lifecycle events only** — no standalone execution outside Claude Code
3. **State is flat files** — no database, no external service
4. **Skills auto-trigger via description matching** — Claude Code's built-in routing, not custom
5. **Department leads created per-project** — never per-session or per-command
6. **Boardroom verdicts are independent** — parallel dispatch prevents bias
7. **Checkpoint files survive sessions** — .wingman/state.json persists across Claude Code sessions
