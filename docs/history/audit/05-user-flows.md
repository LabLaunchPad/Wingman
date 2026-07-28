# User Flows

## Pipeline Flow — End to End

```mermaid
graph LR
    D[discovery] --> DF[define]
    DF --> A[architecture]
    A --> U[uxflow]
    U --> IP[implementation-planning]
    IP -->|Planning Milestone\nBoardroom Checkpoint| B[build]
    B -->|Build Checkpoint\nBoardroom]| S[ship]
    S -->|Ship Checkpoint\nBoardroom| Done[Done]

    style IP fill:#ff9900,color:#000
    style B fill:#ff9900,color:#000
    style S fill:#ff9900,color:#000
```

**3 founder-visible checkpoints** for 7 named stages. The 5 planning stages bundle into one "Planning Milestone" checkpoint at the end of `implementation-planning.md`.

## Boardroom Checkpoint Flow

```mermaid
flowchart TD
    Start[Founder triggers checkpoint] --> Dispatch{Which trigger?}

    Dispatch -->|End of planning milestone| PlanCheck[Planning Milestone Boardroom]
    Dispatch -->|End of build| BuildCheck[Build Boardroom]
    Dispatch -->|Before ship| ShipCheck[Ship Boardroom]
    Dispatch -->|/wingman:boardroom| AdHoc[Ad-hoc Boardroom]

    PlanCheck --> Parallel[8 agents dispatched in parallel]
    BuildCheck --> Parallel
    ShipCheck --> Parallel
    AdHoc --> Parallel

    Parallel --> Collect[All verdicts collected]
    Collect --> Consolidate[Consolidate into:\n## Business\n## Technical\n## Finance\n## Research\nBottom Line: GO / GO WITH CHANGES / DO NOT SHIP]
    Consolidate --> Ask[AskUserQuestion: explicit founder decision]
    Ask -->|GO| Pass[✅ Proceed]
    Ask -->|GO WITH CHANGES| Changes[Changes required → re-checkpoint]
    Ask -->|DO NOT SHIP| Block[⛔ Blocked — revise]
    Ask -->|Silence| Block2[⛔ Treated as NO — never approved]

    Pass --> Record[Write to checkpoints.jsonl]
    Pass --> UpdateState[Update state.json]
    Pass --> PlanFile[Write ## Wingman Boardroom Checkpoint\ninto plan file]
```

## Build Flow (build.md)

```mermaid
flowchart TD
    Start["/wingman:build <feature>"] --> Branch{Feature branch exists?}
    Branch -->|No| CreateBranch[Create feature branch]
    Branch -->|Yes| TDD

    CreateBranch --> TDD
    TDD[Test-driven development cycle] --> Verify[Fresh verification evidence]
    Verify --> DoG{Definition-of-Done gate}

    DoG -->|Check: tests pass| DoG2{Threat register clean?}
    DoG2 -->|Check: coverage OK| DoG3{All requirements met?}
    DoG3 -->|Pass| Boardroom[Build Boardroom checkpoint]
    DoG3 -->|Fail| TDD

    Boardroom -->|Founder approves| Commit[git commit]
    Boardroom -->|Founder rejects| Revise

    Commit --> Push[git push → CI]

    Push -->|Pre-push hook| Dodge{DoD structural gate}
    Dodge -->|All artifacts present| Allow[Allow push]
    Dodge -->|Missing artifacts| Block2[⛔ Block push]
```

## Ship Flow (ship.md)

```mermaid
flowchart TD
    Start["/wingman:ship <feature>"] --> Pre1{Preflight 1:\nBuild verified?}
    Pre1 -->|Yes| Pre2{Preflight 2:\nTree clean?}
    Pre1 -->|No| VerifyBuild[Run build first]
    Pre2 -->|Yes| Pre3{Preflight 3:\nFeature branch?}
    Pre2 -->|No| CommitFirst[Commit changes]
    Pre3 -->|Yes| Pre4{Preflight 4:\nRemote auth?}
    Pre3 -->|No| CreateFeatureBranch[Create feature branch]
    Pre4 -->|Yes| ShipCheckpoint[Ship Boardroom checkpoint]
    Pre4 -->|No| SetupRemote[Configure remote]

    ShipCheckpoint -->|GO| DraftPR[Draft PR via gh CLI]
    DraftPR --> Poll[CI poll loop]
    Poll -->|CI passes| ShipIt[Squash-merge + resync]
    Poll -->|CI fails| FixAndRerun[Fix → re-push]
```

## Adaptive Command Flows

```mermaid
flowchart TD
    subgraph "Learning & Improvement"
        Retro[/wingman:retro\] --> Action[Action items]
        Learn[/wingman:learn\] --> Facts[Durable facts]
        Evolve[/wingman:evolve\] --> Promote{Evidence threshold met?}
        Promote -->|Yes| CreateAgent[Create specialist agent]
        Promote -->|No| Wait[Wait for more evidence]
    end

    subgraph "Operational"
        Hotfix[/wingman:hotfix\] --> Patch[Emergency patch → redeploy]
        Incident[/wingman:incident\] --> Respond[Incident response procedure]
        Launch[/wingman:launch\] --> ProdPush[Production push]
        Telemetry[/wingman:telemetry\] --> Gather[Gather diagnostics]
    end

    subgraph "Quality"
        Audit[/wingman:audit\] --> Findings[Findings report]
        OverEng[/wingman:over-engineering-review\] --> Simplify[Simplification recommendations]
        Bloat[/wingman:bloat-audit\] --> Prune[Cruft removal]
        DebtLedger[/wingman:debt-ledger\] --> Track[Debt register]
    end

    subgraph "Research & Advisory"
        ResearchCmd[/wingman:research\] --> Answer[Findings]
        Advisory[/wingman:advisory\] --> Guidance[Expert guidance]
        Dogfood[/wingman:dogfood\] --> Gap[Gap identification]
        Harness[/wingman:harness\] --> SkillCreation[New skill scaffolding]
    end
```

## Boardroom Verdict Schema

Each verdict follows this structure:

```
## <SEAT> VERDICT: GO | GO_WITH_CONCERNS | NO_GO

**Assessment**: <1-2 sentence plain-language summary>

**Key Point**: <The single most important thing the founder needs to know>

**If NOT GO**: <What specifically would change this to GO>
```

Consolidated summary:

```
## Wingman Boardroom Checkpoint

### Business
- CEO: GO — ...
- CPO: GO — ...
- CMO: GO — ...

### Technical
- CTO: GO WITH CONCERNS — ...

### Finance
- CFO: GO — ...

### Research
- Research: GO — ...

### Design
- Design: GO — ...

**Bottom Line**: GO | GO WITH CHANGES | DO NOT SHIP
**Founder Decision**: <explicit, recorded>
```

## Human Escalation Framework

When a Boardroom verdict is `DO NOT SHIP` or the founder rejects:
1. Escalation is recorded in `checkpoints.jsonl`
2. The founder is offered specific, concrete changes that would flip the verdict
3. No silent override — founder must explicitly accept or reject each concern
4. Re-escalation after changes re-dispatches the full Boardroom (not a subset)
