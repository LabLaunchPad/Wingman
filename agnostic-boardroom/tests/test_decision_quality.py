"""Zero-cost verification of the decision-quality comparison harness
itself, per the founder's explicit choice to prove the methodology on
scripted scenarios before authorizing any real live-model spend.
"""

from eval.decision_quality import Scenario, ScriptedTurn, run_all, run_scenario
from eval.scenarios import SCENARIOS


def test_all_labeled_scenarios_match_their_expected_outcome():
    report = run_all(SCENARIOS)
    mismatches = [o for o in report.outcomes if not o.matched]
    assert not mismatches, f"unexpected mismatches: {[(o.scenario_name, o.detail) for o in mismatches]}"
    assert report.accuracy == 1.0


def test_never_fixed_scenario_actually_escalates_after_max_iterations():
    outcome = run_scenario(next(s for s in SCENARIOS if s.name == "never_fixed_escalates"))
    assert outcome.matched
    assert outcome.actual_accepted is False
    assert outcome.actual_iterations == 3


def test_checker_unparseable_scenario_does_not_get_silently_accepted():
    outcome = run_scenario(
        next(s for s in SCENARIOS if s.name == "checker_unparseable_response_fails_closed_then_recovers")
    )
    assert outcome.matched
    # 2 iterations means the unparseable first Checker response was NOT
    # treated as acceptance -- if it had been, this would resolve in 1.
    assert outcome.actual_iterations == 2


def test_harness_correctly_flags_a_mismatch_it_should_not_rubber_stamp():
    """The harness's own negative case: a scenario whose declared
    expectation is deliberately wrong relative to what the script actually
    produces. If `run_scenario` reported `matched=True` here, the harness
    would be worthless -- it would pass regardless of the real outcome."""
    wrong_scenario = Scenario(
        name="deliberately_wrong_expectation",
        task_description="Write a function that adds two numbers.",
        script=[
            ScriptedTurn(text="def add(a, b): return a + b"),
            ScriptedTurn(text='{"accepted": true, "reason": "correct"}'),
        ],
        expected_accepted=False,  # wrong on purpose -- the script actually accepts on iteration 1
        expected_iterations=1,
        expected_escalated=False,
    )
    outcome = run_scenario(wrong_scenario)
    assert outcome.matched is False
    assert outcome.actual_accepted is True
    assert "expected accepted=False" in outcome.detail
    assert "got accepted=True" in outcome.detail


def test_report_accuracy_aggregates_correctly_across_a_mixed_set():
    correct_scenario = SCENARIOS[0]
    wrong_scenario = Scenario(
        name="deliberately_wrong",
        task_description="x",
        script=[ScriptedTurn(text="y"), ScriptedTurn(text='{"accepted": true, "reason": "z"}')],
        expected_accepted=False,
        expected_iterations=1,
    )
    report = run_all([correct_scenario, correct_scenario, wrong_scenario])
    assert report.accuracy == 2 / 3
