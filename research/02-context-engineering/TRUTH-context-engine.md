# Engineering Truth: Context Engine

Studied before promoting `scripts/query-founder-knowledge.mjs` from prototype to core (PR 4 of the
AI Engineering Operating System build). Real, checked sources only — see References.

## Problem

Wingman's own `docs/status/DATABASE.md` named the gap directly: "no single file or view unifies
`checkpoints.jsonl`, `state.json`, `traceability.json`, and `memory/*.md` into one 'what has this
project decided and why' surface." A fresh session (or one after context compaction) had no
mechanical way to reconstruct project state without reading four files in three formats.

## 1. The Pioneers

- **The term "context engineering"** was coined by Shopify CEO Tobi Lütke in a June 19, 2025 post,
  defined as "the art of providing all the context for the task to be plausibly solvable by the
  LLM." Phil Schmid helped popularize the broader discipline shortly after.
- The underlying practice — assembling instructions, external knowledge, memory, and tool state
  into one coherent context for a model — predates the term by years, but the name gave the
  industry a shared vocabulary for a previously informal practice.

## 2. Current Best Implementations

| Implementation | What was checked | Real, confirmed finding |
|---|---|---|
| Sourcegraph's context-engineering guide (2026) | Read directly via search result | Frames context assembly as a first-class engineering discipline distinct from prompt engineering — informs vs. instructs |
| Kubiya's "Context Engineering for Reliable AI Agents" (2025 guide) | Read via search result | Emphasizes context *reliability* (consistency across runs) as the production concern, not just relevance |

## 3. Community Experience

Widely-cited framing (Sourcegraph, Kubiya): teams that treat context as "whatever fits in the
prompt" hit reliability problems in production — the same task succeeds or fails depending on
what happened to be in context, not on the model's actual capability. This matches Wingman's own
motivating finding directly: `docs/status/PROJECT.md`'s dogfood run found a session that forgot to
update `state.json` after a checkpoint, silently drifting from reality — exactly the "context looks
right but isn't" failure class.

## 4. Engineering Trade-offs

The industry's context-engineering guidance is about *assembling* context from multiple live
sources at request time (RAG, tool results, memory retrieval). Wingman's own problem is narrower
and more structural: the sources of truth already exist as flat files on disk
(`checkpoints.jsonl`, `state.json`, `traceability.json`, `memory/*.md`) — the gap was never "no
context available," it was "four incompatible formats with no single read path." A general RAG
pipeline would be over-engineering for a problem that's actually a parsing/unification problem, not
a retrieval problem — matching `references/constitution.md` rule 4 (clarity before complexity).

## 5. Our Synthesis

**Our Principle:** context assembly should be a pure, deterministic unification of files that
already exist — never a fresh retrieval/ranking pipeline for state Wingman itself already wrote.

**Our Architecture:** `unify()`/`unifyTiers()` in `scripts/query-founder-knowledge.mjs` read and
normalize all four (now seven, with tiers) sources into one chronologically-sortable array;
`summary()` adds the one derived signal worth computing (`state_stage_mismatch`) rather than
leaving drift detection to the reading session's judgment.

**Our Improvements:** no embeddings, no ranking, no network call — the
entire read path is `readFileSync` + `JSON.parse`/line-splitting. Zero-dependency, consistent with
`install-smoke.yml`'s CI-enforced invariant that `node_modules` never appears.

**What We Will Not Do:** build a vector index over this data. `docs/history/audit-reorg-2026-07-20.md`
already declined semantic search over Wingman's own skills for the identical reason — flat data at
this scale doesn't need it, and building one would be exactly the speculative-infrastructure pattern
this project's evidence-gate exists to block.

**Open Questions:** whether a founder's project ever grows `checkpoints.jsonl` large enough that a
full unpaginated read becomes slow — not yet observed in any real dogfood run; revisit only with
evidence.

## Strengths (of the studied prior art)

Reliability-first framing (Kubiya, Sourcegraph) is directly applicable even without adopting their
retrieval machinery — it's why `summary()`'s mismatch detector exists.

## Weaknesses (of the studied prior art)

Most public context-engineering guidance assumes a live retrieval pipeline (RAG, tool results) —
none of it addresses "four flat files already on disk, just unify them," so it informed the
*principle* (reliability matters more than cleverness) more than the *implementation*.

## Our Design

`scripts/query-founder-knowledge.mjs` (promoted from PROTOTYPE in PR 4) +
`skills/context-assembly` (new). See `docs/status/PROJECT.md`'s decisions log, PR 4 entry.

## Trade-offs (of our own design)

`unify()` stays project-tier-only for backward compatibility; `unifyTiers()` is the newer, broader
entry point — two functions doing overlapping work is a real cost, justified by not breaking every
existing caller mid-build.

## Future Improvements

None speculative — revisit only if a real dogfood run surfaces a genuine gap.

## References

- [Kubiya: Context Engineering for Reliable AI Agents (2025 Guide)](https://www.kubiya.ai/blog/context-engineering-ai-agents)
- [Sourcegraph: Context Engineering — A Practical Guide for AI Agents (2026)](https://sourcegraph.com/blog/context-engineering)
- `docs/status/DATABASE.md` — the named gap this closes.
- `docs/status/PROJECT.md`'s decisions log, PR 4 entry — the real 4-session dogfood run.
