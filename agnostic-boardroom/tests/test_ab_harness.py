"""Phase 2a verification: the A/B harness runs against real skill files and
produces the honest, mechanically-verifiable comparison it claims to.

Slower than the Phase 1 schema tests (real embedding model, real vector
search) -- this is deliberate integration coverage, not a mock.
"""

import json

import pytest

from core.state_schema import ContextVariant
from knowledge.ab_harness import DEFAULT_LOG_PATH, count_tokens, run_ab_test
from knowledge.vector_store import SKILLS_DIR, build_skill_knowledge


@pytest.fixture(scope="module")
def kb():
    return build_skill_knowledge(
        lancedb_uri="/tmp/agnostic_boardroom_test_lancedb",
        table_name="test_skills",
    )


def test_skills_dir_resolves_to_real_plugin_skills():
    """Sanity check the path math before trusting anything built on it."""
    assert SKILLS_DIR.exists()
    assert (SKILLS_DIR / "engineering-minimalism" / "SKILL.md").exists()


def test_retrieved_context_uses_meaningfully_fewer_tokens_than_full_context(kb):
    results = run_ab_test(
        skill_name="engineering-minimalism",
        query="when should I add error handling for a scenario that cannot happen",
        kb=kb,
        k=2,
    )
    by_variant = {r.variant: r for r in results}
    full = by_variant[ContextVariant.FULL_CONTEXT]
    retrieved = by_variant[ContextVariant.RETRIEVED_CONTEXT]

    assert full.token_count == count_tokens(full.context_text)
    assert retrieved.token_count == count_tokens(retrieved.context_text)
    # The real, honest claim this A/B test can make: retrieval materially
    # reduces token count. It does NOT claim decision quality is preserved --
    # that needs a live model call (Phase 3).
    assert retrieved.token_count < full.token_count
    assert full.retrieval_latency_ms is None
    assert retrieved.retrieval_latency_ms is not None and retrieved.retrieval_latency_ms >= 0


def test_results_are_appended_to_the_jsonl_log(kb, tmp_path):
    log_path = tmp_path / "ab_results.jsonl"
    run_ab_test(
        skill_name="engineering-minimalism",
        query="test query for logging",
        kb=kb,
        k=1,
        log_path=log_path,
    )
    lines = log_path.read_text().strip().split("\n")
    assert len(lines) == 2  # one row per variant
    row = json.loads(lines[0])
    assert row["skill_name"] == "engineering-minimalism"
    assert "run_id" in row and "token_count" in row


def test_retrieved_context_is_actually_relevant_to_the_query(kb):
    """A cheap, honest proxy for retrieval quality without needing a live
    model call: the retrieved text should contain query-relevant vocabulary,
    not be unrelated boilerplate from the skill file."""
    results = run_ab_test(
        skill_name="engineering-minimalism",
        query="error handling for a scenario that cannot happen",
        kb=kb,
        k=2,
    )
    retrieved = next(r for r in results if r.variant == ContextVariant.RETRIEVED_CONTEXT)
    lowered = retrieved.context_text.lower()
    assert any(term in lowered for term in ["error", "validat", "minimal", "cut", "yagni"])
