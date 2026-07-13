# Progress Ledger — Template and Rules

## Purpose

The progress ledger is the single source of truth for task completion status. It survives conversation compaction; your context does not. The ledger prevents re-dispatching completed tasks — the most expensive failure in multi-task execution.

## File Location

`.wingman/sdd/progress.md`

Create the `.wingman/sdd/` directory if it does not exist.

## Template

```markdown
# Progress Ledger

Plan: <plan file path>
Branch: <branch name>
Started: <ISO timestamp>

## Tasks

| # | Status | Commits | Review | Model | Notes |
|---|--------|---------|--------|-------|-------|
| 1 | complete | a1b2c3d..d4e5f6g | clean | claude-sonnet-4-20250514 | |
| 2 | complete | h7i8j9k..k0l1m2n | clean-after-fix | claude-sonnet-4-20250514 | reviewer found missing test |
| 3 | in-progress | — | — | | dispatched |
| 4 | pending | — | — | | |
| 5 | pending | — | — | | |
```

## Rules

1. **Append-only.** Never edit or remove past entries. If a task status changes, add a new row for the same task number with the updated status.

2. **Write immediately after clean review.** Do not batch ledger writes. After a task reviewer returns "approved," append the ledger line before dispatching the next task.

3. **Include commit ranges.** Record the commit hash range so you can verify against `git log` after compaction. Format: `short-hash..short-hash`.

4. **Include the model used.** This helps you track whether your model selection is working — if cheap-model tasks keep getting re-dispatched, upgrade the default.

5. **Include review outcome.** Use `clean` if the first review passed, or `clean-after-fix` if a fix cycle was needed. This surfaces which task types need more review attention.

6. **Verify on skill start.** Before dispatching any task, read the ledger and verify each "complete" entry's commits exist in git. If a commit is missing, mark the task as needing re-dispatch.

7. **Post-compaction recovery.** After context compaction, read the ledger first. Trust it and `git log` over your own recollection. Resume from the first incomplete task.

## Post-Compaction Recovery Checklist

```markdown
- [ ] Read .wingman/sdd/progress.md
- [ ] For each "complete" task: git log --oneline <commit-range>
- [ ] Confirm branch state matches ledger description
- [ ] Identify first incomplete task
- [ ] Correct any ledger entries that conflict with git log
- [ ] Resume execution from first incomplete task
```

## Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| Task re-dispatched that was already done | Ledger not consulted after compaction | Always read ledger first; verify commits |
| Ledger says complete but commits missing | Commit was lost (rebase, reset) | Mark task as pending; re-dispatch |
| Ledger and git log disagree | Ledger was not updated after a fix cycle | Correct the ledger to match git log |
| Ledger not created at skill start | Skill started without initialization | Create ledger before first dispatch |
