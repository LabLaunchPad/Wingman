# File-Based Context Handoffs — Templates and Rules

## Purpose

Everything pasted into a dispatch prompt stays resident in your context for the rest of the session. Context is finite. Every line spent on artifact content is a line unavailable for coordination, decision-making, and recovery. Hand artifacts over as files.

## Directory Structure

All SDD artifacts live under `.wingman/sdd/`:

```
.wingman/sdd/
├── progress.md              # Progress ledger
├── global-constraints.md    # Plan-level constraints (written once)
├── task-1-brief.md          # Task brief (extracted from plan)
├── task-1-report.md         # Implementer + fixer report
├── task-1-review.md         # Task reviewer output (optional, may stay inline)
├── task-1-diff.patch        # Diff file for review
├── task-2-brief.md
├── task-2-report.md
├── task-2-diff.patch
├── ...
└── final-review.md          # Final whole-branch review
```

## File Naming Convention

| Artifact | Name Pattern | Created By |
|---|---|---|
| Task brief | `task-N-brief.md` | Controller (extracted from plan) |
| Task report | `task-N-report.md` | Implementer, then appended by fixer |
| Diff file | `task-N-diff.patch` | Controller (via `git diff`) |
| Review output | `task-N-review.md` | Task reviewer (optional file) |
| Final review | `final-review.md` | Final whole-branch reviewer |
| Global constraints | `global-constraints.md` | Controller (once, at start) |

## Task Brief Template

Extract to `.wingman/sdd/task-N-brief.md`:

```markdown
# Task N: <task title>

## Context
<One line on where this task fits in the project>

## Requirements
<Full task text from the plan — copy verbatim>

## Interfaces
<What this task depends on from prior tasks — specific function signatures, file paths, config keys>

## Decisions
<Any ambiguity resolved by the controller — state the decision and rationale>

## Constraints
<Plan-level global constraints that apply to this task>
```

## Task Report Template

The implementer writes to `.wingman/sdd/task-N-report.md`:

```markdown
# Task N Report

## Status
<DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED>

## What Was Implemented
<One paragraph summary>

## Files Changed
<list of files>

## Tests
<Test count, pass/fail summary>

## Commits
<commit hash range>

## Self-Review Findings
<What the implementer caught and fixed before handoff>

## Concerns
<Observations or doubts — only if DONE_WITH_CONCERNS or BLOCKED>

## Fix History
<Appended by fix subagents — timestamped entries>
```

## Dispatch Prompt Templates

### Implementer Dispatch

```
Task: Implement <task title>
Brief: .wingman/sdd/task-N-brief.md — read this first, it is your requirements
Report: Write your report to .wingman/sdd/task-N-report.md
Context: <one line — interfaces from earlier tasks>
Model: <explicit model>
```

### Task Reviewer Dispatch

```
Review: Task <N>
Brief: .wingman/sdd/task-N-brief.md
Report: .wingman/sdd/task-N-report.md
Diff: .wingman/sdd/task-N-diff.patch
Global constraints: .wingman/sdd/global-constraints.md
Model: <explicit model>
```

### Fix Subagent Dispatch

```
Fix: Task <N>
Report: .wingman/sdd/task-N-report.md — append your fix report here
Findings: <list of findings from reviewer>
Contract: Re-run covering tests, report results in the report file
Model: <explicit model>
```

## Rules

1. **Never paste artifacts inline.** The dispatch prompt references file paths. The subagent reads the files.

2. **Brief before dispatch.** Always extract the task brief to a file before dispatching the implementer. The brief is the contract.

3. **Report is append-only.** The implementer creates the report. Fixers append to it. The report becomes the complete audit trail for the task.

4. **Diffs via script.** Generate diff files with `git diff` or `git diff HEAD~1`, never by pasting terminal output into the dispatch prompt.

5. **One report per task.** Never create separate fix-report files. Everything for a task lives in `task-N-report.md`.

6. **Clean up after final review.** After the final whole-branch review passes, the `.wingman/sdd/` directory can be archived or removed. The progress ledger should be kept until the branch merges.
