# Agnostic Boardroom (experimental, in-progress rewrite)

**Status: Phase 1 (Data & Schema), Phase 2a (skill-context A/B testing), Phase 2 (data substrate,
memory MCP server, skill router, loop/graph engineering, an experimental slash command), Phase 2b
(real MCP client wiring, skill-router→loop integration, an end-to-end dry run), Phase 3
(decision-quality comparison harness, zero-cost), Phase 4 (a real, invokable engineering-review
engine + MCP tools + project-level registration), and Phase 5 (the live decision-quality A/B itself,
real money spent) all done. 52/52 fast tests pass, plus 2/2 real live-model tests (run explicitly,
cost real money). **Phase 5's real result is a genuine caution, not a green light**: the new engine
disagreed with the shipped plugin's real CTO persona on 1 of 2 scenarios — and disagreed by being
*too lenient*, accepting a bug the real persona caught. Still not installable as a Wingman plugin and
`plugins/wingman/commands/adaptive/boardroom.md` is still untouched — see Phase 5's writeup below for
the real numbers, and Phase 4's honest-scope note for what "wired in" does and doesn't mean here.**

## Phase 5: the live decision-quality A/B — real money, real result, a real caution

The one experiment every prior phase deferred: does `boardroom_engine.py` reach as good a decision
as the shipped plugin's real Boardroom, not a scripted stand-in for one. Run via
`eval/live_ab_run.py`, kept deliberately small for cost efficiency (2 real scenarios,
`max_iterations=2` not the harness's default 3, one extra call per scenario) — **no separate API
key**, the same headless `claude -p` mechanism this whole rewrite has used from the start.

**Methodology**: for each scenario, `boardroom_engine.py`'s real Maker/Checker loop runs to its
real, live conclusion (a real candidate solution, really accepted or escalated). That exact
artifact is then handed to a single live call framed with the real, unmodified CTO seat persona
(`plugins/wingman/agents/boardroom-cto.md`, read from disk at run time, never copy-pasted, so it
can't silently drift from what's actually shipped) — asking whether the shipped plugin's own CTO
seat would independently reach the same verdict on the same artifact.

**Real results** (both entries in `eval/.data/live_ab_results.jsonl`, independently re-read, not
trusted from the script's own printed summary):

| Scenario | New engine | Shipped CTO persona | Agree? |
|---|---|---|---|
| `palindrome-check` | `GO_WITH_CONCERNS` (accepted a solution that strips spaces but not punctuation) | **`NO_GO`** — named the exact punctuation gap and demanded a fix + test cases before shipping | **No** |
| `simple-email-validation` | `GO_WITH_CONCERNS` (downgraded only because of a low-confidence skill route, not a content concern) | `GO` — clean, no concerns | Nominally yes, but for different reasons |

**Total real cost: $0.855020** (`palindrome-check`: $0.153924; `simple-email-validation`:
$0.701096 — a genuinely wrong-first-attempt case that needed a real 2nd Maker iteration, confirmed
by the loop's own `iterations` count).

**The honest reading, not a rounded-up "50% agreement"**: on the one scenario where the two systems
actually disagreed in substance, the new engine was *wrong in the more dangerous direction* — it
accepted code with a real bug that the shipped, already-working plugin caught and named specifically.
The "agreement" on the second scenario wasn't even reached the same way: the new engine's
`GO_WITH_CONCERNS` came from routing uncertainty (`low_confidence_fallback`), not from any actual
concern about the code, while the real CTO persona said clean `GO` for a genuinely different reason.
Two scenarios is nowhere near enough to conclude a rate, but it's enough to answer the actual
question asked: **no, this hasn't yet demonstrated it's as good as the shipped plugin's real
judgment — the one real disagreement observed points the other way.** This is exactly the caution a
"prove decision-quality first" bar exists to catch, and exactly why overriding that bar to build and
register the engine anyway (Phase 4) doesn't mean the engine is ready to actually decide anything for
a real founder yet.

A real bug in the harness itself was also found and fixed while running this: the original script
only wrote results to `eval/.data/live_ab_results.jsonl` after every scenario succeeded, so a later
scenario's real (paid-for) failure would have silently discarded an earlier scenario's already-spent
result. Fixed to write incrementally, one scenario at a time.

## Phase 6: root-caused the gap, fixed it, re-ran the A/B — result is nuanced, not a clean win

Direct comparison of the real prompt templates found the gap: `boardroom-cto.md` has an explicit
5-point checklist; `cto_evaluator.py`'s Checker prompt had none. `eval/checker_rubric_ab.py` proved
this in isolation — injecting the checklist into the Checker's prompt flipped its verdict on the
known-buggy `palindrome-check` code from accepted to rejected ($0.097233). The checklist was then
ported permanently into `cto_evaluator.py`, and the original 2-scenario A/B was re-run for real.

**Real re-run result** (`eval/.data/live_ab_results.jsonl`, entries 3-4):

| Scenario | New engine (post-fix) | Shipped CTO persona | Agree? |
|---|---|---|---|
| `palindrome-check` | `NO_GO`, **escalated** (rejected its own fix attempt — `[c for c in s if c.isalnum()]` strips more than the fix needed) | `GO_WITH_CONCERNS` — same concern, but judged shippable | **No** |
| `simple-email-validation` | `GO_WITH_CONCERNS` (routing uncertainty, unchanged) | `GO` | Nominally yes |

Total re-run cost: **$0.804398** (combined with the original run + rubric test: **$1.756651** real
spend across this whole investigation so far).

**Honest reading — this is not "the fix worked"**: agreement is still 1 of 2, the same rate as
before. What changed is the *direction* of the one real disagreement: pre-fix, the Checker was too
lenient (accepted a real bug the persona caught). Post-fix, it swung to too strict — it escalated
(blocked shipping entirely) on a solution the persona would have shipped with a documented caveat.
The checklist fixed the specific miss it was built to fix (confirmed in isolation), but calibrating
a rubric-bearing Checker to match a persona's actual judgment — not just "notice more things," but
weigh severity the same way — is evidently a harder, unsolved problem than adding the checklist
alone. This is real, disclosed evidence against declaring the gap closed, not for it.

The founder reviewed Phase 1-3's real-metrics readiness report and explicitly chose to proceed on the
strength of the already-measured token-compression result alone, overriding the earlier
"prove decision-quality against the shipped plugin first" bar — see `docs/PROJECT.md`'s decisions
log for the exact exchange. Two things were built as a result:

1. **`agents/boardroom_engine.py`** composes `retrieve_memories` + `route_task` +
   `run_maker_checker_loop` into a single, real `BoardroomVerdict` — the exact same Pydantic model
   `core/state_schema.py` already defines, ported faithfully from the shipped plugin's own
   `.wingman/checkpoints.jsonl` schema. `to_boardroom_verdict()` maps loop outcomes onto it: accepted
   + a confident skill match → a clean `GO`; accepted but only via a `low_confidence_fallback` route
   → downgraded to `GO_WITH_CONCERNS` (never silently reported as clean); escalated (never accepted
   within the iteration cap) → `NO_GO`, `bottom_line: DO NOT SHIP`, `blocks_advancement: true` — the
   real gate rule, unchanged.
2. **Two new MCP tools** on the existing memory server (renamed `wingman-agnostic-boardroom` in
   `.mcp.json` at the repo root, so a real Claude Code session can actually connect to it):
   `route_task_tool` (zero-cost, vector retrieval only) and `run_engineering_review_tool` (the real
   engine above, returned as a plain dict matching `BoardroomVerdict.model_dump()`).

**Honest scope, stated plainly rather than overclaimed**: this is **one seat's** worth of judgment —
a technical/engineering accept-or-reject gate, the same shape of call the Maker/Checker loop already
proves it can make. It is **not** a replacement for the shipped plugin's other 7 seats (CEO/CPO/CMO/
CISO/CFO/Research/Design business, security, and financial judgment) — those personas have no
equivalent in this backend today, and building them was not part of this pass. **The shipped
`plugins/wingman/commands/adaptive/boardroom.md` itself is deliberately left untouched** — cutting
over Wingman's real, founder-facing gate to call this engine instead of dispatching its 8 markdown
personas is a separate, much higher-blast-radius decision (it's the load-bearing check every real
founder using the installed plugin depends on) than building and registering the engine so it's
real and callable. 4 new tests (`test_boardroom_engine.py`) cover all 3 verdict paths (clean GO,
downgraded GO_WITH_CONCERNS, blocking NO_GO) plus the real seeded-memory read-back, all against the
real 40-skill index and a real seeded memory store, mocked only on the model-call side (zero cost).

**Also generalized in this pass**: `agents/model_runner.py`'s `run_claude_headless` no longer
hardcodes `"claude"` as the CLI binary — it reads `WINGMAN_MODEL_CLI` (default `claude`), so a second
harness isn't architecturally impossible. No second adapter ships, though: writing one without a way
to actually run and verify it against a real second CLI in this sandbox would mean shipping untested
code claiming to work, which is exactly what this project's own `verification-before-completion`
discipline exists to prevent.

## Phase 3: decision-quality harness — proving the methodology before spending real money

After Phase 2b, a real-metrics readiness review (not a self-report — every number traced to a test
file or a live-confirmed figure) surfaced the actual open question this rewrite hasn't answered yet:
not "does the pipeline run" (it does), but "does it reach as good a decision as the shipped plugin's
real Boardroom would, at a cost worth paying." The founder confirmed building toward that comparison
next, and — given real live-model calls cost real money (confirmed ~$0.26 for a single trivial
reply) — to prove the comparison *methodology* on scripted, zero-cost scenarios first, deferring any
live spend to a later, explicitly-authorized round.

`eval/decision_quality.py` is that harness: a `Scenario` names the ground-truth outcome (accepted /
escalated, at what iteration) a correct Maker/Checker loop should reach for a scripted sequence of
Maker attempts and Checker verdicts; `run_scenario` runs the real, unmodified
`agents.loop.run_maker_checker_loop` against that script and checks whether its actual outcome
matches. The same harness runs unmodified against a real `call_model` (e.g. `run_claude_headless`)
once live spend is authorized — only the injected model call changes, not the harness.

`eval/scenarios.py` holds 4 labeled scenarios, each exercising a genuinely different code path (not
a cosmetic restatement of another, per this project's own eval discipline): correct on the first
try; wrong then fixed via the Checker's real rejection reason; never fixed, escalating after the
iteration cap; and a Checker response that fails to parse as JSON, proving the fail-closed path
doesn't get silently treated as acceptance. `tests/test_decision_quality.py` adds the harness's own
negative case — a scenario with a deliberately wrong expected outcome, proving `run_scenario` can
actually report a mismatch rather than rubber-stamping every result.

**Known, disclosed limitation**: this proves the loop mechanism reaches the expected decision for a
scripted exchange. It does not yet compare against a live run of the shipped plugin's own
`/wingman:boardroom` on the same task — that comparison needs two real model runs, one per system,
on identical input, and stays the deferred next step once live spend is authorized. See
`docs/PROJECT.md`'s decisions log for the exact exchange this phase resolves and defers.

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
