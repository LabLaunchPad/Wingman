# Wingman — Product Requirements Document

## Problem

A non-technical solo founder who wants to build and ship real software today has two bad options: hire/manage engineers they can't technically evaluate, or use an AI coding tool directly and be asked to approve plans and review diffs they cannot actually judge. Either way, the moment that matters most — "is this safe and worth shipping" — is decided by someone other than the founder, or by the founder rubber-stamping something they don't understand.

## Target user

A solo founder with no engineering background, running Claude Code (directly or through Wingman's guidance) to build their own product. They can describe business outcomes ("what I want and why it matters") but cannot evaluate a diff, an architecture tradeoff, a security finding, or a cost projection on their own.

## Goals

1. Run a complete SDLC — plan, build, secure, ship — inside Claude Code, with the founder making every consequential decision in plain language.
2. Replace code review with a **Boardroom checkpoint**: a fixed panel of specialist reviewers (business, engineering, security, design, cost) that gates every stage and hands the founder one short, jargon-free go/no-go summary.
3. Keep the agent population **lean by default** — a small fixed Boardroom, department leads created only when a project's real complexity calls for them, specialists promoted only on evidenced, repeated need.
4. Stay a **Claude Code plugin, and only a Claude Code plugin** — no hosted backend, no separate service the founder has to run or pay for beyond what they already use Claude Code for.

## Non-goals

- Replacing Claude Code itself, or any general-purpose coding capability — Wingman is a workflow/governance layer on top of it.
- Building a hosted product, dashboard, or SaaS. If a future need genuinely requires one, that's a different product, not Wingman.
- Teaching the founder to code, or to read diffs. The premise is they never need to.
- Matching every detail of the original 56-agent/8-department blueprint literally on day one — see `docs/ARCHITECTURE.md` for why the agent population grows lazily instead.

## Key features

### The Boardroom (built)
Five fixed seats — founder, engineer, security, design, cost — dispatched in parallel by `/wingman:boardroom`, consolidated into one plain-language verdict (`GO` / `GO WITH CHANGES` / `DO NOT SHIP`). Enforced by a hook: `ExitPlanMode` is blocked until a Boardroom verdict is recorded in the plan file (see `docs/ARCHITECTURE.md` §4 and `docs/DATABASE.md`).

### Pipeline commands (built)
`/wingman:plan` → `/wingman:build` → `/wingman:secure` → `/wingman:ship`, each ending in a Boardroom checkpoint before advancing.

### Adaptive commands (built)
`/wingman:retro`, `/wingman:learn`, `/wingman:evolve`, `/wingman:harness`, `/wingman:telemetry`, `/wingman:launch`, `/wingman:hotfix`, `/wingman:audit`, `/wingman:drift`, `/wingman:agents` — invoked as needed, not part of the fixed pipeline. `/wingman:boardroom` also has an opt-in deep-review mode (a second, cross-informed review round) — its default single-round path is unchanged.

### Department leads (built, v2)
One build-time worker subagent per corporate department (Product, Design, Engineering, Data, QA, Legal/Security, DevOps, Growth), created lazily per-project only when that department's activation signal is true. None exist at fresh install. See `docs/ARCHITECTURE.md` §5.

### Specialists (mechanism built, v3 — individual specialists remain lazy)
The 56-role candidate catalog in `docs/AGENT-ROSTER.md`. `/wingman:evolve`'s promotion mechanism is built and verified; no individual specialist exists until one is actually promoted, on repeated, evidenced friction on a real project. Never bulk-created.

### Tech-stack/MCP skill catalog (built, v8)
`docs/SKILL-ROSTER.md` — the same lazy-materialization discipline as department leads and specialists, applied to tech-stack- and MCP-integration-specific skills instead of agents. A real signal (a `package.json`/lockfile dependency, `Dockerfile`, or `.mcp.json` entry) materializes exactly one narrowly-scoped skill into the founder's own project; nothing is bulk-shipped. See `docs/ARCHITECTURE.md` §12.

### Mid-flight scope drift (built, v8)
`/wingman:drift` routes a founder's new ask, or real evidence surfacing mid-build, back through a real Boardroom checkpoint instead of letting it get silently folded into whatever's already being built — gated mechanically in both interactive and headless sessions. See `docs/ARCHITECTURE.md` §12.

### Quality-discipline skills (built)
`verification-before-completion`, `writing-plans`, `systematic-debugging` (adapted from `obra/superpowers`), `systematic-auditing` (paired with `systematic-debugging`, codifying this project's own multi-angle-parallel-review pattern), `design-taste`, `engineering-minimalism`, `token-economy` (synthesized from vendor research — see `docs/ARCHITECTURE.md` §9), and `plain-language-checkpoint` (Wingman's own writing-quality bar for anything founder-facing).

## Success criteria

Wingman succeeds if a founder can, without ever reading a diff:
1. Describe a feature in their own words and get a plan they can approve via one plain-language checkpoint.
2. Get a build that's actually verified (not just claimed) before it reaches them.
3. Get an explicit, understandable answer to "is this safe" before every ship.
4. Never be surprised by a cost, a security issue, or a UX problem that a reviewer should have caught.

## Out of scope for v1 (historical — see "Key features" above for what's since been built)

- Department leads and specialists (see Non-goals) — v1 pipeline commands did this work inline; both are now built (v2/v3), lazily-activated per project as originally intended.
- `/wingman:launch` and `/wingman:hotfix` — named in `docs/ARCHITECTURE.md`'s open items at v1; both are now built (v3.1).

## Still out of scope

- The bundled MCP state-store server — planned, spec'd in `docs/DATABASE.md`, deliberately deferred until a real project generates the friction that would justify it (see that document's "Why no server yet").

## Open questions

- Should Wingman ship with any first-party MCP connectors pre-wired (e.g. GitHub, an error-tracking service for `/wingman:telemetry`), or leave all of that to the founder's own Claude Code setup?
- At what point does a project's Boardroom checkpoint history (`.wingman/checkpoints.jsonl`) become large enough to need its own review/pruning workflow?
