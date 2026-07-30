# Eval: validate-engines

<!-- eval:no-fixture-needed: runs directly against the real plugin.json/engines/ tree, plus a
     deliberately-broken in-place mutation restored immediately after -->

Tests `plugins/wingman/scripts/validate-engines.mjs` — the engine ownership contract added in
PR7 of the AI Engineering Operating System build and reorganized 2026-07-30 (EngineOS pass) from
17 to 22 engines. Fully deterministic — no model-judgment component — verified by running the real
script directly and checking exit codes/output, same method as `evals/cases/dod-pre-push-check.md`.

## Procedure

1. Run `node plugins/wingman/scripts/validate-engines.mjs` against the real, unmodified plugin tree.
2. Temporarily delete one real `## Members` line from a real `ENGINE.md` (e.g.
   `skills/interview-one-question-at-a-time/SKILL.md` from `vision-engine/ENGINE.md`), re-run, and
   check the exit code and message.
3. Restore the file exactly (`git checkout` or a saved copy) and re-run to confirm PASS returns.

## Expectations

| Scenario | Expected exit code | Expected output |
|---|---|---|
| Real, unmodified 22-manifest tree against the real plugin scope | `0` | "22 engine(s), 122 real file(s) checked." + "PASS", zero problems listed |
| One real member line deleted from an `ENGINE.md` | `1` | Names the specific orphaned path and "has no engine owner" |
| Restored after the deliberate break | `0` | PASS again, byte-identical to the first run |

## Trust level

`verified` — all 3 shapes ran directly against the real repo during this PR's own build (not a
constructed fixture — the real plugin tree is the fixture), and the restore step confirmed no
lasting damage.

## Run log

### Run 1 — 2026-07-29

Ran `node plugins/wingman/scripts/validate-engines.mjs` against the real tree: `17 engine(s), 119
real file(s) checked.` / `PASS`. Deleted `skills/interview-one-question-at-a-time/SKILL.md`'s
member line from `plugins/wingman/engines/vision-engine/ENGINE.md` via `sed`, re-ran: `1 problem(s):
"skills/interview-one-question-at-a-time/SKILL.md" has no engine owner -- every
command/skill/hook/reference must belong to exactly one engine` / `FAIL`, exit 1. Restored the file
from a saved copy, re-ran: `17 engine(s), 119 real file(s) checked.` / `PASS` again, matching Run 1
exactly. All three outcomes matched what's documented above with no discrepancy.

### Run 2 — 2026-07-30 (re-verified after the EngineOS reorganization split 17 engines into 22)

Same 3-shape procedure re-run against the post-split tree: unmodified → `22 engine(s), 122 real
file(s) checked.` / `PASS`. Deleted the same `skills/interview-one-question-at-a-time/SKILL.md`
member line from `vision-engine/ENGINE.md` (unaffected by the split — Vision wasn't one of the
engines carved up) → `1 problem(s): "skills/interview-one-question-at-a-time/SKILL.md" has no
engine owner -- every command/skill/hook/reference must belong to exactly one engine` / `FAIL`,
exit 1 — identical message to Run 1. Restored → `22 engine(s), 122 real file(s) checked.` / `PASS`
again. Confirms the checker's logic is unaffected by the engine count changing, only the totals it
reports — no regression from the split.
