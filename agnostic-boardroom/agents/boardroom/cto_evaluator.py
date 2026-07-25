"""The Checker: independently evaluates the Maker's output against the task.

Fails closed: if the model's response isn't parseable as the expected
{"accepted": bool, "reason": str} JSON, this is treated as a rejection (not
silently accepted) -- an unparseable verdict is not evidence the work is
good.

The prompt's rubric is the same 5-point checklist the shipped plugin's real
`boardroom-cto.md` persona already uses (correctness incl. missing edge
cases, architecture fit, test coverage, maintainability, blast radius) --
ported in after a live A/B (agnostic-boardroom's Phase 5, see
docs/PROJECT.md's decisions log) found the bare, rubric-less prompt this
file used to have let a real bug through that the checklist-bearing persona
caught. `eval/checker_rubric_ab.py` confirmed injecting exactly this
checklist flips the verdict on that known case.

`CheckerVerdict.reason` deliberately keeps this name rather than matching
`core.state_schema.SeatVerdict.summary` -- it mirrors the literal `"reason"`
JSON key this prompt asks the model to return, a wire-format contract, not
a stylistic choice. `SeatVerdict.summary` is a different layer (the
founder-facing checkpoint record `agents/boardroom_engine.py` builds from
this), not this file's contract to rename.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass

from agents.model_runner import run_claude_headless

# Verbatim from plugins/wingman/agents/boardroom-cto.md's "What you check"
# section -- kept in sync by citing the source file in this comment, not by
# reading it live (the persona file is prose for a human/agent to read, not
# a machine-parseable API this module should take a runtime dependency on).
_CHECKLIST = """1. Correctness -- does the plan/change actually do what it claims? Are there obvious gaps, missing edge cases, or steps that don't follow from the ones before them?
2. Architecture fit & scalability -- does this fit how the rest of the project is built, or does it introduce a new pattern/dependency without a reason?
3. Test coverage -- is there a real plan to verify this works, or is "it should work" being assumed?
4. Maintainability -- will the next person be able to understand and extend this without re-deriving everything from scratch?
5. Blast radius -- what breaks if this is wrong, and how far does the damage spread?"""


@dataclass
class CheckerVerdict:
    accepted: bool
    reason: str
    cost_usd: float


_JSON_BLOCK_RE = re.compile(r"\{.*\}", re.DOTALL)


def evaluate(task_description: str, maker_output: str, call_model=run_claude_headless) -> CheckerVerdict:
    prompt = (
        f"Task: {task_description}\n\n"
        f"Proposed solution:\n{maker_output}\n\n"
        f"Evaluate this solution strictly against the task, checking it against each of these "
        f"5 dimensions explicitly:\n\n{_CHECKLIST}\n\n"
        'Respond with ONLY a JSON object, no other text: {"accepted": true or false, "reason": "one sentence why"}'
    )
    result = call_model(prompt)

    match = _JSON_BLOCK_RE.search(result.text)
    if not match:
        return CheckerVerdict(
            accepted=False,
            reason=f"checker response was not valid JSON, failing closed: {result.text[:200]}",
            cost_usd=result.total_cost_usd,
        )
    try:
        parsed = json.loads(match.group(0))
        return CheckerVerdict(
            accepted=bool(parsed.get("accepted", False)),
            reason=str(parsed.get("reason", "")),
            cost_usd=result.total_cost_usd,
        )
    except json.JSONDecodeError:
        return CheckerVerdict(
            accepted=False,
            reason=f"checker response had unparseable JSON, failing closed: {result.text[:200]}",
            cost_usd=result.total_cost_usd,
        )
