# Eval: debt-ledger

Tests `plugins/wingman/commands/debt-ledger.md` — its status/harvest/add commands and `// minimal:` comment format — against a fixture with intentional debt patterns.

## Scenario 1 — Codebase with debt patterns (positive case)

A small Node.js project with intentional debt:
- 3 `// minimal:` comments with valid ceiling and upgrade path
- 1 `// minimal:` comment that has hit its ceiling
- 1 `// minimal:` comment that is approaching ceiling (within 20%)
- 1 stale `// minimal:` comment (>2 cycles old)
- A DEBT.md file with corresponding entries

## Expectations

| Check | Expected |
|---|---|
| `status` command lists all shortcuts | Yes — 5 total |
| `status` command flags ceiling hits | Yes — 1 hit |
| `status` command flags approaching ceiling | Yes — 1 approaching |
| `status` command flags stale comments | Yes — 1 stale |
| `harvest` command proposes upgrades | Yes — based on upgrade path |
| `add` command creates valid comment | Yes — `// minimal: <ceiling>, <upgrade path>` |
| `add` command creates DEBT.md entry | Yes — with all required fields |
| Report matches exact format | Yes — ID, File:Line, Ceiling, Upgrade Path, Age, Status |

## Trust level

`verified` — passed a real positive scenario with intentional debt patterns, each command correctly identifying and managing debt.
