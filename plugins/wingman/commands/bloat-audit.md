---
description: Run a whole-repo bloat audit, ranking files by complexity and identifying opportunities for simplification. Scans for code that could be shorter, abstractions that could be deleted, or native solutions that were missed.
argument-hint: "[optional: directory to focus on, defaults to whole project]"
---

# Wingman: Bloat Audit

Run a whole-repo scan that ranks files by complexity and identifies bloat. This is the ponytail-audit pattern: scan everything, rank by severity, propose the simplest fix for each.

$ARGUMENTS

## Process

1. **Scan.** Use `ripgrep` or equivalent to find:
   - Files over 200 lines (potential monoliths)
   - Functions/methods over 50 lines (potential complexity)
   - Deeply nested code (>3 levels of indentation)
   - Repeated patterns (copy-paste code)
   - Large imports (importing entire libraries for one function)

2. **Rank.** Sort findings by estimated simplification impact:
   - **High:** File/function can be cut by >50% using stdlib/native
   - **Medium:** File/function can be cut by 20-50% with targeted refactoring
   - **Low:** Style/readability improvements, minor complexity reduction

3. **Classify.** Apply the same 5-tag taxonomy as `/wingman:over-engineering-review`:
   - `#delete` — Dead code that can be removed
   - `#stdlib` — Reimplements stdlib functionality
   - `#native` — Reimplements platform functionality
   - `#yagni` — Unnecessary abstraction
   - `#shrink` — Code that's longer than necessary

4. **Prioritize.** Focus fixes on the highest-impact items first. Don't try to fix everything at once.

## Report

```markdown
## Bloat Audit: <scope>

**Files scanned:** N
**Findings:** N (High: N, Medium: N, Low: N)
**Total lines that could be removed:** ~N

### Top Findings

#### 1. [`#tag`] <file> — <N> lines, could be ~<M> lines
- **Current:** <brief description>
- **Simpler:** <brief description>
- **Impact:** Remove ~<N> lines

...

### Summary by Tag
- `#delete`: N files/functions (remove entirely)
- `#stdlib`: N files/functions (use stdlib instead)
- `#native`: N files/functions (use platform feature instead)
- `#yagni`: N files/functions (remove unnecessary abstraction)
- `#shrink`: N files/functions (simplify existing code)
```

Translate findings through `plain-language-checkpoint` before reporting to founder.
