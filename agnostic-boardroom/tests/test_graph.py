"""Phase 2 item 6 verification: the graph never auto-advances past a stage
that requires a founder checkpoint, and mirrors the real 7-stage order."""

from agents.graph import STAGES, StageResult, run_pipeline


def test_stages_match_the_real_pipeline_order_exactly():
    assert STAGES == [
        "discovery",
        "define",
        "architecture",
        "uxflow",
        "implementation-planning",
        "build",
        "ship",
    ]


def test_pipeline_runs_all_stages_when_none_require_a_checkpoint():
    handlers = {stage: (lambda s: StageResult(stage=s, requires_checkpoint=False)) for stage in STAGES}
    result = run_pipeline(handlers)
    assert result.completed_stages == STAGES
    assert result.stopped_at is None


def test_pipeline_stops_at_the_first_stage_requiring_a_founder_checkpoint():
    def build_requires_checkpoint(stage):
        if stage == "build":
            return StageResult(stage=stage, requires_checkpoint=True, summary="DoD gate not yet passed")
        return StageResult(stage=stage, requires_checkpoint=False)

    handlers = {stage: build_requires_checkpoint for stage in STAGES}
    result = run_pipeline(handlers)

    assert result.completed_stages == ["discovery", "define", "architecture", "uxflow", "implementation-planning"]
    assert result.stopped_at == "build"
    assert "DoD gate" in result.stopped_reason
    # "ship" must never run -- the pipeline does not auto-advance past build.
    assert "ship" not in result.completed_stages


def test_missing_handler_stops_rather_than_silently_skipping():
    handlers = {"discovery": lambda s: StageResult(stage=s, requires_checkpoint=False)}
    result = run_pipeline(handlers)
    assert result.completed_stages == ["discovery"]
    assert result.stopped_at == "define"
