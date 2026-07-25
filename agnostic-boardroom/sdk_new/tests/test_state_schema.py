"""Phase 1 verification: the schema parses the real documented shapes.

These fixtures are copied verbatim from docs/DATABASE.md's own worked
examples, not invented -- this proves the model is a faithful port, not a
guess at the format.
"""

import json

import pytest
from pydantic import ValidationError

from core.state_schema import (
    BoardroomVerdict,
    BottomLine,
    DebtLedgerEntry,
    ProjectState,
    ThreatDisposition,
    ThreatRegisterEntry,
    Verdict,
)

CHECKPOINT_JSON = """
{
  "schema_version": 4,
  "checkpoint_id": "2026-07-14T14-32-00Z-implementation-planning",
  "stage": ["discovery", "define", "architecture", "uxflow", "implementation-planning"],
  "bundle": "planning-milestone",
  "scope_ref": "docs/wingman/plans/2026-07-14-billing-integration.md",
  "seats": [
    { "seat": "ceo",      "verdict": "GO",              "summary": "Solves the stated problem, scope is right-sized." },
    { "seat": "cpo",      "verdict": "GO",              "summary": "Real user need, right-sized slice." },
    { "seat": "cmo",      "verdict": "GO",              "summary": "N/A" },
    { "seat": "cto",      "verdict": "GO_WITH_CONCERNS", "summary": "No test plan for the webhook retry path yet." },
    { "seat": "ciso",     "verdict": "GO",              "summary": "No new data exposure identified." },
    { "seat": "cfo",      "verdict": "GO",              "summary": "No new paid services introduced." },
    { "seat": "research", "verdict": "GO",              "summary": "N/A" }
  ],
  "bottom_line": "GO_WITH_CHANGES",
  "founder_decision": "fix_concerns_first",
  "founder_notes": "",
  "next_stage": "build",
  "details_ref": ".wingman/checkpoint-details/2026-07-14T14-32-00Z-implementation-planning.md"
}
"""

STATE_JSON = """
{
  "current_stage": "build",
  "active_department_leads": [],
  "active_managers": [],
  "active_specialists": [],
  "last_checkpoint_id": "2026-07-07T14-32-00Z-plan",
  "updated_at": "2026-07-07T14:32:05Z"
}
"""


def test_parses_real_checkpoint_example_from_database_md():
    verdict = BoardroomVerdict.model_validate_json(CHECKPOINT_JSON)
    assert verdict.bottom_line == BottomLine.GO_WITH_CHANGES
    assert isinstance(verdict.stage, list) and len(verdict.stage) == 5
    assert verdict.seats[3].seat == "cto"
    assert verdict.seats[3].verdict == Verdict.GO_WITH_CONCERNS
    assert not verdict.blocks_advancement


def test_do_not_ship_blocks_advancement():
    data = json.loads(CHECKPOINT_JSON)
    data["bottom_line"] = "DO NOT SHIP"
    verdict = BoardroomVerdict.model_validate(data)
    assert verdict.blocks_advancement


def test_parses_real_state_json_example_from_database_md():
    state = ProjectState.model_validate_json(STATE_JSON)
    assert state.current_stage == "build"
    assert state.active_managers == []


def test_missing_active_managers_defaults_to_empty_list():
    """DATABASE.md: a state.json written before this field existed has no
    active_managers key -- treat absence as [], not an error."""
    data = json.loads(STATE_JSON)
    del data["active_managers"]
    state = ProjectState.model_validate(data)
    assert state.active_managers == []


def test_invalid_stage_name_rejected():
    data = json.loads(CHECKPOINT_JSON)
    data["stage"] = "not-a-real-stage"
    with pytest.raises(ValidationError):
        BoardroomVerdict.model_validate(data)


def test_threat_register_open_disposition_has_no_evidence_requirement():
    entry = ThreatRegisterEntry(
        threat_id="T1",
        location="api/billing.py:42",
        trigger_condition="webhook signature not verified",
        description="Unsigned Stripe webhook payload accepted",
        disposition=ThreatDisposition.OPEN,
    )
    assert entry.evidence_ref is None
    assert not entry.accepted_by_founder


def test_debt_ledger_entry_round_trip():
    entry = DebtLedgerEntry(
        debt_id="D1",
        location="src/cache.py:42",
        ceiling_condition=">500 users",
        upgrade_path="Redis lock",
        logged_at="2026-07-13T00:00:00Z",
    )
    assert entry.status.value == "OPEN"
    assert entry.resolved_at is None
