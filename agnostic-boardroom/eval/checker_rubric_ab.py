"""One-call isolation test: does injecting the old CTO persona's actual
5-point checklist into the Checker's prompt change its verdict on the exact
same buggy code it already accepted in the live A/B (Phase 5)?

Deliberately does NOT re-run the Maker -- reuses the exact known buggy
output from `palindrome-check` (recorded in eval/.data/live_ab_results.jsonl)
so this costs exactly one live call, not a full loop rerun. Isolates the
rubric-absence hypothesis as cheaply as a live test can.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

from models.model_runner import run_claude_headless

LOG_PATH = Path(__file__).parent / ".data" / "checker_rubric_ab_results.jsonl"

TASK = (
    "Write a Python function is_palindrome(s) that returns True if s reads the same "
    "forwards and backwards, ignoring case and spaces. Respond with only the function "
    "definition, no explanation."
)
# The exact, known buggy code from the live A/B run (Phase 5) -- the new
# engine's Checker accepted this; the shipped plugin's real CTO persona
# said NO_GO on it.
KNOWN_BUGGY_CODE = "```python\ndef is_palindrome(s):\n    cleaned = s.replace(\" \", \"\").lower()\n    return cleaned == cleaned[::-1]\n```"

# The old CTO persona's real checklist (verbatim from
# plugins/wingman/agents/boardroom-cto.md's "What you check" section),
# injected into the Checker's otherwise-unchanged prompt shape.
CHECKLIST = """1. Correctness -- does the plan/change actually do what it claims? Are there obvious gaps, missing edge cases, or steps that don't follow from the ones before them?
2. Architecture fit & scalability -- does this fit how the rest of the project is built?
3. Test coverage -- is there a real plan to verify this works, or is "it should work" being assumed?
4. Maintainability -- will the next person be able to understand and extend this without re-deriving everything from scratch?
5. Blast radius -- what breaks if this is wrong, and how far does the damage spread?"""

_JSON_BLOCK_RE = re.compile(r"\{.*\}", re.DOTALL)


def evaluate_with_checklist(task: str, maker_output: str) -> dict:
    prompt = (
        f"Task: {task}\n\n"
        f"Proposed solution:\n{maker_output}\n\n"
        f"Evaluate this solution strictly against the task, checking it against each of these "
        f"5 dimensions explicitly:\n\n{CHECKLIST}\n\n"
        'Respond with ONLY a JSON object, no other text: {"accepted": true or false, "reason": "one sentence why"}'
    )
    result = run_claude_headless(prompt)
    match = _JSON_BLOCK_RE.search(result.text)
    if not match:
        return {"accepted": False, "reason": f"unparseable: {result.text[:200]}", "cost_usd": result.total_cost_usd}
    parsed = json.loads(match.group(0))
    return {
        "accepted": bool(parsed.get("accepted", False)),
        "reason": str(parsed.get("reason", "")),
        "cost_usd": result.total_cost_usd,
    }


def main() -> None:
    result = evaluate_with_checklist(TASK, KNOWN_BUGGY_CODE)
    record = {
        "test": "checker_rubric_ab",
        "task": TASK,
        "code_under_test": KNOWN_BUGGY_CODE,
        "original_checker_verdict": "accepted (no checklist injected, live A/B Phase 5)",
        "checklist_injected_verdict": result,
    }
    print(json.dumps(record, indent=2))

    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with LOG_PATH.open("a") as f:
        f.write(json.dumps(record) + "\n")

    print(f"\nTOTAL REAL COST: ${result['cost_usd']:.6f}")


if __name__ == "__main__":
    main()
