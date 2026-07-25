"""The Checker: independently evaluates the Maker's output against the task.

Fails closed: if the model's response isn't parseable as the expected
{"accepted": bool, "concerns": [str], "reason": str} JSON, this is treated as
a rejection (not silently accepted) -- an unparseable verdict is not
evidence the work is good.

The prompt's rubric is the same 5-point checklist the shipped plugin's real
`boardroom-cto.md` persona already uses (correctness incl. missing edge
cases, architecture fit, test coverage, maintainability, blast radius) --
ported in after a live A/B (agnostic-boardroom's Phase 5, see
docs/PROJECT.md's decisions log) found the bare, rubric-less prompt this
file used to have let a real bug through that the checklist-bearing persona
caught.

**A real, deeper gap found in a follow-up live re-run (Phase 6), fixed
here**: adding the checklist alone didn't converge on the real persona's
verdict -- it flipped the failure from too-lenient (silently accepting a
real bug) to too-strict (escalating/blocking a solution the persona would
ship with a caveat). Root cause: this module's own verdict schema was
binary (accept/reject), with no way to express "shippable, but here's a
concern" -- exactly what the real persona's `GO_WITH_CONCERNS` tier is.
`CheckerVerdict.concerns` (new) lets the Checker accept AND flag specific,
named concerns in the same verdict, so `agents/boardroom_engine.py` can map
a content-based concern to `GO_WITH_CONCERNS` instead of only ever reaching
that tier via routing confidence. `accepted` still solely controls loop
retry (a concern never triggers a retry on its own -- only `accepted: false`
does); concerns are informational, carried through for the founder-facing
verdict.

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
from dataclasses import dataclass, field

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

# The severity-calibration guidance a real live A/B re-run showed was
# missing: without it, adding the checklist alone pushed the Checker toward
# treating any deviation from the literal spec as a blocker, rather than
# weighing whether it actually breaks correctness for the stated use case --
# the same judgment call the real persona's GO/GO_WITH_CONCERNS/NO_GO
# 3-tier verdict already makes.
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
