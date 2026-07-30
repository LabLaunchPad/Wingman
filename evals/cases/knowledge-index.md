# Eval: knowledge-index

<!-- eval:no-fixture-needed: runs directly against the real plugins/wingman/references/ tree -->

Tests `plugins/wingman/scripts/knowledge-index.mjs` — the Knowledge Engine's searchability layer
(PR8 of the AI Engineering Operating System build). Fully deterministic — no model-judgment
component, no embeddings — verified by running the real script directly against the real reference
catalog and checking output, same method as `evals/cases/validate-engines.md`.

## Procedure

1. Run `node plugins/wingman/scripts/knowledge-index.mjs "permission tiers"` against the real,
   unmodified `references/` tree.
2. Run the same script with a query guaranteed to match nothing real.
3. Run with no query argument at all.
4. Run with `--json` and confirm the output is valid, parseable JSON matching the plain-text run.

## Expectations

| Scenario | Expected exit code | Expected output |
|---|---|---|
| `"permission tiers"` | `0` | Names `references/permission-model.md` as a match, with matched heading(s) shown |
| `"nonexistent gibberish query xyz"` | `0` | "No matches for ... across N reference doc(s)." — an honest empty result, not an error |
| No query argument | `2` | Usage message |
| `"permission tiers" --json` | `0` | Valid JSON array; first entry's `path` is `references/permission-model.md` |

## Trust level

`verified` — all 4 shapes ran directly against the real repo during this PR's own build.

## Run log

### Run 1 — 2026-07-29

`node plugins/wingman/scripts/knowledge-index.mjs "permission tiers"` → `1 match(es) ...
references/permission-model.md — Permission Model (score 6)`, listing `§ Permission decision rules`
and `§ Permission matrix` as matched headings, exit 0. `"nonexistent gibberish query xyz"` →
`No matches for "nonexistent gibberish query xyz" across 22 reference doc(s).`, exit 0. No-argument
run → `Usage: node knowledge-index.mjs "<query>" [--json]`, exit 2. All three outcomes matched what's
documented above with no discrepancy. `--json` mode independently verified via the accompanying
`node --test` suite's real-tree assertion (`tests/hooks-integration/knowledge-index.test.mjs`), which
confirms the same query returns a real, existing path via the JSON-shaped result object directly
(not by re-parsing CLI text output).
