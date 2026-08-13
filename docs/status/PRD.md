# Wingman — Product Requirements Document

**Rewritten 2026-07-30** as part of a 19-layer validation pass (Layers 2/3/9). Added the 5 sections the framework requires that were missing (personas, JTBD, business outcomes, dependencies, acceptance criteria) and corrected two stale claims found while doing so: "Adaptive commands" listed 5 of the real 20, and "Out of scope for v1" claimed `/wingman:hotfix`/`/wingman:launch` weren't built — both exist.

## Problem

A non-technical solo founder who wants to build and ship real software today has two bad options: hire/manage engineers they can't technically evaluate, or use an AI coding tool directly and be asked to approve plans and review diffs they cannot actually judge. Either way, the moment that matters most — "is this safe and worth shipping" — is decided by someone other than the founder, or by the founder rubber-stamping something they don't understand.

## Target user

A solo founder with no engineering background, running Claude Code (directly or through Wingman's guidance) to build their own product. They can describe business outcomes ("what I want and why it matters") but cannot evaluate a diff, an architecture tradeoff, a security finding, or a cost projection on their own.

## Personas

**Status: deferred, explicitly.** Wingman's own 7-stage UX Intelligence Engine produces real personas/JTBD for *founder projects*, but Wingman has none for itself — writing them now, with no real external user input, would fabricate research (`references/constitution.md` rule 1: grounding truth before generation). Held open rather than filled with maintainer-proxy guesses.

**Re-visit trigger**: the first 3 real, non-maintainer founder installs that produce genuine usage signal (per `docs/HUMAN-TODOS.md`'s demo-footage/dogfooding items). Until then, this section stays a named gap — not silently dropped, not silently invented.

## Jobs to be done

Unlike personas (which need real people to be honest), a JTBD statement can be derived directly from the Problem/Target-user sections already validated above, without inventing a person:

> When a non-technical founder needs software built and is faced with either learning to review code or trusting a black box, they want an AI system that makes every consequential decision legible in plain language, so they can approve or reject with real understanding instead of blind trust.

## Business outcomes

**Business intent, recorded explicitly** (previously unrecorded — flagged as a Layer 2 validation failure, since MIT licensing plus zero paid infrastructure anywhere in this repo implied but never stated an intent):

- **Free, open-source, no monetisation.** Wingman is MIT-licensed and distributed as a free Claude Code plugin. There is no paid tier, no revenue model, and no lead-generation mechanism built into the product itself.
- This is a **non-goal**, not an oversight — see the Non-goals section below, where it's now stated directly rather than left inferable from the license file alone.
- **Re-visit condition**: if this changes (a paid tier, a hosted offering, a services/consulting angle), record the new intent here explicitly before building toward it — don't let a monetisation decision get made implicitly through what gets built.

## Goals

1. Run a complete SDLC — plan, build, secure, ship — inside Claude Code, with the founder making every consequential decision in plain language.
2. Replace code review with a **Boardroom checkpoint**: a fixed panel of specialist reviewers (CEO, CPO, CMO, CTO, CISO, CFO, Research, Design) that gates every stage and hands the founder one short, jargon-free go/no-go summary.
3. Keep the agent population **lean by default** — a small fixed Boardroom, department leads created only when a project's real complexity calls for them, specialists promoted only on evidenced, repeated need.
4. Stay a **Claude Code plugin, and only a Claude Code plugin** — no hosted backend, no separate service the founder has to run or pay for beyond what they already use Claude Code for.

## Non-goals

- Replacing Claude Code itself, or any general-purpose coding capability — Wingman is a workflow/governance layer on top of it.
- Building a hosted product, dashboard, or SaaS. If a future need genuinely requires one, that's a different product, not Wingman.
- Teaching the founder to code, or to read diffs. The premise is they never need to.
- Matching every detail of the original 56-agent/8-department blueprint literally on day one — see `docs/status/ARCHITECTURE.md` for why the agent population grows lazily instead.
- **Monetisation of any kind** (see Business outcomes above) — free, open-source distribution is the deliberate, recorded intent, not an unexamined default.

## Key features

### The Boardroom (built)
Seven fixed C-suite-style seats — CEO, CPO, CMO, CTO, CISO, CFO, Research — plus Design, dispatched in parallel by `/wingman:boardroom`, consolidated into one plain-language verdict (`GO` / `GO WITH CHANGES` / `DO NOT SHIP`) under grouped Business/Technical/Finance/Research summary headers. Enforced by hooks: `ExitPlanMode` is blocked until a Boardroom verdict is recorded in the plan file (see `docs/status/ARCHITECTURE.md` §4 and `docs/status/DATABASE.md`), and `dod-structural-gate.mjs` mechanically checks artifact presence (traceability, tests, a clean threat register) before a real `git push`.

### Pipeline commands (built)
14 named stages, each with its own founder-visible Boardroom checkpoint — the "Planning Milestone"
bundled-checkpoint model described in an earlier revision of this document was reversed
(`docs/status/ARCHITECTURE.md` §4/§4d): `/wingman:discovery` → `/wingman:research-synthesis` →
`/wingman:personas-jobs` → `/wingman:journey-mapping` → `/wingman:define` →
`/wingman:information-architecture` → `/wingman:uxflow` → `/wingman:wireframes` →
`/wingman:visual-design-system` → `/wingman:prototype-usability` → `/wingman:architecture` →
`/wingman:implementation-planning` → `/wingman:build` (its own checkpoint, folding in what used to
be a separate `/wingman:secure` stage as a Definition-of-Done gate) → `/wingman:ship` (final
checkpoint) — 12 individual pre-build checkpoints plus Build's and Ship's own, trading ceremony for
full enterprise UX process completeness, a founder-approved decision.

### Adaptive commands (built)
**20 real commands** (corrected 2026-07-30 — this section previously listed only 5): `retro`, `learn`, `evolve`, `harness`, `dogfood`, `telemetry`, `launch`, `hotfix`, `audit`, `over-engineering-review`, `bloat-audit`, `debt-ledger`, `research`, `advisory`, `incident`, `knowledge-export`, `post-launch`, `review`, `test` — invoked as needed, not part of the fixed pipeline.

### Department leads (built, activated lazily)
One build-time worker subagent per corporate department (Product, Design, Engineering, Data, QA, Legal/Security, DevOps, Growth). The **activation mechanism** (`skills/department-lead-activation`) is built and real; the **agent files themselves** are created lazily, per-project, only when that department's documented activation signal is true — none exist at fresh install, by design. See `docs/status/ARCHITECTURE.md` §5.

### Specialists (planned, evolve-gated)
The 56-role candidate catalog in `docs/roadmap/AGENT-ROSTER.md`. Only created by `/wingman:evolve` after repeated, evidenced friction on a real project. Never bulk-created.

### The 17 engines (built)
The naming/ownership layer over all of the above — Vision, Context, Memory, Research, Planning, Design, Architecture, Engineering, UX Intelligence, Workflow, Orchestration, Governance, Evaluation, Agent Adapter, Knowledge, Tool Runtime, Code Intelligence. See `docs/status/ENGINES.md`.

### Quality-discipline skills (built)
`verification-before-completion`, `writing-plans`, `systematic-debugging` (adapted from `obra/superpowers`), `design-taste`, `engineering-minimalism`, `token-economy` (synthesized from vendor research — see `docs/status/ARCHITECTURE.md` §9), and `plain-language-checkpoint` (Wingman's own writing-quality bar for anything founder-facing).

## Success criteria

Wingman succeeds if a founder can, without ever reading a diff:
1. Describe a feature in their own words and get a plan they can approve via one plain-language checkpoint.
2. Get a build that's actually verified (not just claimed) before it reaches them.
3. Get an explicit, understandable answer to "is this safe" before every ship.
4. Never be surprised by a cost, a security issue, or a UX problem that a reviewer should have caught.

## Acceptance criteria

The product is acceptable for release when:

1. All 34 commands, 8 Boardroom seats, and 46 skills pass `node scripts/validate-all.mjs`'s 9 checks.
2. A founder can complete Discovery through Ship on a real project with every checkpoint clearing the `plain-language-checkpoint` bar (no unexplained jargon, no silent approval).
3. No Boardroom seat's `NO_GO` is ever bypassed, softened, or overridden by configuration.
4. Every shipped requirement traces back to a `DISC-*` finding (`check-traceability.mjs --chain`).
5. The eval harness (`evals/`, 90 cases) shows no `provisional` case that should be `verified` given available evidence.

## Dependencies

- **Runtime**: Claude Code (or one of the 6 adapted harnesses — see `ARCHITECTURE.md` §8b), Node.js (bundled), POSIX shell. Zero npm dependencies (`install-smoke.yml`-enforced).
- **Optional, credential-gated, never assumed present**: `ANTHROPIC_API_KEY` (real eval grading + `@claude` PR review), a Figma token, a speech-to-text provider, Codex CLI/OpenCode model-provider credentials for live harness verification. All tracked in `docs/HUMAN-TODOS.md`; the product functions fully without any of them.
- **No external database, no hosted service, no paid infrastructure** — see Non-goals.

## Out of scope for v1

- Specialists (see Non-goals) — created only via `/wingman:evolve` on evidenced need, never bulk-created.
- The bundled MCP state-store server — planned, spec'd in `docs/status/DATABASE.md`, not yet built as of this writing (genuinely still true, unlike the two corrected claims above).
- Figma/voice ingest for `/wingman:discovery` — credential-gated adapter contracts, documented in `docs/HUMAN-TODOS.md`, not built.

## Open questions

- Should Wingman ship with any first-party MCP connectors pre-wired (e.g. GitHub, an error-tracking service for `/wingman:telemetry`), or leave all of that to the founder's own Claude Code setup?
- At what point does a project's Boardroom checkpoint history (`.wingman/checkpoints.jsonl`) become large enough to need its own review/pruning workflow?
