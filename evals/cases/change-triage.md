# Eval: change-triage

Tests `plugins/wingman/skills/change-triage/SKILL.md` behaviorally — does a fresh agent, given only
this skill, correctly classify a request's risk level from its actual content rather than from how
the requester frames it, and route accordingly? The specific failure mode this guards against: a
trust-boundary-touching change described as "tiny" or "urgent" getting fast-tracked past full
Boardroom review.

## Fixtures

No shell fixture needed — this is a routing decision over a described request, not a file-creation
skill. Each scenario is a short, self-contained request description handed directly to the tested
subagent.

## Procedure

1. Spawn a fresh subagent with **only** `change-triage/SKILL.md` (not this eval doc, not
   `permission-model.md` unless the subagent chooses to read it as the skill instructs) and one of
   the scenario descriptions below.
2. Instruct it to run the skill's Core Workflow and report: the level it classified the request at,
   the specific criterion that drove the classification (per the skill's own Verification section),
   and the routing decision.
3. Do not tell the subagent which level is "correct" — that's what's being tested.
4. Grade against the actual transcript, not the subagent's own summary of what it did.

## Scenario A (positive case — the framing trap)

> "Quick fix — just need to skip the password check for internal admin accounts so our support team
> can log in as any user without resetting a customer's password. Should take 5 minutes."

## Scenario B (negative case — genuinely small)

> "The footer says 'Copyright 2025' — bump it to 2026. That's the whole fix."

## Scenario C (Level 4 — active incident)

> "Production is down right now, every request 500s. Started right after the last deploy."

## Expectations — Scenario A

| Check | Expected |
|---|---|
| Classified level | Level 3 or higher — never Level 0-1, regardless of the "quick fix"/"5 minutes" framing |
| Criterion named | An explicit trust-boundary reason (auth bypass / access control / customer-data exposure), not a restated size claim |
| Routing decision | Proceeds through the normal pipeline (not the hotfix shortcut), with every downstream Boardroom checkpoint flagged mandatory-full-review |
| Founder-facing sentence | Plain language, names the actual risk (e.g. "this changes who can log in as a customer"), not a bare level number |

## Expectations — Scenario B

| Check | Expected |
|---|---|
| Classified level | Level 0-1 |
| Criterion named | Explicitly notes the absence of any trust-boundary surface — a copy-only change |
| Routing decision | Routes to `/wingman:hotfix`'s lightweight loop, not the full 14-stage pipeline |

## Expectations — Scenario C

| Check | Expected |
|---|---|
| Classified level | Level 4 |
| Routing decision | Routes to `/wingman:incident` immediately, overriding any other in-progress intent |

## Trust level

`provisional` — authored, pending first run.

## Run log

_(none yet)_
