"""Decision-quality comparison harness for the Maker/Checker loop.

Built after the founder reviewed a real-metrics readiness report on Phase
1-2b and named the actual open question: not "does the pipeline run" (it
does -- 42/42 fast tests, 2/2 live-model tests) but "does it reach as good
a decision as the shipped plugin's real Boardroom would, at a cost worth
paying." The founder confirmed proceeding on this specifically, and to
build the comparison methodology zero-cost first, deferring any real
spend to a later, explicitly-authorized round (see docs/PROJECT.md's
decisions log for the exact exchange).

Each `Scenario` names the ground-truth outcome a correct Maker/Checker
loop should reach for a scripted (not live) sequence of Maker attempts and
Checker verdicts. `run_scenario` executes the real, unmodified
`run_maker_checker_loop` against that script and checks whether the
loop's *actual* outcome matches the scenario's *expected* one. The same
harness runs unmodified against a real `call_model` (e.g.
`agents.model_runner.run_claude_headless`) once live spend is authorized
-- only the injected `call_model` changes between the mocked and live
runs, never the harness itself.

Known limitation, disclosed rather than hidden: this proves whether the
loop mechanism reaches the expected decision for a scripted exchange --
it does not yet compare against a live run of the shipped plugin's own
`/wingman:boardroom` on the same task. That comparison needs two real
model runs (one per system, run side by side on identical input) and
is the deferred next step once the founder authorizes live spend for it.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from agents.loop import LoopResult, run_maker_checker_loop
from agents.model_runner import RunResult


@dataclass
class ScriptedTurn:
    """One canned model response -- either a Maker attempt's raw text, or
    a Checker verdict already formatted as its expected JSON string."""

    text: str
    cost_usd: float = 0.0


@dataclass
class Scenario:
    name: str
    task_description: str
    script: list[ScriptedTurn]  # alternating Maker, Checker, Maker, Checker, ...
    expected_accepted: bool
    expected_iterations: int
    expected_escalated: bool = False
    max_iterations: int = 3


@dataclass
class ScenarioOutcome:
    scenario_name: str
    matched: bool
    expected_accepted: bool
    actual_accepted: bool
    expected_iterations: int
    actual_iterations: int
    total_cost_usd: float
    detail: str = ""


@dataclass
class DecisionQualityReport:
    outcomes: list[ScenarioOutcome] = field(default_factory=list)

    @property
    def accuracy(self) -> float:
        if not self.outcomes:
            return 0.0
        return sum(1 for o in self.outcomes if o.matched) / len(self.outcomes)


def _scripted_call_model(script: list[ScriptedTurn]):
    calls = list(script)

    def _call(prompt: str) -> RunResult:
        if not calls:
            raise AssertionError("scenario script exhausted -- loop made more model calls than scripted")
        turn = calls.pop(0)
        return RunResult(text=turn.text, total_cost_usd=turn.cost_usd, session_id="scripted", is_error=False)

    return _call


def run_scenario(scenario: Scenario) -> ScenarioOutcome:
    call_model = _scripted_call_model(scenario.script)
    result: LoopResult = run_maker_checker_loop(
        scenario.task_description, max_iterations=scenario.max_iterations, call_model=call_model
    )
    matched = (
        result.accepted == scenario.expected_accepted
        and len(result.iterations) == scenario.expected_iterations
        and result.escalated == scenario.expected_escalated
    )
    detail = (
        ""
        if matched
        else (
            f"expected accepted={scenario.expected_accepted} iterations={scenario.expected_iterations} "
            f"escalated={scenario.expected_escalated}, got accepted={result.accepted} "
            f"iterations={len(result.iterations)} escalated={result.escalated}"
        )
    )
    return ScenarioOutcome(
        scenario_name=scenario.name,
        matched=matched,
        expected_accepted=scenario.expected_accepted,
        actual_accepted=result.accepted,
        expected_iterations=scenario.expected_iterations,
        actual_iterations=len(result.iterations),
        total_cost_usd=result.total_cost_usd,
        detail=detail,
    )


def run_all(scenarios: list[Scenario]) -> DecisionQualityReport:
    return DecisionQualityReport(outcomes=[run_scenario(s) for s in scenarios])
