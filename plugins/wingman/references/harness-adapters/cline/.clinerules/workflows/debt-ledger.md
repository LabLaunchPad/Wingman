---
description: Maintain and review the technical debt ledger. Lists all `// minimal:` comments, flags ceilings that have been hit, and reports on debt trends over time.
argument-hint: "[optional: 'status' for current state, 'harvest' to upgrade completed items, 'add' to log new debt]"
---

# Wingman: Debt Ledger

Maintain the project's technical debt ledger. Every `// minimal:` comment in the codebase represents a deliberate shortcut with a ceiling and upgrade path. This command manages that debt.

$ARGUMENTS

## Commands

### `status` (default)

Scan the codebase for all `// minimal:` comments and report:

```markdown
## Debt Ledger Status

**Total shortcuts:** N
**Ceilings hit:** N (needs immediate attention)
**Within 20% of ceiling:** N (plan upgrade soon)
**Stale (>2 cycles old):** N (needs review)

### Active Debt

| ID | File:Line | Ceiling | Upgrade Path | Age | Status |
|----|-----------|---------|--------------|-----|--------|
| D1 | src/cache.py:42 | >500 users | Redis lock | 3d | OPEN |
| D2 | src/api.ts:88 | >10k req/s | Per-account partition | 5d | OPEN |

### Ceiling Alerts

- `src/cache.py:42` — Approaching 500 user ceiling (currently ~400)
- `src/api.ts:88` — Hit 10k req/s ceiling (currently ~12k)
```

### `harvest`

For each debt item that's been hit or is within 20% of its ceiling:
1. Show the current code with the `// minimal:` comment
2. Propose the upgrade (based on the upgrade path in the comment)
3. If the upgrade is safe, apply it
4. Verify with tests
5. Update that item's row in `DEBT.md`: set `Status` to `RESOLVED` and remove the now-obsolete `// minimal:` comment from the code. Skip this step only for an item you deliberately left alone (e.g. a lower-priority item within the same run) — a harvested item with no `DEBT.md` update leaves the ledger silently out of sync with the code, which defeats its purpose as a source of truth.

### `add`

When you're about to take a deliberate shortcut during `/wingman:build`:
1. Write the code with a `// minimal: <ceiling>, <upgrade path>` comment
2. Add an entry to `DEBT.md` (create if needed)
3. Confirm the entry was added

## DEBT.md Format

```markdown
# Technical Debt Ledger

| ID | Location | Ceiling | Upgrade Path | Date Marked | Hit Date | Status |
|----|----------|---------|--------------|-------------|----------|--------|
| D1 | `src/cache.py:42` | >500 users | Redis lock | 2026-07-13 | — | OPEN |
```

## Rules

- Every `// minimal:` comment MUST have a corresponding DEBT.md entry
- Every entry MUST have a ceiling and upgrade path
- A `harvest`-ed item MUST have its `DEBT.md` row updated (`Status` → `RESOLVED`) in the same pass that removes its `// minimal:` comment — never leave the ledger claiming `OPEN`/`HIT` for code that's already been upgraded
- No ceiling may be permanently exceeded without either:
  - Upgrading to the proper solution, OR
  - Raising the ceiling with explicit justification
- Debt older than 2 release cycles without review is flagged as stale
