"""Schema for the 5 concern-tables, mirroring core/state_schema.py's Pydantic models.

Every table stores its full validated row as `payload_json` (a Pydantic
`model_dump_json()` string, re-validated with `model_validate_json()` on
read) plus a handful of indexed scalar columns pulled out for filtering.
Deliberately never `pickle` or unrestricted `msgpack` -- a real, cited risk
class (a documented LangGraph SQLite-checkpointer CVE chained SQL injection
into remote code execution via unvalidated metadata deserialization). Every
column value in every query in `repository.py` is bound as a parameter;
nothing here is ever built by string concatenation.
"""

from __future__ import annotations

import sqlite3

CREATE_STATEMENTS = [
    """
    CREATE TABLE IF NOT EXISTS memory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        layer TEXT NOT NULL CHECK (layer IN ('session', 'project', 'org')),
        content TEXT NOT NULL,
        tags_json TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL
    )
    """,
    "CREATE INDEX IF NOT EXISTS idx_memory_layer ON memory(layer)",
    """
    CREATE TABLE IF NOT EXISTS checkpoints (
        checkpoint_id TEXT PRIMARY KEY,
        bundle TEXT,
        bottom_line TEXT NOT NULL,
        next_stage TEXT,
        payload_json TEXT NOT NULL
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS threat_register (
        threat_id TEXT PRIMARY KEY,
        disposition TEXT NOT NULL CHECK (disposition IN ('OPEN', 'CLOSED')),
        accepted_by_founder INTEGER NOT NULL DEFAULT 0,
        payload_json TEXT NOT NULL
    )
    """,
    "CREATE INDEX IF NOT EXISTS idx_threat_disposition ON threat_register(disposition)",
    """
    CREATE TABLE IF NOT EXISTS debt_ledger (
        debt_id TEXT PRIMARY KEY,
        status TEXT NOT NULL CHECK (status IN ('OPEN', 'RESOLVED')),
        payload_json TEXT NOT NULL
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS traceability (
        marker_id TEXT PRIMARY KEY,
        prefix TEXT NOT NULL,
        source_file TEXT NOT NULL,
        payload_json TEXT NOT NULL
    )
    """,
]


def init_schema(conn: sqlite3.Connection) -> None:
    for statement in CREATE_STATEMENTS:
        conn.execute(statement)
    conn.commit()
