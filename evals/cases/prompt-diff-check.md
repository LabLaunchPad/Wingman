# Eval: prompt-diff-check

Tests `plugins/wingman/skills/knowledge/prompt-diff-check/SKILL.md` — whether it correctly distinguishes a
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
2. Spawn a fresh un-briefed subagent with only `skills/knowledge/prompt-diff-check/SKILL.md` and the fixture
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

`provisional` — passed one real run with both a positive and negative signal in the same fixture
(see Run log). Not yet re-run against a second, differently-shaped scenario (e.g. a case that's
missing entirely, not just outdated), per `evals/README.md`'s bar for `verified`.

## Run log

### Run 1 — 2026-07-20 — positive (deploy) + negative (rollback) in one fixture

Ran `evals/fixtures/setup-prompt-diff-check-fixture.sh` into a scratch dir, then spawned a fresh
un-briefed subagent with only `skills/knowledge/prompt-diff-check/SKILL.md` and the fixture path, instructed
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
