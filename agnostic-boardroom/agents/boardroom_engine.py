"""The real, invokable replacement engine for the technical half of a
Boardroom checkpoint -- built per the founder's explicit decision to wire
this backend in as the actual engine, overriding the earlier "prove
decision-quality against the shipped plugin first" bar on the strength of
the already-measured token-compression result alone (see `docs/PROJECT.md`'s
decisions log for the exact exchange).

**Honest scope, stated plainly rather than overclaimed**: this composes
memory retrieval + skill routing + the Maker/Checker loop into a single
`BoardroomVerdict` (the same Pydantic model `core/state_schema.py` already
defines, faithfully ported from the shipped plugin's real
`.wingman/checkpoints.jsonl` schema). It produces ONE seat's worth of
judgment -- a technical/engineering accept-or-reject gate, the same shape
of call the Maker/Checker loop already proves it can make. It does **not**
reproduce the shipped plugin's other 7 seats (CEO/CPO/CMO/CISO/CFO/Research/
Design business, security, and financial judgment) -- those personas have
no equivalent in this backend today. Calling this a full Boardroom
replacement would overclaim; it replaces the CTO seat's technical gate
specifically, nothing else, until the other seats are built too.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone

from agents.loop import DEFAULT_MAX_ITERATIONS, LoopResult, run_maker_checker_loop
from agents.model_runner import run_claude_headless
from core.state_schema import BottomLine, BoardroomVerdict, FounderDecision, SeatVerdict, Verdict
from knowledge.skill_router import RoutedSkill, route_task
from mcp_server.memory_tools import retrieve_memories


@dataclass
class EngineeringReview:
    """The engine's own full result, before compression into a BoardroomVerdict."""

    routing: RoutedSkill
    loop: LoopResult
    memory_hits: list[dict]


def run_engineering_review(
    kb_skills,
    kb_memory,
    task_description: str,
    scope_ref: str,
    max_iterations: int = DEFAULT_MAX_ITERATIONS,
    call_model=run_claude_headless,
) -> EngineeringReview:
    """Runs the real, composed pipeline: retrieve relevant memory, route to
    the matching skill, then run the bounded Maker/Checker loop with both
    fed into context. Every piece here is already independently tested
    (test_pipeline_wiring.py, test_loop_mocked.py/test_loop_live.py,
    test_skill_router.py) -- this function's own job is only the
    composition, same discipline as `agents/pipeline.py`.
    """
    memory_hits = retrieve_memories(kb_memory, query=task_description, k=5)
    routed = route_task(kb_skills, task_description)

    context_parts = [routed.skill_text]
    if memory_hits:
        memory_text = "\n".join(f"- {m['content']}" for m in memory_hits)
        context_parts.append(f"\nRelevant prior decisions:\n{memory_text}")

    loop_result = run_maker_checker_loop(
        task_description,
        context="\n".join(context_parts),
        max_iterations=max_iterations,
        call_model=call_model,
    )
    return EngineeringReview(routing=routed, loop=loop_result, memory_hits=memory_hits)


def to_boardroom_verdict(review: EngineeringReview, scope_ref: str, checkpoint_id: str | None = None) -> BoardroomVerdict:
    """Compresses an EngineeringReview into a real BoardroomVerdict matching
    the shipped plugin's own `.wingman/checkpoints.jsonl` schema, so a
    caller consuming this can't tell the difference in shape from a real
    checkpoint entry -- only in seat coverage (see module docstring).

    Mapping: loop.accepted -> CTO seat GO; loop still resolved before the
    iteration cap but with concerns noted via a low-confidence route ->
    GO_WITH_CONCERNS; loop.escalated (never resolved) -> CTO seat NO_GO,
    consolidated bottom_line DO NOT SHIP. This is a deliberately conservative
    mapping -- a low-confidence skill match downgrades an otherwise-accepted
    result to GO_WITH_CONCERNS rather than silently reporting a clean GO,
    since `route_task`'s own low_confidence_fallback is an explicitly
    unguarded gap (see `knowledge/skill_router.py`'s docstring).
    """
    if review.loop.escalated:
        cto_verdict = Verdict.NO_GO
        summary = (
            f"Escalated after {len(review.loop.iterations)} iterations, never accepted. "
            f"Last reason: {review.loop.iterations[-1].checker_reason if review.loop.iterations else 'n/a'}"
        )
        bottom_line = BottomLine.DO_NOT_SHIP
        founder_decision = FounderDecision.STILL_REVIEWING
    elif review.routing.confidence == "low_confidence_fallback":
        cto_verdict = Verdict.GO_WITH_CONCERNS
        summary = (
            f"Accepted after {len(review.loop.iterations)} iteration(s), but routed to "
            f"'{review.routing.skill_name}' on a low-confidence match (similarity="
            f"{review.routing.best_similarity:.2f}) -- worth a human second look."
        )
        bottom_line = BottomLine.GO_WITH_CHANGES
        founder_decision = FounderDecision.STILL_REVIEWING
    else:
        cto_verdict = Verdict.GO
        summary = f"Accepted after {len(review.loop.iterations)} iteration(s), routed to '{review.routing.skill_name}'."
        bottom_line = BottomLine.GO
        founder_decision = FounderDecision.STILL_REVIEWING

    checkpoint_id = checkpoint_id or f"{datetime.now(timezone.utc).strftime('%Y-%m-%dT%H-%M-%SZ')}-engineering-review"

    return BoardroomVerdict(
        checkpoint_id=checkpoint_id,
        stage="build",
        scope_ref=scope_ref,
        seats=[SeatVerdict(seat="cto", verdict=cto_verdict, summary=summary)],
        bottom_line=bottom_line,
        founder_decision=founder_decision,
        founder_notes=(
            "Produced by agnostic-boardroom's engineering-review engine -- a single technical "
            "seat, not the full 8-seat Boardroom. See agents/boardroom_engine.py's module "
            "docstring for the honest scope of what this does and doesn't cover."
        ),
    )
