"""Memory MCP server -- a thin FastMCP wrapper over memory_tools.py's pure functions.

Stdio transport, matching Claude Code's native MCP client. This file has
almost no logic of its own on purpose: the pure functions in
`memory_tools.py` are independently tested without any MCP client involved
(see tests/test_memory_mcp.py) -- this module's only job is exposing them as
typed MCP tools.
"""

from __future__ import annotations

import logging

# Real bug found via a live MCP client test: Agno's own INFO logging (e.g.
# "Creating table: ...", "Adding content from ...") writes to stdout by
# default, which corrupts the stdio transport's JSON-RPC framing -- stdout
# must carry protocol messages only. Disabling below CRITICAL process-wide
# is the standard fix for a stdio MCP server pulling in a chatty dependency;
# confirmed necessary and sufficient by re-running the client test after.
logging.disable(logging.WARNING)

from mcp.server.fastmcp import FastMCP

from db.connection import get_connection
from db.schema import init_schema
from mcp_server.memory_tools import build_memory_knowledge, list_memories, retrieve_memories, store_memory

mcp = FastMCP("wingman-memory")

_conn = get_connection()
init_schema(_conn)
_kb = build_memory_knowledge()


@mcp.tool()
def store_memory_tool(content: str, layer: str, tags: list[str] | None = None) -> dict:
    """Persist a fact, decision, or corrected assumption to durable memory.

    layer: one of 'session' (ephemeral, this conversation only),
    'project' (durable, this project), or 'org' (shared across projects).
    """
    return store_memory(_conn, _kb, content=content, layer=layer, tags=tags)


@mcp.tool()
def retrieve_memories_tool(query: str, layer_filter: list[str] | None = None, k: int = 5) -> list[dict]:
    """Semantically search stored memory for content relevant to `query`."""
    return retrieve_memories(_kb, query=query, layer_filter=layer_filter, k=k)


@mcp.tool()
def list_memories_tool(tags: list[str] | None = None, limit: int = 50, offset: int = 0) -> list[dict]:
    """List stored memory entries, newest first, optionally filtered by tags."""
    return list_memories(_conn, tags=tags, limit=limit, offset=offset)


if __name__ == "__main__":
    mcp.run(transport="stdio")
