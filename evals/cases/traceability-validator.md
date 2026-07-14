# Eval: traceability-validator

Tests `plugins/wingman/scripts/check-traceability.mjs` (and by extension the `traceability-linking` skill's marker convention it enforces) — does it correctly find every requirement/marker cross-reference, correctly warn (not error) on a legitimately unlinked-so-far requirement, and correctly error on a marker that references an ID that was never minted?

Unlike most eval cases in this suite, this one is fully deterministic — the script under test has no model-judgment component, so this is verified by running the real script against real fixtures and checking exit codes/output directly, not by grading a subagent's behavior.

## Fixtures (inline, not a `setup-*.sh` script)

Three small directories, each with a `docs/wingman/plans/plan.md` (a `## Requirements` table) and a source file:

- **Positive**: `plan.md` mints `DEF-001`; `src/reset.js` carries `// wingman:req DEF-001`. Fully linked.
- **Negative (unlinked, not orphaned)**: `plan.md` mints `DEF-001`; the source file has no marker at all. Expected: a *warning* (mid-pipeline is a legitimate state), not a failure.
- **Orphaned marker**: a source file carries `// wingman:req DEF-999`, but no table anywhere mints `DEF-999`. Expected: an *error* — the more serious case, since it means a change claims to satisfy a requirement that doesn't exist.

## Procedure

1. Build each fixture directory directly (no `evals/fixtures/setup-*.sh` script needed — these are 2-file directories, not realistic mini-projects).
2. Run `node plugins/wingman/scripts/check-traceability.mjs <fixture-dir>` against each.
3. Check the exit code and the specific warning/error text, not just pass/fail.

## Expectations

| Fixture | Expected exit code | Expected output |
|---|---|---|
| Positive | `0` | 1 ID minted, 1 ID referenced, `PASS`, no warnings/errors |
| Negative (unlinked) | `0` | 1 ID minted, 0 referenced, one **warning** naming `DEF-001` as unlinked, still `PASS` |
| Orphaned marker | `1` | one **error** naming `DEF-999` as orphaned, `FAIL` |

## Trust level

`verified` — all three differently-shaped scenarios (fully linked / legitimately unlinked / genuinely broken) ran and were independently checked against actual exit codes and output text, including the important distinction that an unlinked requirement warns (doesn't block) while an orphaned marker errors (does block) — this asymmetry is the core design decision the script makes and is exactly what needed direct verification.

## Run log

### Run 1 — 2026-07-14

**Result: PASS on all 3 fixtures**, plus one real bug caught and fixed along the way: the script originally used `path.join(cwd, argv[2])` for its root argument, which silently mangled any *absolute* path passed on the command line (`join('/home/user/Wingman', '/tmp/.../trace-positive')` produces a nonsense concatenated path, not the intended absolute path) — the first real run against an absolute fixture path reported "0 files checked" instead of erroring, which would have been a silent false-pass in production use. Fixed by switching to `path.resolve(cwd, argv[2])`, which correctly returns the absolute path unchanged when one is given. Re-ran all 3 fixtures after the fix:

- Positive: `checked 2 file(s) ... 1 requirement/decision/flow ID(s) minted, 1 distinct ID(s) referenced` → `PASS`, exit 0, zero warnings/errors.
- Negative (unlinked): `1 requirement/decision/flow ID(s) minted, 0 distinct ID(s) referenced` → one warning: `unlinked requirement: "DEF-001" (defined in docs/wingman/plans/plan.md) has no downstream wingman:req marker in any other file yet` → still `PASS`, exit 0 (confirming unlinked-but-not-orphaned is correctly non-blocking).
- Orphaned marker: `0 requirement/decision/flow ID(s) minted, 1 distinct ID(s) referenced` → one error: `orphaned marker: "DEF-999" is referenced via wingman:req in src/reset.js but was never minted in any requirement/decision/flow table` → `FAIL`, exit 1 (confirming an orphaned marker is correctly blocking).

Promoted directly to `verified` on the first run since all 3 differently-shaped scenarios (positive, benign-negative, genuine-failure) were exercised together and the pass/fail asymmetry between them — the actual design decision under test — was directly confirmed.
