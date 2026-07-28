---
name: change-triage
description: Use at intake — before /wingman:discovery starts on a fresh request, before /wingman:build proceeds with no prior approved plan, or as /wingman:hotfix's first step — classify the requested change's risk level and route it to the right-sized path. Triggers whenever a new, not-yet-classified change request enters the pipeline at any of those three entry points.
---

<!--
Origin: a founder-supplied "enterprise blueprint" proposed a Stage-1 Triage step ahead of a
multi-stage decision framework. The founder chose to build the triage idea now, as a deliberate,
explicitly-recorded partial reversal of the 14-stage-checkpoint-bundling decision documented in
docs/ARCHITECTURE.md §4d — see docs/PROJECT.md's decisions log, 2026-07-28, for the full record.
The framework's other proposed pieces (a coarser 7-8 stage model, a separate risk scale) were not
adopted: this skill reuses the permission model's existing 5 tiers (references/permission-model.md)
rather than inventing a second, competing risk taxonomy.
-->

# Change Triage

## Overview

Before any pipeline stage starts real work on a request, something has to decide how much process
that request actually needs — a one-line copy fix and a change to the login flow should not travel
the same path. This skill is that one decision, made once at intake, using the same 5-tier risk
scale the permission model (`references/permission-model.md`) already defines — not a second,
competing risk taxonomy.

**Core principle:** one risk taxonomy, two consumers. The permission model's tiers govern what an
agent may *do* once work is underway; this skill uses the identical tiers to decide which *path* a
request takes before any of that begins. Triage may route work **up**, to more process, but never
**down**, to less — that asymmetry is what keeps a routing step from becoming a gate-weakening dial,
the exact failure mode a prior "configurable Boardroom strictness" proposal was declined for.

**This is a skill, not a 15th pipeline stage.** It produces a routing decision, not an artifact with
its own Boardroom checkpoint, and it never mints a traceability ID — adding a stage would break the
14 stage names already encoded in the `checkpoints.jsonl` schema (`docs/DATABASE.md`).

## When To Use

- At the very start of `/wingman:discovery`, before Discovery.1, on a fresh request that hasn't been
  classified yet.
- At the start of `/wingman:build`'s "Before starting" step, specifically when no prior approved plan
  exists for this request (an ad hoc/direct build request that's skipping the earlier pipeline
  stages) — an already-approved plan was already triaged implicitly by having passed through
  Discovery, so this skill doesn't re-run there.
- As `/wingman:hotfix`'s Step 1 intake, alongside its existing normalization of the triggering error —
  a "hotfix" framing is exactly where under-classification risk is highest, since urgency pressures
  toward skipping process.

## Inputs

The raw request as given — the founder's own words, an error/stack trace, or a telemetry alert —
before any deeper investigation. Triage classifies from what's stated and what's structurally
knowable about the surface being touched, not from a full root-cause analysis.

## Core Workflow

1. **Check for a trust boundary first, regardless of how the request is framed.** Does this touch
   auth/session logic, payments, access control, migrations, customer/personal data, a shared or
   production environment, or an external service with side effects? If yes, this is **Level 3
   minimum** — full stop, no matter how small or urgent the requester says it is. Framing is not
   evidence; the actual surface being touched is.
2. **Check whether production is actively broken or degraded right now.** If yes, this is **Level 4**
   — route to `/wingman:incident` (and `incident-response`'s stabilize-first runbook) immediately.
   This check overrides everything else, including step 1's trust-boundary check.
3. **Otherwise, size and reversibility decide Level 0-2:** a small, easily-reversible,
   non-trust-boundary change (a copy tweak, a display glitch, a broken link, a typo) is Level 0-1. An
   ordinary feature or change with normal risk and no trust-boundary surface is Level 2.
4. **Route by level:**
   - **Level 0-1** → the small-fix path (`/wingman:hotfix`'s lightweight loop), not the full 14-stage
     pipeline from Discovery. Right-sized process for a right-sized change.
   - **Level 2** → proceed through whichever pipeline stage the founder is already running, normally
     — no shortcut, no extra ceremony added by this skill.
   - **Level 3** → proceed through the normal pipeline, but explicitly flag every downstream Boardroom
     checkpoint for this request as mandatory full review — a later stage's checkpoint must never be
     skipped or rubber-stamped on the reasoning that "triage already looked at this."
   - **Level 4** → stop the currently-requested command, redirect to `/wingman:incident`, and do not
     resume the originally-requested pipeline stage until the incident is stabilized.
5. **State the classification and routing decision to the founder in one plain-language sentence**
   before proceeding — e.g. "This touches how customers log in, so it'll go through a full review
   before shipping, not just a quick fix." Never a bare level number with no explanation.

## Output

A classification (Level 0-4, using the permission model's own tier names) plus the routing decision
from step 4, surfaced to the founder as one plain-language sentence (step 5). No separate artifact,
no traceability ID, no checkpoint of its own — this is a routing decision, not a stage output.

## Escalation

A Level 3 or 4 classification *is* the escalation — to full mandatory Boardroom review, or to
`/wingman:incident`, respectively. There is no further escalation path beyond routing correctly; get
the classification right and the existing pipeline/incident machinery does the rest.

## Constraints

**MUST:**
- Classify every intake request against the permission model's actual tiers before choosing a path.
- Treat any request touching a trust boundary as Level 3+ regardless of how the requester frames its
  size or urgency.
- Route a Level 4 classification to `/wingman:incident` immediately, ahead of any other in-progress
  intent.
- Tell the founder the classification and routing decision in one plain-language sentence.

**MUST NOT:**
- Downgrade a Level 3+ classification later in the pipeline because a subsequent checkpoint feels
  redundant.
- Skip triage because the requester called the change "tiny," "urgent," or "just a quick fix."
- Invent a new risk scale or tier — this skill reuses `references/permission-model.md`'s 5 tiers
  exactly; a second, competing taxonomy is exactly the kind of drift `docs/GOVERNANCE.md` exists to
  prevent.
- Re-run on a request that already has an approved plan from an earlier pipeline pass — that request
  was already triaged implicitly by having gone through Discovery.

## Rationalizations

| Excuse | Reality |
|---|---|
| "The founder says it's tiny, I'll just fast-track it" | Framing isn't evidence. Check the actual surface being touched (step 1) before trusting a size claim. |
| "This is basically the same request as last time, skip the check" | Re-classify every request independently — a similar-sounding request can touch a different surface than the one before it. |
| "It's urgent, process can wait" | Urgency is exactly the condition Level 4 exists for — route it there, don't skip triage to save time. |
| "The pipeline stage already implies a certain risk level" | The stage a founder happens to invoke doesn't determine risk — the request's actual content does. A `/wingman:build` call can still hide a Level 3 change. |

## Red Flags — Stop and Reconsider

- You're about to route an auth/payment/data-touching request to the small-fix path because the
  founder called it urgent or small.
- You're skipping triage because a command is already mid-flow, or because "the earlier stage
  probably already checked this."
- You're about to downgrade a Level 3 classification at a later checkpoint because it feels
  redundant to review again.
- You're inventing a new severity label instead of using the permission model's existing 5 tiers.

## Verification

Before proceeding past triage, name the specific criterion that drove the classification — the exact
trust boundary found (or confirmed absent), or the specific reversibility/size reasoning for a
Level 0-2 call — not a vague impression of how the request "feels." If you can't name the criterion,
the classification isn't done.

## Referenced by

- `commands/pipeline/discovery.md`
- `commands/pipeline/build.md`
- `commands/adaptive/hotfix.md`
