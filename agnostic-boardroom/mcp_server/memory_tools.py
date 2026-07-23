"""Memory MCP tool logic (store_memory / retrieve_memories / list_memories).

Scope is deliberately narrow, per the founder's explicit decision: this is a
structured store for the same content class the existing plugin's
`.wingman/memory/*.md` already holds (evergreen facts, decisions, tried
approaches) -- not raw checkpoints, not turn-by-turn conversation history,
not cross-project data speculatively invented. "Multi-layered" means a
3-tier taxonomy (`session`/`project`/`org`), not a new memory *category*.

Kept infrastructurally separate from `knowledge/vector_store.py`'s skill
index -- same embedder (FastEmbed, reused, not duplicated), a different
LanceDB table -- because skill-routing is a dispatch problem and memory
retrieval is a state-management problem; merging them was explicitly
rejected by the founder.

These are plain functions, independently testable without an MCP client in
the loop -- `server.py` is a thin FastMCP wrapper around them.
"""

from __future__ import annotations

import sqlite3
from pathlib import Path

from agno.knowledge.embedder.fastembed import FastEmbedEmbedder
from agno.knowledge.knowledge import Knowledge
from agno.vectordb.lancedb import LanceDb

from db.repository import insert_memory, list_memories as _list_memories_rows

DEFAULT_MEMORY_LANCEDB_URI = str(Path(__file__).parent / ".lancedb")
DEFAULT_MEMORY_TABLE_NAME = "wingman_memory"

VALID_LAYERS = ("session", "project", "org")


def build_memory_knowledge(
    lancedb_uri: str = DEFAULT_MEMORY_LANCEDB_URI,
    table_name: str = DEFAULT_MEMORY_TABLE_NAME,
) -> Knowledge:
    vector_db = LanceDb(uri=lancedb_uri, table_name=table_name, embedder=FastEmbedEmbedder())
    return Knowledge(vector_db=vector_db)


def store_memory(
    conn: sqlite3.Connection,
    kb: Knowledge,
    content: str,
    layer: str,
    tags: list[str] | None = None,
) -> dict:
    if layer not in VALID_LAYERS:
        raise ValueError(f"Unknown memory layer: {layer!r}, must be one of {VALID_LAYERS}")
    row_id = insert_memory(conn, layer=layer, content=content, tags=tags)
    kb.add_content(
        name=f"memory-{row_id}",
        text_content=content,
        metadata={"layer": layer, "tags": ",".join(tags or [])},
    )
    return {"id": row_id, "layer": layer, "content": content, "tags": tags or []}


def retrieve_memories(
    kb: Knowledge,
    query: str,
    layer_filter: list[str] | None = None,
    k: int = 5,
) -> list[dict]:
    # Over-fetch before filtering, since layer filtering happens post-search
    # (kept simple/robust over relying on the vector store's own metadata
    # filter API, which this project hasn't needed to depend on elsewhere).
    fetch_k = k * 4 if layer_filter else k
    results = kb.search(query, max_results=fetch_k)
    out = []
    for r in results:
        layer = r.meta_data.get("layer") if r.meta_data else None
        if layer_filter and layer not in layer_filter:
            continue
        tags = r.meta_data.get("tags", "") if r.meta_data else ""
        out.append({"content": r.content, "layer": layer, "tags": tags.split(",") if tags else []})
        if len(out) >= k:
            break
    return out


def list_memories(
    conn: sqlite3.Connection,
    tags: list[str] | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[dict]:
    rows = _list_memories_rows(conn)  # layer=None -> all layers, newest first
    out = []
    for row in rows:
        row_tags = row["tags_json"]
        import json

        parsed_tags = json.loads(row_tags)
        if tags and not set(tags) & set(parsed_tags):
            continue
        out.append(
            {
                "id": row["id"],
                "layer": row["layer"],
                "content": row["content"],
                "tags": parsed_tags,
                "created_at": row["created_at"],
            }
        )
    return out[offset : offset + limit]
