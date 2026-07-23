"""A/B harness: full-SKILL.md context vs. vector-retrieved context.

Measures two honest, mechanically-verifiable things per variant:
  1. token_count   -- via tiktoken, a real tokenizer, not a word-count proxy.
  2. retrieval latency -- via Agno's own `agno.eval.performance.PerformanceEval`
     (reused, not reinvented -- this is the "how do we use Agno more" answer
     for this piece: Agno already ships a warmup+multi-iteration performance
     harness, so this wraps it rather than hand-rolling a timer).

Logs one ABTestResult row per variant, per run, append-only to a local JSONL
file -- the same append-only-audit-log convention `.wingman/checkpoints.jsonl`
already uses in the existing plugin (see docs/DATABASE.md), reused here
deliberately for consistency rather than inventing a new logging shape.
"""

from __future__ import annotations

import json
import uuid
from pathlib import Path

import tiktoken
from agno.eval.performance import PerformanceEval

from core.state_schema import ABTestResult, ContextVariant
from knowledge.vector_store import (
    build_skill_knowledge,
    load_full_skill_text,
    retrieve_top_k_chunks,
)

DEFAULT_LOG_PATH = Path(__file__).parent / ".data" / "ab_results.jsonl"

_ENCODING = tiktoken.get_encoding("cl100k_base")


def count_tokens(text: str) -> int:
    return len(_ENCODING.encode(text))


def run_ab_test(
    skill_name: str,
    query: str,
    kb=None,
    k: int = 3,
    log_path: Path | str = DEFAULT_LOG_PATH,
) -> list[ABTestResult]:
    """Run both context-strategy variants for one (skill, query) pair.

    `kb` may be a pre-built Knowledge instance (reuse across many runs to
    avoid re-indexing every skill on every call); builds a fresh one over all
    real skills if omitted.
    """
    if kb is None:
        kb = build_skill_knowledge()

    run_id = str(uuid.uuid4())
    results: list[ABTestResult] = []

    # Variant A: full SKILL.md text, no retrieval step -- no latency to measure.
    full_text = load_full_skill_text(skill_name)
    results.append(
        ABTestResult(
            run_id=run_id,
            skill_name=skill_name,
            query=query,
            variant=ContextVariant.FULL_CONTEXT,
            context_text=full_text,
            token_count=count_tokens(full_text),
            retrieval_latency_ms=None,
        )
    )

    # Variant B: top-k retrieved chunks -- measure the retrieval step's real
    # runtime via Agno's own PerformanceEval rather than a hand-rolled timer.
    perf = PerformanceEval(
        func=lambda: retrieve_top_k_chunks(kb, query, k=k),
        measure_memory=False,
        warmup_runs=1,
        num_iterations=3,
        show_spinner=False,
    )
    perf_result = perf.run()
    retrieved_chunks = retrieve_top_k_chunks(kb, query, k=k)
    retrieved_text = "\n\n".join(retrieved_chunks)
    avg_run_time_s = perf_result.avg_run_time if perf_result is not None else None

    results.append(
        ABTestResult(
            run_id=run_id,
            skill_name=skill_name,
            query=query,
            variant=ContextVariant.RETRIEVED_CONTEXT,
            context_text=retrieved_text,
            token_count=count_tokens(retrieved_text),
            retrieval_latency_ms=(avg_run_time_s * 1000) if avg_run_time_s is not None else None,
        )
    )

    _append_results(results, log_path)
    return results


def _append_results(results: list[ABTestResult], log_path: Path | str) -> None:
    log_path = Path(log_path)
    log_path.parent.mkdir(parents=True, exist_ok=True)
    with log_path.open("a") as f:
        for result in results:
            f.write(result.model_dump_json() + "\n")
