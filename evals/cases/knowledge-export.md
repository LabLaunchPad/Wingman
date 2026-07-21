# Eval: knowledge-export

Tests `plugins/wingman/scripts/okf-export.mjs` and `commands/adaptive/knowledge-export.md`'s invocation of
it — the Google Open Knowledge Format (OKF v0.1) bundle export. Fully deterministic (no
model-judgment component): run the real script against `evals/fixtures/setup-knowledge-export-fixture.sh`'s
output and check the real filesystem, same trust methodology as `dod-pre-push-check.md`.

## Fixture

`evals/fixtures/setup-knowledge-export-fixture.sh <target-dir>` — "Porchlight," a synthetic
project with:

- `.wingman/checkpoints.jsonl` — 3 realistic lines: an array-`stage` planning-milestone bundle
  (`GO_WITH_CHANGES`, `details_ref` present, a real `scope_ref` path), a scalar-stage `GO` build
  checkpoint (`scope_ref: "diff"`), and a `DO NOT SHIP` checkpoint with a `NO_GO` seat verdict.
- `.wingman/memory/MEMORY.md` and `decisions.md` — populated.
- `.wingman/memory/tried.md` — **intentionally absent** (the deliberate negative-path case).

## Procedure

1. Run `evals/fixtures/setup-knowledge-export-fixture.sh <target-dir>`.
2. Run `node plugins/wingman/scripts/okf-export.mjs --project-dir <target-dir>` directly.
3. Inspect `<target-dir>/.wingman/okf-export/` on the real filesystem — not the script's own
   self-reported summary alone.

## Expectations

| Check | Expected |
|---|---|
| Exit code | `0` |
| `index.md` present | Yes, no YAML frontmatter, plain `* [title](path) - description` bullets, grouped under `## Checkpoints` / `## Memory` |
| `log.md` present | Yes, `YYYY-MM-DD` headings, newest first |
| Checkpoint concept files | One `.md` per `checkpoints.jsonl` line (3 expected), `type: checkpoint` frontmatter, correct `title`/`tags`/`timestamp`, body renders `bottom_line`/`founder_decision`/all seats as prose — no raw JSON in the body |
| Array-`stage` checkpoint | The planning-milestone entry's concept file renders all 5 stages, doesn't crash or drop entries |
| `DO NOT SHIP`/`NO_GO`-seat checkpoint | Rendered faithfully (`**Bottom line:** DO NOT SHIP`, `NO_GO` seat verdict text intact), not filtered out or watered down |
| `resource` field fidelity | Present (verbatim `scope_ref`) on the checkpoint with a real path; correctly omitted on checkpoints where `scope_ref === "diff"` |
| Memory concept files | `memory/memory-facts.md` and `memory/decisions.md` present with `type: memory-fact` frontmatter and verbatim source prose in the body |
| Missing `tried.md` (negative path) | No `memory/tried.md` concept file emitted, no crash, no error — export completes cleanly with the other files intact |
| Source files untouched | `.wingman/checkpoints.jsonl` and `.wingman/memory/*.md` byte-identical (verified via `md5sum`) before/after the export run |
| Re-run safety | Running the script a second time regenerates the bundle cleanly with the same file count, no stale leftovers |
| No Claude Code involvement | Runs as a plain CLI invocation, no stdin JSON payload, matching `dod-pre-push-check.md`'s standalone-runnability bar |

## Trust level

`verified` — two differently-shaped scenarios: Run 1 (positive, populated fixture) and Run 2
(negative, a fully empty project) both executed for real, checks confirmed against real filesystem
output (`find`, `cat`, `md5sum`), not a subagent's self-report. Corrected 2026-07-20: Run 1's own
"positive + negative" framing was a same-fixture idempotency re-run, not a genuinely distinct
scenario — flagged by `FIXLOG.md` T2 and closed by the real Run 2 below rather than by relabeling.

## Run log

**2026-07-20 — Run 1 (positive + negative path, single combined run).** Ran the fixture setup
script, then `node plugins/wingman/scripts/okf-export.mjs --project-dir <fixture>` directly.
Confirmed via direct filesystem inspection:
- 3 checkpoint concept files + 2 memory concept files written (7 total files including `index.md`/`log.md`).
- Array-stage checkpoint rendered all 5 stages in its title/tags without dropping any.
- `DO NOT SHIP` checkpoint's body read: `**Bottom line:** DO NOT SHIP`, `**Founder decision:** fix_concerns_first`, `**Founder notes:** Founder to correct pricing copy before re-review.`, and the seat list included `**CEO** — NO_GO: Pricing copy contradicts the signed contract terms.` — fully faithful, not softened.
- `resource: "docs/wingman/plans/2026-07-14-billing-integration.md"` present on the planning-milestone checkpoint; `resource` field absent entirely on both `scope_ref: "diff"` checkpoints.
- `memory/tried.md` correctly not present in the output tree (`ls .wingman/okf-export/memory/` shows only `decisions.md` and `memory-facts.md`); no error or warning printed.
- `md5sum` of `.wingman/checkpoints.jsonl` + `.wingman/memory/*.md` identical before and after the export run — source data confirmed untouched.
- Re-ran the script a second time against the same fixture: same 7-file output, no stale files left over, exit 0 both times.
- `index.md`/`log.md` content spot-checked directly (`cat`) — bullet-list format with no frontmatter on `index.md`, dated `## YYYY-MM-DD` headings newest-first on `log.md`, matching the OKF v0.1 spec's reserved-filename conventions exactly.

No false positives, no gaps found. Every expectation in the table above confirmed against real
command output during this run.

**2026-07-20 — Run 2 (negative path: fully empty project).** Created a fresh `git init`-only
directory with no `.wingman/` at all, ran `node plugins/wingman/scripts/okf-export.mjs
--project-dir <empty-dir>` directly. Confirmed via direct filesystem inspection:
- Exit code 0 — no crash on a completely empty source.
- Script printed `okf-export: 0 checkpoint(s) and 0 memory file(s) exported to .../.wingman/okf-export`.
- `index.md` correctly wrote `_Nothing exported yet — no checkpoints or memory files found in this project._` rather than an empty or malformed file.
- `log.md` correctly wrote `_No entries yet._`.
- No `checkpoints/` or `memory/` subdirectories created (matches the "only create if non-empty" contract).

This is the genuinely distinct negative scenario Run 1 didn't provide. Promoted to `verified`.
