"""Parameterized CRUD over the 5 concern tables.

Every query uses `?` placeholders -- never string-concatenated SQL, even for
column names that are hardcoded constants in this file. Every write and read
round-trips through the exact Pydantic models in `core/state_schema.py`:
`model_dump_json()` before insert, `model_validate_json()` after select. A
payload that fails validation on ingest is never silently dropped and never
crashes the caller -- it lands in `threat_register` via
`log_schema_deviation`, giving an auditable trail of anomalous data, the same
audit-log discipline `.wingman/checkpoints.jsonl` already applies to the
existing plugin.
"""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from typing import Any

from pydantic import ValidationError

from core.state_schema import (
    BoardroomVerdict,
    DebtLedgerEntry,
    ThreatDisposition,
    ThreatRegisterEntry,
    TraceabilityLink,
)


# --- checkpoints -----------------------------------------------------------

def insert_checkpoint(conn: sqlite3.Connection, verdict: BoardroomVerdict) -> None:
    conn.execute(
        "INSERT OR REPLACE INTO checkpoints (checkpoint_id, bundle, bottom_line, next_stage, payload_json) "
        "VALUES (?, ?, ?, ?, ?)",
        (
            verdict.checkpoint_id,
            verdict.bundle,
            verdict.bottom_line.value,
            verdict.next_stage,
            verdict.model_dump_json(),
        ),
    )
    conn.commit()


def get_checkpoint(conn: sqlite3.Connection, checkpoint_id: str) -> BoardroomVerdict | None:
    row = conn.execute(
        "SELECT payload_json FROM checkpoints WHERE checkpoint_id = ?", (checkpoint_id,)
    ).fetchone()
    if row is None:
        return None
    return BoardroomVerdict.model_validate_json(row["payload_json"])


# --- threat register ---------------------------------------------------

def insert_threat(conn: sqlite3.Connection, entry: ThreatRegisterEntry) -> None:
    conn.execute(
        "INSERT OR REPLACE INTO threat_register (threat_id, disposition, accepted_by_founder, payload_json) "
        "VALUES (?, ?, ?, ?)",
        (
            entry.threat_id,
            entry.disposition.value,
            int(entry.accepted_by_founder),
            entry.model_dump_json(),
        ),
    )
    conn.commit()


def get_open_threats(conn: sqlite3.Connection) -> list[ThreatRegisterEntry]:
    rows = conn.execute(
        "SELECT payload_json FROM threat_register WHERE disposition = ?",
        (ThreatDisposition.OPEN.value,),
    ).fetchall()
    return [ThreatRegisterEntry.model_validate_json(r["payload_json"]) for r in rows]


def log_schema_deviation(conn: sqlite3.Connection, raw_payload: Any, reason: str) -> str:
    """Records a payload that failed Pydantic validation on ingest as its own
    threat-register row, rather than silently dropping or crashing on it."""
    threat_id = f"SCHEMA-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%f')}"
    entry = ThreatRegisterEntry(
        threat_id=threat_id,
        location="db.repository.ingest",
        trigger_condition="payload failed Pydantic validation on ingest",
        description=f"{reason}: {json.dumps(raw_payload, default=str)[:2000]}",
        disposition=ThreatDisposition.OPEN,
    )
    insert_threat(conn, entry)
    return threat_id


def ingest_checkpoint_raw(conn: sqlite3.Connection, raw: dict) -> BoardroomVerdict | None:
    """Validates untrusted/external raw data before it ever reaches insert_checkpoint.

    Returns the validated model on success, or None (after logging the
    deviation) on failure -- callers must check for None rather than assume
    ingestion always succeeds.
    """
    try:
        verdict = BoardroomVerdict.model_validate(raw)
    except ValidationError as e:
        log_schema_deviation(conn, raw, str(e))
        return None
    insert_checkpoint(conn, verdict)
    return verdict


# --- debt ledger ---------------------------------------------------------

def insert_debt(conn: sqlite3.Connection, entry: DebtLedgerEntry) -> None:
    conn.execute(
        "INSERT OR REPLACE INTO debt_ledger (debt_id, status, payload_json) VALUES (?, ?, ?)",
        (entry.debt_id, entry.status.value, entry.model_dump_json()),
    )
    conn.commit()


# --- traceability ---------------------------------------------------------

def insert_traceability(conn: sqlite3.Connection, link: TraceabilityLink) -> None:
    conn.execute(
        "INSERT OR REPLACE INTO traceability (marker_id, prefix, source_file, payload_json) "
        "VALUES (?, ?, ?, ?)",
        (link.marker_id, link.prefix, link.source_file, link.model_dump_json()),
    )
    conn.commit()


# --- memory ----------------------------------------------------------------

def insert_memory(conn: sqlite3.Connection, layer: str, content: str, tags: list[str] | None = None) -> int:
    if layer not in ("session", "project", "org"):
        raise ValueError(f"Unknown memory layer: {layer}")
    cursor = conn.execute(
        "INSERT INTO memory (layer, content, tags_json, created_at) VALUES (?, ?, ?, ?)",
        (layer, content, json.dumps(tags or []), datetime.now(timezone.utc).isoformat()),
    )
    conn.commit()
    return cursor.lastrowid


def list_memories(conn: sqlite3.Connection, layer: str | None = None) -> list[sqlite3.Row]:
    if layer is not None:
        return conn.execute(
            "SELECT * FROM memory WHERE layer = ? ORDER BY id DESC", (layer,)
        ).fetchall()
    return conn.execute("SELECT * FROM memory ORDER BY id DESC").fetchall()
