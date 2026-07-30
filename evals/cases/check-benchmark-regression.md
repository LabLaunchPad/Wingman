# Eval: check-benchmark-regression

<!-- eval:no-fixture-needed: runs directly against the real repo state, with a temporary,
     restored-after in-place mutation of docs/status/benchmark-baseline.json -->

Tests `scripts/check-benchmark-regression.mjs` — the continuous-benchmarking piece of PR9 of the AI
Engineering Operating System build. Fully deterministic — no model-judgment component — verified by
running the real script directly and checking exit codes/output, same method as
`evals/cases/validate-engines.md`.

**Explicitly not a service-style MLOps benchmark**: this checks whether the existing agent-weakness
coverage benchmark (`docs/status/AGENT-WEAKNESS-BENCHMARK.md`) has regressed since
`docs/status/benchmark-baseline.json` was recorded — automation over an existing, already-computed
metric, never a new p95/throughput/cache-hit-rate measurement (which the repo's own decisions log
already declined twice, since Wingman has no persistent runtime to instrument).

## Procedure

1. Run `node scripts/check-benchmark-regression.mjs` against the real, unmodified repo state.
2. Temporarily raise `docs/status/benchmark-baseline.json`'s `pctCovered` above what the real repo
   currently scores, re-run, and check the exit code/message.
3. Restore the baseline file exactly and re-run to confirm PASS returns.
4. Run with `--update-baseline` against the real (unmodified) state and confirm it either no-ops
   (numbers already match) or updates cleanly — never lowers the recorded floor.

## Expectations

| Scenario | Expected exit code | Expected output |
|---|---|---|
| Real, unmodified state vs. real baseline | `0` | Names the current %/% and "at or above baseline", "PASS" |
| Baseline artificially raised above current real score | `1` | Names "coverage regressed" with the specific %/% mismatch |
| Restored after the deliberate change | `0` | PASS again, byte-identical to the first run |
| `--update-baseline` against unmodified current state | `0` | Either "Baseline updated" (if current > recorded) or leaves the file at its already-correct values |

## Trust level

`verified` — all scenarios ran directly against the real repo during this PR's own build, and the
restore step confirmed no lasting damage.

## Run log

### Run 1 — 2026-07-30

Ran `node scripts/check-benchmark-regression.mjs` against the real, unmodified repo:
`Agent-weakness coverage benchmark: 92% covered, 92% measured -- at or above baseline (92%/92%,
recorded 2026-07-30).` / `PASS`, exit 0. Raised `pctCovered` to 99 in a backed-up copy of
`docs/status/benchmark-baseline.json`, re-ran: `1 problem(s) against baseline (recorded
2026-07-30): - coverage regressed: 92% covered, baseline requires at least 99%` / `FAIL`, exit 1.
Restored the original file, re-ran: identical `PASS` output to Run 1's first invocation. All three
outcomes matched what's documented above with no discrepancy.
