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

from agents.boardroom_engine import run_engineering_review, to_boardroom_verdict
from db.connection import get_connection
from db.schema import init_schema
from knowledge.skill_router import route_task
from knowledge.vector_store import build_skill_knowledge
from mcp_server.memory_tools import build_memory_knowledge, list_memories, retrieve_memories, store_memory

mcp = FastMCP("wingman-memory")

_conn = get_connection()
init_schema(_conn)
_kb = build_memory_knowledge()
# Building the 40-skill index takes real time (real embedding, not
# instant) -- a disclosed startup cost, same one test_skill_router.py's
# own module-scoped fixture pays once per test session.
_kb_skills = build_skill_knowledge()


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


@mcp.tool()
def route_task_tool(task_description: str) -> dict:
    """Routes a task description to the single best-matching Wingman skill.

    Returns skill_name, skill_text (the full SKILL.md content), confidence
    ('matched' or 'low_confidence_fallback'), and best_similarity.
    """
    routed = route_task(_kb_skills, task_description)
    return {
        "skill_name": routed.skill_name,
        "skill_text": routed.skill_text,
        "confidence": routed.confidence,
        "best_similarity": routed.best_similarity,
    }


@mcp.tool()
def run_engineering_review_tool(task_description: str, scope_ref: str, max_iterations: int = 3) -> dict:
    """Runs the real, live Maker/Checker engineering review for a task and
    returns a BoardroomVerdict-shaped result (same schema as a real
    `.wingman/checkpoints.jsonl` entry) -- a single technical (CTO) seat's
    verdict, not a full 8-seat Boardroom review (see
    agents/boardroom_engine.py's module docstring for the honest scope).

    WARNING: this makes real, live `claude -p` calls (up to 2x
    max_iterations of them) and costs real, non-trivial money per call
    (confirmed ~$0.26 for a single trivial reply) -- this is not a
    zero-cost/mocked tool.
    """
    review = run_engineering_review(_kb_skills, _kb, task_description, scope_ref=scope_ref, max_iterations=max_iterations)
    verdict = to_boardroom_verdict(review, scope_ref=scope_ref)
    return verdict.model_dump()


if __name__ == "__main__":
    mcp.run(transport="stdio")
