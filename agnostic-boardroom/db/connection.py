"""SQLite connection helper with the founder-specified PRAGMAs.

One SQLite file, WAL mode -- chosen over Postgres per the founder's explicit
decision: no concurrent-writer case exists in this project's real usage (one
founder, one project, one session at a time), so a server process would be
pure operational overhead with no corresponding benefit. Runs alongside the
existing plugin's `.wingman/*.jsonl` flat files -- non-destructive, same rule
every other piece of `agnostic-boardroom/` has followed so far.

`foreign_keys` is a per-connection PRAGMA in SQLite (not persisted in the
database file itself) -- it must be re-applied on every new connection, which
is why this lives in a small helper rather than being a one-time schema
migration step.
"""

from __future__ import annotations

import sqlite3
from pathlib import Path

DEFAULT_DB_PATH = Path(__file__).parent / ".data" / "agnostic_boardroom.sqlite3"


def get_connection(path: Path | str = DEFAULT_DB_PATH) -> sqlite3.Connection:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(path))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA busy_timeout=5000")
    conn.execute("PRAGMA synchronous=NORMAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def checkpoint_wal(conn: sqlite3.Connection, mode: str = "PASSIVE") -> None:
    """Transfer committed pages from the -wal file back to the main database.

    PASSIVE (the default) never blocks and never fails -- it does whatever
    checkpointing it safely can without waiting on readers/writers, unlike
    TRUNCATE/RESTART which can block. RESTART is available for callers that
    specifically want to force a fresh WAL file (e.g. before a backup).
    """
    if mode not in ("PASSIVE", "RESTART", "FULL", "TRUNCATE"):
        raise ValueError(f"Unknown WAL checkpoint mode: {mode}")
    conn.execute(f"PRAGMA wal_checkpoint({mode})")
