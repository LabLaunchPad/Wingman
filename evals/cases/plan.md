# Eval: plan — RETIRED (4-stage pipeline replaced by 7-stage pipeline, MVP2)

**Status: retired, not deleted**, per this project's "stale status is worse than no status doc at all" rule. `commands/plan.md` no longer exists — the 4-stage `plan`/`build`/`secure`/`ship` pipeline was replaced by the 7-stage `discovery`/`define`/`architecture`/`uxflow`/`implementation-planning`/`build`/`ship` pipeline in MVP2 (see `docs/ARCHITECTURE.md` §10 v14). This case was authored but never actually run (`authored, pending first run`) before `plan.md` was retired, so there is no historical run log to preserve.

## Why this file is kept instead of deleted

This case originally tested whether `plan.md`'s escalation discipline held the line between a genuine founder-level decision and a routine technical one. That discipline now lives across the planning stages that replaced it — most directly `discovery.md` and `define.md` — and is exercised end to end by `evals/cases/seven-stage-pipeline-e2e.md`, which covers escalation behavior as part of a whole-pipeline run. No dedicated per-stage case exists for `discovery.md`/`define.md` individually, by the same deliberate design already documented in `docs/PROJECT.md` for the other 5 planning-stage commands (they bundle into one Planning Milestone checkpoint rather than getting separate cases).

## Original fixture and scope (unchanged, no longer executed)

`evals/fixtures/setup-plan-fixture.sh` — "Notes," a tiny zero-dependency Node HTTP note-taking service, mixing a genuine business/one-way-door decision (should an anonymously-shared note link expose the note to non-logged-in visitors) with a routine technical decision (token format/expiry mechanism for the share link). The original intent — escalate exactly the business decision, decide the technical one unprompted — is the same shape of check `seven-stage-pipeline-e2e.md` now exercises against the current pipeline.

## Trust level

`retired` — superseded by `seven-stage-pipeline-e2e.md`, never independently run under this file.
