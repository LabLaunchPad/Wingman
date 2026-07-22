# Founder preferences — what's worth learning, and where it lives

Guidance for what a founder's working style/approval-preferences picture should cover, and how to
capture it — not a data-capture mechanism of its own. Once known, persist it via the `memory`
skill's `.wingman/memory/MEMORY.md` (the existing "evergreen facts: project name, stack,
constraints, preferences" store) — do not create a second, parallel preferences file.

## What's worth learning (ask via `interview-one-question-at-a-time`, one at a time, as it comes up naturally — never a front-loaded intake form)

- **Approval style** — does this founder want to be asked before every one-way-door decision (the
  Boardroom/checkpoint default), or do they explicitly prefer batching decisions into fewer, larger
  checkpoints? This is itself a Boardroom-relevant fact, not just a style note.
- **Output preference** — plain narrative summaries vs. structured checklists/tables; this should
  already be responsive to what a founder's own questions and answers look like, not a separate
  survey.
- **Stack defaults** — a returning founder's prior project's stack choices are a reasonable default
  starting point for a new project, not a hard rule; always let `architecture.md`'s real requirements
  override a remembered default.
- **Communication style** — how much jargon translation a founder needs (some are technical, most
  aren't) — recalibrate per project rather than assuming this is fixed for a person.

## Where it's persisted

`.wingman/memory/MEMORY.md`, under whatever section heading fits (the `memory` skill doesn't
mandate a fixed schema for this). Cross-project persistence (a founder's preferences following them
from one project to the next) is **not** currently built — each project's `.wingman/` is
self-contained. If that's ever needed, it's a new, separate, evidence-gated capability, not
something to bolt onto this reference doc.

## References

- `skills/knowledge/memory` — the actual store this feeds.
- `skills/mechanics/interview-one-question-at-a-time` — how to ask, not what to ask; this doc is the
  "what," that skill is the "how."
