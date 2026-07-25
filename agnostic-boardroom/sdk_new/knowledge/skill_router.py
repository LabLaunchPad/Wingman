"""Cross-skill dispatch: given a task, decide which single skill applies.

Distinct from `vector_store.py`'s `retrieve_top_k_chunks`, which searches
*within* an already-named skill. This module answers "which skill(s) should
even be loaded for this task" -- routing at whole-skill granularity, per the
founder's explicit directive: never assemble a mixed context across multiple
skills' chunks, since that risks handing the agent fragmented, contradictory
instructions (e.g. a database-migration chunk from one skill mixed with a
state-management chunk from an unrelated one).

Confirmed empirically before writing this: Agno's high-level
`Knowledge.search()` does not surface a similarity score (its
`reranking_score` field is for a reranker step, always None without one
configured) -- the real score lives one layer down, on
`vector_db.vector_search()`'s raw dict results, as a `_distance` field.
LanceDB's configured default metric is cosine distance
(`agno.vectordb.distance.Distance.cosine`), so similarity = 1 - distance.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Literal

from agno.knowledge.knowledge import Knowledge

from knowledge.vector_store import load_full_skill_text

# Founder-specified retrieval budget: cap injected context, discard anything
# below the relevance threshold rather than padding to a fixed chunk count.
MIN_CHUNKS = 5
MAX_CHUNKS = 10
HARD_CEILING = 15
SIMILARITY_THRESHOLD = 0.5

Confidence = Literal["matched", "low_confidence_fallback"]


@dataclass
class RoutedSkill:
    skill_name: str
    skill_text: str
    confidence: Confidence
    best_similarity: float
    matched_chunk_count: int


def _score_chunks(kb: Knowledge, query: str, fetch_limit: int) -> list[dict]:
    """Returns [{name, content, similarity}, ...] via the raw vector_search
    path, since the high-level Knowledge.search() API doesn't expose scores."""
    raw_results = kb.vector_db.vector_search(query, limit=fetch_limit)
    scored = []
    for r in raw_results or []:
        payload = json.loads(r["payload"])
        similarity = 1.0 - r["_distance"]
        scored.append({"name": payload["name"], "content": payload["content"], "similarity": similarity})
    return scored


def route_task(kb: Knowledge, task_description: str, fetch_limit: int = HARD_CEILING) -> RoutedSkill:
    """Picks the single best-matching skill for `task_description`.

    On a low-confidence match (nothing clears SIMILARITY_THRESHOLD), proceeds
    anyway with the single highest-ranked skill rather than halting -- per
    the founder's explicit directive. KNOWN GAP, stated plainly rather than
    swept under "the Checker will catch it": until a real Maker/Checker loop
    (see agents/) is wired to actually consume this router's output and
    verify it, this fallback has no verification safety net behind it yet.
    Callers must check `.confidence` and are responsible for their own
    handling of a `low_confidence_fallback` result until that loop exists.
    """
    scored = _score_chunks(kb, task_description, fetch_limit)
    if not scored:
        raise ValueError("No skills indexed -- build_skill_knowledge() must run first")

    # Best similarity per skill (a skill can have multiple matching chunks).
    best_per_skill: dict[str, float] = {}
    matched_count = 0
    for chunk in scored:
        name = chunk["name"]
        if chunk["similarity"] >= SIMILARITY_THRESHOLD:
            matched_count += 1
        best_per_skill[name] = max(best_per_skill.get(name, float("-inf")), chunk["similarity"])

    above_threshold = {name: sim for name, sim in best_per_skill.items() if sim >= SIMILARITY_THRESHOLD}

    if above_threshold:
        best_name = max(above_threshold, key=above_threshold.get)
        confidence: Confidence = "matched"
    else:
        # Nothing cleared the bar -- proceed anyway with the single best
        # overall match, per founder directive.
        best_name = max(best_per_skill, key=best_per_skill.get)
        confidence = "low_confidence_fallback"

    return RoutedSkill(
        skill_name=best_name,
        skill_text=load_full_skill_text(best_name),
        confidence=confidence,
        best_similarity=best_per_skill[best_name],
        matched_chunk_count=min(max(matched_count, MIN_CHUNKS if matched_count else 0), MAX_CHUNKS),
    )
