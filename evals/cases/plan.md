# Eval: plan — RETIRED (4-stage pipeline replaced by 7-stage pipeline, MVP2)

**Status: retired, not deleted**, per this project's "stale status is worse than no status doc at all" rule. `commands/plan.md` no longer exists — the 4-stage `plan`/`build`/`secure`/`ship` pipeline was replaced by the 7-stage `discovery`/`define`/`architecture`/`uxflow`/`implementation-planning`/`build`/`ship` pipeline in MVP2 (see `docs/ARCHITECTURE.md` §10 v14). This case was authored but never actually run (`authored, pending first run`) before `plan.md` was retired, so there is no historical run log to preserve.

## Why this file is kept instead of deleted

This case originally tested whether `plan.md`'s escalation discipline held the line between a genuine founder-level decision and a routine technical one. That discipline now lives across the planning stages that replaced it — most directly `discovery.md` and `define.md` — and is exercised end to end by `evals/cases/seven-stage-pipeline-e2e.md`, which covers escalation behavior as part of a whole-pipeline run. No dedicated per-stage case exists for `discovery.md`/`define.md` individually, by the same deliberate design already documented in `docs/PROJECT.md` for the other 5 planning-stage commands (they bundle into one Planning Milestone checkpoint rather than getting separate cases).

## Original fixture and scope (unchanged, no longer executed)

`evals/fixtures/setup-plan-fixture.sh` — "Notes," a tiny zero-dependency Node HTTP note-taking service, mixing a genuine business/one-way-door decision (should an anonymously-shared note link expose the note to non-logged-in visitors) with a routine technical decision (token format/expiry mechanism for the share link). The original intent — escalate exactly the business decision, decide the technical one unprompted — is the same shape of check `seven-stage-pipeline-e2e.md` now exercises against the current pipeline.

## Trust level

`retired` — superseded by `seven-stage-pipeline-e2e.md`, never independently run under this file.

**Note on a conflicting version encountered during a merge (2026-07-18):** a `verified`/"Run 1"
version of this section briefly existed on `main`, claiming a real subagent dispatch tested
`commands/plan.md` on 2026-07-15. That claim does not hold up under verification —
`commands/plan.md` has not existed since commit `358e364` (the same-day MVP2 retirement), confirmed
directly (`git show origin/main:plugins/wingman/commands/plan.md` → does not exist; `git log --all
-- plugins/wingman/commands/plan.md` shows no commit after `358e364`). Discarded as
unverifiable/fabricated rather than merged, per this project's own "don't trust a self-report,
verify against the real filesystem" discipline.
