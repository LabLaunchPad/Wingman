"""Phase 2 item 2 verification: WAL PRAGMAs are really set, concurrent reads
don't block a writer, and a schema-invalid payload lands in the audit trail
instead of being silently dropped or crashing the caller."""

import json
import sqlite3

import pytest

from datetime import datetime, timezone

from core.state_schema import (
    BottomLine,
    DebtLedgerEntry,
    FounderDecision,
    SeatVerdict,
    ThreatDisposition,
    ThreatRegisterEntry,
    TraceabilityLink,
    Verdict,
)
from db.connection import checkpoint_wal, get_connection
from db.repository import (
    get_checkpoint,
    get_open_threats,
    ingest_checkpoint_raw,
    insert_checkpoint,
    insert_debt,
    insert_memory,
    insert_threat,
    insert_traceability,
    list_memories,
    log_schema_deviation,
)
from db.schema import init_schema


def _sample_verdict(checkpoint_id="cp-1", bottom_line=BottomLine.GO):
    from core.state_schema import BoardroomVerdict

    return BoardroomVerdict(
        checkpoint_id=checkpoint_id,
        stage="build",
        scope_ref="docs/wingman/plans/test.md",
        seats=[SeatVerdict(seat="cto", verdict=Verdict.GO, summary="looks fine")],
        bottom_line=bottom_line,
        founder_decision=FounderDecision.SHIP_IT,
    )


@pytest.fixture
def db_path(tmp_path):
    return tmp_path / "test.sqlite3"


def test_pragmas_are_actually_set(db_path):
    conn = get_connection(db_path)
    assert conn.execute("PRAGMA journal_mode").fetchone()[0].lower() == "wal"
    assert conn.execute("PRAGMA busy_timeout").fetchone()[0] == 5000
    assert conn.execute("PRAGMA synchronous").fetchone()[0] == 1  # NORMAL
    assert conn.execute("PRAGMA foreign_keys").fetchone()[0] == 1


def test_wal_mode_lets_a_second_connection_write_without_sqlite_busy(db_path):
    """The real point of WAL: a long-held connection (simulating an in-progress
    read) must not make a second connection's write raise SQLITE_BUSY within
    the busy_timeout window."""
    conn_a = get_connection(db_path)
    init_schema(conn_a)
    # conn_a holds an open read transaction (simulating a long-running reader)
    conn_a.execute("BEGIN")
    conn_a.execute("SELECT * FROM checkpoints").fetchall()

    conn_b = get_connection(db_path)
    # This must NOT raise sqlite3.OperationalError: database is locked
    insert_checkpoint(conn_b, _sample_verdict("cp-concurrent"))

    conn_a.commit()
    assert get_checkpoint(conn_b, "cp-concurrent") is not None


def test_checkpoint_wal_checkpoint_helper_runs_without_error(db_path):
    conn = get_connection(db_path)
    init_schema(conn)
    insert_checkpoint(conn, _sample_verdict())
    checkpoint_wal(conn, mode="PASSIVE")  # must not raise


def test_checkpoint_wal_rejects_an_unknown_mode(db_path):
    """Real coverage gap found via a coverage audit: only the valid-mode path
    was ever exercised."""
    conn = get_connection(db_path)
    init_schema(conn)
    with pytest.raises(ValueError, match="Unknown WAL checkpoint mode"):
        checkpoint_wal(conn, mode="NOT_A_REAL_MODE")


def test_get_checkpoint_returns_none_for_an_unknown_id(db_path):
    conn = get_connection(db_path)
    init_schema(conn)
    assert get_checkpoint(conn, "does-not-exist") is None


def test_do_not_ship_checkpoint_round_trips_correctly(db_path):
    conn = get_connection(db_path)
    init_schema(conn)
    verdict = _sample_verdict("cp-blocked", bottom_line=BottomLine.DO_NOT_SHIP)
    insert_checkpoint(conn, verdict)
    fetched = get_checkpoint(conn, "cp-blocked")
    assert fetched is not None
    assert fetched.blocks_advancement


def test_schema_invalid_payload_lands_in_threat_register_not_dropped(db_path):
    conn = get_connection(db_path)
    init_schema(conn)
    bad_payload = {"checkpoint_id": "cp-bad", "stage": "not-a-real-stage"}  # missing required fields too

    result = ingest_checkpoint_raw(conn, bad_payload)

    assert result is None  # ingestion correctly refused
    open_threats = get_open_threats(conn)
    schema_threats = [t for t in open_threats if t.threat_id.startswith("SCHEMA-")]
    assert len(schema_threats) == 1
    assert "cp-bad" in schema_threats[0].description


def test_threat_register_disposition_filter(db_path):
    conn = get_connection(db_path)
    init_schema(conn)
    insert_threat(
        conn,
        ThreatRegisterEntry(
            threat_id="T1",
            location="x",
            trigger_condition="y",
            description="z",
            disposition=ThreatDisposition.OPEN,
        ),
    )
    insert_threat(
        conn,
        ThreatRegisterEntry(
            threat_id="T2",
            location="x",
            trigger_condition="y",
            description="z",
            disposition=ThreatDisposition.CLOSED,
        ),
    )
    open_threats = get_open_threats(conn)
    assert {t.threat_id for t in open_threats} == {"T1"}


def test_memory_insert_and_list_by_layer(db_path):
    conn = get_connection(db_path)
    init_schema(conn)
    insert_memory(conn, "project", "the founder prefers pnpm", tags=["package-manager"])
    insert_memory(conn, "session", "currently debugging the webhook retry path")

    project_rows = list_memories(conn, layer="project")
    assert len(project_rows) == 1
    assert project_rows[0]["content"] == "the founder prefers pnpm"
    assert json.loads(project_rows[0]["tags_json"]) == ["package-manager"]

    all_rows = list_memories(conn)
    assert len(all_rows) == 2


def test_memory_rejects_unknown_layer(db_path):
    conn = get_connection(db_path)
    init_schema(conn)
    with pytest.raises(ValueError):
        insert_memory(conn, "galaxy", "nonsense layer")


def test_ingest_checkpoint_raw_succeeds_and_persists_a_valid_payload(db_path):
    """Real coverage gap found via a coverage audit: only the failure
    (schema-invalid) branch of ingest_checkpoint_raw was ever tested --
    the success path (a valid payload actually gets persisted) never was."""
    conn = get_connection(db_path)
    init_schema(conn)
    raw = {
        "checkpoint_id": "cp-valid",
        "stage": "build",
        "scope_ref": "docs/wingman/plans/test.md",
        "seats": [{"seat": "cto", "verdict": "GO", "summary": "looks fine"}],
        "bottom_line": "GO",
        "founder_decision": "ship_it",
    }
    result = ingest_checkpoint_raw(conn, raw)
    assert result is not None
    assert result.checkpoint_id == "cp-valid"
    assert get_checkpoint(conn, "cp-valid") is not None


def test_insert_debt_persists_a_row(db_path):
    """Real coverage gap found via a coverage audit: insert_debt had zero
    test coverage anywhere in the suite."""
    conn = get_connection(db_path)
    init_schema(conn)
    entry = DebtLedgerEntry(
        debt_id="DEBT-1",
        location="agents/loop.py",
        ceiling_condition=">500 users",
        upgrade_path="add a real queue",
        logged_at=datetime.now(timezone.utc),
    )
    insert_debt(conn, entry)
    row = conn.execute("SELECT debt_id, status FROM debt_ledger WHERE debt_id = ?", ("DEBT-1",)).fetchone()
    assert row is not None
    assert row["status"] == "OPEN"


def test_insert_traceability_persists_a_row(db_path):
    """Real coverage gap found via a coverage audit: insert_traceability had
    zero test coverage anywhere in the suite."""
    conn = get_connection(db_path)
    init_schema(conn)
    link = TraceabilityLink(marker_id="DISC-3", prefix="DISC", source_file="commands/pipeline/discovery.md")
    insert_traceability(conn, link)
    row = conn.execute(
        "SELECT marker_id, prefix, source_file FROM traceability WHERE marker_id = ?", ("DISC-3",)
    ).fetchone()
    assert row is not None
    assert row["prefix"] == "DISC"
    assert row["source_file"] == "commands/pipeline/discovery.md"
