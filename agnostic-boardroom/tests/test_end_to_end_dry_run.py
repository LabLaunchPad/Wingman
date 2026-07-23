"""Phase 2b item 3 verification: the real `.claude/commands/ship-feature.md`
chain (memory retrieval -> skill routing -> Maker/Checker loop, respecting
the checkpoint boundary) exercised end to end.

Real memory retrieval + real routing (no mocking) with a fake `call_model`
for the loop side -- the Maker/Checker loop's own live behavior is already
separately proven with real money in test_loop_live.py; no need to re-spend
real cost re-proving that here, only proving the wiring across all three
stages is real.
"""

import pytest

from agents.model_runner import RunResult
from agents.pipeline import run_ship_feature_dry_run
from knowledge.vector_store import build_skill_knowledge
from mcp_server.memory_tools import build_memory_knowledge, store_memory
from db.connection import get_connection
from db.schema import init_schema


@pytest.fixture(scope="module")
def kb_skills():
    return build_skill_knowledge(
        lancedb_uri="/tmp/agnostic_boardroom_e2e_test_skills_lancedb",
        table_name="e2e_test_skills",
    )


@pytest.fixture
def kb_memory(tmp_path):
    conn = get_connection(tmp_path / "e2e.sqlite3")
    init_schema(conn)
    kb = build_memory_knowledge(lancedb_uri=str(tmp_path / "e2e_memory_lancedb"), table_name="e2e_memory")
    store_memory(conn, kb, "the founder decided to use pnpm for this project's package management", layer="project")
    return kb


def _accepting_model_capturing_prompts():
    seen_prompts = []

    def call_model(prompt: str) -> RunResult:
        seen_prompts.append(prompt)
        if len(seen_prompts) % 2 == 1:
            return RunResult(text="some output", total_cost_usd=0.0, session_id="s", is_error=False)
        return RunResult(
            text='{"accepted": true, "reason": "fine"}', total_cost_usd=0.0, session_id="s", is_error=False
        )

    return call_model, seen_prompts


def test_full_chain_memory_then_routing_then_loop_all_hand_off_correctly(kb_memory, kb_skills):
    call_model, seen_prompts = _accepting_model_capturing_prompts()

    result = run_ship_feature_dry_run(
        kb_memory,
        kb_skills,
        "what package manager should this new project use, and how do I set it up minimally",
        call_model=call_model,
    )

    # Memory stage: the seeded fact was actually retrieved.
    assert any("pnpm" in hit["content"] for hit in result.memory_hits)

    # Routing stage: a real skill was chosen.
    assert result.routing.skill_name
    assert result.routing.confidence in ("matched", "low_confidence_fallback")

    # Loop stage: both the memory content and the routed skill text genuinely
    # reached the Maker's actual prompt -- the real proof this is wired end
    # to end, not just returning parallel, disconnected results.
    maker_prompt = seen_prompts[0]
    assert "pnpm" in maker_prompt
    assert result.routing.skill_name in maker_prompt or result.routing.skill_text[:100] in maker_prompt
    assert result.loop.accepted
