"""Live decision-quality A/B: the shipped plugin's real CTO persona vs.
agnostic-boardroom's `boardroom_engine.py`, on identical real tasks/artifacts.

Costs real money via headless `claude -p` -- run explicitly, on purpose,
kept to the minimum live calls needed per the founder's explicit
token-efficiency instruction: 2 scenarios, `max_iterations=2` (not the
harness's default 3) to bound worst-case spend, one extra call per
scenario for the CTO-persona-equivalent review. Every dollar figure below
is read directly from the CLI's own reported `total_cost_usd`, never
estimated.

**Methodology, stated plainly**: this does not run two independent
code-writing tasks and compare them -- it takes the SAME final artifact
`boardroom_engine.py`'s Maker/Checker loop actually produced, and asks the
real, unmodified CTO seat persona (`plugins/wingman/agents/boardroom-cto.md`,
read live from disk, not copy-pasted, so it can never silently drift from
what's actually shipped) to render its own independent verdict on that
exact artifact. Agreement means: would the real, shipped CTO seat approve
what the new engine already decided to accept/reject. This is the direct,
real answer to "does the new engine reach as good a decision as the
shipped plugin's Boardroom" -- for the one seat this engine actually
claims to replace (see `agents/boardroom_engine.py`'s own honest-scope
docstring).
"""

from __future__ import annotations

import json
import re
from pathlib import Path

from agents.boardroom_engine import run_engineering_review, to_boardroom_verdict
from agents.model_runner import run_claude_headless
from db.connection import get_connection
from db.schema import init_schema
from knowledge.vector_store import build_skill_knowledge
from mcp_server.memory_tools import build_memory_knowledge

REPO_ROOT = Path(__file__).resolve().parents[2]
CTO_PERSONA_PATH = REPO_ROOT / "plugins/wingman/agents/boardroom-cto.md"
LOG_PATH = Path(__file__).parent / ".data" / "live_ab_results.jsonl"

# Kept small and cost-bounded on purpose: 2 real scenarios, each with a
# genuine edge case a naive first attempt could plausibly miss (so the
# loop's real back-and-forth has something real to exercise), not 5-10.
SCENARIOS = [
    {
        "name": "palindrome-check",
        "task": (
            "Write a Python function is_palindrome(s) that returns True if s reads the same "
            "forwards and backwards, ignoring case and spaces. Respond with only the function "
            "definition, no explanation."
        ),
    },
    {
        "name": "simple-email-validation",
        "task": (
            "Write a Python function is_valid_email(s) that returns True only if s contains "
            "exactly one '@' character and at least one '.' character appearing after that '@'. "
            "Respond with only the function definition, no explanation."
        ),
    },
]

_VERDICT_RE = re.compile(r"##\s*CTO VERDICT:\s*(GO_WITH_CONCERNS|GO|NO_GO)")


def _extract_persona_body(path: Path) -> str:
    text = path.read_text()
    parts = text.split("---", 2)
    return parts[2].strip() if len(parts) == 3 else text


def _run_cto_persona_review(task: str, candidate_solution: str, persona_body: str) -> dict:
    prompt = (
        f"{persona_body}\n\n"
        "---\n\n"
        f"You are reviewing this specific change:\n\nTask: {task}\n\n"
        f"Proposed solution:\n{candidate_solution}\n\n"
        "Render your verdict now, in the exact Output format specified above."
    )
    result = run_claude_headless(prompt)
    match = _VERDICT_RE.search(result.text)
    return {
        "raw_response": result.text,
        "verdict": match.group(1) if match else None,
        "cost_usd": result.total_cost_usd,
    }


def main(scenarios=None) -> None:
    scenarios = scenarios if scenarios is not None else SCENARIOS
    persona_body = _extract_persona_body(CTO_PERSONA_PATH)
    kb_skills = build_skill_knowledge()
    kb_memory = build_memory_knowledge()
    conn = get_connection(":memory:")
    init_schema(conn)

    total_cost = 0.0
    records = []
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)

    for scenario in scenarios:
        print(f"=== {scenario['name']} ===", flush=True)
        review = run_engineering_review(
            kb_skills,
            kb_memory,
            scenario["task"],
            scope_ref=scenario["name"],
            max_iterations=2,
            call_model=run_claude_headless,
        )
        verdict = to_boardroom_verdict(review, scope_ref=scenario["name"])
        total_cost += review.loop.total_cost_usd

        cto_result = _run_cto_persona_review(scenario["task"], review.loop.final_output, persona_body)
        total_cost += cto_result["cost_usd"]

        new_engine_verdict = verdict.seats[0].verdict.value
        agree = new_engine_verdict == cto_result["verdict"] or (
            new_engine_verdict == "GO" and cto_result["verdict"] == "GO_WITH_CONCERNS"
        ) or (new_engine_verdict == "GO_WITH_CONCERNS" and cto_result["verdict"] == "GO")

        record = {
            "scenario": scenario["name"],
            "task": scenario["task"],
            "new_engine": {
                "accepted": review.loop.accepted,
                "escalated": review.loop.escalated,
                "iterations": len(review.loop.iterations),
                "routed_skill": review.routing.skill_name,
                "routing_confidence": review.routing.confidence,
                "seat_verdict": new_engine_verdict,
                "bottom_line": verdict.bottom_line.value,
                "cost_usd": review.loop.total_cost_usd,
                "final_output": review.loop.final_output,
            },
            "shipped_plugin_cto_persona": cto_result,
            "verdicts_agree": agree,
        }
        records.append(record)
        print(json.dumps(record, indent=2, default=str), flush=True)
        # Write incrementally -- a later scenario's real (paid-for) call
        # failing must not lose an earlier scenario's already-spent result.
        with LOG_PATH.open("a") as f:
            f.write(json.dumps(record, default=str) + "\n")

    agreements = sum(1 for r in records if r["verdicts_agree"])
    print(f"\nAgreement: {agreements}/{len(records)} scenarios")
    print(f"TOTAL REAL COST (this invocation): ${total_cost:.6f}")


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        names = set(sys.argv[1:])
        main(scenarios=[s for s in SCENARIOS if s["name"] in names])
    else:
        main()
