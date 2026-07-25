"""Wires the previously-isolated pieces together: skill routing feeds real
context into the Maker/Checker loop, and (for the end-to-end dry run) memory
retrieval feeds context in too.

Ported from `agents/pipeline.py` -- only the loop import path changed
(`loop.workflow` instead of `agents.loop`, the Agno-native rewrite), logic
unchanged.
"""

from __future__ import annotations

from dataclasses import dataclass

from knowledge.skill_router import RoutedSkill, route_task
from loop.workflow import DEFAULT_MAX_ITERATIONS, LoopResult, run_maker_checker_loop
from mcp_server.memory_tools import retrieve_memories
from models.model_runner import run_claude_headless


@dataclass
class RoutedLoopResult:
    routing: RoutedSkill
    loop: LoopResult


def run_task_with_routing(
    kb,
    task_description: str,
    max_iterations: int = DEFAULT_MAX_ITERATIONS,
    call_model=run_claude_headless,
) -> RoutedLoopResult:
    routed = route_task(kb, task_description)
    loop_result = run_maker_checker_loop(
        task_description,
        context=routed.skill_text,
        max_iterations=max_iterations,
        call_model=call_model,
    )
    return RoutedLoopResult(routing=routed, loop=loop_result)


@dataclass
class DryRunResult:
    memory_hits: list[dict]
    routing: RoutedSkill
    loop: LoopResult


def run_ship_feature_dry_run(
    kb_memory,
    kb_skills,
    task_description: str,
    max_iterations: int = DEFAULT_MAX_ITERATIONS,
    call_model=run_claude_headless,
) -> DryRunResult:
    memory_hits = retrieve_memories(kb_memory, query=task_description, k=5)
    routed = route_task(kb_skills, task_description)

    context_parts = []
    if memory_hits:
        memory_text = "\n".join(f"- {hit['content']}" for hit in memory_hits)
        context_parts.append(f"Relevant prior memory:\n{memory_text}")
    context_parts.append(f"Relevant skill ({routed.skill_name}):\n{routed.skill_text}")

    loop_result = run_maker_checker_loop(
        task_description,
        context="\n\n".join(context_parts),
        max_iterations=max_iterations,
        call_model=call_model,
    )
    return DryRunResult(memory_hits=memory_hits, routing=routed, loop=loop_result)
