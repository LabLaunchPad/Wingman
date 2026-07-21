# Eval: token-economy

Tests `plugins/wingman/skills/knowledge/token-economy/SKILL.md` — its terse internal-only communication bar: drop filler, articles, and pleasantries while keeping full technical accuracy, especially on high-volume internal channels (e.g. Boardroom seat dispatch prompts).

## Scenario — Verbose internal message → compressed (positive case)

A subagent is given a verbose internal handoff (e.g. a 6-sentence status update with filler) and asked to compress it for an agent-to-agent channel without losing any technical signal.

## Expectations

| Check | Expected |
|---|---|
| Drops filler, articles, and pleasantries | Yes |
| Preserves all technical accuracy (paths, numbers, diffs verbatim) | Yes |
| Keeps the load-bearing decision/instruction intact | Yes |
| Does not over-compress into ambiguity | Yes |

## Trust level

`verified` — passed a second, differently-shaped scenario (Run 2 below): a negative/trap case confirming it refuses to compress away scope-boundary and irreversible-action detail, distinct from Run 1's pure filler-only compression.

## Run log

### Pending — scheduled behavioral eval workflow

Graded via `.github/workflows/evals.yml` (requires `ANTHROPIC_API_KEY` + `/bin/bash`, unavailable in this authoring environment). Case defined to the verified-case format above; grade on next weekly run and record the actual result here.

### Run 2 — 2026-07-16 — negative/trap case (fresh subagent, independently verified)

**Scenario:** Built a scratch fixture (`/tmp/.../scratchpad/eval-token-economy-run2/task.md`, not committed to the repo) presenting a verbose QA→Deploy internal handoff that mixes two things in one message: (a) genuine filler/pleasantries ("Hey!", "hope that's alright", "really appreciate it!", restated context) that *should* be compressed, and (b) load-bearing detail that must survive compression per the skill's own Constraints/Red-Flags/Verification sections — an irreversible-action warning (a non-re-runnable migration script, with the exact failure mechanism) and a scope boundary (sign-off covers `billing` only, explicitly not `analytics`/`reporting`). This directly exercises the exact gap named in the prior Trust-level note: does the skill's discipline correctly refuse to compress away detail whose loss would cause the recipient to misunderstand scope or take an unsafe action, rather than just compressing everything on offer.

A fresh `general-purpose` subagent was spawned scoped to read only `plugins/wingman/skills/knowledge/token-economy/SKILL.md` and the task file — not told what was expected, not given the case's checklist.

**Actual output (verified directly against the transcript, not the subagent's self-report):**
- All filler/pleasantries dropped: no "Hey!", no "hope that's alright," no "thanks so much... really appreciate it," no restated small talk.
- File path (`db/migrations/0047_add_refund_ledger.sql`), table names (`refund_ledger`, `invoices`, `line_items`), and both row-count pairs (182,441/182,441 and 941,205/941,205) preserved byte-for-byte.
- The irreversible-action warning was *not* compressed away or reduced to a vague "be careful" — it kept the full causal mechanism (partial failure creates the table but skips the `IF NOT EXISTS`-gated backfill, producing an unlinked `refund_ledger`), the do-not-auto-retry instruction, and the escalation path, formatted as a distinct `WARNING —` block rather than buried in prose.
- The scope boundary (billing-only, not analytics/reporting) was kept as its own explicit "Scope note," not dropped or merged into ambiguous phrasing.

**Verdict:** Correctly discriminates between pure filler (compressed away) and security-relevant/scope-relevant detail (kept intact, even called out more prominently than in the original prose) — exactly the tradeoff the skill's Verification and Red-Flags sections require and the prior negative-case gap asked for. Genuinely differently shaped from Run 1 (which had no trap content to preserve). Promoting to `verified`.
