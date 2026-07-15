---
description: Audit whether this project's tests, linting, and build actually prove anything, so Wingman's verification claims are trustworthy.
argument-hint: ""
---

# Wingman: Harness

Every "tests pass" claim Wingman makes during `/wingman:build` (including its Definition-of-Done gate, which folds in what used to be a separate `/wingman:secure` stage) is only as good as the test/build/lint setup (the "harness") behind it. This command periodically checks that the harness itself is honest, rather than assuming it.

## What to check

1. **Does a test suite exist at all?** If not, say so plainly — every "verified" claim until one exists is weaker than it sounds, and the founder should know that.
2. **Do the tests actually run and fail when they should?** Spot-check: temporarily break something trivial and confirm the relevant test fails, then restore it. A test suite that never fails is not verifying anything.
3. **Is there a real build/typecheck step**, and does it catch real errors (not just lint style issues)?
4. **Is CI wired up** (or is verification only ever run locally, meaning it can be skipped)?
5. **Coverage gaps** — is there a category of change (e.g. anything touching payments, auth, or data migrations) with no tests at all?
6. **Bloat detection** — scan for files over 200 lines, functions over 50 lines, deeply nested code (>3 levels), and repeated patterns. Flag anything that could be simplified using stdlib, native platform features, or existing dependencies. Apply the 5-tag taxonomy (`#delete`, `#stdlib`, `#native`, `#yagni`, `#shrink`).
7. **Debt ceiling check** — scan for `// minimal:` comments and flag any that have hit their ceiling or are within 20% of it. See `ponytail-debt-harvesting` for the debt harvesting pattern.

## Report

```markdown
## Harness Audit

**Can we trust "tests pass" here?** <yes / partially / no — plain language>
**Gaps found:** <bulleted, plain language, ordered by how much they matter>
**Recommended next step:** <the single highest-leverage fix, sized as small/medium/large>
```

## If gaps are found

Offer to fix the highest-leverage gap now (following the same test-first discipline as `/wingman:build`), or log it via `/wingman:learn` if it's a known tradeoff being accepted for now rather than fixed immediately.

## See also

`/wingman:harness` audits whether *existing* test/build/lint state is honest. `/wingman:dogfood` is a different, complementary operation — it generates and runs a fixture/feature through the real pipeline end to end, to find gaps in the pipeline's own behavior rather than in a project's existing harness.
