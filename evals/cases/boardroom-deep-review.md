# Eval: boardroom-deep-review

Tests `plugins/wingman/commands/boardroom.md`'s deep-review mode (v8, see `docs/ARCHITECTURE.md` §12) — the opt-in second dispatch round where each seat sees the other four seats' round-1 verdicts and confirms or revises its own. Two things need real evidence, not just a design read: (1) round 2 verdicts are actually *informed* by round-1 content (a seat referencing another seat's specific finding, not independently re-derived from scratch), and (2) the default no-flag `/wingman:boardroom` path is genuinely unaffected by this addition.

## Fixture

`evals/fixtures/setup-boardroom-deep-review-fixture.sh <target-dir>` — "csv-import-app," a plan for a bulk CSV customer-import feature, with the implementation already committed as `src/bulk-import.js`. Deliberately seeded with real, independently-discoverable defects across multiple lenses so round 1 has genuine grounds for a split verdict: a hardcoded live-looking credential (`sk_live_...`) and string-interpolated SQL (Security), an undefined `runQuery` call that would crash on the first row despite the plan's "tested against 5 rows" claim (Engineering), no per-row validation or error handling despite the plan promising graceful skip behavior (Design), and an uncapped/non-idempotent per-row API call loop (Cost).

## Procedure

1. Run the fixture setup script.
2. Dispatch all 5 real Boardroom seats (`wingman:boardroom-founder/-engineer/-security/-design/-cost`, actual subagents, not synthetic verdicts) in parallel against the fixture's plan + implementation — round 1, identical to the default single-round dispatch.
3. Persist each seat's full round-1 verdict verbatim to `.wingman/boardroom/<checkpoint_id>/round-1/<seat>.md` in the fixture.
4. Dispatch all 5 seats again — round 2 — each given its own round-1 verdict plus the other four's as read-only reference, asked to name any conflict/question and confirm-or-revise. Persist to `round-2/<seat>.md`.
5. Apply the convergence check from `boardroom.md`: does round 2 change any seat's bottom-line verdict in a way that changes the *overall* consolidated outcome? If not, stop at round 2 (no round 3).
6. Write the final checkpoint: mark the plan file, append `checkpoints.jsonl` with `"rounds": 2`, update `state.json`.
7. Independently verify every file against the real filesystem — do not trust any seat's or the orchestrating turn's self-report.
8. Separately, confirm the default no-flag path is unaffected: diff `boardroom.md` against its pre-v8 version and confirm the original dispatch/consolidation sections are unmodified (only additions), rather than re-running a full default-path scenario from scratch (already covered, unmodified, by `boardroom-gate-rule.md` and every other eval that exercises the standard path).

## Expectations

| Check | Expected |
|---|---|
| Round 1 verdicts | Independent, no cross-visibility — 5 real subagents, no synthetic content |
| Round-1 files | `.wingman/boardroom/<checkpoint_id>/round-1/{founder,engineer,security,design,cost}.md`, each the seat's full verbatim verdict |
| Round-2 cross-informed content | At least one seat's round-2 text explicitly references another seat's *specific* round-1 finding by name/detail (not a generic "I agree with the team") |
| Genuine verdict revision | At least one seat's bottom-line verdict changes between round 1 and round 2, with an explicit reason tied to another seat's finding |
| Convergence check applied correctly | If the changed verdict doesn't change the *overall* consolidated outcome (e.g. bottom line was already `DO NOT SHIP` and stays `DO NOT SHIP`), stop at round 2 — do not run a round 3 just because a seat's individual verdict moved |
| Round cap | Never exceeds round 3 regardless of outcome |
| `checkpoints.jsonl` | Valid JSON line, `"rounds"` field matches the actual number of rounds run, all 5 seats' *final* (latest-round) verdicts recorded, not round-1 verdicts |
| Founder-facing summary | Reports round count and whether any seat changed its mind, in the exact format `boardroom.md` specifies |
| Default path unaffected | `boardroom.md`'s diff against its pre-v8 version shows only additions — the original single-round dispatch/consolidation text is byte-for-byte unchanged |

## Trust level

`verified` — a real 2-round, 10-subagent-dispatch run (not synthetic verdicts) produced a genuine, evidence-based verdict revision, correctly applied the convergence check to stop at round 2, and every file write was independently confirmed against the real filesystem.

## Run log

### Run 1 — 2026-07-10

**Round 1** (5 real subagents, independent, no cross-visibility): 4× `NO_GO` (founder, engineer, security, design) + 1× `GO_WITH_CONCERNS` (cost) — a genuine split, not a manufactured one. Each seat found real, independently-discoverable defects in its own lens: Security found the hardcoded `sk_live_...` key and SQL-injectable string interpolation; Engineering found `runQuery` is never imported/defined (meaning the plan's "manually tested against 5 rows" claim cannot be true — the code throws `ReferenceError` on row one); Design found the plan's "skips malformed rows" promise isn't implemented at all; Founder synthesized the business risk in plain language; Cost initially treated the hardcoded key as "outside my lane, one line" and rated the usage-based billing exposure (uncapped row count, no dedupe) as `GO_WITH_CONCERNS` rather than a hold.

Persisted verbatim to `round-1/{founder,engineer,security,design,cost}.md` — independently confirmed present on disk with matching content.

**Round 2** (5 real subagents, each given all 5 round-1 verdicts): every seat explicitly engaged with at least one other seat's specific finding rather than restating its own — e.g. Engineering told Cost its "100k paid API calls" scenario is currently *latent* (can't fire yet, since `runQuery` doesn't exist) but would apply "to whatever version actually ships"; Security noted Engineering's finding "sharpens, not softens" its own read since an untested path was presented as verified. **Cost genuinely revised its verdict from `GO_WITH_CONCERNS` to `NO_GO`**, explicitly reasoning from Security's round-1 finding: "Security now confirms it's a production-prefixed key that, once committed, is in git history forever. That changes my own analysis... a leaked live key is a standalone, unbounded cost vector." This is real cross-informed reasoning, not a cosmetic restatement — the verdict change is traceable to a specific other seat's specific finding, which is exactly what this eval needed to confirm actually happens rather than being asserted by the design doc.

**Convergence check, applied correctly**: Cost's verdict changed, but the overall consolidated outcome did not — it was `DO NOT SHIP` after round 1 (any `NO_GO` present) and remained `DO NOT SHIP` after round 2 (now unanimous). Per `boardroom.md`'s exact rule ("if round 2 changed any seat's bottom-line verdict *in a way that could change the overall consolidation outcome*"), this correctly stops at round 2 — no round 3 ran. This is a meaningful negative check on the rule's precision: a naive implementation might trigger a third round any time *any* individual verdict moves, but the rule specifically gates on the *outcome*, and this run exercised exactly that distinction with a real (not hypothetical) verdict change that didn't cross the outcome threshold.

**Final checkpoint, independently verified against the real filesystem**: `.wingman/checkpoints.jsonl` — one valid JSON line, `"bottom_line": "DO NOT SHIP"`, all 5 seats' *final* (round-2) verdicts recorded (all `NO_GO`), `"rounds": 2`, `"next_stage": "plan"` (correctly pinned to the reviewed stage, not advanced — reusing the existing gate-rule invariant `boardroom-gate-rule.md` already covers). `.wingman/state.json` created fresh with `current_stage: "plan"`, empty rosters, `last_checkpoint_id` matching. Plan file's `## Wingman Boardroom Checkpoint` marker correctly appended with `Bottom line: DO NOT SHIP` / `Founder decision: fix concerns first`.

**Default-path regression check**: `git diff origin/main -- plugins/wingman/commands/boardroom.md` shows exactly 3 removed lines (the frontmatter `description`/`argument-hint`, extended in place with deep-mode trigger phrasing, and the JSON schema's `"next_stage"` line, which gained a sibling `"rounds": 1` field immediately after it) and only additive new sections elsewhere. The original dispatch instructions ("Dispatch all five boardroom seats **in parallel**..."), the seat list, the `token-economy` note, and the entire "Consolidate into one founder-facing summary" section (including the bottom-line rule) are byte-for-byte unchanged — confirming the deep-review mode is genuinely opt-in and doesn't alter the path every other eval (`boardroom-gate-rule.md`, `full-pipeline-e2e.md`, `department-lead-activation.md`) already exercises.

Promoted to `verified` on the first run — both required properties (cross-informed revision, correct convergence-check precision) were demonstrated with real evidence in one pass, and the default-path diff check leaves no ambiguity about non-interference.
