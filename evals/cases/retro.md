# Eval: retro

Tests `plugins/wingman/commands/adaptive/retro.md` behaviorally — never exercised by any prior eval in this project. Does a fresh agent gather real facts before writing (not generic boilerplate), follow the exact required format, save to the right canonical location, and make a genuine, reasoned feed-forward decision about `/wingman:learn` rather than reflexively always or never triggering it?

## Fixture

Reuses `evals/fixtures/setup-ledger-fixture.sh`'s output *after* a full `full-pipeline-e2e` Run 2 has completed against it (see that eval case) — a project with a rich, real history: a plan-stage fix-recheck loop, a build-stage finding independently reconfirmed twice, a secure-stage founder-accepted-risk decision, and a ship-stage process defect that was self-caught and disclosed. No separate fixture script needed; this is real accumulated history, not synthetic.

## Procedure

1. Confirm `docs/wingman/retros.md` doesn't already exist in the fixture (it doesn't, prior to this eval).
2. Spawn a fresh subagent with `retro.md` and the fixture, instructed to run a real retro on the just-shipped work and decide honestly whether it surfaces anything worth feeding forward via `/wingman:learn`.
3. Independently verify: does the file exist at the right path, is the content genuinely specific to this project's real events (not generic template language), is it appropriately short, and is the feed-forward decision reasoned rather than reflexive.

## Expectations

| Check | Expected |
|---|---|
| Facts gathered first | References real git history, real `checkpoints.jsonl` entries, not invented details |
| Location | `docs/wingman/retros.md`, created fresh since it didn't exist — matches `LEARNINGS.md`'s established convention |
| Format | Exact 4-field structure from `retro.md` (What went well / What was harder / What we'd do differently / Anything for you to know) |
| Specificity | Names actual things that happened (the actual timeout bug, the actual Cost-seat finding, the actual branch-timing defect) — not boilerplate that could apply to any project |
| Length discipline | Short relative to the feature, per the command's own stated bar |
| Feed-forward decision | Reasoned, not reflexive — correctly distinguishes a durable, recurring-risk lesson from a one-off project-specific detail |

## Trust level

`verified` — passed two differently-shaped runs: Run 1 (rich multi-stage history → a real, specific, appropriately-short retro with a reasoned feed-forward decision) and Run 2 (a trivial one-word typo fix → correctly recommended *skipping* the retro rather than manufacturing one, per the command's own trivial-skip guidance), each independently verified against the real filesystem. The command makes the meaningful-vs-trivial call in both directions. Not yet tested against a rockier history (multiple `NO_GO`s) needing harder editorial judgment — a possible third dimension, not required for `verified`.

## Run log

### Run 1 — 2026-07-08

**Result: PASS on every expectation**, independently verified against the real filesystem. The subagent:
- Confirmed `docs/wingman/retros.md` didn't already exist before writing (didn't assume).
- Gathered real facts: git log (16 commits), all 5 `.wingman/checkpoints.jsonl` entries with their actual verdicts, `LEARNINGS.md`, and `docs/wingman/founder-todos.md`.
- Wrote the retro in the exact required format, referencing specific real events by name — the timeout/regex fix-recheck loop, the negative-cache reliability fix and its independent re-confirmation, the branch-timing defect Boardroom's own ship review caught and disclosed, and the founder-accepted FX-API risk with its stated revisit trigger. None of this reads as generic — every sentence ties to something that actually happened in this fixture's history, independently confirmed by cross-referencing the retro's claims against the fixture's actual git log and checkpoint file.
- Kept it to 286 words — short relative to the multi-stage feature it's summarizing, meeting the command's own "shouldn't take longer to read than the feature took to explain" bar.
- Made a reasoned feed-forward decision: correctly identified the branch-timing gap as durable and worth an eventual `/wingman:learn` entry (the engineer seat had explicitly flagged that `build.md` itself doesn't branch before work starts, meaning it will recur on future projects — a Wingman process gap, not a one-off), while correctly declining to feed forward the FX-outage/negative-cache pattern and the plan-stage fix loop as project-specific rather than durable. This is exactly the judgment call this eval was designed to test — not whether it always or never triggers `/wingman:learn`, but whether it can tell the difference.

### Run 2 — 2026-07-08 (negative case: a trivial change)

The complement of Run 1: instead of a rich multi-stage history, a project whose entire recent history is one trivial change — a one-word README typo fix (`Recieve` → `Receive`), shipped with an all-`GO` checkpoint and zero concerns. Fixture: `evals/fixtures/setup-retro-trivial-fixture.sh`. Tests whether the command manufactures a ceremony-retro for a non-event, or correctly recommends skipping per its own opening line ("Skip this for trivial changes").

**Result: PASS**, independently verified. The subagent gathered the real facts (git log showing only the typo fix; a single all-`GO` checkpoint with no `GO_WITH_CONCERNS`/`NO_GO`, no failed attempts, no `/wingman:learn` entries), correctly recognized this as the textbook trivial case, and **recommended skipping the retro** with reasoning tied to `retro.md`'s own lines 8 and 29 — rather than writing a forced "what went well / what was harder" block about a typo. Independently confirmed `docs/wingman/retros.md` was **not** created (the `docs/` dir doesn't exist in the fixture) and the Wingman repo stayed untouched. With Run 1 (rich history → a real, specific, well-reasoned retro) and Run 2 (trivial change → correctly skipped), the command is shown to make the meaningful-vs-trivial judgment in both directions.
