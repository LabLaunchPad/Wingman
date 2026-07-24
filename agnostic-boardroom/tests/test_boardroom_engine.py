"""Verifies `agents/boardroom_engine.py` -- the composed engineering-review
engine wired in as a real (honestly-scoped) technical-seat replacement.
Real routing (the full 40-skill index) + real memory retrieval (a small,
seeded memory store) + a mocked, zero-cost `call_model` for the loop side,
same discipline as `test_pipeline_wiring.py`.
"""

import pytest

from agents.boardroom_engine import run_engineering_review, to_boardroom_verdict
from agents.model_runner import RunResult
from core.state_schema import BottomLine, FounderDecision, Verdict
from db.connection import get_connection
from db.schema import init_schema
from knowledge.vector_store import build_skill_knowledge
from mcp_server.memory_tools import build_memory_knowledge, store_memory


@pytest.fixture(scope="module")
def kb_skills():
    return build_skill_knowledge(
        lancedb_uri="/tmp/agnostic_boardroom_engine_test_skills_lancedb",
        table_name="engine_test_skills",
    )


@pytest.fixture(scope="module")
def kb_memory():
    kb = build_memory_knowledge(
        lancedb_uri="/tmp/agnostic_boardroom_engine_test_memory_lancedb",
        table_name="engine_test_memory",
    )
    conn = get_connection(":memory:")
    init_schema(conn)
    store_memory(conn, kb, content="The team decided error handling for unreachable states is intentionally omitted.", layer="project")
    return kb


def _accepting_model():
    seen = []

    def call_model(prompt: str) -> RunResult:
        seen.append(prompt)
        if len(seen) % 2 == 1:
            return RunResult(text="def f(): pass", total_cost_usd=0.05, session_id="s", is_error=False)
        return RunResult(text='{"accepted": true, "reason": "fine"}', total_cost_usd=0.02, session_id="s", is_error=False)

    return call_model


def _always_rejecting_model():
    def call_model(prompt: str) -> RunResult:
        return RunResult(text='{"accepted": false, "reason": "still wrong"}', total_cost_usd=0.02, session_id="s", is_error=False)

    return call_model


def test_accepted_matched_route_produces_a_clean_go_verdict(kb_skills, kb_memory):
    review = run_engineering_review(
        kb_skills,
        kb_memory,
        "when should I skip adding error handling for a scenario that cannot happen",
        scope_ref="test-scope",
        call_model=_accepting_model(),
    )
    assert review.loop.accepted
    assert review.routing.confidence == "matched"

    verdict = to_boardroom_verdict(review, scope_ref="test-scope")
    assert len(verdict.seats) == 1
    assert verdict.seats[0].seat == "cto"
    assert verdict.seats[0].verdict == Verdict.GO
    assert verdict.bottom_line == BottomLine.GO
    assert verdict.founder_decision == FounderDecision.STILL_REVIEWING
    assert not verdict.blocks_advancement


def test_accepted_low_confidence_route_downgrades_to_go_with_concerns(kb_skills, kb_memory):
    review = run_engineering_review(
        kb_skills, kb_memory, "purple elephant quantum banana spreadsheet", scope_ref="test-scope", call_model=_accepting_model()
    )
    assert review.loop.accepted
    assert review.routing.confidence == "low_confidence_fallback"

    verdict = to_boardroom_verdict(review, scope_ref="test-scope")
    assert verdict.seats[0].verdict == Verdict.GO_WITH_CONCERNS
    assert verdict.bottom_line == BottomLine.GO_WITH_CHANGES
    assert not verdict.blocks_advancement


def test_escalated_loop_produces_a_blocking_no_go_verdict(kb_skills, kb_memory):
    review = run_engineering_review(
        kb_skills,
        kb_memory,
        "when should I skip adding error handling for a scenario that cannot happen",
        scope_ref="test-scope",
        max_iterations=2,
        call_model=_always_rejecting_model(),
    )
    assert review.loop.escalated
    assert not review.loop.accepted

    verdict = to_boardroom_verdict(review, scope_ref="test-scope")
    assert verdict.seats[0].verdict == Verdict.NO_GO
    assert verdict.bottom_line == BottomLine.DO_NOT_SHIP
    assert verdict.blocks_advancement  # the real gate rule: any NO_GO blocks


def test_seeded_memory_fact_is_retrieved_and_reaches_the_review(kb_skills, kb_memory):
    review = run_engineering_review(
        kb_skills,
        kb_memory,
        "should this function handle an error case that can never actually occur",
        scope_ref="test-scope",
        call_model=_accepting_model(),
    )
    assert any("unreachable states" in hit["content"] for hit in review.memory_hits)
