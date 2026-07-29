# Engineering Truth: 7-Tier Memory Engine

Studied before building `scripts/memory-tiers.mjs` (PR 5). Real, checked sources only.

## Problem

The founder's spec named 7 memory tiers (Global/Org/Product/Project/Feature/Task/User) with no
existing Wingman mechanism beyond a single flat Project-tier store. Needed: a real design for
scope, precedence, and promotion — not an invented one.

## 1. The Pioneers

**MemGPT** (the research paper) introduced treating an LLM's context window like a computer's
virtual memory — the foundational idea behind tiered agent memory. **Letta** is MemGPT's
production successor, built by the same team, running a full agent runtime around that idea.

## 2. Current Best Implementations

| Implementation | What was checked | Real, confirmed finding |
|---|---|---|
| Letta (MemGPT's production successor) | Read via search result (vectorize.io comparison) | Uses an explicit OS-inspired 3-tier hierarchy: **Core Memory** (in-context, like RAM, agent reads/writes directly), **Recall Memory** (searchable history outside context, like disk cache), **Archival Memory** (long-term, queried via tool calls, like cold storage) |
| Industry convergence (2025-2026), per vectorize.io's 8-framework comparison | Read via search result | The broader ecosystem converged on a 3-tier taxonomy — episodic/semantic/procedural — described as mirroring cognitive-science memory research, not just an implementation convenience |

## 3. Community Experience

The clearest, most load-bearing finding from this research: **"each layer has different retrieval
semantics... using the same retrieval strategy for all three is a common architectural mistake"**
(vectorize.io, on Letta's design). This directly validated Wingman's own design choice —
`readAllTiers()` deliberately does *not* merge or re-rank entries across tiers into one scored list;
each tier's entries stay tagged and ordered narrowest-first, because collapsing them into one
undifferentiated pool would be exactly the mistake this finding names.

## 4. Engineering Trade-offs

Letta's 3 tiers are organized by **retention/retrieval mechanism** (what's in-context vs.
searchable vs. archival) — an orthogonal axis to Wingman's 7 tiers, which are organized by
**ownership scope** (whose fact is this, and how widely does it apply). Wingman didn't adopt
Letta's axis because the founder's actual requirement was scope-based, not retention-based — a
Global-tier fact and a Project-tier fact are both small enough to sit in a flat file read on
demand; there's no in-context/archival distinction to make at Wingman's scale (dozens of bullet
lines, not a running agent's full conversation history).

## 5. Our Synthesis

**Our Principle:** narrower scope wins on precedence, but no tier's data is ever discarded or
silently merged into another — matching the "different retrieval semantics per layer, don't
conflate them" finding above, applied to a scope axis instead of a retention axis.

**Our Architecture:** `scripts/memory-tiers.mjs`'s `tierDir()`/`readTier()`/`readAllTiers()`/
`writeTierEntry()`. Product and Project collapse to one store — a real, disclosed design decision,
not an oversight (Wingman has no multi-product-per-project concept to justify two tiers).

**Our Improvements:** a mechanical (not documented-only) approval gate on
the two out-of-repo tiers (Global/Org) — `writeTierEntry()` throws without `{ approved: true }`.
Neither Letta nor the broader survey material described an approval-gated promotion path between
tiers; this is Wingman's own addition, driven by the founder's explicit "promotion is never
automatic" requirement.

**What We Will Not Do:** adopt Letta's retention-based tiering (Core/Recall/Archival) as a second,
parallel axis. Two independent tiering systems for the same underlying files would be exactly the
premature-complexity pattern `references/constitution.md` rule 4 warns against, with no evidenced
Wingman-scale need for it (files here are read in full on every access; there is no context-window
budget being managed).

**Open Questions:** whether a founder's Global-tier store ever grows large enough that
`readAllTiers()`'s full-file reads become a real cost — not observed; revisit with evidence only.

## Strengths (of the studied prior art)

The "don't use one retrieval strategy for every tier" finding is a real, transferable engineering
principle, independent of which axis (retention vs. scope) a system tiers along.

## Weaknesses (of the studied prior art)

Letta's tiers solve a problem Wingman doesn't have (bounding what fits in a live model's context
window during a long-running agent process) — Wingman has no persistent runtime
(`docs/status/ARCHITECTURE.md` §2), so a direct port of Letta's axis would solve a problem that
doesn't exist here while leaving the founder's actual scope-ownership problem unsolved.

## Our Design

`scripts/memory-tiers.mjs` (new, PR 5), extending `scripts/query-founder-knowledge.mjs` via
`unifyTiers()`. See `docs/status/PROJECT.md`'s decisions log, PR 5 entry.

## Trade-offs (of our own design)

Product/Project's collapse means the founder's spec's literal 7-tier vocabulary maps to 6 distinct
storage locations in practice — disclosed plainly rather than silently implemented as if 7 real
tiers existed.

## Future Improvements

None speculative. If Wingman ever grows a genuine persistent-runtime component where in-context
budget actually matters, Letta's retention-based tiering becomes directly relevant research to
revisit — not before.

## References

- [Vectorize.io: Best AI Agent Memory Systems in 2026 — 8 Frameworks Compared](https://vectorize.io/articles/best-ai-agent-memory-systems)
- [Vectorize.io: Mem0 vs Letta (MemGPT) — AI Agent Memory Compared (2026)](https://vectorize.io/articles/mem0-vs-letta)
- `docs/status/PROJECT.md`'s decisions log, PR 5 entry — the real cross-project isolation test.
