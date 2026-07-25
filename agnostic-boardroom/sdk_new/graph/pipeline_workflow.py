"""Macro-graph topology, rewritten on Agno's own `Workflow` + `Step` primitives
(replaces `agents/graph.py`) -- still the real, existing 7-stage pipeline,
mirrored exactly (not redesigned), per the founder's explicit directive.

**Contract preserved exactly**: `run_pipeline(stage_handlers, stages=STAGES) ->
PipelineResult(completed_stages, stopped_at, stopped_reason)`. Founder-visible
checkpoints are still a hard governance line (docs/ARCHITECTURE.md §4) -- this
graph does NOT auto-advance past a stage requiring one.

**Why a plain `Workflow` of sequential steps, not `Loop`/`Condition`/`Router`**:
the original `run_pipeline` is a fixed, ordered stage list with a single
stop-early rule (first checkpoint-requiring stage halts the run) -- there is no
branching or repetition to model, so `Loop`/`Condition` would add machinery
this contract doesn't need. Each `StepOutput.stop=True` (a real Agno field,
confirmed via `inspect.signature(StepOutput.__init__)`) halts the Workflow at
that stage -- confirmed empirically in this rewrite's own test, not assumed
from docs alone.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable

from agno.workflow import Workflow
from agno.workflow.types import StepInput, StepOutput

STAGES = ["discovery", "define", "architecture", "uxflow", "implementation-planning", "build", "ship"]


@dataclass
class StageResult:
    stage: str
    requires_checkpoint: bool
    summary: str = ""


@dataclass
class PipelineResult:
    completed_stages: list[str] = field(default_factory=list)
    stopped_at: str | None = None
    stopped_reason: str = ""


StageHandler = Callable[[str], StageResult]


def run_pipeline(stage_handlers: dict[str, StageHandler], stages: list[str] = STAGES) -> PipelineResult:
    completed: list[str] = []
    outcome = {"stopped_at": None, "stopped_reason": ""}

    def make_stage_step(stage_name: str):
        def stage_step(step_input: StepInput) -> StepOutput:
            handler = stage_handlers.get(stage_name)
            if handler is None:
                outcome["stopped_at"] = stage_name
                outcome["stopped_reason"] = "no handler registered for this stage"
                return StepOutput(step_name=stage_name, content=None, stop=True)

            result = handler(stage_name)
            if result.requires_checkpoint:
                outcome["stopped_at"] = stage_name
                outcome["stopped_reason"] = result.summary
                return StepOutput(step_name=stage_name, content=result, stop=True)

            completed.append(stage_name)
            return StepOutput(step_name=stage_name, content=result, stop=False)

        return stage_step

    workflow = Workflow(name="wingman-pipeline", steps=[make_stage_step(s) for s in stages])
    workflow.run(input="")

    return PipelineResult(
        completed_stages=completed,
        stopped_at=outcome["stopped_at"],
        stopped_reason=outcome["stopped_reason"],
    )
