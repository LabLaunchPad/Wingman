"""Real coverage gap found via a coverage audit: `vector_store.py`'s 2
`FileNotFoundError` paths were never exercised anywhere else in the suite.
Both raise before any embedding happens, so these are fast, zero-cost tests
-- no FastEmbed model load involved."""

import pytest

from knowledge.vector_store import build_skill_knowledge, load_full_skill_text


def test_build_skill_knowledge_raises_on_a_nonexistent_skills_dir(tmp_path):
    missing_dir = tmp_path / "does_not_exist"
    with pytest.raises(FileNotFoundError, match="No skills directory found"):
        build_skill_knowledge(
            lancedb_uri=str(tmp_path / "lancedb"), table_name="t", skills_dir=missing_dir
        )


def test_load_full_skill_text_raises_on_an_unknown_skill_name(tmp_path):
    with pytest.raises(FileNotFoundError, match="No SKILL.md for"):
        load_full_skill_text("not-a-real-skill", skills_dir=tmp_path)
