# Wingman

Wingman is a Claude Code plugin that gives non-technical founders a full AI SDLC — an AI Boardroom of agents that plans, builds, secures, and ships production-grade software end to end, with plain-language checkpoints instead of code review.

## How it works

Instead of asking a founder to read code or a diff, Wingman gates every stage of the SDLC through a **Boardroom checkpoint**: a handful of specialist reviewers (business, engineering, security, design, cost) examine the plan or change in parallel and hand back one short, jargon-free go/no-go summary. The founder makes the call; Wingman never assumes silence means approval.

The agent population is deliberately **lazy, not exhaustive** — a fixed 5-seat Boardroom is always present, a small set of department leads (Product, Engineering, QA, Security, DevOps, etc.) are created only when a project's real complexity calls for them, and narrow specialists are promoted one at a time via `/wingman:evolve` only after proven, repeated need. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full model and [`docs/AGENT-ROSTER.md`](docs/AGENT-ROSTER.md) for the complete specialist catalog.

## Status

The pipeline is built and behaviorally tested, not just scaffolded: 13 commands (`plan`/`build`/`secure`/`ship` plus 9 adaptive commands including `audit`), 10 skills, and 5 fixed Boardroom seats. The plugin lives at `plugins/wingman/`, packaged as a Claude Code marketplace + plugin (`.claude-plugin/marketplace.json`).

`evals/` holds a lightweight behavioral eval harness (not just structural validation) with 10 eval cases, including two full end-to-end pipeline runs against realistic projects. See `docs/PROJECT.md` for exact build/eval status and `docs/ARCHITECTURE.md` for what's built versus planned. This has all been verified in a sandboxed testing environment; it hasn't yet been run as a real installed plugin against a real project — see `docs/HUMAN-TODOS.md` for what that needs.

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — the hybrid Boardroom/department/specialist model and why it's shaped this way.
- [`docs/AGENT-ROSTER.md`](docs/AGENT-ROSTER.md) — the full specialist candidate catalog, organized by department.
- [`docs/PROJECT.md`](docs/PROJECT.md) — current build/eval status, decisions log, and roadmap.
- [`docs/HUMAN-TODOS.md`](docs/HUMAN-TODOS.md) — what's blocked on a human rather than more engineering (installing/dogfooding for real, publishing, demo content — see `docs/DEMO-CHECKLIST.md` for the demo-capture plan).
- [`evals/README.md`](evals/README.md) — how the behavioral eval harness works and what's been verified.
- [`ATTRIBUTIONS.md`](ATTRIBUTIONS.md) — provenance for design patterns adapted from vendored reference repositories.
