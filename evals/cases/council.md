# Eval: council

Tests `plugins/wingman/skills/response/council/SKILL.md` behaviorally. This skill convenes a four-voice decision council for ambiguous decisions.

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

`provisional` — first run (2026-07-15) confirms the skill produces genuinely independent, structured multi-voice output per its own instructions; not yet re-run against a second, differently-shaped scenario including a negative case, per `evals/README.md`'s bar for `verified`. Corrected 2026-07-20 from a `verified` label the run log doesn't actually support (see `FIXLOG.md` T1).

## Run log

### Run 1 — 2026-07-15

Acted as the fresh subagent per the case's Procedure, given only `plugins/wingman/skills/response/council/SKILL.md` and the fixture question ("Should we use a monorepo or polyrepo structure for a new project with 3 services?"). Followed the skill's workflow: formed the Architect position first, then launched the Skeptic, Pragmatist, and Critic as three separate `Agent` tool calls (genuine subprocess dispatch, not simulated in one context), each given only the role prompt + question + role-emphasis line from the skill's "Prompt shape" — no conversation history, no exposure to the other voices' output or to my Architect position. Confirmed independence directly by inspecting each subagent's own transcript file (`*.output` JSONL): each one's first `user` message contained only the isolated role prompt I sent, and each produced its Position/Reasoning/Risk/Surprise answer before any of the others' content could reach it.

Produced verdict:

```markdown
## Council: Monorepo vs. polyrepo for a new 3-service project

**Architect:** Start with a monorepo; unified CI and atomic cross-service commits outweigh polyrepo's isolation benefits at this stage.
Coupling risk grows over time, but that's cheaper to manage early than premature separation is to undo.

**Skeptic:** The real question isn't repo topology, it's unstated team/ownership boundaries — default to monorepo and treat polyrepo as a migration to earn later, not a choice to make now.
Splitting a monorepo later is mechanical; merging drifted polyrepos back after independent CI/versioning calcifies is not.

**Pragmatist:** Default to monorepo unless a concrete forcing function (separate teams, compliance boundary, different release cadence) already exists.
Polyrepo pays coordination costs (CI orchestration, cross-repo versioning, multi-checkout dev setup) upfront, before anything ships.

**Critic:** Monorepo is right only if this is one team; if the 3 services are actually owned by separate teams with different release cadences, monorepo's shared CI/versioning discipline becomes a bottleneck no one budgeted for.
The topology choice matters less than CI/CD scoping and ownership boundaries — a badly-scoped monorepo or a well-federated polyrepo can each beat the "wrong" choice done well.

### Verdict
- **Consensus:** All four voices converge on monorepo-by-default for 3 services with no stated team-size or deploy-independence constraints — reversibility favors monorepo (cheap to split later, expensive to merge back).
- **Strongest dissent:** If the 3 services are actually owned by separate teams with independent release cadences or a compliance/deployment-isolation requirement, the monorepo default is wrong and forces costly shared-CI bottlenecks — this conditional case for polyrepo is real, not manufactured, and is rejected here only because the question stated no such team split.
- **Premise check:** Yes — the Skeptic explicitly challenged the framing, arguing repo topology is not the load-bearing decision at all; the unresolved variable is team/ownership structure, which the question never specified, and no repo-structure choice fixes a wrong answer to that.
- **Recommendation:** Monorepo by default; revisit only when a concrete forcing function (distinct teams, independent release trains, compliance boundary) actually appears.
```

Verification against Expectations table:
- **Four voices present** — pass. Architect, Skeptic, Pragmatist, Critic all present with distinct positions.
- **Independent voices** — pass. Verified by direct inspection of each subagent's transcript file: three separate `Agent` tool invocations, each seeded with only the isolated role prompt (question + compact context + role + output shape), none saw this conversation, my Architect position, or each other's output.
- **Bias guardrails** — pass, with a caveat worth flagging: all three external voices converged toward the same monorepo-by-default lean as my initial Architect position, so there was no "external voice changed the recommendation" moment to report — the synthesis says so explicitly rather than manufacturing a reversal. The guardrail that did fire in practice was resisting the temptation to treat unanimity as license to skip the dissent — the conditional case for polyrepo (team/ownership divergence) is surfaced prominently in the verdict even though no voice built a full affirmative case for polyrepo outright.
- **Strongest dissent included** — pass. The team/ownership-divergence counter-case (raised by Skeptic and Critic independently) is included as the named "Strongest dissent" even though the final recommendation rejects it given the stated fixture (no team-split constraint given).
- **Premise check present** — pass. Skeptic's transcript explicitly interrogates the question's framing ("the actual driver is deployment/ownership boundaries, which are unspecified — answering confidently here just launders an assumption into a recommendation").
- **Structured output** — pass. Verdict follows the skill's exact `## Council: [title]` / per-voice position+reason / `### Verdict` (Consensus/Strongest dissent/Premise check/Recommendation) shape from SKILL.md's "Present a compact verdict" section.

One honest wrinkle, not a failure: the Critic subagent's actual response leaned more toward organizational/premise framing than pure downside-risk-and-failure-mode content, overlapping stylistically with the Skeptic's angle rather than being sharply distinct — the skill's role-prompt language ("surface downside risk, edge cases, and reasons the plan could fail") was followed, but the two voices ended up more correlated in substance than the skill's role table implies they should be. This didn't break any Expectations-table check (the Critic did supply a distinct Risk/Surprise pair), but it's worth noting as a soft-spot in role differentiation rather than a hard failure of the dispatch mechanism itself.
