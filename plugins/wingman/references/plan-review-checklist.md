# Plan Review Checklist (gstack pattern)

Adapted from `garrytan/gstack`'s `plan-ceo-review` / `plan-eng-review` / `plan-design-review` / `plan-devex-review` multi-perspective review concept, and its "EXIT PLAN MODE GATE" idea. This checklist is the concrete, enforceable form of that pattern inside Wingman: the `boardroom-checkpoint` hook refuses `ExitPlanMode` unless the plan file carries **all** required sections below.

## Required plan sections (enforced by `boardroom-checkpoint.mjs`)

Every plan that passes through `/wingman:boardroom` and then `ExitPlanMode` must contain, as `##` headings:

1. `## Executive Summary` — one paragraph a non-technical founder can read and act on.
2. `## Current State` — what exists today (code, data, infra) that this plan touches.
3. `## Problem Statement` — the concrete problem, with evidence (logs, user reports, metrics), not a vibe.
4. `## Solution Approach` — the chosen approach and *why* it was chosen over alternatives.
5. `## Success Criteria` — how we'll know it worked, stated as observable/verifiable outcomes.
6. `## Timeline` — rough sequencing and any hard deadlines or dependencies.
7. `## Risks` — what could go wrong, with the gsd-plugin threat-register dispositions (see `threat-register.md`).

If any section is missing, the gate denies exit with the list of missing sections. This is the gstack "verify a required report section exists before allowing ExitPlanMode" rule.

## Four-perspective review (the Boardroom's ancestry)

Before a plan is "ship it", each of these lenses should have a clear answer. The Boardroom runs them in parallel; this checklist is what each seat checks:

- **CEO/founder lens** — Does this solve a real problem for the business? Is the scope right-sized (not gold-plated)?
- **Engineer lens** — Is the approach sound? Are there architectural landmines? Is the test plan adequate?
- **Design lens** — If there's a user surface, is it usable and consistent?
- **DevEx/security lens** — Does it add operational or security burden? Can we maintain it?

## Anti-rationalization

- "The plan is obvious, sections are overhead" → A missing `## Risks` or `## Success Criteria` is exactly how projects ship something unmeasurable and un-rollbackable. Write the sections.
- "I'll add the sections after exit" → Exit is the gate. After exit there is no gate. Write them now.
- Red flag: you are about to hit ExitPlanMode and the plan file has no `## Risks`. Stop.

## Cited by

- `plugins/wingman/commands/adaptive/boardroom.md`
- `plugins/wingman/commands/pipeline/implementation-planning.md`
