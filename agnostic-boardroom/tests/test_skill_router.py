"""Phase 2 item 4 verification: cross-skill routing against the real,
already-built 40-skill index."""

import pytest

from knowledge.skill_router import route_task
from knowledge.vector_store import build_skill_knowledge


@pytest.fixture(scope="module")
def kb():
    return build_skill_knowledge(
        lancedb_uri="/tmp/agnostic_boardroom_router_test_lancedb",
        table_name="router_test_skills",
    )


def test_routes_a_clear_task_to_the_matching_skill_with_confidence(kb):
    routed = route_task(kb, "how do I write a minimal reproduction before fixing a bug")
    assert routed.confidence == "matched"
    assert routed.best_similarity >= 0.5
    assert routed.skill_text  # full skill text loaded, not a chunk fragment


def test_nonsense_query_falls_back_but_still_returns_a_skill(kb):
    routed = route_task(kb, "purple elephant quantum banana spreadsheet")
    assert routed.confidence == "low_confidence_fallback"
    assert routed.skill_name  # still returns something usable, doesn't raise
    assert routed.skill_text


def test_engineering_minimalism_query_routes_correctly(kb):
    routed = route_task(kb, "when should I skip adding error handling for a scenario that cannot happen")
    assert routed.skill_name == "engineering-minimalism"
    assert routed.confidence == "matched"
