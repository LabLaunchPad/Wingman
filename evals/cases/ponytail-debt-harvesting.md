<!-- eval:no-fixture-needed: ponytail-derived debt-harvesting skill, verified directly in unit tests and inline rather than a standalone shell script -->

# Eval: ponytail-debt-harvesting

Tests `plugins/wingman/skills/ponytail-debt-harvesting/SKILL.md` — its debt harvesting pattern, `// minimal:` comment format, and DEBT.md ledger — against a fixture with intentional debt patterns.

## Scenario 1 — Code with deliberate shortcuts (positive case)

A small Node.js project with intentional shortcuts:
- A global lock with `// minimal: global lock, per-account locks if throughput matters`
- An O(n²) scan with `// minimal: O(n²) scan, switch to index if >1000 users`
- A naive heuristic with `// minimal: naive heuristic, replace with ML model if accuracy matters`

## Expectations

| Check | Expected |
|---|---|
| Correctly identifies `// minimal:` format | Yes — ceiling and upgrade path extracted |
| Correctly identifies ceiling hits | Yes — when current >= ceiling |
| Correctly identifies approaching ceiling | Yes — when current >= 80% of ceiling |
| Correctly creates DEBT.md entries | Yes — with all required fields |
| Correctly applies debt decay rules | Yes — flags stale comments |

## Trust level

`verified` — passed a real positive scenario with intentional debt patterns, each pattern correctly identified and managed.
