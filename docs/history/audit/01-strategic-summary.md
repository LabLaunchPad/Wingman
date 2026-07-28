# Strategic Summary

## Purpose

Wingman is a Claude Code plugin that gives non-technical founders a full AI SDLC — an "AI Boardroom" of agents that plans, builds, secures, and ships production-grade software end to end, with plain-language checkpoints instead of code review.

## Problem Statement

A non-technical solo founder building real software has two bad options: hire/manage engineers they can't technically evaluate, or use AI coding tools directly and be asked to approve plans and review diffs they cannot actually judge. The moment that matters most — "is this safe and worth shipping" — is decided by someone other than the founder, or by the founder rubber-stamping something they don't understand.

## Target User

A solo founder with no engineering background, running Claude Code to build their own product. They can describe business outcomes but cannot evaluate a diff, an architecture tradeoff, a security finding, or a cost projection independently.

## Success Criteria

Wingman succeeds if a founder can, without ever reading a diff:

1. Describe a feature in their own words and get a plan they can approve via one plain-language checkpoint
2. Get a build that's actually verified (not just claimed) before it reaches them
3. Get an explicit, understandable answer to "is this safe" before every ship
4. Never be surprised by a cost, a security issue, or a UX problem that a reviewer should have caught

## Key Architectural Decisions

| Decision | Rationale |
|---|---|
| Claude Code plugin only (no external service) | NFR-1: no hosted backend, no infra to maintain |
| Node stdlib-only scripts (no npm dependencies) | NFR-2: no package manager install step beyond Claude Code |
| Plain-language checkpoints replace code review | PRD goal #2: founder makes every consequential decision |
| Lazy agent population | NFR-4: small fixed surface, department leads/specialists created only on evidenced need |
| Self-contained skills | NFR-5: no skill may depend on another vendor's runtime/API/infra |
| Vendor/ dir as design reference only | Wingman's own code is original; vendor repos are MIT-licensed inspiration |

## Competitive Position

- **Not** a replacement for Claude Code — it's a workflow/governance layer
- **Not** a hosted product, dashboard, or SaaS — explicitly out of scope
- **Not** a LangGraph/smolagents custom runtime — cross-agent collaboration uses Claude Code's Task tool and (future) Agent Teams

## Current Status

| Dimension | Status |
|---|---|
| Pipeline commands (7 stages) | Built |
| Boardroom (7 seats + Design) | Built |
| Hooks (gates + enforcement) | Built |
| Adaptive commands (11) | Built |
| Department leads | Planned (v2) |
| Specialists (56-role catalog) | Evolve-gated, none exist yet |
| MCP state-store server | Planned — spec'd in DATABASE.md |
| Eval harness | Built — 62 cases, 36 fixtures, 72 integration tests |
| CI/CD | Built — GitHub Actions (validate, evals, version-gate) |
