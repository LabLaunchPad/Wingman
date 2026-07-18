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

`verified` (2026-07-16) — two real runs against this repo's own current, real docs, both
independently cross-checked by hand. Run 1 confirmed field filtering and one occurrence count
(inclusion side); Run 2 exercised the threshold logic's exclusion side and boundary condition,
plus `--json`/table row-equivalence for a filter query, which Run 1 didn't cover.

## Run log

### Run 2 — 2026-07-16

Differently-shaped from Run 1: instead of re-checking an already-recurring category, this run
targeted the parts of `--recurring`'s threshold logic Run 1 left unverified — correct **exclusion**
of single-occurrence categories, and the exact **boundary** at a threshold equal to a real count.

**Current default `--recurring` (threshold 2)** now reports 9 categories (docs have grown since
Run 1's 8): `environment` (2), `hooks` (13), `dogfooding-mechanism` (2), `governance` (2, new since
Run 1), `tooling-proposal` (2), `evolve` (4), `eval` (10), `boardroom` (3), `general` (2).

**Exclusion check**: ran `--recurring=1 --json` to see every category down to count 1, then picked
6 categories present at threshold 1 but absent from the default (threshold-2) output — `process`,
`security`, `pipeline`, `audit`, `install`, `evidence-gate` — and manually grep-counted each across
all three files:

```
process:        LEARNINGS=1 retros=0 PROJECT=0  total=1
security:        LEARNINGS=1 retros=0 PROJECT=0  total=1
pipeline:        LEARNINGS=1 retros=0 PROJECT=0  total=1
audit:           LEARNINGS=0 retros=0 PROJECT=1  total=1
install:         LEARNINGS=0 retros=0 PROJECT=1  total=1
evidence-gate:   LEARNINGS=0 retros=0 PROJECT=1  total=1
```

All 6 are genuinely single-occurrence and correctly excluded from the default `--recurring` output
— confirms the threshold filter isn't just inclusive-correct (Run 1) but exclusive-correct too.

**Boundary check**: ran `--recurring=13` (exactly equal to `hooks`'s real count) — returned only
`hooks` (count 13), confirming the comparison is `>=` and applied precisely at the boundary, not
off-by-one in either direction (a category at exactly the threshold is included; `eval` at 10 and
everything below is excluded).

**Inclusion cross-check on a category not sampled in Run 1**: manually grep-counted `boardroom`
(`LEARNINGS=0, retros=0, PROJECT=3` → total 3) and the new `governance` category (`LEARNINGS=0,
retros=0, PROJECT=2` → total 2) — both match the script's reported counts exactly.

**`--json` vs. table equivalence for a filter query** (not explicitly shown in Run 1): ran
`--category=governance --json` and the default table for the same query — both returned the same 2
rows, same `file:line` (`docs/PROJECT.md:46`, `docs/PROJECT.md:52`). Spot-checked line 46 against
the real file: the heading text ("Mechanical, low-risk fixes with existing direct test coverage
don't require a retroactive Boardroom review.") matches the actual entry verbatim.

No bugs found. No discrepancies between script output and manual counts in any of the 8 categories
checked across both runs.

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
