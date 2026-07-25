"""Phase 2b item 1 verification: a real MCP client talking to a real
`mcp_server/server.py` subprocess over the actual protocol -- not importing
the underlying functions directly (that's `test_memory_tools.py`'s job).

No model inference here, so no `live_model` marker and no real dollar cost --
but spawning the subprocess plus FastEmbed's model load is genuinely slow, so
the server is started once per test file (module-scoped) and every client
call is wrapped in a bounded timeout so a stuck server hangs the test suite
loudly rather than silently forever.

**A real bug found by running the full test suite, fixed here**: the server
subprocess used to always point at its default, persistent SQLite/LanceDB
store (`db/.data/agnostic_boardroom.sqlite3`, `mcp_server/.lancedb`) with no
way to isolate a test run -- every test invocation appended to the same
store on disk, forever. As it grows, top-k similarity retrieval becomes
non-deterministic: a test that passed run in isolation (fresh insert, small
store) failed when run after the rest of the suite had already added its own
entries via the same server. Fixed by pointing this test's subprocess at a
fresh temp directory via env vars `server.py` now reads
(`WINGMAN_AB_DB_PATH`, `WINGMAN_AB_MEMORY_LANCEDB_URI`,
`WINGMAN_AB_MEMORY_TABLE`), so this test's data never touches the real store
and never accumulates across runs.
"""

from __future__ import annotations

import os
import sys
import uuid
from pathlib import Path

import anyio
import pytest
from mcp import ClientSession
from mcp.client.stdio import StdioServerParameters, stdio_client

REPO_ROOT = Path(__file__).resolve().parents[1]
# Bumped from 30s: the server now also builds the 40-skill index at startup
# (route_task_tool/run_engineering_review_tool need it), which is real,
# disclosed embedding work, not instant.
CLIENT_TIMEOUT_S = 90


@pytest.fixture(scope="module")
def anyio_backend():
    return "asyncio"


@pytest.fixture(scope="module")
def isolated_server_env(tmp_path_factory):
    """A fresh, isolated DB/LanceDB location for this test file's server
    subprocess -- never the real, persistent default store (see module
    docstring for the bug this prevents)."""
    tmp_dir = tmp_path_factory.mktemp("mcp_server_live_test")
    env = dict(os.environ)
    env["WINGMAN_AB_DB_PATH"] = str(tmp_dir / "test.sqlite3")
    env["WINGMAN_AB_MEMORY_LANCEDB_URI"] = str(tmp_dir / "lancedb")
    env["WINGMAN_AB_MEMORY_TABLE"] = "test_memory"
    return env


async def _run_with_session(coro_fn, env):
    """Spins up the real server subprocess, opens a real MCP session, runs
    `coro_fn(session)` inside a bounded timeout, and tears everything down."""
    # Run as `python -m mcp_server.server`, not `python mcp_server/server.py` --
    # the latter puts mcp_server/ itself on sys.path (not the repo root),
    # which breaks `from db.connection import ...`. Module invocation with
    # cwd=REPO_ROOT is the fix, confirmed by hitting the real ModuleNotFoundError.
    params = StdioServerParameters(
        command=sys.executable, args=["-m", "mcp_server.server"], cwd=str(REPO_ROOT), env=env
    )
    with anyio.fail_after(CLIENT_TIMEOUT_S):
        async with stdio_client(params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                return await coro_fn(session)


@pytest.mark.anyio
async def test_store_then_retrieve_round_trips_over_the_real_protocol(isolated_server_env):
    marker = str(uuid.uuid4())
    content = f"integration-test memory entry {marker}: the founder prefers pnpm"

    async def _work(session: ClientSession):
        store_result = await session.call_tool(
            "store_memory_tool", {"content": content, "layer": "project"}
        )
        assert not store_result.isError

        retrieve_result = await session.call_tool(
            "retrieve_memories_tool", {"query": "what package manager does the founder prefer", "k": 5}
        )
        assert not retrieve_result.isError
        return retrieve_result

    result = await _run_with_session(_work, isolated_server_env)
    text_blocks = [block.text for block in result.content if hasattr(block, "text")]
    assert any(marker in text for text in text_blocks)


@pytest.mark.anyio
async def test_list_memories_over_the_real_protocol_includes_stored_entry(isolated_server_env):
    marker = str(uuid.uuid4())
    content = f"integration-test list entry {marker}"

    async def _work(session: ClientSession):
        await session.call_tool("store_memory_tool", {"content": content, "layer": "session"})
        return await session.call_tool("list_memories_tool", {"limit": 500})

    result = await _run_with_session(_work, isolated_server_env)
    text_blocks = [block.text for block in result.content if hasattr(block, "text")]
    assert any(marker in text for text in text_blocks)


@pytest.mark.anyio
async def test_real_tools_are_discoverable_via_list_tools(isolated_server_env):
    async def _work(session: ClientSession):
        return await session.list_tools()

    result = await _run_with_session(_work, isolated_server_env)
    tool_names = {t.name for t in result.tools}
    assert {
        "store_memory_tool",
        "retrieve_memories_tool",
        "list_memories_tool",
        "route_task_tool",
        "run_engineering_review_tool",
    } <= tool_names


@pytest.mark.anyio
async def test_route_task_tool_over_the_real_protocol_no_model_cost(isolated_server_env):
    """route_task_tool costs nothing (no model call, only vector retrieval)
    -- unlike run_engineering_review_tool, which is deliberately NOT exercised
    here since it makes real, live `claude -p` calls with real dollar cost."""

    async def _work(session: ClientSession):
        return await session.call_tool(
            "route_task_tool",
            {"task_description": "when should I skip adding error handling for a scenario that cannot happen"},
        )

    result = await _run_with_session(_work, isolated_server_env)
    assert not result.isError
    text_blocks = [block.text for block in result.content if hasattr(block, "text")]
    assert any("engineering-minimalism" in text for text in text_blocks)
