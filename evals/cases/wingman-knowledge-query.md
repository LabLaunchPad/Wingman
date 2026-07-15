# Eval: wingman-knowledge-query

<!-- eval:no-fixture-needed: operates on this repo's own real, already wingman:log-marked docs -->

Tests `scripts/query-wingman-knowledge.mjs` — the query/filter interface built on top of
`scripts/parse-wingman-logs.mjs`'s existing marker parsing. Specifically: does `--recurring`
correctly reproduce `recurringCategories()`'s occurrence counts, does field filtering
(`--type`/`--category`/`--status`/`--source`) return the correct, exact subset, and does `--json`
emit the same data as the default table view.

Like `traceability-validator.md`, this is fully deterministic — no model-judgment component — so
it's verified by running the real script against this repo's own real files and checking output
directly, not by grading a subagent.

## Procedure

1. Run `node scripts/query-wingman-knowledge.mjs --recurring` and `--recurring --json`; cross-check
   a sample of the reported category counts against a manual `grep -c 'wingman:log.*category=<X>'`
   across `LEARNINGS.md`/`docs/wingman/retros.md`/`docs/PROJECT.md`.
2. Run a filter query (`--type=`/`--category=`/`--status=`/`--source=`) and confirm every returned
   row actually matches the filter, and that the `file:line` given in each row's heading points at
   the real entry.
3. Confirm `--json` and the default table represent the same underlying rows (same count, same
   categories) for the same query.

## Expectations

| Check | Expected |
|---|---|
| `--recurring` | Only categories with 2+ occurrences across learnings+retros+decisions appear, matching `recurringCategories()` exactly |
| Manual cross-check | Grep-counted occurrences of a sampled category match the script's reported count exactly |
| Field filter | Every returned row satisfies all given filters; no false positives/negatives |
| `--json` vs. table | Same row count and same categories for an identical query |

## Trust level

`provisional` (2026-07-15) — one real run against this repo's own current, real docs, independently
cross-checked by hand. Not yet `verified`: only run against this project's own real data so far, no
second differently-shaped run (e.g. against a deliberately smaller/edited fixture copy of the
marked files) to confirm behavior on a shape other than "this repo's own current history."

## Run log

### Run 1 — 2026-07-15

**`--recurring`** returned 8 categories: `environment` (2), `hooks` (13), `dogfooding-mechanism`
(2), `tooling-proposal` (2), `evolve` (4), `eval` (10), `boardroom` (3), `general` (2). `--json`
produced the identical list in JSON form.

**Cross-check**: manually ran `grep -c 'wingman:log.*category=hooks' LEARNINGS.md
docs/wingman/retros.md docs/PROJECT.md` → `1`, `0`, `12` → sums to `13`, exactly matching the
script's reported count for `hooks`. Confirms the occurrence-counting is correct, not just
plausible.

**Field filter**: `--type=decision --source=decisions` returned only rows with `type: decision`
sourced from `docs/PROJECT.md`'s decisions log, each with a real `heading (docs/PROJECT.md:N)` —
spot-checked one row (`tooling-proposal`, line 46) against the actual file, confirmed the heading
text matches the real entry at that line.

No bugs found. One design note, not a defect: `gaps` entries (from `docs/wingman/GAPS.md`'s table)
don't carry a `type`/`occurrence`/`file`/`line` the way marker-based entries do — a `--type=`
filter naturally excludes them unless explicitly querying `--source=gaps`, which is correct given
`GAPS.md`'s summary table only captures `id`/`category`/`name`/`priority`/`status` today.
