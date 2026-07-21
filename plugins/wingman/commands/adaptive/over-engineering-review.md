---
description: Run a focused over-engineering review on the specified code path, area, or recent changes. Applies the 5-tag taxonomy from ponytail-review to find and simplify unnecessary complexity.
argument-hint: "[file, directory, or 'recent' to review last changes]"
---

# Wingman: Over-Engineering Review

Review the specified code (or recent changes) through the lens of deliberate complexity reduction. This is a surgical audit, not a general review — it specifically looks for over-engineering patterns that can be simplified.

$ARGUMENTS

## Tag Taxonomy

For each finding, classify it with one of these tags:

- **`#delete`** — Code that can be removed entirely. Not called, not needed, dead.
- **`#stdlib`** — Code reimplements something the language/framework already provides.
- **`#native`** — Code reimplements something the platform (browser, OS, database) already provides.
- **`#yagni`** — Abstraction or flexibility that no current use case requires.
- **`#shrink`** — Code that works but is longer/more complex than necessary.

## Process

1. **Identify the scope.** If `$ARGUMENTS` is `recent`, review the last commit diff. Otherwise, scan the specified files/directory.

2. **Classify each finding.** For each piece of code that could be simpler:
   - What does it do?
   - What would the simpler alternative be?
   - Which tag applies?

3. **Propose the fix.** For each finding, show the current code and the proposed simpler version. If the fix is safe (no behavioral change), apply it.

4. **Verify.** Run the project's test suite to confirm the simplification didn't break anything.

## Report

```markdown
## Over-Engineering Review: <scope>

**Tags applied:** `#delete` (N), `#stdlib` (N), `#native` (N), `#yagni` (N), `#shrink` (N)
**Total findings:** N
**Fixed:** N
**Deferred:** N

### Findings

#### 1. [`#tag`] <file:line> — <one-line description>
- **Current:** <what exists>
- **Simpler:** <what it should be>
- **Action:** Fixed / Deferred (reason)

...
```

Translate findings through `plain-language-checkpoint` before reporting to founder.
