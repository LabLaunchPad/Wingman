"""One-call isolation test, Phase 7: does the `concerns` field + severity
guidance (added to `agents/boardroom/cto_evaluator.py` after Phase 6's live
re-run showed the rubric-only fix flipped the Checker from too-lenient to
too-strict) actually recover a `GO_WITH_CONCERNS`-shaped verdict on the same
known-buggy `palindrome-check` code -- instead of continuing to reject it
outright.

Deliberately calls the real, current `agents.boardroom.cto_evaluator.evaluate()`
function directly (not a hand-copied duplicate prompt, unlike Phase 6's
`checker_rubric_ab.py`) so this test exercises the exact code path that ships,
not a proxy for it. Reuses the exact known buggy output from `palindrome-check`
(recorded in eval/.data/live_ab_results.jsonl) so this costs exactly one live
call, not a full loop rerun.
"""

from __future__ import annotations

import json
from dataclasses import asdict
from pathlib import Path

from agents.boardroom.cto_evaluator import evaluate

LOG_PATH = Path(__file__).parent / ".data" / "checker_severity_ab_results.jsonl"

TASK = (
    "Write a Python function is_palindrome(s) that returns True if s reads the same "
    "forwards and backwards, ignoring case and spaces. Respond with only the function "
    "definition, no explanation."
)
# The exact, known buggy code from the live A/B run (Phase 5) -- misses
# punctuation-stripping, which the shipped plugin's real CTO persona
# considers a real gap (NO_GO in the original A/B; the persona's own
# Phase 6 re-run verdict on this class of gap was GO_WITH_CONCERNS on a
# similar but not identical solution -- see docs/PROJECT.md's decisions log).
KNOWN_BUGGY_CODE = "```python\ndef is_palindrome(s):\n    cleaned = s.replace(\" \", \"\").lower()\n    return cleaned == cleaned[::-1]\n```"


def main() -> None:
    verdict = evaluate(TASK, KNOWN_BUGGY_CODE)
    record = {
        "test": "checker_severity_ab",
        "task": TASK,
        "code_under_test": KNOWN_BUGGY_CODE,
        "prior_verdicts": {
            "pre_fix_no_rubric": "accepted (live A/B Phase 5)",
            "post_rubric_only": "rejected (checker_rubric_ab, Phase 6 isolation test)",
        },
        "severity_and_concerns_fix_verdict": asdict(verdict),
    }
    print(json.dumps(record, indent=2))

    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with LOG_PATH.open("a") as f:
        f.write(json.dumps(record) + "\n")

    print(f"\nTOTAL REAL COST: ${verdict.cost_usd:.6f}")


if __name__ == "__main__":
    main()
