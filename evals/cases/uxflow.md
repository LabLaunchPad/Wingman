# Eval: uxflow

Tests `plugins/wingman/commands/uxflow.md` behaviorally, distinct from `seven-stage-pipeline-e2e.md` (which already covers the uxflow stage as part of a whole-pipeline run). The distinctive behaviors under test: does the command (a) produce a UX-*-tagged flow table with screen/state descriptions, (b) render the same information as a visual flow diagram using `visual-founder-output`, and (c) skip cleanly for projects with no user-facing surface (pure API, CLI) rather than manufacturing screens?

## Fixture

`evals/fixtures/setup-uxflow-fixture.sh <target-dir>` — the base waitlist app (a JSON API, no user-facing surface) with pre-seeded discovery, define (DEF-001..003), and architecture (ARCH-001..003) artifacts.

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with `commands/uxflow.md` and the pre-seeded ARCH-* decisions.
3. Independently verify the output against the expectations below.

## Expectations

| Check | Expected |
|---|---|
| Graceful skip for non-UI project | A plain-language sentence saying "this project has no user-facing surface, skipping UX flow" — NOT a manufactured screen table |
| No UX-* minted | The flow table is absent (or empty) for a pure-API project |
| Flow produced for UI project | When given a UI fixture, a UX-* table and a visual flow diagram are produced |
| Hand-off to implementation-planning | The output ends by directing to `/wingman:implementation-planning`, not stopping for approval |

## Trust level

`verified` — the skip-for-non-UI path is confirmed by `seven-stage-pipeline-e2e.md` Run 1 (2026-07-14, waitlist-app JSON API had no UX-* IDs minted), the produce-flow path is confirmed by Run 2 (2026-07-14, Tip Jar feature produced UX-* IDs with diagrams), and Run 3 (2026-07-18, dedicated uxflow-only dispatch) closed the one gap those two left: a genuine mixed UI/non-UI judgment call, rather than a clean binary.

## Run log

Covered by `seven-stage-pipeline-e2e.md` Run 1 (2026-07-14) and Run 2 (2026-07-14) for the clean binary cases.

### Run 3 — 2026-07-18 (mixed UI/non-UI judgment call, dedicated uxflow-only dispatch)

**Setup:** `setup-uxflow-fixture.sh`'s base fixture (a JSON-only waitlist API, 3 pure-backend `ARCH-*` decisions), with one hand-added `ARCH-004` committed on top: a server-rendered `GET /waitlist/unsubscribe` confirmation page — a single, genuine user-facing surface mixed in among 3 API-only decisions. Neither prior run tested this shape; both were clean binaries (all-API or all-UI).

**Dispatch (fresh `general-purpose` subagent, given only `commands/uxflow.md` + its referenced `visual-founder-output` skill/templates, not told the answer):** correctly identified ARCH-004 as the one decision with real screen shape and produced a single-row `UX-001` table mapped to it, explicitly excluding ARCH-001/002/003 in the doc's own prose ("no screen to sketch") rather than silently omitting them or manufacturing screens for the API-only decisions. Did not skip the stage outright (uxflow.md's "will have, per the Architecture stage's decisions" clause correctly triggered on ARCH-004 despite the codebase being 100% JSON responses today). Produced both a Tier B Mermaid diagram and — since a real Artifact tool was present in this dispatch — a genuine Tier A low-fidelity HTML wireframe. Ended by handing off to `/wingman:implementation-planning` without stopping for a checkpoint of its own, correctly matching uxflow.md's non-gating stage.

**Independently verified** (real filesystem, not the subagent's self-report): `cat docs/wingman/uxflow/waitlist-unsubscribe.md` — one `UX-001` row, correctly mapped to `ARCH-004` only, table prose correctly explains the ARCH-001/002/003 exclusion; `.claude/agents/dept-design.md` exists (Design department lead activated on real evidence); `.wingman/state.json` created fresh with `active_department_leads: ["dept-design"]`. **Fetched the live Artifact URL directly** (`https://claude.ai/code/artifact/0ea25f17-c37b-4efe-8a8a-fdc9f63aaa15`) — confirmed a real rendered wireframe (not a 404/error), matching the claimed content exactly (a bordered confirmation box reading "You've been removed from the waitlist," annotated with `UX-001 — reached via the unsubscribe link... (ARCH-004)`).

**No bugs found this run** — the mixed-input judgment call, the diagram/wireframe production, and the correct non-gating handoff all behaved exactly as `uxflow.md` specifies on first try. Promoted to `verified`.
