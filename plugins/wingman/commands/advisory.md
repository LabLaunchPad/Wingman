---
description: Run the three business-advisory lenses (CFO / CMO / CRO) in parallel and merge them into one plain-language recommendation. Use when the founder wants the combined finance, marketing, and revenue read on a decision.
---

# /wingman:advisory

Give the founder a combined C-level business read. This is the orchestrator for
the `founder-cfo`, `founder-cmo`, and `founder-cro` skills — it fans them out in
parallel and merges their verdicts, exactly like `/wingman:boardroom` does for
the engineering/security/design/cost seats.

## When to use
- The founder asks "should we do this?" with money, market, or revenue stakes.
- A plan needs a business sanity check before a Boardroom or ship checkpoint.

## Steps
1. Restate the decision in one plain-language sentence.
2. In a single turn, load and apply all three skills:
   - `founder-cfo` — cash, runway, pricing, affordability.
   - `founder-cmo` — positioning, audience, messaging.
   - `founder-cro` — conversion, retention, revenue motion.
3. Merge into one summary:
   - Each lens's verdict in 1-2 lines.
   - Conflicts resolved by the most severe caveat winning (same rule as
     `/wingman:boardroom`).
   - A single recommended path.
4. Lead with consequence, not jargon. Never write or edit code.
5. Suggest the next step: `/wingman:plan`, `/wingman:boardroom`, or `/wingman:ship`.

## Guardrails
- Verdicts only — these lenses render advice, not code.
- State each lens's assumptions; a missing number is a flagged risk.
- Keep it plain-language; the founder may not be technical.
