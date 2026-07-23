# Agnostic Boardroom (experimental, in-progress rewrite)

**Status: Phase 1 (Data & Schema) done. Phase 2a (skill-context A/B testing) done. Phase 2 (MCP server) not started. Not installable, not wired into anything yet.**

This is a from-scratch Python backend rebuild of Wingman's Boardroom/pipeline concepts as a
standalone, agent-agnostic MCP server — LangGraph-style graph orchestration (via
[Agno](https://github.com/agno-agi/agno), chosen over LangGraph for its smaller footprint and
declarative style, more in keeping with this project's own `engineering-minimalism` discipline),
typed Maker/Checker micro-loops, a vector-store-backed skill router, and a real relational store
for checkpoints/threat-register/debt-ledger/traceability data.

**This does not replace `plugins/wingman/` today.** The existing markdown Claude Code plugin under
`plugins/wingman/` is Wingman's shipped, working product and keeps operating unchanged throughout
this build-out. Nothing here is deleted, retired, or wired to override it until this backend is
proven end-to-end. See `docs/PROJECT.md`'s decisions log for the full record of why this was built
additively rather than as an in-place replacement.

## Why this exists

A full architectural rewrite proposal (LangGraph/PydanticAI/MCP/vector-store/SQL state,
`docs/PROJECT.md`'s decisions log has the full pasted blueprint and the evaluation) was reviewed
against Wingman's existing, documented decisions — several of which it directly reverses (the
flat-file state store choice in `docs/DATABASE.md`, the unconditional any-`NO_GO`-blocks Boardroom
gate rule, the v16 audit's evidence-based rejection of vector search / self-healing / enterprise
governance for zero cited need). Those conflicts were surfaced and the user explicitly confirmed:
build it anyway, as a full rewrite, evaluating Agno over LangGraph. This directory is that build,
in progress.

## Phases (see `docs/PROJECT.md` decisions log for the full execution protocol)

1. **Data & Schema** (in progress) — `core/state_schema.py`: Pydantic models for `ProjectState`,
   `BoardroomVerdict`, `ThreatRegisterEntry`, `CheckpointRecord`, `DebtLedgerEntry`,
   `TraceabilityLink`. Guarantees type safety before any agent logic is written.
2. **The MCP Server** (not started) — stand up `mcp_server/server.py`, prove a dummy tool call and
   a resource read work end-to-end via a real MCP client, before adding any AI logic.
3. **The Micro-Loops** (not started) — `agents/departments/engineering_maker.py` +
   `agents/boardroom/cto_evaluator.py` as an Agno Maker/Checker pair; prove a real 3-iteration
   bounded rejection loop with no human input.
4. **The Macro-Graph** (not started) — wrap the micro-loops in Agno's own workflow/topology
   primitives; Discovery → Define → Build → Ship.

## Phase 2a: skill-context A/B testing (done)

`knowledge/vector_store.py` + `knowledge/ab_harness.py` — a real, running A/B comparison of
Wingman's own two candidate context strategies for a subagent's skill payload: **Variant A**
(today's approach — the whole `SKILL.md` in context) vs. **Variant B** (the blueprint's Pillar II
proposal — top-k vector-retrieved chunks only). Uses Agno's own `Knowledge` abstraction over an
embedded LanceDB table (a single local directory, no server — the "lightest minimal runtime"
property that motivated choosing Agno over LangGraph) and a local FastEmbed model (ONNX, no
Anthropic/OpenAI API key required), indexing the real, already-shipped `plugins/wingman/skills/*/SKILL.md`
files, not synthetic content. Retrieval timing reuses Agno's own `agno.eval.performance.PerformanceEval`
rather than a hand-rolled timer.

**What this honestly measures, and what it doesn't.** Each run logs an append-only `ABTestResult`
row per variant (`.data/ab_results.jsonl`, mirroring `.wingman/checkpoints.jsonl`'s own
append-only-audit-log convention) with a real `tiktoken` token count and retrieval latency. Real
measured numbers against actual skill files, at a tuned `chunk_size=800` (Agno's 5000-char default
barely sub-divided a ~10K-char `SKILL.md`, giving near-zero compression until tuned down — a real
finding, not assumed): **`systematic-debugging`** 2211 → 536 tokens (~76% reduction);
**`engineering-minimalism`** 2427 → 545 tokens (~78% reduction) — both within the blueprint's
claimed 60-80% range, but earned by measurement, not asserted. This layer does **not** claim
decision quality is preserved under the reduced context — verifying that needs an actual agent run
against each variant and a Definition-of-Done check on its output, which needs live model
inference (Phase 3, the Maker/Checker loop, not built yet). Logging a fabricated quality score here
would be exactly the "purposeless data" this A/B layer exists to avoid.

## Running this today

Nothing here runs yet beyond `pytest tests/` against the Phase 1 schema module. There is no
installed package, no server, no CLI. Do not point any tooling at this directory expecting a
working MCP server — that's Phase 2.
