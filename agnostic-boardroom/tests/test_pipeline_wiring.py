"""Phase 2b item 2 verification: route_task()'s output genuinely reaches
run_maker_checker_loop()'s context -- not just structurally present fields,
but the routed skill's real text actually appearing in what the Maker's
prompt received.

Real routing (the real 40-skill index, no mocking) + a fake `call_model` for
the loop side (reusing test_loop_mocked.py's pattern) -- keeps this fast and
free while still proving the wiring is real.
"""

import pytest

from agents.model_runner import RunResult
from agents.pipeline import run_task_with_routing
from knowledge.vector_store import build_skill_knowledge


@pytest.fixture(scope="module")
def kb():
    return build_skill_knowledge(
        lancedb_uri="/tmp/agnostic_boardroom_wiring_test_lancedb",
        table_name="wiring_test_skills",
    )


def _recording_accepting_model():
    seen_prompts = []

    def call_model(prompt: str) -> RunResult:
        seen_prompts.append(prompt)
        # First call is the Maker; second is the Checker. Accept immediately
        # to keep this a single-iteration, zero-cost, deterministic test.
        if len(seen_prompts) % 2 == 1:
            return RunResult(text="some output", total_cost_usd=0.0, session_id="s", is_error=False)
        return RunResult(
            text='{"accepted": true, "reason": "fine"}', total_cost_usd=0.0, session_id="s", is_error=False
        )

    return call_model, seen_prompts


def test_routed_skill_text_genuinely_reaches_the_makers_prompt(kb):
    call_model, seen_prompts = _recording_accepting_model()
    result = run_task_with_routing(
        kb, "when should I skip adding error handling for a scenario that cannot happen", call_model=call_model
    )

    assert result.routing.skill_name == "engineering-minimalism"
    assert result.routing.confidence == "matched"
    # The real proof of wiring: the routed skill's actual text is what the
    # Maker's prompt received verbatim, not just present on the result object.
    maker_prompt = seen_prompts[0]
    assert result.routing.skill_text[:200] in maker_prompt
    assert result.loop.accepted


def test_low_confidence_result_is_surfaced_not_swallowed(kb):
    call_model, _ = _recording_accepting_model()
    result = run_task_with_routing(kb, "purple elephant quantum banana spreadsheet", call_model=call_model)

    assert result.routing.confidence == "low_confidence_fallback"
    # Still returns something usable -- the caller can see the low-confidence
    # flag and decide what to do, rather than the loop running blind.
    assert result.routing.skill_text
