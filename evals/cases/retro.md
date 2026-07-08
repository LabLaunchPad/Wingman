# Eval: retro

Tests `plugins/wingman/commands/retro.md` behaviorally — never exercised by any prior eval in this project. Does a fresh agent gather real facts before writing (not generic boilerplate), follow the exact required format, save to the right canonical location, and make a genuine, reasoned feed-forward decision about `/wingman:learn` rather than reflexively always or never triggering it?

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

`provisional` — passed one real run, single scenario, against a project with genuinely rich history to draw on. Not yet tested against a trivial change (to confirm the command correctly recommends skipping the retro entirely, per its own "skip this for trivial changes" instruction) or a project with a rockier history (multiple `NO_GO`s) that would need harder editorial judgment about what's actually worth saying.

## Run log

### Run 1 — 2026-07-08

**Result: PASS on every expectation**, independently verified against the real filesystem. The subagent:
- Confirmed `docs/wingman/retros.md` didn't already exist before writing (didn't assume).
- Gathered real facts: git log (16 commits), all 5 `.wingman/checkpoints.jsonl` entries with their actual verdicts, `LEARNINGS.md`, and `docs/wingman/founder-todos.md`.
- Wrote the retro in the exact required format, referencing specific real events by name — the timeout/regex fix-recheck loop, the negative-cache reliability fix and its independent re-confirmation, the branch-timing defect Boardroom's own ship review caught and disclosed, and the founder-accepted FX-API risk with its stated revisit trigger. None of this reads as generic — every sentence ties to something that actually happened in this fixture's history, independently confirmed by cross-referencing the retro's claims against the fixture's actual git log and checkpoint file.
- Kept it to 286 words — short relative to the multi-stage feature it's summarizing, meeting the command's own "shouldn't take longer to read than the feature took to explain" bar.
- Made a reasoned feed-forward decision: correctly identified the branch-timing gap as durable and worth an eventual `/wingman:learn` entry (the engineer seat had explicitly flagged that `build.md` itself doesn't branch before work starts, meaning it will recur on future projects — a Wingman process gap, not a one-off), while correctly declining to feed forward the FX-outage/negative-cache pattern and the plan-stage fix loop as project-specific rather than durable. This is exactly the judgment call this eval was designed to test — not whether it always or never triggers `/wingman:learn`, but whether it can tell the difference.
