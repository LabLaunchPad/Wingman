"""A small, labeled scenario set for `decision_quality.py`'s zero-cost
harness. Each scenario is deliberately shaped to exercise a different real
code path in the loop/Checker, not a cosmetic restatement of another --
the same discipline this project's own eval cases apply (`evals/README.md`:
a real second scenario must be genuinely differently shaped, never a
repeat of the first).
"""

from __future__ import annotations

from eval.decision_quality import Scenario, ScriptedTurn


def _maker(text: str, cost: float = 0.10) -> ScriptedTurn:
    return ScriptedTurn(text=text, cost_usd=cost)


def _checker_json(accepted: bool, reason: str, cost: float = 0.05) -> ScriptedTurn:
    return ScriptedTurn(text=f'{{"accepted": {str(accepted).lower()}, "reason": "{reason}"}}', cost_usd=cost)


def _checker_unparseable(cost: float = 0.05) -> ScriptedTurn:
    return ScriptedTurn(text="I think this looks fine, no issues here!", cost_usd=cost)


SCENARIOS: list[Scenario] = [
    Scenario(
        name="correct_first_try",
        task_description="Write a function that returns the sum of a list of numbers.",
        script=[
            _maker("def total(nums): return sum(nums)"),
            _checker_json(True, "correctly sums the list"),
        ],
        expected_accepted=True,
        expected_iterations=1,
        expected_escalated=False,
    ),
    Scenario(
        name="wrong_then_fixed",
        task_description="Write a function that returns the average of a list of numbers.",
        script=[
            _maker("def avg(nums): return sum(nums) / len(nums)"),
            _checker_json(False, "does not handle an empty list, raises ZeroDivisionError"),
            _maker("def avg(nums): return sum(nums) / len(nums) if nums else 0"),
            _checker_json(True, "now handles the empty-list case"),
        ],
        expected_accepted=True,
        expected_iterations=2,
        expected_escalated=False,
    ),
    Scenario(
        name="never_fixed_escalates",
        task_description="Write a function that reverses a string without using slicing.",
        script=[
            _maker("def rev(s): return s[::-1]"),
            _checker_json(False, "uses slicing, which the task explicitly disallows"),
            _maker("def rev(s): return s[::-1]  # same wrong attempt again"),
            _checker_json(False, "still uses slicing"),
            _maker("def rev(s): return ''.join(reversed(list(s)))[::-1]"),
            _checker_json(False, "still contains a slice at the end"),
        ],
        expected_accepted=False,
        expected_iterations=3,
        expected_escalated=True,
    ),
    Scenario(
        name="checker_unparseable_response_fails_closed_then_recovers",
        task_description="Write a function that checks if a number is prime.",
        script=[
            _maker("def is_prime(n): return n > 1"),
            _checker_unparseable(),  # not JSON -- must be treated as a rejection, not silently accepted
            _maker("def is_prime(n):\n    if n < 2: return False\n    return all(n % i for i in range(2, int(n**0.5)+1))"),
            _checker_json(True, "correctly checks primality"),
        ],
        expected_accepted=True,
        expected_iterations=2,
        expected_escalated=False,
    ),
]
