# Eval: uxflow

Tests `plugins/wingman/commands/pipeline/uxflow.md` behaviorally, distinct from `seven-stage-pipeline-e2e.md` (which already covers the uxflow stage as part of a whole-pipeline run). The distinctive behaviors under test: does the command (a) produce a UX-*-tagged flow table with screen/state descriptions, (b) render the same information as a visual flow diagram using `visual-founder-output`, and (c) skip cleanly for projects with no user-facing surface (pure API, CLI) rather than manufacturing screens?

## Fixture

`evals/fixtures/setup-uxflow-fixture.sh <target-dir>` — the base waitlist app (a JSON API, no user-facing surface) with pre-seeded discovery, define (DEF-001..003), and architecture (ARCH-001..003, all pure-backend) artifacts. Used alone this only re-exercises the skip-for-non-UI path (already covered by Run 1/3); for a genuine `ARCH-*`-tracing backward-compat check (Run 5), hand-add one user-facing `ARCH-004` row on top, as Run 3 and Run 5 both did.

`evals/fixtures/setup-uxflow-14stage-fixture.sh <target-dir>` (added Run 5) — the real 14-stage-order shape: pre-seeded discovery, define (DEF-001..003), and information-architecture (IA-001) artifacts, with deliberately **no** `docs/wingman/architecture/` directory at all, since `architecture.md` (stage 11) genuinely hasn't run yet by the time `uxflow` (stage 7) does in the real pipeline order. Exercises the new default IA-*/DEF-* tracing path.

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with `commands/pipeline/uxflow.md` and the pre-seeded ARCH-* decisions.
3. Independently verify the output against the expectations below.

## Expectations

| Check | Expected |
|---|---|
| Graceful skip for non-UI project | A plain-language sentence saying "this project has no user-facing surface, skipping UX flow" — NOT a manufactured screen table |
| No UX-* minted | The flow table is absent (or empty) for a pure-API project |
| Flow produced for UI project | When given a UI fixture, a UX-* table and a visual flow diagram are produced |
| Hand-off to implementation-planning | The output ends by directing to `/wingman:implementation-planning`, not stopping for approval |

## Trust level

`verified` (re-confirmed by Run 5, 2026-07-26, after the Run 4 downgrade) — the skip-for-non-UI path is confirmed by `seven-stage-pipeline-e2e.md` Run 1 (2026-07-14, waitlist-app JSON API had no UX-* IDs minted), the produce-flow path is confirmed by Run 2 (2026-07-14, Tip Jar feature produced UX-* IDs with diagrams), Run 3 (2026-07-18, dedicated uxflow-only dispatch) closed the mixed UI/non-UI judgment-call gap, and Run 5 closed the gap Run 4 left open: an independent run confirming the new default `IA-*`/`DEF-*` tracing path (no `ARCH-*` on disk), plus a dedicated re-check that the old `ARCH-*` tracing path still works when `ARCH-*` genuinely is the immediate upstream artifact on disk.

## Run log

Covered by `seven-stage-pipeline-e2e.md` Run 1 (2026-07-14) and Run 2 (2026-07-14) for the clean binary cases.

### Run 3 — 2026-07-18 (mixed UI/non-UI judgment call, dedicated uxflow-only dispatch)

**Setup:** `setup-uxflow-fixture.sh`'s base fixture (a JSON-only waitlist API, 3 pure-backend `ARCH-*` decisions), with one hand-added `ARCH-004` committed on top: a server-rendered `GET /waitlist/unsubscribe` confirmation page — a single, genuine user-facing surface mixed in among 3 API-only decisions. Neither prior run tested this shape; both were clean binaries (all-API or all-UI).

**Dispatch (fresh `general-purpose` subagent, given only `commands/pipeline/uxflow.md` + its referenced `visual-founder-output` skill/templates, not told the answer):** correctly identified ARCH-004 as the one decision with real screen shape and produced a single-row `UX-001` table mapped to it, explicitly excluding ARCH-001/002/003 in the doc's own prose ("no screen to sketch") rather than silently omitting them or manufacturing screens for the API-only decisions. Did not skip the stage outright (uxflow.md's "will have, per the Architecture stage's decisions" clause correctly triggered on ARCH-004 despite the codebase being 100% JSON responses today). Produced both a Tier B Mermaid diagram and — since a real Artifact tool was present in this dispatch — a genuine Tier A low-fidelity HTML wireframe. Ended by handing off to `/wingman:implementation-planning` without stopping for a checkpoint of its own, correctly matching uxflow.md's non-gating stage.

**Independently verified** (real filesystem, not the subagent's self-report): `cat docs/wingman/uxflow/waitlist-unsubscribe.md` — one `UX-001` row, correctly mapped to `ARCH-004` only, table prose correctly explains the ARCH-001/002/003 exclusion; `.claude/agents/dept-design.md` exists (Design department lead activated on real evidence); `.wingman/state.json` created fresh with `active_department_leads: ["dept-design"]`. **Fetched the live Artifact URL directly** (`https://claude.ai/code/artifact/0ea25f17-c37b-4efe-8a8a-fdc9f63aaa15`) — confirmed a real rendered wireframe (not a 404/error), matching the claimed content exactly (a bordered confirmation box reading "You've been removed from the waitlist," annotated with `UX-001 — reached via the unsubscribe link... (ARCH-004)`).

**No bugs found this run** — the mixed-input judgment call, the diagram/wireframe production, and the correct non-gating handoff all behaved exactly as `uxflow.md` specifies on first try. Promoted to `verified`.

### Run 4 — 2026-07-25/26 (14-stage dogfood run, real gap found and fixed) — `provisional`

**Setup:** first-ever real 14-stage-pipeline dogfood run (a real "fetch-app" fixture). Found while
executing the real UX Flow stage (stage 7 of 14) as one stage of the full run — not this case's own
isolated dispatch.

**Real gap found:** `uxflow.md`'s own body text instructed tracing to `ARCH-*` decisions — but in
the real 14-stage order, `uxflow` is stage 7 and `architecture.md` (which mints `ARCH-*`) is stage
11, four stages later. At the point a real pipeline run reaches UX Flow, no `ARCH-*` ID exists yet
on disk. This is leftover text from before the v20 stage-reorder, when Architecture ran immediately
before UX Flow in the older 7-stage sequence — this eval case's own `setup-uxflow-fixture.sh` still
pre-seeds `ARCH-*` fixture data for exactly that older ordering, which is why no prior run here
caught the mismatch.

**Fix:** `uxflow.md` now traces to `IA-*`/`DEF-*` (both genuinely available by stage 7 in the real
order) by default, while still accepting `ARCH-*` when it's the most immediate upstream artifact
actually on disk (so this case's own older-shaped fixture, and any other project still in the
7-stage layout, keep working unmodified). See `docs/wingman/retros.md`'s "First real dogfooding pass
of the full 14-stage pipeline" entry for the full narrative.

**Status:** `provisional` — fixed, but not yet confirmed by a second, independent run tracing the
new default path. See Run 5.

### Run 5 — 2026-07-26 (independent re-verification: new default path + backward-compat re-check)

**Setup 1 (new default path):** added `evals/fixtures/setup-uxflow-14stage-fixture.sh` — pre-seeds
discovery, define (`DEF-001..003`), and information-architecture (`IA-001`), with deliberately no
`docs/wingman/architecture/` directory at all, mirroring the real dogfood run's exact situation
(stage 7 reached, stage 11 not yet run). Confirmed on disk before dispatch: `ls docs/wingman` showed
only `discovery/`, `define/`, `information-architecture/` — no `architecture/`.

**Dispatch 1 (fresh `general-purpose` subagent, given only `commands/pipeline/uxflow.md` + its
referenced skills, not told the answer):** traced every `UX-*` row (`UX-001..004`) to `IA-001` and
`DEF-001`/`DEF-002`, quoting the command's own text back verbatim: *"Trace instead to the `IA-*`/`DEF-*`
chain, which is already available by this stage."* Confirmed no `ARCH-*` existed anywhere in the
project before choosing this path. Produced a real Mermaid diagram plus (since a real Artifact tool
was available in that dispatch) a Tier A wireframe. Activated `dept-design` on real evidence
(`DEF-001`'s "confirmation page" requirement), correctly left the Management Board inactive (1
department lead, below the 3-lead threshold), and ended with a GO gate verdict rather than stopping
for approval.

**Independently verified** (real filesystem): `cat docs/wingman/uxflow/waitlist-unsubscribe.md` in
the fixture directory shows the exact "Satisfies" column values `IA-001, DEF-001` / `IA-001, DEF-001`
/ `IA-001, DEF-002` / `IA-001` for the four rows — no `ARCH-*` reference anywhere in the file, and a
real Mermaid `flowchart LR` block present.

**Setup 2 (backward-compat re-check):** reused `setup-uxflow-fixture.sh`'s base fixture, then added
one hand-authored `ARCH-004` row (a real server-rendered confirmation page) on top of the existing
`ARCH-001..003` (all pure-backend) — since the base fixture alone has zero user-facing surface and
would only re-exercise the already-covered skip path, not ARCH-* tracing itself.

**Dispatch 2 (fresh `general-purpose` subagent, same conditions):** traced `UX-*` rows to `ARCH-*`,
quoting the command's own fallback clause: *"use whichever of `ARCH-*`/`IA-*`/`DEF-*` is the most
immediate real upstream artifact on disk."* Since no `information-architecture/` directory existed
in this project, it correctly fell back to `ARCH-*`. Explicitly excluded ARCH-001/002/003 (no
screen) and included only ARCH-004, mapping three UX-* states to it.

**Independently verified** (real filesystem): `cat docs/wingman/uxflow/waitlist-unsubscribe.md` in
that fixture directory shows a `UX-*` table whose `Satisfies` column reads `ARCH-004` (and
`ARCH-004, DEF-002` for the idempotent row), with explicit prose excluding ARCH-001/002/003 as
"pure backend, no screen." A Mermaid flow diagram is present.

**Note on this run's own process:** this worktree's copy of `plugins/wingman/commands/pipeline/uxflow.md`
had not actually received the Run 4 fix yet when this run started (verified: `git show HEAD:...`
still read the pre-fix `ARCH-*`/`DEF-*`-only text) — an early read against a sibling checkout gave a
false impression the fix was already in place here. The fix text described in Run 4 was applied to
this worktree's file as part of this run before dispatching either subagent, and both dispatches
above ran against the corrected file (confirmed via file content/mtime, not assumed).

**No bugs found this run** — both the new default `IA-*`/`DEF-*` path and the backward-compat
`ARCH-*` path traced correctly, exactly as the command text specifies, with explicit exclusion
reasoning in both cases. Promoted back to `verified`.
