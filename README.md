# Wingman

Wingman is a Claude Code plugin that gives non-technical founders a full AI SDLC — an AI Boardroom of agents that plans, builds, secures, and ships production-grade software end to end, with plain-language checkpoints instead of code review.

## How it works

Instead of asking a founder to read code or a diff, Wingman gates every stage of the SDLC through a **Boardroom checkpoint**: a handful of specialist reviewers (business, engineering, security, design, cost) examine the plan or change in parallel and hand back one short, jargon-free go/no-go summary. The founder makes the call; Wingman never assumes silence means approval.

The agent population is deliberately **lazy, not exhaustive** — a fixed 5-seat Boardroom is always present, a small set of department leads (Product, Engineering, QA, Security, DevOps, etc.) are created only when a project's real complexity calls for them, and narrow specialists are promoted one at a time via `/wingman:evolve` only after proven, repeated need. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full model and [`docs/AGENT-ROSTER.md`](docs/AGENT-ROSTER.md) for the complete specialist catalog.

## Status

This project is under active design and build-out. The plugin lives at `plugins/wingman/`, packaged as a Claude Code marketplace + plugin (`.claude-plugin/marketplace.json`). See `docs/ARCHITECTURE.md` for what's built versus planned.

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — the hybrid Boardroom/department/specialist model and why it's shaped this way.
- [`docs/AGENT-ROSTER.md`](docs/AGENT-ROSTER.md) — the full specialist candidate catalog, organized by department.
- [`ATTRIBUTIONS.md`](ATTRIBUTIONS.md) — provenance for design patterns adapted from vendored reference repositories (once added).
