# Capability map — calibrating to what a founder already knows

Guidance for gauging a founder's own technical capability and where they need more support —
used to calibrate explanation depth and where department-lead/specialist support helps most, not a
data-capture mechanism or a formal skill-tracking system.

## What's worth noticing (inferred from how a founder talks and what they ask, not a quiz)

- **Technical fluency** — do they use precise technical terms correctly, or describe things in
  outcome/behavior terms? This should shift how much translation `plain-language-checkpoint` output
  needs, not whether it's used at all (it's always used for Boardroom/checkpoint output).
- **Prior build experience** — a founder who has shipped software before needs less scaffolding
  explanation (what a "definition of done" is, why a threat register matters) than a first-time
  builder; don't over-explain to someone who's already fluent.
- **Where they want to stay hands-off vs. hands-on** — some founders want to review architecture
  decisions closely; others want them handled and only surfaced at the 3 real checkpoints. This is
  closely related to, but distinct from, `founder-preferences.md`'s "approval style" — capability is
  about *how much they'd understand*, approval style is about *how much they want to be asked*.

## How to use it

Calibrate explanation depth in-the-moment (a Boardroom verdict, a discovery clarifying question) —
this is a judgment call every skill/command already makes implicitly via `plain-language-checkpoint`,
not a new gate or scoring system. There is no numeric "skill level" to compute or store.

## What this deliberately isn't

Not a formal skills-gap tracker, not a training-plan generator, not something that blocks or
gates any pipeline stage. If a founder's own project repeatedly surfaces the same explanation gap
(logged via `/wingman:learn`), that's a `LEARNINGS.md` signal like any other — handled by the
existing `evolve-promotion` mechanism, not this doc.

## References

- `skills/plain-language-checkpoint` — where this calibration actually shows up.
- `skills/memory` — if a durable fact about a founder's background is worth remembering
  across sessions (e.g. "founder is a former backend engineer"), it goes in `MEMORY.md`, same as any
  other evergreen fact — no separate store.
