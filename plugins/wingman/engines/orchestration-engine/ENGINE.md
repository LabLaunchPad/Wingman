# Engine: Orchestration

**Status:** built
**Purpose:** the mechanics of running multiple agents/turns efficiently and safely — parallel
subagent dispatch patterns, token economy, session health, and loop/compaction control. Narrowed
2026-07-30 (EngineOS reorganization): `telemetry.md` moved to the new Operations Engine — this
engine bounds a single session's own dispatch, not a shipped product's ongoing production metrics.

## Inputs

Any multi-agent or long-running session that needs bounded, efficient dispatch.

## Output artifacts

Session-health/compaction/stall signals from the 4 owned hooks, and token-efficiency guidance
applied across every other engine's dispatch.

## Members

- `skills/token-economy/SKILL.md`
- `hooks/context-monitor.mjs`
- `hooks/pre-compact-guard.mjs`
- `hooks/session-health.mjs`
- `hooks/stop-loop.mjs`
- `references/orchestration-patterns.md`
- `references/model-selection-guide.md`

## State read + written

Reads: session/turn state, `.wingman/loop.json`, `.wingman/loop-counter.<sessionID>.json`. Writes:
`.wingman/session-health.json`, `.wingman/context-monitor.json`, `.wingman/pending-warnings.json`.

## Escalation

`stop-loop.mjs`'s 50-iteration/3-stall caps halt a runaway loop and surface it to the founder rather
than let it spend indefinitely.

## Permitted tool tiers

Read-only (`references/permission-model.md` Level 0) — this engine observes and bounds, it doesn't
itself write project code.
