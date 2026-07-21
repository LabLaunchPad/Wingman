---
name: ponytail-debt-harvesting
description: Use when managing technical debt during /wingman:build, /wingman:audit, or any code-touching work — formally track it via `// minimal:` comments, maintain a debt ledger, enforce time limits, and upgrade to proper solutions when thresholds are hit. Prevents shortcuts from silently becoming permanent debt.
---

<!--
Adapted from DietrichGebert/ponytail (MIT License, Copyright (c) 2026
DietrichGebert) — skills/ponytail-debt/SKILL.md. Debt harvesting
pattern formalized here for Wingman's build-time use.
-->

# Technical Debt Harvesting

## The Problem

Every deliberate shortcut (`// minimal:` comment) has a ceiling. When usage approaches that ceiling, the shortcut becomes the wrong abstraction. Without a ledger, shortcuts rot silently into permanent debt — nobody remembers the ceiling, the upgrade path, or even that the shortcut was deliberate.

## The Pattern

### 1. Mark Every Shortcut

When you take a deliberate shortcut in `engineering-minimalism`, mark it:

```python
# minimal: O(n²) scan, switch to index if >1000 users
for user in users:
    if user.id in [f.id for f in followers]:
        ...
```

```typescript
// minimal: global lock, per-account locks if throughput matters
const lock = new GlobalLock();
```

The format: `// minimal: <ceiling or limit>, <upgrade path>`

### 2. The Debt Ledger

Maintain a `DEBT.md` (or `DEBT.json`) in the project root. Every `// minimal:` comment should have a corresponding entry:

```markdown
# Technical Debt Ledger

| ID | Location | Ceiling | Upgrade Path | Date Marked | Hit Date | Status |
|----|----------|---------|--------------|-------------|----------|--------|
| D1 | `src/cache.py:42` | >500 concurrent users | Redis-backed lock | 2026-07-13 | — | OPEN |
| D2 | `src/api/handler.ts:88` | >10k req/s | Per-account partition | 2026-07-13 | — | OPEN |
```

### 3. When to Harvest

- **Monitor:** When approaching the ceiling (load test shows 400/500 concurrent users), start planning the upgrade.
- **Execute:** At the ceiling, stop new work on the affected path and upgrade before the next feature.
- **Never leave:** Don't leave a `// minimal:` comment with a ceiling you've already hit. Either upgrade now or raise the ceiling explicitly (new comment with new ceiling and justification).

### 4. Debt Decay Rule

A `// minimal:` comment older than **one release cycle** without being upgraded needs a status review — this is the earlier, softer trigger; the audit's harder 2-cycle flag below is for debt nobody reviewed even once:
- **Still relevant?** Update the ceiling and date.
- **Never going to be hit?** Remove the comment and simplify — you don't need a ladder to the roof if you're never going to the roof.
- **Already hit?** Upgrade now, or justify the debt with a time-boxed plan in DEBT.md.

### 5. Debt Audit (via `/wingman:audit`)

The audit command scans all `// minimal:` comments and:
1. Lists every shortcut with its ceiling and upgrade path.
2. Flags any ceiling that's been hit or is within 20% of being hit.
3. Flags any comment older than 2 release cycles without a status update.
4. Reports total debt count and trends (growing, stable, shrinking).

## Anti-Patterns

- **Silent shortcuts:** Taking a shortcut without marking it. Every shortcut must have a `// minimal:` comment.
- **Ceiling blindness:** Hitting the ceiling and working around it instead of upgrading.
- **Debt hoarding:** Accumulating dozens of minimal comments without ever harvesting any.
- **Over-engineering the ledger:** The debt ledger should be simple (markdown table or JSON). Don't build a tool to manage the tool.

## Integration with Wingman

- **`engineering-minimalism`**: Generates `// minimal:` comments when taking shortcuts at rungs 6-7.
- **`verification-before-completion`**: Checks that `// minimal:` comments exist for every deliberate shortcut.
- **`/wingman:audit`**: Runs debt harvest scan, flags ceiling hits, reports trends.
- **`/wingman:build`**: When building near a debt ceiling, reminds about pending upgrades.

## Anti-Rationalization Defense

### Common Rationalizations

| Excuse | Reality |
|---|---|
| "The shortcut still works fine, no need to upgrade" | Hitting the ceiling means the shortcut is now the wrong abstraction. Working-fine is not the same as correct. |
| "I'll add the `// minimal:` comment later" | Later never comes. If you're taking a shortcut now, mark it now. Unmarked shortcuts are invisible debt. |
| "The ceiling is close but not hit yet, I'll deal with it next release" | Start planning the upgrade when approaching the ceiling (80% threshold). Waiting until you hit it means you're already past the point where it works. |
| "The debt ledger is extra overhead for something I already track mentally" | Mental tracking is invisible tracking. Without a ledger, shortcuts rot silently into permanent debt. Write it down. |
| "This shortcut is permanent anyway, no need for a ceiling" | If it's permanent, it's not a shortcut — it's the implementation. Write it as proper code, not as a `// minimal:` comment. |
| "I've had this shortcut for 3 release cycles but it's still relevant" | 3 cycles without upgrade means either the ceiling was wrong or you're avoiding the harvest. Review and decide: update the ceiling, upgrade, or justify with a time-boxed plan. |

### Red Flags

- You're taking a shortcut without adding a `// minimal: <ceiling>, <upgrade path>` comment.
- You've hit a ceiling and are working around it instead of upgrading.
- You have more than a dozen `// minimal:` comments without having harvested any.
- You're adding a `// minimal:` comment with no realistic ceiling (i.e., you're writing permanent code as a shortcut).
- A `// minimal:` comment is older than 2 release cycles without a status update.
- You're building a tool to manage the debt ledger instead of just maintaining the markdown table.

### Anti-Pattern Callouts

- **Silent shortcuts:** Taking a shortcut without marking it. Every unmarked shortcut is invisible debt that will surprise someone later.
- **Ceiling blindness:** Approaching or hitting the ceiling and working around it instead of upgrading. The ceiling exists to trigger the upgrade, not to be endured.
- **Debt hoarding:** Accumulating dozens of minimal comments without ever harvesting. The ledger is a trigger for action, not a trophy case.
- **Ledger-engineering:** Building a sophisticated tool to manage the debt ledger. The ledger is a markdown table. Keep it simple.
