# Eval: bloat-audit

Tests `plugins/wingman/commands/bloat-audit.md` — its whole-repo scan, complexity ranking, and 5-tag classification — against a fixture with intentional bloat patterns.

## Scenario 1 — Codebase with bloat patterns (positive case)

A small Node.js project with intentional bloat:
- A 250-line monolith file (should be split)
- A 60-line function (should be decomposed)
- Deeply nested code (4+ levels)
- Copy-paste patterns (repeated code)
- Large imports (importing entire lodash for one function)

## Expectations

| Check | Expected |
|---|---|
| Correctly identifies files >200 lines | Yes — flags monolith |
| Correctly identifies functions >50 lines | Yes — flags complex function |
| Correctly identifies deep nesting | Yes — flags >3 levels |
| Correctly identifies repeated patterns | Yes — flags copy-paste |
| Correctly identifies large imports | Yes — flags lodash |
| Ranks by simplification impact | Yes — high/medium/low |
| Applies 5-tag taxonomy | Yes — #delete, #stdlib, #native, #yagni, #shrink |
| Report matches exact format | Yes — files scanned, findings, summary by tag |

## Trust level

`verified` — passed a real positive scenario with intentional bloat patterns, each finding correctly ranked and tagged.
