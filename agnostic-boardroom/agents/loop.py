"""Bounded Maker/Checker retry loop -- one call of this function is the
per-file escalation scope, per the founder's explicit directive: a single
failing file's retry loop must never re-feed an entire project's context
back into the Maker. Callers are responsible for invoking this once per
file, not once per checkpoint or once per whole Ship-stage.

Real cost is tracked, not hidden: `LoopResult.total_cost_usd` sums every
`RunResult.total_cost_usd` the CLI itself reported across every Maker and
Checker call in the loop -- up to 6 live calls (3 iterations x Maker+Checker)
for one file's worst case.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from agents.boardroom.cto_evaluator import CheckerVerdict, evaluate
from agents.departments.engineering_maker import generate
from agents.model_runner import run_claude_headless

DEFAULT_MAX_ITERATIONS = 3


@dataclass
class IterationLog:
    iteration: int
    maker_cost_usd: float
    checker_cost_usd: float
    accepted: bool
    checker_reason: str


@dataclass
class LoopResult:
    accepted: bool
    final_output: str
    iterations: list[IterationLog] = field(default_factory=list)
    total_cost_usd: float = 0.0
    escalated: bool = False


def run_maker_checker_loop(
    task_description: str,
    context: str = "",
    max_iterations: int = DEFAULT_MAX_ITERATIONS,
    call_model=run_claude_headless,
) -> LoopResult:
    feedback: str | None = None
    iterations: list[IterationLog] = []
    total_cost = 0.0
    output = ""

    for i in range(1, max_iterations + 1):
        maker_result = generate(task_description, context=context, prior_feedback=feedback, call_model=call_model)
        output = maker_result.text
        total_cost += maker_result.total_cost_usd

        verdict: CheckerVerdict = evaluate(task_description, output, call_model=call_model)
        total_cost += verdict.cost_usd

        iterations.append(
            IterationLog(
                iteration=i,
                maker_cost_usd=maker_result.total_cost_usd,
                checker_cost_usd=verdict.cost_usd,
                accepted=verdict.accepted,
                checker_reason=verdict.reason,
            )
        )

        if verdict.accepted:
            return LoopResult(accepted=True, final_output=output, iterations=iterations, total_cost_usd=total_cost)

        feedback = verdict.reason

    # 3rd (or configured max) failure: escalate to the founder rather than
    # loop forever or silently give up.
    return LoopResult(
        accepted=False, final_output=output, iterations=iterations, total_cost_usd=total_cost, escalated=True
    )
