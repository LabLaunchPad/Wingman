"""Phase 2b item 1 verification: a real MCP client talking to a real
`mcp_server/server.py` subprocess over the actual protocol -- not importing
the underlying functions directly (that's `test_memory_tools.py`'s job).

No model inference here, so no `live_model` marker and no real dollar cost --
but spawning the subprocess plus FastEmbed's model load is genuinely slow, so
the server is started once per test file (module-scoped) and every client
call is wrapped in a bounded timeout so a stuck server hangs the test suite
loudly rather than silently forever.
"""

from __future__ import annotations

import sys
import uuid
from pathlib import Path

import anyio
import pytest
from mcp import ClientSession
from mcp.client.stdio import StdioServerParameters, stdio_client

REPO_ROOT = Path(__file__).resolve().parents[1]
CLIENT_TIMEOUT_S = 30


@pytest.fixture(scope="module")
def anyio_backend():
    return "asyncio"


async def _run_with_session(coro_fn):
    """Spins up the real server subprocess, opens a real MCP session, runs
    `coro_fn(session)` inside a bounded timeout, and tears everything down."""
    # Run as `python -m mcp_server.server`, not `python mcp_server/server.py` --
    # the latter puts mcp_server/ itself on sys.path (not the repo root),
    # which breaks `from db.connection import ...`. Module invocation with
    # cwd=REPO_ROOT is the fix, confirmed by hitting the real ModuleNotFoundError.
    params = StdioServerParameters(
        command=sys.executable, args=["-m", "mcp_server.server"], cwd=str(REPO_ROOT)
    )
    with anyio.fail_after(CLIENT_TIMEOUT_S):
        async with stdio_client(params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                return await coro_fn(session)


@pytest.mark.anyio
async def test_store_then_retrieve_round_trips_over_the_real_protocol():
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

    result = await _run_with_session(_work)
    text_blocks = [block.text for block in result.content if hasattr(block, "text")]
    assert any(marker in text for text in text_blocks)


@pytest.mark.anyio
async def test_list_memories_over_the_real_protocol_includes_stored_entry():
    marker = str(uuid.uuid4())
    content = f"integration-test list entry {marker}"

    async def _work(session: ClientSession):
        await session.call_tool("store_memory_tool", {"content": content, "layer": "session"})
        return await session.call_tool("list_memories_tool", {"limit": 500})

    result = await _run_with_session(_work)
    text_blocks = [block.text for block in result.content if hasattr(block, "text")]
    assert any(marker in text for text in text_blocks)


@pytest.mark.anyio
async def test_real_tools_are_discoverable_via_list_tools():
    async def _work(session: ClientSession):
        return await session.list_tools()

    result = await _run_with_session(_work)
    tool_names = {t.name for t in result.tools}
    assert {"store_memory_tool", "retrieve_memories_tool", "list_memories_tool"} <= tool_names
