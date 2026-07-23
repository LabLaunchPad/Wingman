# Agnostic Boardroom (experimental, in-progress rewrite)

**Status: Phase 1 (Data & Schema), Phase 2a (skill-context A/B testing), Phase 2 (data substrate,
memory MCP server, skill router, loop/graph engineering, an experimental slash command), and Phase
2b (real MCP client wiring, skill-router→loop integration, an end-to-end dry run) all done. 42/42
fast tests pass, plus 2/2 real live-model tests (run explicitly, cost real money). Not installable
as a plugin, not wired into `plugins/wingman/` — this remains a standalone, additive backend.**

## Phase 2b: closing the "built in isolation" gaps

Phase 2 shipped three pieces that were each tested on their own but never proven to work *together*:
the memory MCP server was never run as a live subprocess, `skill_router.py`'s `route_task()` was
never actually fed into `agents/loop.py`'s `run_maker_checker_loop()`, and `.claude/commands/
ship-feature.md`'s described chain (memory → routing → loop) was never exercised end to end. All
three closed:

- **A real MCP client** (`tests/test_mcp_server_live.py`, using `mcp.client.stdio` + `ClientSession`)
  spawns `python -m mcp_server.server` as a genuine subprocess and calls its 3 tools over the actual
  protocol. **Found and fixed a real bug in the process**: Agno's own `INFO` logging writes to
  stdout by default, which corrupted the stdio transport's JSON-RPC framing — `logging.disable()`
  in `mcp_server/server.py` fixes it. A second real finding: `python mcp_server/server.py` (script
  mode) puts `mcp_server/` itself on `sys.path`, not the repo root, breaking `from db.connection
  import ...` — the fix is invoking as `python -m mcp_server.server` with `cwd` set to the repo root.
- **`agents/pipeline.py`** wires `route_task()`'s output into `run_maker_checker_loop()`'s `context`
  for real (`run_task_with_routing`), surfacing `routing.confidence` explicitly rather than
  swallowing a `low_confidence_fallback` result. Verified with real routing (the real 40-skill
  index) + a fake, zero-cost `call_model` for the loop side: the routed skill's actual text is
  confirmed present in what the Maker's prompt received, not just structurally on the result object.
- **`run_ship_feature_dry_run()`** (also in `agents/pipeline.py`) exercises the full chain: real
  memory retrieval → real skill routing → the wired loop, with every stage's output inspectable, not
  just the final answer. `tests/test_end_to_end_dry_run.py` seeds a real memory fact and confirms it
  genuinely reaches the Maker's prompt alongside the routed skill's text.

Deliberately did **not** re-spend real `claude -p` money proving the Maker/Checker loop's own live
rejection behavior again here — that's already proven in `tests/test_loop_live.py`; these new tests
prove the *wiring* is real using mocked, zero-cost model calls.

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

1. **Data & Schema** (done) — `core/state_schema.py`: Pydantic models for `ProjectState`,
   `BoardroomVerdict`, `ThreatRegisterEntry`, `DebtLedgerEntry`, `TraceabilityLink`. Guarantees type
   safety before any agent logic is written.
2. **SQLite data substrate** (done) — `db/connection.py`/`db/schema.py`/`db/repository.py`:
   one SQLite file, WAL mode, one table per concern from item 1's Pydantic models, running alongside
   `.wingman/*.jsonl` non-destructively. 8 tests, including a real WAL concurrency test (a second
   connection writes successfully while a first holds an open read transaction — no `SQLITE_BUSY`)
   and a schema-deviation test proving an invalid payload lands in `threat_register`, not dropped.
3. **Memory MCP server** (done) — `mcp_server/`: `store_memory`/`retrieve_memories`/
   `list_memories`, scoped strictly to `.wingman/memory/*.md`-equivalent content, a 3-tier
   session/project/org layer taxonomy, semantic search reusing `vector_store.py`'s FastEmbed
   embedder against its own separate LanceDB table. 5 tests, including the founder's own exact
   stress-test bar: 500 entries inserted, 20 sequential reads timed, p95 < 100ms.
4. **Skill router** (done) — `knowledge/skill_router.py`: cross-skill dispatch over the existing
   40-skill index, whole-skill granularity, a real cosine-similarity retrieval budget (top 5-10,
   ceiling 15, threshold ~0.5) using `vector_db.vector_search()`'s raw `_distance` field (confirmed:
   the high-level `Knowledge.search()` API doesn't expose a score at all). 3 tests, including a
   real routed query and a real low-confidence-fallback case.
5. **Loop engineering** (done) — `agents/model_runner.py` + `agents/departments/engineering_maker.py`
   + `agents/boardroom/cto_evaluator.py`: a real Maker/Checker pair using headless `claude -p`
   subprocess calls (see "Live model inference" below) for genuine, non-mocked rejection/escalation
   behavior, bounded at 3 iterations. 5 fast mocked-control-flow tests (iteration cap, escalation,
   cost summation, Checker fail-closed-on-bad-JSON) plus **2 real live tests** (`test_loop_live.py`,
   run explicitly via `pytest -m live_model`, real dollar cost): a live Checker genuinely rejecting
   an obviously wrong solution, and a full live Maker→Checker pass with real, non-zero logged cost.
6. **Graph engineering** (done) — `agents/graph.py` wraps item 5's loop in the real, existing
   7-stage pipeline topology (Discovery → Define → Architecture → UX → Implementation-Planning →
   Build → Ship) — deliberately mirrored, not redesigned. 4 tests proving it never auto-advances
   past a stage that requires a founder checkpoint, and stops (rather than silently skipping) on a
   stage with no registered handler.
7. **Experimental slash command** (done) — `.claude/commands/ship-feature.md`, a thin MCP client.
   **Real placement correction, found by actually running the validator, not assumed**: the original
   plan called for `plugins/wingman/commands/experimental/`, but `validate-structure.mjs`'s own
   orphan check treats any `.md` under `plugins/wingman/commands/` not listed in `plugin.json` as a
   hard error ("it will never load") — confirmed by running it. `.claude/commands/` (Claude Code's
   real project-scoped custom-command mechanism) is outside `plugins/wingman/` entirely, so it's
   still a genuinely invocable command with none of the plugin's validators applying to it.

## Live model inference: headless `claude -p`, not a separate API key

Phase 3/4 originally looked blocked — a real Maker/Checker loop needs live model inference, and no
`ANTHROPIC_API_KEY` is configured for this Python process to call directly. Resolved by the founder:
use **the AI model already available in the AI coding agent** — the same authenticated `claude` CLI
this session itself runs on, via headless `claude -p "..." --output-format json` subprocess calls.
Verified live in this exact sandbox before committing to the design: a real completion came back
with a real `session_id`, real token usage, and a real `$0.26` cost for a single trivial one-word
reply — this is the identical mechanism `evals/run-headless.mjs` already uses and trusts elsewhere
in this repo, not a new, unverified idea. One real consequence worth stating plainly: **each
headless call has a real dollar cost**, so the Maker/Checker loop's iteration cap bounds real
spend, not just step count — every run logs its actual `total_cost_usd` (a field `claude -p` already
returns), not a hidden or estimated figure.

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

`cd agnostic-boardroom && python -m pytest tests/` runs the fast suite (36 tests, no live model
calls, no real cost). `pytest -m live_model` additionally runs the 2 tests that make real,
non-trivial-cost `claude -p` calls — run those deliberately, not as part of routine iteration.
`python mcp_server/server.py` starts the real memory MCP server over stdio. There is still no
installed package, no HTTP server, and nothing here is wired into `plugins/wingman/` — this remains
a standalone backend a founder cannot install today.
