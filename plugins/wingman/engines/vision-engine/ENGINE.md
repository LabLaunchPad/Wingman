# Engine: Vision

**Status:** built
**Purpose:** captures the founder's actual intent — the thing every later artifact must trace back
to — as real, ID-bearing findings rather than free prose that nothing downstream can reference.

## Inputs

A founder's verbal description of what they want to build, plus (per PR9 of the AI Engineering
Operating System build) real images or screenshots when the founder has one — read directly via the
`Read` tool, no new dependency. Figma files and voice input are documented, credential-gated adapter
contracts, not yet built — see `docs/HUMAN-TODOS.md`.

## Output artifacts

A `DISC-*` findings table (per `commands/pipeline/discovery.md`'s output template) — the root of the
vision→artifact traceability chain every other engine's output ultimately `Satisfies`.

## Members

- `commands/pipeline/discovery.md`
- `skills/interview-one-question-at-a-time/SKILL.md`

## State read + written

Reads: nothing (this is the pipeline's entry point). Writes: `.wingman/state.json` (stage = Discovery),
`.wingman/checkpoints.jsonl` (Discovery.5 checkpoint), the `DISC` counter in `.wingman/traceability.json`.

## Escalation

Ambiguous or contradictory founder intent is a **Must-ask** per `skills/research-gate`'s Human
Approval Framework — this engine never invents a vision the founder didn't state.

## Permitted tool tiers

Read-only / draft tier (`references/permission-model.md` Level 0-1) — Discovery only records intent,
it does not write code or infrastructure.
