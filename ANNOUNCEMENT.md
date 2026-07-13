# Wingman 0.1.2 — Release Announcement (draft)

*Plain-language draft for the marketplace listing / README / founder post. Not yet submitted to any marketplace — that's a human account action (see `docs/HUMAN-TODOS.md`).*

---

## Wingman: your AI Boardroom for shipping software

Wingman is a Claude Code plugin that gives non-technical founders a full AI software-development lifecycle — an "AI Boardroom" of specialist agents that plans, builds, secures, and ships production-grade software end to end, with **plain-language checkpoints instead of code review**.

You never read a diff unless you want to. Every consequential decision comes back as a one-paragraph bottom line with what each seat thought and what it costs you.

## What's new in 0.1.2

This release folds in six more vendor-proven patterns and hardens the safety gates:

- **Real TDD, enforced.** Red-green-refactor discipline with an 80% coverage floor, so "done" means tested, not just typed.
- **Subagent-driven builds.** A fresh subagent per task, reviewed against its own spec after — no context rot, no silent drift.
- **A decision Council** for the genuinely ambiguous calls, plus a **Doc-Index** discipline so the reference docs actually get used.
- **Stronger security & minimalism tooling**: a re-schematized threat register, an over-engineering 5-tag audit, a bloat scan, and a debt ledger — all callable as plain commands.

## The bug we caught before you ever hit it

An automated, multi-angle audit found a critical defect in the plan-mode safety hook: it was silently blocking *every* plan from exiting. We fixed it so the gate judges each source independently and only blocks on a genuinely unfinished checkpoint — and we locked the fix with a regression test. This is exactly the kind of failure a single review pass misses and a Boardroom-style audit catches.

## Get it

Add the Wingman marketplace and install the `wingman` plugin in Claude Code. Then start with `/wingman:plan` and answer in plain language.

*Wingman is Claude-Code-plugin-only — no hosted backend, no SaaS, your code never leaves your machine.*
