"""Phase 2 item 3 verification: memory_tools.py's pure functions, independent
of any MCP client."""

import time

import pytest

from db.connection import get_connection
from db.schema import init_schema
from mcp_server.memory_tools import (
    build_memory_knowledge,
    list_memories,
    retrieve_memories,
    store_memory,
)


@pytest.fixture
def conn(tmp_path):
    c = get_connection(tmp_path / "memory_test.sqlite3")
    init_schema(c)
    return c


@pytest.fixture
def kb(tmp_path):
    return build_memory_knowledge(
        lancedb_uri=str(tmp_path / "memory_lancedb"), table_name="test_memory"
    )


def test_store_then_retrieve_round_trip(conn, kb):
    store_memory(conn, kb, "the founder prefers pnpm over npm for new projects", layer="project")
    results = retrieve_memories(kb, "what package manager should I use", k=3)
    assert any("pnpm" in r["content"] for r in results)


def test_store_rejects_unknown_layer(conn, kb):
    with pytest.raises(ValueError):
        store_memory(conn, kb, "nonsense", layer="galaxy")


def test_retrieve_respects_layer_filter(conn, kb):
    store_memory(conn, kb, "session note: currently debugging webhook retries", layer="session")
    store_memory(conn, kb, "project decision: use pnpm for package management", layer="project")

    project_only = retrieve_memories(kb, "package manager decision", layer_filter=["project"], k=5)
    assert all(r["layer"] == "project" for r in project_only)
    assert len(project_only) >= 1


def test_list_memories_newest_first_and_tag_filtered(conn, kb):
    store_memory(conn, kb, "fact A", layer="project", tags=["stack"])
    store_memory(conn, kb, "fact B", layer="project", tags=["preferences"])

    all_entries = list_memories(conn)
    assert [e["content"] for e in all_entries] == ["fact B", "fact A"]  # newest first

    tagged = list_memories(conn, tags=["preferences"])
    assert len(tagged) == 1
    assert tagged[0]["content"] == "fact B"


def test_500_entry_stress_scoped_to_founders_own_bar(conn, kb):
    """The founder's own stated stress-test bar: 500 entries, sub-100ms reads,
    rapid sequential read/write with no corruption -- NOT a concurrency/load
    test, since no concurrent-writer case exists in this project's real usage."""
    for i in range(500):
        store_memory(conn, kb, f"synthetic memory entry number {i}", layer="project")

    all_entries = list_memories(conn, limit=500)
    assert len(all_entries) == 500

    read_times = []
    for i in range(20):
        start = time.perf_counter()
        list_memories(conn, limit=50)
        read_times.append((time.perf_counter() - start) * 1000)

    p95 = sorted(read_times)[int(len(read_times) * 0.95)]
    assert p95 < 100, f"p95 read latency {p95:.2f}ms exceeded the 100ms bar"
