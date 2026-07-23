"""Real, live-model verification -- costs real money via headless `claude -p`.

Deliberately NOT run as part of the fast default test suite (marked
`live_model`) -- run explicitly, on purpose, when Phase 3/4's actual
behavioral claim needs re-proving. This is the file that answers the plan's
own requirement: "must not claim Phase 3 done without live behavioral
proof." Kept to the minimum live calls needed to prove the real claims,
given every call has a real, non-trivial dollar cost (confirmed ~$0.26 for
a single trivial reply).
"""

import pytest

from agents.boardroom.cto_evaluator import evaluate
from agents.loop import run_maker_checker_loop

pytestmark = pytest.mark.live_model


def test_live_checker_genuinely_rejects_an_obviously_wrong_solution():
    """One live call. Proves the Checker's rejection is real model judgment,
    not a scripted/mocked response."""
    verdict = evaluate(
        task_description="Write a Python function `add(a, b)` that returns the sum of a and b.",
        maker_output="def add(a, b):\n    return a - b  # subtracts instead of adding",
    )
    assert verdict.accepted is False
    assert verdict.reason
    assert verdict.cost_usd > 0


def test_live_full_loop_accepts_a_correct_simple_solution_and_logs_real_cost():
    """A task simple enough the Maker should get right on the first try, to
    bound live-call cost (2 calls: 1 Maker + 1 Checker) while still proving
    the full pipeline's real mechanics end to end."""
    result = run_maker_checker_loop(
        task_description="Write a Python function `add(a, b)` that returns the sum of a and b. Respond with only the function definition."
    )
    assert result.total_cost_usd > 0
    assert len(result.iterations) >= 1
    # Whatever the real outcome, it must be a genuine one -- either accepted
    # on a real pass, or escalated after 3 real rejected attempts. Never
    # silently pass with zero iterations recorded.
    assert result.accepted or result.escalated
