# Engine: Tool Runtime

**Status:** built
**Purpose:** a declarative intent→tool map (Git/GitHub/filesystem/browser/DB/cloud/docs/test-runner),
composed with `references/permission-model.md`'s tiers, so tool choice is explicit and governed
rather than ad-hoc. Not a daemon and not a router process — Claude Code (or whichever harness is
driving the session) remains the executor.

## Inputs

An action with more than one plausible tool/approach for the same intent.

## Output artifacts

A named permission level for the intended action (`references/tool-runtime.md`'s map), and — when
the level isn't already satisfied — an escalation surfaced before the action proceeds.

## Members

- `skills/tool-selection/SKILL.md`
- `references/tool-runtime.md`

## State read + written

Reads: the intended action and `references/tool-runtime.md`'s map. Writes: nothing directly — this
engine names the level; the real enforcement lives in `hooks/deploy-approval-gate.mjs`,
`hooks/dod-structural-gate.mjs`, and `scripts/memory-tiers.mjs`'s approval gate (Governance/Memory
Engines).

## Escalation

An action mapping to Level 3+ with no recorded approval is a Must-ask, surfaced before proceeding —
this engine names the gap, it does not itself block.

## Permitted tool tiers

Spans Level 0-4 by composition (`references/permission-model.md`) — this engine names the level an
action requires, it does not define a second scale.
