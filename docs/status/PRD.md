# Wingman — Product Requirements Document

## Problem

A non-technical solo founder who wants to build and ship real software today has two bad options: hire/manage engineers they can't technically evaluate, or use an AI coding tool directly and be asked to approve plans and review diffs they cannot actually judge. Either way, the moment that matters most — "is this safe and worth shipping" — is decided by someone other than the founder, or by the founder rubber-stamping something they don't understand.

## Target user

A solo founder with no engineering background, running Claude Code (directly or through Wingman's guidance) to build their own product. They can describe business outcomes ("what I want and why it matters") but cannot evaluate a diff, an architecture tradeoff, a security finding, or a cost projection on their own.

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
`/wingman:retro`, `/wingman:learn`, `/wingman:evolve`, `/wingman:harness`, `/wingman:telemetry` — invoked as needed, not part of the fixed pipeline.

### Department leads (planned, v2)
One build-time worker subagent per corporate department (Product, Design, Engineering, Data, QA, Legal/Security, DevOps, Growth), created lazily per-project only when that department's activation signal is true. None exist at fresh install. See `docs/status/ARCHITECTURE.md` §5.

### Specialists (planned, evolve-gated)
The 56-role candidate catalog in `docs/roadmap/AGENT-ROSTER.md`. Only created by `/wingman:evolve` after repeated, evidenced friction on a real project. Never bulk-created.

### Quality-discipline skills (built)
`verification-before-completion`, `writing-plans`, `systematic-debugging` (adapted from `obra/superpowers`), `design-taste`, `engineering-minimalism`, `token-economy` (synthesized from vendor research — see `docs/status/ARCHITECTURE.md` §9), and `plain-language-checkpoint` (Wingman's own writing-quality bar for anything founder-facing).

## Success criteria

Wingman succeeds if a founder can, without ever reading a diff:
1. Describe a feature in their own words and get a plan they can approve via one plain-language checkpoint.
2. Get a build that's actually verified (not just claimed) before it reaches them.
3. Get an explicit, understandable answer to "is this safe" before every ship.
4. Never be surprised by a cost, a security issue, or a UX problem that a reviewer should have caught.

## Out of scope for v1

- Department leads and specialists (see Non-goals) — v1 pipeline commands do this work inline.
- The bundled MCP state-store server — planned, spec'd in `docs/status/DATABASE.md`, not yet built as of this writing.
- `/wingman:launch` and `/wingman:hotfix` — named in `docs/status/ARCHITECTURE.md`'s open items, not yet built.

## Open questions

- Should Wingman ship with any first-party MCP connectors pre-wired (e.g. GitHub, an error-tracking service for `/wingman:telemetry`), or leave all of that to the founder's own Claude Code setup?
- At what point does a project's Boardroom checkpoint history (`.wingman/checkpoints.jsonl`) become large enough to need its own review/pruning workflow?
