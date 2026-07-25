"""The Checker: independently evaluates the Maker's output against the task.

Ported verbatim (unchanged logic) from `agents/boardroom/cto_evaluator.py` -- this
Agno-native rewrite reuses the exact same rubric, severity guidance, and fail-closed
JSON-parsing behavior. Only the module location changed.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field

from models.model_runner import run_claude_headless

_CHECKLIST = """1. Correctness -- does the plan/change actually do what it claims? Are there obvious gaps, missing edge cases, or steps that don't follow from the ones before them?
2. Architecture fit & scalability -- does this fit how the rest of the project is built, or does it introduce a new pattern/dependency without a reason?
3. Test coverage -- is there a real plan to verify this works, or is "it should work" being assumed?
4. Maintainability -- will the next person be able to understand and extend this without re-deriving everything from scratch?
5. Blast radius -- what breaks if this is wrong, and how far does the damage spread?"""

_SEVERITY_GUIDANCE = """Not every deviation from the literal spec is a blocker. Judge severity the
way a principal engineer would: if a concern doesn't break correctness for the stated use case, it's
a real thing worth naming -- but it belongs in "concerns", not a rejection. Only reject (accepted:
false) for a genuine correctness gap, a missed requirement, or something that would break in
real use -- not for "this could theoretically be more thorough.\""""


@dataclass
class CheckerVerdict:
    accepted: bool
    reason: str
    cost_usd: float
    concerns: list[str] = field(default_factory=list)


_JSON_BLOCK_RE = re.compile(r"\{.*\}", re.DOTALL)


def evaluate(task_description: str, maker_output: str, call_model=run_claude_headless) -> CheckerVerdict:
    prompt = (
        f"Task: {task_description}\n\n"
        f"Proposed solution:\n{maker_output}\n\n"
        f"Evaluate this solution strictly against the task, checking it against each of these "
        f"5 dimensions explicitly:\n\n{_CHECKLIST}\n\n"
        f"{_SEVERITY_GUIDANCE}\n\n"
        'Respond with ONLY a JSON object, no other text: {"accepted": true or false, '
        '"concerns": ["short concern", ...] (empty list if none), "reason": "one sentence why"}'
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
        concerns = parsed.get("concerns", [])
        return CheckerVerdict(
            accepted=bool(parsed.get("accepted", False)),
            reason=str(parsed.get("reason", "")),
            cost_usd=result.total_cost_usd,
            concerns=[str(c) for c in concerns] if isinstance(concerns, list) else [],
        )
    except json.JSONDecodeError:
        return CheckerVerdict(
            accepted=False,
            reason=f"checker response had unparseable JSON, failing closed: {result.text[:200]}",
            cost_usd=result.total_cost_usd,
        )
