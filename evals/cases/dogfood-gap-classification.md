# Eval: dogfood-gap-classification

<!-- eval:no-fixture-needed: evidence comes from this project's own real dogfooding history, not a dedicated setup-*.sh script -->

Tests `plugins/wingman/skills/dogfood-gap-classification/SKILL.md` — its 5-branch decision tree
(out-of-scope / hook candidate / skill candidate / command-instruction addition / deferred) and
whether it drives an approved fix through implementation, reproduction, eval coverage, and a retro,
rather than stopping at "classified and proposed."

## Real evidence already produced (not a constructed test)

This skill has never needed a synthetic fixture — it has genuine, repeated, real exercise from
this project's own actual dogfooding history, classifying real `observed_gaps` entries produced by
real dogfood runs:

**5 real gaps classified in one run** (2026-07-15, maintainer-mode complex + simple paths):
1. Multi-ID traceability marker syntax silently dropping IDs → classified as a mechanical bug fix
   to an existing script (`check-traceability.mjs`) plus a documentation correction — shipped
   directly, no cooling-off needed (not a new hook, a correctness fix to an existing one).
2. Boardroom diff-checkpoints not being deterministic across repeated dispatches → classified as a
   documentation/expectation-setting addition to `boardroom.md` (situational judgment, no
   mechanical enforcement possible or desirable) — shipped directly.
3. Missing output-file convention in `define.md`/`architecture.md`/`uxflow.md` → classified as a
   command-instruction addition (repeated, safe, no per-step judgment) — shipped directly.
4. `management-board-activation`'s manager-creation gating starving `mgr-product`/`mgr-research` →
   classified as a skill-logic fix (genuine judgment about when a check should run) — shipped
   directly, re-verified against a later real dogfood run.
5. Sandbox-specific named-subagent-type dispatch unavailable → correctly classified `out-of-scope`
   (an already-documented environment limitation, not a Wingman-specific gap) — logged once in
   `references/recognized-generic-behaviors.md`, re-surfaced and correctly re-classified the same
   way on a later, independent run rather than treated as new.

**The classification tree's own honesty was tested for real**: none of the 5 gaps were forced into
the "hook candidate" bucket despite hook-shaped mechanical checkability being available for at
least gap #1 and #3 — the skill's own "classify by what the gap actually needs, not the strongest-
sounding enforcement" principle held under real pressure to close the loop quickly.

## What's genuinely still untested

**No real hook-candidate gap has been classified yet**, so the cooling-off mechanism (holding a
hook promotion at `pending-second-opinion` until a second, separate dogfood run confirms it) has
never actually fired in a real run — it's implemented and reasoned through, but not yet exercised
end-to-end. This needs a future dogfood run that surfaces a genuinely mechanical, safety-critical
gap to close.

## Trust level

`provisional` — 5 real, independent classification decisions across 2 separate runs, with a
correctly-reused `out-of-scope` re-classification on the 3rd, is strong direct evidence the
decision tree works as designed for 4 of its 5 branches. Not yet `verified`: the hook-candidate
branch and its cooling-off gate have never been exercised by a real gap that actually needed it.
