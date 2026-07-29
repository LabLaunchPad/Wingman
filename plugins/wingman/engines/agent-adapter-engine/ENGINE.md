# Engine: Agent Adapter

**Status:** built
**Purpose:** ports Wingman's own content (skills, commands, hook logic) to other coding-agent
harnesses (Codex CLI, OpenCode, Gemini CLI, Cursor, Cline, OpenHands) so the same discipline runs
regardless of which agent is actually driving a session — wiring stays harness-specific, decision
logic stays generic and reused.

## Inputs

Wingman's canonical `plugins/wingman/{commands,skills,agents,hooks}` content.

## Output artifacts

Per-harness generated adapter trees under `references/harness-adapters/<harness>/`, plus
`references/harness-capability-profile.md` — the capability matrix every capability-aware branch in
the canonical files reads.

## Members

- `commands/adaptive/harness.md`
- `skills/platform-native-reference/SKILL.md`
- `references/fablize-pattern.md`
- `references/harness-capability-profile.md`

## State read + written

Reads: canonical plugin content. Writes: `references/harness-adapters/**` (generated, `--write` /
`--check` idempotent — see `scripts/generate-harness-adapters.mjs`).

## Escalation

A harness with no confirmed capability for a primitive (plan-gate, parallel dispatch, question tool)
gets an honestly-disclosed substitute, never a silent claim of parity.

## Permitted tool tiers

Draft (`references/permission-model.md` Level 1) — generates reference files, no project code.
