"""Bounded Maker/Checker retry loop, rewritten on Agno's own `Workflow` + `Loop`
step primitives (Agno 2.8.2, confirmed installed) instead of the hand-rolled
`for i in range(1, max_iterations + 1)` loop this replaces (formerly
`agents/loop.py`).

**Why `Loop`, not `Team`**: Agno's `Team` (coordinate/route/collaborate/broadcast
modes) is built for delegating a single task across multiple agents and
synthesizing a combined answer -- not for a bounded retry-with-feedback gate
where a Checker's rejection reason must feed back into the Maker's *next*
attempt. `Loop`'s `end_condition` + `max_iterations` is the closer primitive:
it repeats a fixed step sequence until a condition holds or the cap is hit,
which is exactly this contract's shape.

**Contract preserved exactly** (so every existing caller --
`engine/boardroom_engine.py`, `eval/live_ab_run.py`, `eval/checker_rubric_ab.py`
-- needs zero changes beyond the import path): `run_maker_checker_loop(task_description,
context, max_iterations=3, call_model) -> LoopResult(accepted, final_output,
iterations, total_cost_usd, escalated, final_concerns)`.

**Per-file escalation scope preserved**: one call of this function is still the
per-file retry boundary the founder's directive requires -- the Loop step never
crosses that boundary since each call constructs its own fresh `Workflow`.

Iteration state (the `IterationLog` list, running cost) is accumulated via a
closure-captured list rather than Agno's own `session_state`/`previous_step_outputs`
machinery, deliberately: those are built for cross-run persistence across a
long-lived `Workflow` object, not this contract's single-call, throwaway-state
shape -- reusing them here would be state-machinery for its own sake, not a real
requirement of this port.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from agno.workflow import Loop, Workflow
from agno.workflow.types import StepInput, StepOutput

from loop.checker import CheckerVerdict, evaluate
from loop.maker import generate
from models.model_runner import run_claude_headless

DEFAULT_MAX_ITERATIONS = 3


@dataclass
class IterationLog:
    iteration: int
    maker_cost_usd: float
    checker_cost_usd: float
    accepted: bool
    checker_reason: str
    concerns: list[str] = field(default_factory=list)


@dataclass
class LoopResult:
    accepted: bool
    final_output: str
    iterations: list[IterationLog] = field(default_factory=list)
    total_cost_usd: float = 0.0
    escalated: bool = False
    final_concerns: list[str] = field(default_factory=list)


def run_maker_checker_loop(
    task_description: str,
    context: str = "",
    max_iterations: int = DEFAULT_MAX_ITERATIONS,
    call_model=run_claude_headless,
) -> LoopResult:
    iterations: list[IterationLog] = []
    state = {"feedback": None, "total_cost": 0.0, "output": "", "iteration_num": 0}

    def maker_step(step_input: StepInput) -> StepOutput:
        state["iteration_num"] += 1
        maker_result = generate(
            task_description, context=context, prior_feedback=state["feedback"], call_model=call_model
        )
        state["output"] = maker_result.text
        state["total_cost"] += maker_result.total_cost_usd
        return StepOutput(step_name="maker", content={"text": maker_result.text, "cost_usd": maker_result.total_cost_usd})

    def checker_step(step_input: StepInput) -> StepOutput:
        verdict: CheckerVerdict = evaluate(task_description, state["output"], call_model=call_model)
        state["total_cost"] += verdict.cost_usd

        iterations.append(
            IterationLog(
                iteration=state["iteration_num"],
                maker_cost_usd=step_input.previous_step_content.get("cost_usd", 0.0)
                if isinstance(step_input.previous_step_content, dict)
                else 0.0,
                checker_cost_usd=verdict.cost_usd,
                accepted=verdict.accepted,
                checker_reason=verdict.reason,
                concerns=verdict.concerns,
            )
        )
        if not verdict.accepted:
            state["feedback"] = verdict.reason

        return StepOutput(
            step_name="checker",
            content={"accepted": verdict.accepted, "concerns": verdict.concerns},
        )

    def end_condition(outputs: list[StepOutput]) -> bool:
        # `outputs` is the list of this iteration's step outputs (maker, checker);
        # the checker's is last. Loop exits (accepted or cap hit) when this is True.
        checker_output = outputs[-1]
        return bool(isinstance(checker_output.content, dict) and checker_output.content.get("accepted"))

    loop_step = Loop(
        steps=[maker_step, checker_step],
        max_iterations=max_iterations,
        end_condition=end_condition,
    )
    workflow = Workflow(name="maker-checker-loop", steps=[loop_step])
    workflow.run(input=task_description)

    if iterations and iterations[-1].accepted:
        return LoopResult(
            accepted=True,
            final_output=state["output"],
            iterations=iterations,
            total_cost_usd=state["total_cost"],
            final_concerns=iterations[-1].concerns,
        )

    # Cap hit without acceptance: escalate to the founder rather than loop
    # forever or silently give up -- same rule the hand-rolled version enforced.
    return LoopResult(
        accepted=False,
        final_output=state["output"],
        iterations=iterations,
        total_cost_usd=state["total_cost"],
        escalated=True,
    )
