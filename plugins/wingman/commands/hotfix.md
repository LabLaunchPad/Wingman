---
description: Investigate and fix a production error — root cause first, then a minimal verified fix, then a Boardroom checkpoint before shipping again.
argument-hint: "<paste the error, stack trace, or symptom — or leave blank if this was triggered by a telemetry alert>"
---

# Wingman: Hotfix

This is the loop that runs when something already shipped breaks in production: find out what actually went wrong before touching anything, fix only that, verify it, then get the founder a plain-language go/no-go before it ships again. `/wingman:telemetry` is what makes an error visible in the first place ("will anyone find out, or will it fail silently") — this command is what happens once someone does find out.

$ARGUMENTS

## Step 1: Intake

Normalize whatever triggered this into one clear problem statement: a founder-pasted error/stack trace, or an alert delivered through an error-tracking connector wired up via `/wingman:telemetry`. If the input is too vague to investigate (no error message, no reproduction, just "it's broken"), ask the founder one plain-language clarifying question before proceeding — don't start guessing.

## Step 2: Activate the relevant department leads

Use the `department-lead-activation` skill for `dept-engineering` (always active), `dept-qa` (always active), and `dept-devops` (check for CI config, a Dockerfile, or a prior `ship` entry in `.wingman/checkpoints.jsonl` — a production incident almost always implies at least one prior ship, so this will typically already be true).

## Step 3: Root cause — before proposing any fix

Delegate to the `systematic-debugging` skill and do not skip ahead. Its Iron Law applies literally here: **no fixes without root cause investigation first.** Specifically:
- Complete **Phase 1 (Root Cause Investigation)** — read the actual error/stack trace carefully, reproduce it if at all possible, check what changed recently (recent commits, `.wingman/checkpoints.jsonl`'s last `ship` entry).
- Complete **Phase 2 (Pattern Analysis)** and **Phase 3 (Hypothesis and Testing)** — form a single, specific hypothesis about the cause and test it minimally before committing to a fix.

Do not propose a fix until Phase 3 is done. If 3+ hypotheses fail, `systematic-debugging`'s own escalation applies: stop and question the architecture rather than attempting a 4th patch.

## Step 4: Fix

Delegate the fix to `dept-engineering`, using the same discipline `/wingman:build` already applies: write a failing test that reproduces the bug first, implement the minimal fix that addresses the root cause (not the symptom), re-run the test to confirm it passes, keep the change scoped to that one fix — no bundled refactoring or "while I'm here" improvements. This is `systematic-debugging`'s own Phase 4 requirement; don't restate it differently here.

## Step 5: Re-verify

Delegate to `dept-qa` to verify the fix doesn't break anything else, and re-check whatever `/wingman:telemetry` uses to detect this class of error — confirm the original signal actually clears, not just that the new test passes.

## Step 6: Boardroom checkpoint

Run `/wingman:boardroom diff` before this ships again — a hotfix under time pressure is exactly when skipping the checkpoint feels tempting and is most likely to matter. Record the checkpoint with `stage: "hotfix"` in `.wingman/checkpoints.jsonl` (a free-text stage label is fine, per `docs/DATABASE.md`), and set `next_stage: "ship"`.

## Step 7: Hand off

Once the Boardroom clears this stage, proceed to `/wingman:ship`. Suggest `/wingman:learn` afterward if this incident revealed something durable worth remembering (a fragile pattern, a monitoring gap, a recurring root cause).
