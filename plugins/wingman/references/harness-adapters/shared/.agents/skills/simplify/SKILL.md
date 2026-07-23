---
name: simplify
description: Use when code has just been written or changed and should be tightened before it hardens — remove duplication, shrink indirection, drop dead branches, and collapse cleverness into the obvious. Renders a simplification plan only; never edits code silently.
---

# Simplify

Keeps the codebase from rotting as features pile on. After a build or change,
take one pass to make the new code smaller and clearer *before* it sets and
every later reader has to decrypt it. Adapted from the simplify discipline in
`obra/superpowers` (MIT), restated in Wingman's own words and paired with
`engineering-minimalism` and `/wingman:harness`'s bloat checks.

## When to use
- Right after `/wingman:build` finishes a feature or fix.
- When a reviewer (or `code-review`) flags "this is more complex than it needs to be."
- Before `/wingman:ship`, as a tidy-up gate.

## Method
1. Read the changed code only — don't rewrite the world.
2. Look for, in order of value:
   - **Duplication** — the same logic twice → extract once.
   - **Indirection** — a wrapper that wraps a wrapper → collapse.
   - **Dead branches** — code that can't run given real inputs → delete.
   - **Cleverness** — something smart that a tired reader won't get → make it obvious.
   - **Size** — a function over ~50 lines or a file over ~200 → split or trim
     (the same thresholds `/wingman:harness` flags).
3. Produce a short plan: each change as "delete / extract / collapse X because Y."
4. **Do not silently rewrite.** Show the plan, then apply it in the same pass —
   never a silent edit with no reasoning shown alongside it. "Silently" is the
   operative word, not "immediately": the plan and the diff travel together, so
   whoever reads the result sees both the reasoning and the change, never the
   change alone. Verify behavior is unchanged (same inputs → same outputs,
   confirmed by re-running the existing tests before and after) as part of the
   same pass, not a separate later step.
5. Lead with the one big win, not a laundry list of nits.

## Rationalizations
- "It works, leave it." — Working and clear are different; clarity is cheaper now.
- "I'll simplify later." — Later never comes; the code sets.
- "More abstraction makes it cleaner." — Abstraction is a cost; only extract real duplication.
- "I'll just rewrite it while I'm here." — Rewrites hide behavior changes; simplify, don't reinvent.

## Red Flags
- Simplifying without showing the plan (silent edits to working code).
- Extracting a "shared" helper used only once (YAGNI).
- Shrinking so far the intent is lost — smaller is not always clearer.

## Verification
After simplifying, re-read the plan against the result: every change maps to a
stated reason, no behavior was silently altered (same inputs → same outputs),
and the code is genuinely smaller or clearer — not just moved around. If you
can't state the behavior-preserving reason for a change, don't make it.
