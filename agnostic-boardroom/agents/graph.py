"""Macro-graph topology: the real, existing 7-stage pipeline, mirrored
exactly (not redesigned) per the founder's explicit directive -- this serves
as an apples-to-apples control group against the old plugin's own pipeline
shape, not a chance to reinvent the stages.

This is a thin orchestration layer over `agents.loop.run_maker_checker_loop`
-- it does not call any model itself, so its own tests need no live
inference; the loop's own live behavior is proven separately in
tests/test_loop_live.py.

Founder-visible checkpoints are a hard governance line this project has held
since v1 (see docs/ARCHITECTURE.md §4) -- this graph does NOT auto-advance
past a stage. `run_pipeline` stops and returns as soon as one stage's handler
reports it needs a founder decision (`requires_checkpoint=True`), exactly
matching the existing plugin's per-stage checkpoint gate.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable

# The real 7 stages, in the real order, per docs/ARCHITECTURE.md §4b.
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
    """Runs each stage's handler in the real pipeline order.

    Stops (does not auto-advance) the moment a handler reports
    `requires_checkpoint=True` -- the founder must act before the next stage
    runs. A stage with no registered handler is treated the same way: stop
    and report, never silently skip.
    """
    completed: list[str] = []
    for stage in stages:
        handler = stage_handlers.get(stage)
        if handler is None:
            return PipelineResult(
                completed_stages=completed, stopped_at=stage, stopped_reason="no handler registered for this stage"
            )
        result = handler(stage)
        if result.requires_checkpoint:
            return PipelineResult(completed_stages=completed, stopped_at=stage, stopped_reason=result.summary)
        completed.append(stage)

    return PipelineResult(completed_stages=completed, stopped_at=None, stopped_reason="")
