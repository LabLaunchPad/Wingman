# Definition of Done — Cross-Skill Quality Gate

Standing checklist applied by every Boardroom seat, every skill, every task. No task is "done" until every section passes. Evidence required — claims without output are ignored.

---

## 1. Correctness

| Gate | How to verify | Blocker? |
|------|--------------|----------|
| All tests pass | `bun test --jobs=4` exits 0, zero failures | YES |
| Type checker clean | `bunx tsc --noEmit` exits 0 errors | YES |
| No regressions | Diff of passing test count: new >= old | YES |
| Lint clean | Linter exits 0 (or project-configured threshold) | YES |
| Edge cases handled | Null, empty, boundary inputs tested explicitly | YES |

**Rule:** If any test is skipped with `.skip` or `xit`, explain why in the PR or treat as incomplete.

---

## 2. Quality

| Gate | How to verify | Blocker? |
|------|--------------|----------|
| 5-tag taxonomy applied | Code classified: Core / Plumbing / Glue / Cosmetic / Incidental — intensity matched | YES |
| No dead code | `grep` for unused exports, unreachable branches, commented-out blocks | YES |
| No premature abstraction | Each abstraction justified by 3+ call sites or stated future need with ADR | YES |
| Single responsibility | Every module/function does exactly one thing | Advisory |
| Immutability preferred | `const`, readonly, pure functions where possible | Advisory |
| Naming clarity | Names reveal intent; no abbreviations except domain-standard | Advisory |

**5-Tag Intensity Guide:**
- **Core** (highest rigor) — correctness-critical, security-sensitive, public API
- **Plumbing** (high) — data flow, I/O, integration seams
- **Glue** (medium) — wiring, configuration, mapping
- **Cosmetic** (low) — formatting, naming, non-functional polish
- **Incidental** (minimal) — one-off scripts, throwaway experiments

---

## 3. Integration

| Gate | How to verify | Blocker? |
|------|--------------|----------|
| No broken imports | `bunx tsc --noEmit` + runtime smoke | YES |
| No missing dependencies | `bun install` clean, lockfile updated | YES |
| No schema drift | Migration files match type definitions | YES |
| API contracts honored | Request/response shapes match docs or tests | YES |
| Backward compatibility | Existing consumers unbroken (or migration path documented) | YES |

---

## 4. Documentation

| Gate | How to verify | Blocker? |
|------|--------------|----------|
| ADRs updated | If an architectural decision changed, new/updated ADR exists | YES (if decision changed) |
| API docs current | Public functions/classes have JSDoc or equivalent | Advisory |
| README reflects changes | Setup, usage, examples match current behavior | Advisory |
| Changelog updated | User-facing changes noted | Advisory |
| Inline comments sparse | Only non-obvious logic explained; code is self-documenting | Advisory |

---

## 5. Ship-Readiness

| Gate | How to verify | Blocker? |
|------|--------------|----------|
| Security scan clean | No HIGH/CRITICAL findings from security tooling | YES |
| No hardcoded secrets | `grep -r "password\|secret\|token\|apikey" --include="*.ts"` returns nothing unexpected | YES |
| Error handling present | Every I/O boundary has explicit error handling | YES |
| Graceful degradation | Failure modes produce useful messages, not stack traces | YES |
| No secrets in VCS | `.env` in `.gitignore`, no keys in committed files | YES |
| Rate limiting (if API) | Endpoints have rate limits or are internal-only | Advisory |

---

## 6. Evidence

| Requirement | What counts | What does NOT count |
|-------------|------------|---------------------|
| Test results | `bun test` output showing pass/fail counts | "Tests should pass" |
| Type check | `bunx tsc --noEmit` output | "Types look fine" |
| Security scan | Tool output with severity levels | "I checked manually" |
| Coverage | `bun test --coverage` report showing % per file | "Most code is covered" |
| Manual verification | Screenshot or command output for UI/IoT flows | "I tested it" |
| Comparison | Before/after metrics for performance claims | "It feels faster" |

**Bottom line:** Every quality claim in a Boardroom checkpoint or PR description must cite a command, a file, or a number. Assumptions are treated as risks.

---

## Application Rules

1. **Every Boardroom seat** references this checklist when assessing task completion.
2. **Every skill** that produces code must run the relevant gates before declaring done.
3. **Engineer seat** owns enforcement; **Founder seat** owns prioritization when gates conflict.
4. If a gate is intentionally skipped, it must be called out explicitly with justification — silent skips are violations.
5. This document is versioned. Changes require a Boardroom checkpoint.
