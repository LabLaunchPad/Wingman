"""The Checker: independently evaluates the Maker's output against the task.

Fails closed: if the model's response isn't parseable as the expected
{"accepted": bool, "reason": str} JSON, this is treated as a rejection (not
silently accepted) -- an unparseable verdict is not evidence the work is
good.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass

from agents.model_runner import run_claude_headless


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
        "Evaluate this solution strictly against the task. Respond with ONLY "
        'a JSON object, no other text: {"accepted": true or false, "reason": "one sentence why"}'
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
