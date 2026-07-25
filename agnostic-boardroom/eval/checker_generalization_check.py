"""Supplementary check for the `flatten-nested-list` scenario (Phase 7's
"does it generalize" test): `eval/live_ab_run.py`'s record didn't capture
whether the engine's real `GO_WITH_CONCERNS` verdict came from the Checker's
own content judgment (recursion-depth risk, the same thing the real CTO
persona flagged) or purely from `route_task`'s low-confidence fallback --
the exact ambiguity the `simple-email-validation` scenario already had in
Phase 5/6 ("nominal agreement," but for different underlying reasons).

Calls the real, current `agents.boardroom.cto_evaluator.evaluate()` directly
on the exact task + final artifact `live_ab_run.py` already produced (no
Maker re-run needed) to backfill this one missing data point as cheaply as
a live call can.
"""

from __future__ import annotations

import json
from dataclasses import asdict
from pathlib import Path

from agents.boardroom.cto_evaluator import evaluate

LOG_PATH = Path(__file__).parent / ".data" / "checker_generalization_check_results.jsonl"

TASK = (
    "Write a Python function flatten(nested) that takes a list which may contain "
    "other lists nested to arbitrary depth, and returns a single flat list containing "
    "all the non-list elements, in their original order. Respond with only the function "
    "definition, no explanation."
)
# The exact artifact live_ab_run.py's real Maker/Checker loop already produced
# and accepted for the flatten-nested-list scenario.
CANDIDATE_SOLUTION = (
    "```python\n"
    "def flatten(nested):\n"
    "    result = []\n"
    "    for item in nested:\n"
    "        if isinstance(item, list):\n"
    "            result.extend(flatten(item))\n"
    "        else:\n"
    "            result.append(item)\n"
    "    return result\n"
    "```"
)


def main() -> None:
    verdict = evaluate(TASK, CANDIDATE_SOLUTION)
    record = {
        "test": "checker_generalization_check",
        "scenario": "flatten-nested-list",
        "task": TASK,
        "candidate_solution": CANDIDATE_SOLUTION,
        "checker_verdict": asdict(verdict),
    }
    print(json.dumps(record, indent=2))

    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with LOG_PATH.open("a") as f:
        f.write(json.dumps(record) + "\n")

    print(f"\nTOTAL REAL COST: ${verdict.cost_usd:.6f}")


if __name__ == "__main__":
    main()
