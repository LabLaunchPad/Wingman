# Cross-User Learning

Wingman gets better for everyone when a lesson one founder's project surfaced can improve the plugin itself. This doc defines how that happens — deliberately as a **lightweight, human-gated, opt-in** convention, not telemetry infrastructure. It is the cross-repo half of the telemetry story; `scripts/wingman-health.mjs` is the local half.

## Principles (why it's shaped this way)

- **No phone-home.** Wingman never transmits anything from a founder's project automatically. A founder's code and business details are sensitive; the plugin has no runtime service and shouldn't grow one just for this (`docs/DATABASE.md`'s "Why no server yet" and the `engineering-minimalism` skill both apply). Everything here is flat files and explicit human action.
- **Opt-in and reviewed, always.** A learning only leaves a founder's project when they choose to contribute it, and only after it's been stripped of anything project-specific and reviewed by a Wingman maintainer before it touches the shared catalog. There is no automatic ingestion.
- **The founder's own loops already exist.** `LEARNINGS.md`, `docs/wingman/retros.md`, and `/wingman:evolve` already capture and act on lessons *within* one project. This doc is only about the extra step of promoting a genuinely general lesson *up* to Wingman.

## The two mechanisms

**1. Founder-initiated contribution (the primary path).**
When a founder has a durable, general lesson in their project's `LEARNINGS.md` or a retro that isn't specific to their codebase, they can contribute it upstream:
- Sanitize it: remove code, business details, proprietary names — reduce it to the general pattern and why it matters.
- Open it as a GitHub issue (or PR against `docs/AGENT-ROSTER.md` / a skill) on the Wingman repo, for a maintainer to review.
- A maintainer decides whether it generalizes — e.g. a recurring specialist need across several founders' projects is exactly the signal that the canonical catalog should absorb a refined version, turning ad-hoc per-project `/wingman:evolve` promotions into an improvement every future founder starts with.

This is the same generalize-from-repeated-friction logic `/wingman:evolve` uses within a project, applied one level up — across projects, with a human gate.

**2. Dogfooding findings (the internal path).**
Wingman is built by running Wingman on itself. Bugs and lessons that surface from *exercising* the plugin (not from a founder hitting them) have a durable home: `docs/PROJECT.md`'s decisions log, and — for anything an audit surfaces — `docs/REGRESSION-CHECKLIST.md`. This session's own history is the proof this works: the inert-hook bug, the model-tier drift, and the attribution error were all found by dogfooding and are now both fixed and defended against mechanically. Every eval run's findings getting a durable home is itself a cross-"usage" learning loop that costs nothing to run.

## What is deliberately NOT built

Automatic, anonymized telemetry (activation rates, promotion frequencies, false-trigger counts) would give stronger signal at scale, but it conflicts with everything above — Wingman is not a hosted service, founders' codebases are sensitive, and standing up collection infrastructure contradicts the lazy-growth, no-speculative-infra stance. If founder-initiated contribution (#1) ever proves too sparse to be useful, revisit it then, opt-in only, and record the decision in `docs/PROJECT.md`'s decisions log — not before there's real evidence it's needed.
