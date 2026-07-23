"""Wires the previously-isolated pieces together: skill routing feeds real
context into the Maker/Checker loop, and (for the end-to-end dry run) memory
retrieval feeds context in too.

Confirmed before writing this: `route_task()` and `run_maker_checker_loop()`
were built and tested in complete isolation -- grepped, zero cross-references
either direction. `route_task`'s own docstring names the consequence
directly: the "a Checker will catch a wrong skill pick" safety net has no
real teeth until something actually wires the router's output through the
loop. This module is that wiring.
"""

from __future__ import annotations

from dataclasses import dataclass

from agents.loop import DEFAULT_MAX_ITERATIONS, LoopResult, run_maker_checker_loop
from agents.model_runner import run_claude_headless
from knowledge.skill_router import RoutedSkill, route_task
from mcp_server.memory_tools import retrieve_memories


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
    """Routes to the best-matching skill, then runs the Maker/Checker loop
    with that skill's full text as context.

    `routing.confidence` is always surfaced on the returned object -- a
    `low_confidence_fallback` result must be visible to the caller, never
    silently swallowed, matching `route_task`'s own existing honesty
    standard.
    """
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
    """The real `.claude/commands/ship-feature.md` chain, exercised end to
    end: retrieve relevant memory, route to the best skill, run the loop
    with both folded into context. Every stage's own output is returned, not
    just the final answer, so a caller can inspect the full chain."""
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
