# Eval: council

Tests `plugins/wingman/skills/council/SKILL.md` behaviorally. This skill convenes a four-voice decision council for ambiguous decisions.

## Fixture

A decision scenario: "Should we use a monorepo or polyrepo structure for a new project with 3 services?" The decision has multiple valid paths with no obvious winner.

## Procedure

1. Give a fresh subagent only the skill file and the decision scenario.
2. Instruct it to convene a council and produce a verdict.
3. Verify it launches 3 independent voices, synthesizes with bias guardrails, and produces a structured verdict.

## Expectations

| Check | Expected |
|---|---|
| Four voices present | The verdict includes Architect, Skeptic, Pragmatist, and Critic positions |
| Independent voices | The three external voices are launched as subagents (not the same context) |
| Bias guardrails | The synthesis explains if any external voice changed the recommendation |
| Strongest dissent included | The verdict includes the strongest dissent even if rejected |
| Premise check present | The verdict includes a premise check from the Skeptic |
| Structured output | The verdict follows the specified output format |

## Trust level

`untested` — awaiting first run.

## Run log

Awaiting first run.
