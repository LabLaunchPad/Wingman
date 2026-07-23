"""Pydantic state schema for the Agnostic Boardroom backend (Phase 1).

Faithfully models the real, already-shipped data shapes documented in
`docs/DATABASE.md` and `plugins/wingman/references/threat-register.md` — this
is a typed port of an existing, working format, not a speculative new schema.
Field names and enums are chosen to match those docs directly, so a future
migration importer (flat files -> this schema) has nothing to reconcile.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


class Verdict(str, Enum):
    """A single Boardroom seat's verdict on a checkpoint."""

    GO = "GO"
    GO_WITH_CONCERNS = "GO_WITH_CONCERNS"
    NO_GO = "NO_GO"


class BottomLine(str, Enum):
    """The consolidated result across all seats for one checkpoint."""

    GO = "GO"
    GO_WITH_CHANGES = "GO_WITH_CHANGES"
    DO_NOT_SHIP = "DO NOT SHIP"


class FounderDecision(str, Enum):
    SHIP_IT = "ship_it"
    FIX_CONCERNS_FIRST = "fix_concerns_first"
    STILL_REVIEWING = "still_reviewing"


Seat = Literal["ceo", "cpo", "cmo", "cto", "ciso", "cfo", "research", "design"]

Bundle = Literal["planning-milestone", "build", "ship"]

Stage = Literal[
    "discovery",
    "define",
    "architecture",
    "uxflow",
    "implementation-planning",
    "build",
    "ship",
]


class SeatVerdict(BaseModel):
    """One Boardroom seat's verdict within a checkpoint — `checkpoints.jsonl`'s `seats[]`."""

    seat: Seat
    verdict: Verdict
    summary: str


class BoardroomVerdict(BaseModel):
    """One row of `.wingman/checkpoints.jsonl` — an append-only audit-log entry.

    `schema_version` starts at 4 here (the current shape); this model does not
    attempt to represent the historical schema_version 1-3 variants documented
    in DATABASE.md's migration notes — a real importer reading old flat-file
    data needs its own version-aware parser, not this model.
    """

    schema_version: Literal[4] = 4
    checkpoint_id: str
    stage: Stage | list[Stage]
    bundle: Bundle | None = None
    scope_ref: str
    seats: list[SeatVerdict]
    bottom_line: BottomLine
    founder_decision: FounderDecision
    founder_notes: str = ""
    next_stage: Stage | None = None
    details_ref: str | None = None

    @property
    def blocks_advancement(self) -> bool:
        """Mirrors the Boardroom gate rule: any NO_GO blocks (docs/ARCHITECTURE.md).

        This rule is a documented, deliberate decision (see docs/PROJECT.md's
        decisions log entry declining a "configurable strictness" proposal) —
        not a parameter this schema exposes as tunable.
        """
        return self.bottom_line == BottomLine.DO_NOT_SHIP


class ThreatDisposition(str, Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"


class ThreatRegisterEntry(BaseModel):
    """One row of the security-checklist threat register.

    Matches `plugins/wingman/references/threat-register.md`'s disposition
    model: every registered risk is CLOSED (fixed + evidence, or founder-
    accepted) or OPEN; a stage may not advance while any entry is OPEN.
    """

    threat_id: str
    location: str
    trigger_condition: str
    description: str
    disposition: ThreatDisposition
    evidence_ref: str | None = None  # PR/commit + regression test, when CLOSED
    accepted_by_founder: bool = False


class DebtStatus(str, Enum):
    OPEN = "OPEN"
    RESOLVED = "RESOLVED"


class DebtLedgerEntry(BaseModel):
    """One row of DEBT.md, per `commands/adaptive/debt-ledger.md`."""

    debt_id: str
    location: str
    ceiling_condition: str  # e.g. ">500 users" -- the trigger past which this must be fixed
    upgrade_path: str
    logged_at: datetime
    resolved_at: datetime | None = None
    status: DebtStatus = DebtStatus.OPEN


TraceabilityPrefix = Literal["DISC", "DEF", "ARCH", "UX", "IP"]


class TraceabilityLink(BaseModel):
    """One minted `<!-- wingman:req ID -->`-style marker, per traceability-linking."""

    marker_id: str  # e.g. "DISC-3"
    prefix: TraceabilityPrefix
    source_file: str
    referenced_by: list[str] = Field(default_factory=list)


class ContextVariant(str, Enum):
    """The two Pillar II context strategies being A/B tested."""

    FULL_CONTEXT = "full_context"  # today's approach: the whole SKILL.md in context
    RETRIEVED_CONTEXT = "retrieved_context"  # the blueprint's proposal: top-k vector-retrieved chunks


class ABTestResult(BaseModel):
    """One append-only log row for a skill-context A/B run.

    Deliberately logs only what is mechanically, honestly measurable without
    a live model call: token count and retrieval latency. It does NOT log a
    "decision quality preserved" field, because verifying that requires
    actually running an agent against the reduced context and checking its
    output against the Definition of Done -- that needs live model inference,
    which isn't wired up yet (tracked as Phase 3, the Maker/Checker loop).
    Logging a fabricated quality score here would be exactly the kind of
    "purposeless data" this A/B layer exists to avoid.
    """

    run_id: str
    skill_name: str
    query: str
    variant: ContextVariant
    context_text: str
    token_count: int
    retrieval_latency_ms: float | None = None  # None for FULL_CONTEXT (no retrieval step)
    logged_at: datetime = Field(default_factory=datetime.utcnow)


class ProjectState(BaseModel):
    """The overwritten-in-place `.wingman/state.json`."""

    current_stage: Stage
    active_department_leads: list[str] = Field(default_factory=list)
    active_managers: list[str] = Field(default_factory=list)
    active_specialists: list[str] = Field(default_factory=list)
    last_checkpoint_id: str | None = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)
