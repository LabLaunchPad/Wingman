# Eval: prompt-diff-check

Tests `plugins/wingman/skills/prompt-diff-check/SKILL.md` — whether it correctly distinguishes a
prompt change that its eval case actually covers from one where the case silently didn't keep up.

## Fixture

`evals/fixtures/setup-prompt-diff-check-fixture.sh <target-dir>` — "Portside," a synthetic project
with two commands, each shown as a before/after change plus its eval case:

- `commands/deploy.md` — changed to add a "confirm build success before pushing" gate.
  `evals/cases/deploy.md`'s expectations table was updated alongside it (positive case: coverage
  genuinely exists).
- `commands/rollback.md` — changed to add a "ask the founder for explicit confirmation before
  rolling back" gate. `evals/cases/rollback.md`'s expectations table was **not** updated (negative
  case: the eval case exists but doesn't cover what changed — the real gap this skill exists to
  catch).

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh un-briefed subagent with only `skills/prompt-diff-check/SKILL.md` and the fixture
   path — not told which command's coverage is adequate and which isn't.
3. Independently verify the subagent's verdict by diffing the before/after files and grepping the
   eval case content directly, not trusting its self-report alone.

## Expectations

| Check | Expected |
|---|---|
| Correctly identifies what changed in `deploy` | Yes — the build-success gate before pushing |
| Correctly identifies `deploy`'s eval case covers the change | Yes — maps to specific expectations-table rows |
| Correctly identifies what changed in `rollback` | Yes — the founder-confirmation gate before redeploying |
| Correctly identifies `rollback`'s eval case does NOT cover the change | Yes — explicitly flags the gap, doesn't assume "a case exists" means "covered" |
| Does not fabricate coverage | Yes — cites exact rows for the covered case, cites the absence for the uncovered one |

## Trust level

`verified` — Run 1 covered "meaningful change, case covers it" vs. "meaningful change, case doesn't
cover it." Run 2 covered the differently-shaped axis Run 1 never touched: is the change meaningful
at all, including a change engineered to *look* cosmetic while being load-bearing. Both scenarios
passed, one of them a genuine negative case (correctly does nothing when nothing behaviorally
changed).

## Run log

### Run 1 — 2026-07-20 — positive (deploy) + negative (rollback) in one fixture

Ran `evals/fixtures/setup-prompt-diff-check-fixture.sh` into a scratch dir, then spawned a fresh
un-briefed subagent with only `skills/prompt-diff-check/SKILL.md` and the fixture path, instructed
to apply the Core Workflow to both commands. Independently verified by diffing the real
before/after files (`diff commands/rollback.before.md commands/rollback.md`) and grepping the real
eval case content (`grep -c "confirmation\|founder" evals/cases/rollback.md` → 0).

| Check | Result |
|---|---|
| Correctly identifies `deploy`'s change | **Pass** — cited the inserted "Confirm the build succeeded before pushing" step verbatim |
| Correctly identifies `deploy`'s coverage | **Pass** — mapped it to expectations-table rows 2 and 3 by exact text |
| Correctly identifies `rollback`'s change | **Pass** — cited the inserted "Ask the founder for explicit confirmation before rolling back" step verbatim |
| Correctly identifies `rollback`'s gap | **Pass** — explicitly stated "NOT covered — gap," named which row was missing, did not assume the case's existence meant coverage |
| No fabricated coverage | **Pass** — every claim cited exact table rows or their absence, independently confirmed correct via `diff`/`grep` above |

All 5 expectations passed on first run, with both the positive and negative signal correctly
distinguished in the same dispatch — not just told two separate stories on request.

### Run 2 — 2026-07-22 — cosmetic-vs-disguised-load-bearing (differently shaped from Run 1)

Run 1 only ever tested "is a change covered" for changes already established as meaningful. It
never tested the skill's Step 1 judgment — whether a diff is meaningful in the first place. Built a
new scratch fixture (not added to `evals/fixtures/`, per instructions to touch only this case file)
at `/tmp/claude-0/-home-user-Wingman/ce30667c-52f4-5242-baf9-f99967a6a993/scratchpad/prompt-diff-run2/`,
a synthetic project with two commands, each with a before/after and an existing eval case:

- `commands/format.md` — purely cosmetic rewording of all 3 steps (same actions, same order, same
  gate/non-gate status). Negative case: should NOT be flagged as a meaningful change.
- `commands/publish.md` — a one-word diff, "You **must** verify the checksum... before uploading"
  softened to "You **should** verify...". Disguised-load-bearing case: looks cosmetic (tiny diff)
  but actually demotes a mandatory pre-upload gate to an optional suggestion — a real behavior
  change. `evals/cases/publish.md`'s expectations table has a row explicitly requiring the mandatory
  gate, which the new prompt text no longer honors.

Applied the skill's Core Workflow directly against only the SKILL.md + fixture content (no live
sub-dispatch tool was available in this session), then independently re-verified against the raw
files via `diff commands/format.before.md commands/format.md` and
`diff commands/publish.before.md commands/publish.md`, not trusting the judgment alone.

| Check | Result |
|---|---|
| `format.md` correctly judged NOT a meaningful change | **Pass** — all 3 line edits are same action/order/gate-status; skill's own Step 1 language ("not a rephrase with identical behavior") applies directly; no eval-case action needed |
| `format.md`'s existing eval case correctly left alone (no fabricated gap) | **Pass** — did not invent a coverage problem where none exists |
| `publish.md`'s must→should correctly judged a meaningful change despite the 1-word diff | **Pass** — identified the mandatory-gate-to-suggestion demotion as a real behavior change, not a cosmetic tweak |
| `publish.md`'s eval case correctly flagged as now-mismatched (case still expects mandatory-gate behavior the prompt no longer requires) | **Pass** — cited the exact stale expectations-table row, verified via `diff` that the change really is must→should and nothing else |
| No fabricated coverage or false negative | **Pass** — the cosmetic case wasn't over-flagged, the disguised case wasn't under-flagged |

All 5 expectations passed. This is a genuinely different scenario shape from Run 1 (it exercises
"is this meaningful at all," including an adversarial disguised-as-cosmetic trap, rather than
"does an already-established meaningful change have coverage") and includes a real negative case
(format.md correctly triggers no action) — satisfying `evals/README.md`'s bar for `verified`.
