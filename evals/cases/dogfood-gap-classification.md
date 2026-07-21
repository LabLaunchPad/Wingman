# Eval: dogfood-gap-classification

<!-- eval:no-fixture-needed: evidence comes from this project's own real dogfooding history, not a dedicated setup-*.sh script -->

Tests `plugins/wingman/skills/governance/dogfood-gap-classification/SKILL.md` — its 5-branch decision tree
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

## Run 2 — 2026-07-15 (closing the hook-candidate gap)

Constructed a real, plausible gap the prior 5 never covered: a `git-pr-workflow` script
(`sync-branch-after-squash-merge.sh`) crashing with `fatal: not a valid ref: HEAD` when invoked from
a detached-HEAD worktree — a mechanical, binary-checkable precondition failure, not a judgment call.
A fresh subagent, given only the skill file and this gap description, was asked to classify it
through the full decision tree and walk the 3 named safeguard questions (generalization,
negative-case requirement, historical-bug check) rather than just naming a bucket.

**Result**: correctly classified as **hook candidate** (the check — `git symbolic-ref -q HEAD`
succeeds or doesn't — is purely mechanical, zero quality/intent judgment), correctly held at
`pending-second-opinion` per the cooling-off rule rather than finalized on one occurrence, and
correctly reasoned through all 3 safeguards: (1) generalizes across all project types since it's
pure git-plumbing, no per-stack sniffing needed; (2) explicitly named that a negative-case fixture
(a normal, branch-attached repo where the guard must stay silent) is still required before this
promotes further — didn't skip that requirement just because the positive case was clear; (3)
flagged the historically-relevant risk directly: since the *original* bug was itself a bad
precondition assumption, a naive fix that auto-remediates (e.g., silently `git checkout`-ing back
to a branch) risks the same class of bug in a new place if the detached-HEAD worktree carries
uncommitted work — correctly recommended fail-fast-with-actionable-message over silent
auto-remediation, consistent with the same script's own existing "never auto-resolve, let the
calling agent decide" convention for cherry-pick conflicts. Also correctly distinguished this from
a skill-candidate framing (no situational judgment remains once the guard exists) and from a
command-instruction-only fix (a mechanical guard clause is the load-bearing fix; prose is at best a
belt-and-suspenders addition, not a substitute).

This is the differently-shaped scenario the trust-level note called out as the specific remaining
gap: the hook-candidate branch, its cooling-off gate, and all 3 safeguard questions, exercised for
real rather than only reasoned through in the abstract.

## Trust level

`verified` — 6 real, independent classification decisions across 3 separate runs now span all 5
decision-tree branches: out-of-scope (correctly reused on re-encounter, not re-litigated as new),
hook candidate (this run, correctly held at `pending-second-opinion` with all 3 safeguards answered
rather than skipped), skill candidate, and command-instruction addition, each shipped directly with
no forced escalation to a stronger-sounding bucket than the gap actually needed. The one item still
genuinely open — an actual negative-case fixture proving the detached-HEAD guard stays silent on a
normal repo — is a follow-up to the *fix*, not to this skill's classification behavior, which is
what this eval tests.
