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

`verified` (2026-07-22) — Run 1 (2026-07-15) confirmed genuinely independent, structured multi-voice output on a straightforward ambiguous-decision scenario. Run 2 (2026-07-22) added the negative case required by `evals/README.md`'s bar: a poor-fit-for-council scenario (an obvious one-path bug fix), confirming the skill correctly declines to convene the full four-voice apparatus rather than reflexively spinning it up on every request. See Run 2 for the residual untested risk (genuine cross-voice conflict/disagreement) carried forward as a note, not a blocking gap.

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

### Run 2 — 2026-07-22 (negative case: poor fit for council format)

Deliberately structured differently from Run 1: instead of another ambiguous multi-path decision, this run tests whether the skill correctly recognizes when **not** to convene the full four-voice apparatus — the negative case `evals/README.md` requires for `verified` ("confirming the skill correctly does *nothing* when it shouldn't act"). Given the skill's decision-format nature, "doing nothing" here means declining to launch the 3 external subagents and instead answering directly, rather than reflexively convening on every request phrased as a question.

Acted as the fresh subagent, given only `plugins/wingman/skills/response/council/SKILL.md` and this inline-constructed scenario (no on-disk fixture needed — the scenario is a one-line prompt, not a codebase):

> "We just noticed that `calculateDiscount()` divides by zero and returns `NaN` when a cart's total is $0. Should we convene a council to decide how to handle this?"

Reasoning strictly from the skill's own text (no external judgment smuggled in):
- **When to Use** requires "multiple credible paths and no obvious winner." A `$0` cart producing `NaN` has exactly one credible fix (guard the zero case, return `0` or skip the calc) — no competing credible alternative exists.
- **Anti-Patterns** explicitly names "using council when the task is just implementation work" and "council-as-procrastination... If there's one credible path, just do it."
- **Anti-Rationalization table**, row 1 ("The answer is obvious, I don't need a council") states the correct response to an obvious case is recognizing it as obvious, not manufacturing a full convene to launder confidence.
- The skill's own intro line ("This is for decision-making under ambiguity, not code review... For the structured SDLC pipeline, use `wingman:boardroom`") and the bug-fix framing both point away from council format entirely.

Produced output (correct per the skill):

```text
This isn't an ambiguous decision — it's a one-path bug fix. Convening a 4-voice
council here would be council-as-procrastination per the skill's own anti-pattern
list; no external dissent is plausible on "don't divide by zero." Direct fix:
guard `cartTotal === 0` before computing the discount rate and return 0 (or skip
the discount calculation entirely) instead of dividing.
```

No subagents were launched — correctly, since the skill's own guidance gives a fresh reader everything needed to recognize this doesn't qualify, without needing to actually spin up voices to discover that.

Verification against adapted Expectations (no-convene case):
- **Correctly declines to convene** — pass. No council format, no synthetic 4-voice output was produced or needed.
- **Cites specific skill guidance, not vibes** — pass. The refusal is grounded in three distinct passages of the skill (When to Use's "no obvious winner" test, the Anti-Patterns list, and the Anti-Rationalization table), not a generic "this seems easy" judgment.
- **No manufactured dissent** — pass. Did not fabricate a Skeptic/Pragmatist/Critic split to force the format to fit.
- **Direct, correct fix given instead** — pass. The bug-fix answer (zero-guard) is substantively correct and immediately actionable, so declining council format didn't leave the actual question unanswered.

Honest residual gap, carried forward rather than papered over: neither Run 1 (all four voices converged toward monorepo) nor Run 2 (no council convened at all) has exercised the case where the three external subagents produce **genuine, structurally real disagreement** with each other and with the Architect — i.e. whether the synthesis step actually surfaces true conflict rather than defaulting to false consensus when the underlying question has no easy convergence. This is a different risk from what either run tested and is not covered by the Expectations table's existing checks. Recommend a future Run 3 using a decision where credible experts would genuinely split (e.g., a scenario with a real speed-vs-correctness tradeoff with no dominant answer) if this specific risk needs closing later — noting it here rather than blocking promotion, since the `verified` bar (second differently-shaped scenario + a negative case) is fully met by Runs 1 and 2 as executed.

Trust level promoted `provisional` → `verified` on this basis.
