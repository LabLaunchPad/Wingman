"""Fast, zero-cost tests of the loop's control flow (iteration cap,
escalation, feedback propagation, cost summation) using an injected fake
model call -- no live inference. Real behavioral proof (does a live Checker
actually reject bad output) lives in test_loop_live.py, which costs real
money and is run deliberately, not on every test invocation.
"""

import pytest

from agents.boardroom.cto_evaluator import evaluate
from agents.loop import run_maker_checker_loop
from agents.model_runner import RunResult


def _fake_model_sequence(responses: list[RunResult]):
    """Returns a call_model callable that pops canned responses in order,
    ignoring the actual prompt content."""
    calls = list(responses)

    def _call(prompt: str) -> RunResult:
        return calls.pop(0)

    return _call


def _maker(text="some output", cost=0.10):
    return RunResult(text=text, total_cost_usd=cost, session_id="s", is_error=False)


def _checker_json(accepted: bool, reason: str, cost=0.05):
    return RunResult(
        text=f'{{"accepted": {str(accepted).lower()}, "reason": "{reason}"}}',
        total_cost_usd=cost,
        session_id="s",
        is_error=False,
    )


def test_accepts_on_first_try_costs_exactly_one_maker_one_checker_call():
    call_model = _fake_model_sequence([_maker(cost=0.10), _checker_json(True, "looks correct", cost=0.05)])
    result = run_maker_checker_loop("do the thing", call_model=call_model)

    assert result.accepted
    assert not result.escalated
    assert len(result.iterations) == 1
    assert result.total_cost_usd == pytest.approx(0.15)


def test_rejects_once_then_accepts_feeds_reason_forward():
    seen_prompts = []

    def call_model(prompt):
        seen_prompts.append(prompt)
        if len(seen_prompts) == 1:
            return _maker("attempt 1")
        if len(seen_prompts) == 2:
            return _checker_json(False, "missing edge case handling")
        if len(seen_prompts) == 3:
            return _maker("attempt 2, fixed")
        return _checker_json(True, "now correct")

    result = run_maker_checker_loop("do the thing", call_model=call_model)

    assert result.accepted
    assert len(result.iterations) == 2
    assert result.iterations[0].accepted is False
    assert result.iterations[1].accepted is True
    # The 2nd Maker prompt must genuinely include the Checker's rejection reason.
    assert "missing edge case handling" in seen_prompts[2]


def test_escalates_after_max_iterations_when_always_rejected():
    call_model = _fake_model_sequence(
        [
            _maker(), _checker_json(False, "reason 1"),
            _maker(), _checker_json(False, "reason 2"),
            _maker(), _checker_json(False, "reason 3"),
        ]
    )
    result = run_maker_checker_loop("do the thing", max_iterations=3, call_model=call_model)

    assert not result.accepted
    assert result.escalated
    assert len(result.iterations) == 3


def test_cost_is_summed_across_all_iterations_not_just_the_last():
    call_model = _fake_model_sequence(
        [
            _maker(cost=1.0), _checker_json(False, "r1", cost=0.5),
            _maker(cost=1.0), _checker_json(False, "r2", cost=0.5),
            _maker(cost=1.0), _checker_json(True, "r3", cost=0.5),
        ]
    )
    result = run_maker_checker_loop("do the thing", call_model=call_model)
    assert result.total_cost_usd == pytest.approx(4.5)


def test_checker_fails_closed_on_unparseable_response():
    call_model = lambda prompt: RunResult(
        text="I think this looks fine!", total_cost_usd=0.05, session_id="s", is_error=False
    )
    verdict = evaluate("do the thing", "some output", call_model=call_model)
    assert verdict.accepted is False
    assert "not valid JSON" in verdict.reason
