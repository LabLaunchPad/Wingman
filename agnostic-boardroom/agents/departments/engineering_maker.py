"""The Maker: generates a solution for one task (optionally re-attempting
with the Checker's prior rejection reason folded in)."""

from __future__ import annotations

from agents.model_runner import RunResult, run_claude_headless


def generate(
    task_description: str,
    context: str = "",
    prior_feedback: str | None = None,
    call_model=run_claude_headless,
) -> RunResult:
    prompt_parts = [f"Task: {task_description}"]
    if context:
        prompt_parts.append(f"\nRelevant skill context:\n{context}")
    if prior_feedback:
        prompt_parts.append(
            f"\nYour previous attempt was rejected for this reason -- fix it:\n{prior_feedback}"
        )
    prompt_parts.append(
        "\nRespond with only the solution (code or text), no preamble or explanation."
    )
    return call_model("\n".join(prompt_parts))
