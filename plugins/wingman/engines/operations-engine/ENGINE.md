# Engine: Operations

**Status:** built
**Purpose:** what happens to a project after it's shipped — launch itself, post-launch review of
real usage/support signals, and incident response when something goes wrong in production. Split out
of the Workflow and Governance Engines 2026-07-30 (EngineOS reorganization): "the mechanics of
shipping a change" (Workflow) and "an ongoing loop's process/learning discipline" (Governance) are
both distinct from "what a founder does with a project that's already live."

## Inputs

A shipped, deployed change (from the Workflow Engine's `ship.md`), or a real production incident.

## Output artifacts

A launch record (`commands/adaptive/launch.md`), post-launch findings fed back into the next
Discovery pass (`commands/adaptive/post-launch.md`), telemetry findings (`commands/adaptive/telemetry.md`),
an incident response record (`commands/adaptive/incident.md`).

## Members

- `commands/adaptive/launch.md`
- `commands/adaptive/post-launch.md`
- `commands/adaptive/telemetry.md`
- `commands/adaptive/incident.md`
- `skills/incident-response/SKILL.md`

## State read + written

Reads: `.wingman/checkpoints.jsonl`'s Ship.5 checkpoint, real usage/support signals the founder
reports. Writes: post-launch findings that feed the next `/wingman:discovery` pass, incident records.

## Escalation

A production incident with unclear root cause, or a post-launch finding suggesting a shipped decision
was wrong, is a Must-ask — surfaced to the founder plainly, not quietly absorbed into the next
iteration's backlog.

## Permitted tool tiers

Draft (`references/permission-model.md` Level 1) for `post-launch.md`/`telemetry.md` (read/report
only); Conditional (Level 3) for `incident.md` when a fix requires a deploy-class action, gated the
same way `deploy-approval-gate.mjs` (Risk Engine) gates any other deploy.
