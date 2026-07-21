# Spec-and-Handler Pattern (superpowers pattern)

Adapted from `obra/superpowers`' discipline of separating *what* a thing must do (the spec) from *how* it is done (the handler), and validating the spec before executing. In Wingman this shapes how commands and skills are written: a command states its contract up front; the execution validates against that contract before acting.

## The shape

- **Spec** — the inputs, the invariants that must hold, and the observable success criteria. Written/confirmed *before* work starts.
- **Handler** — the implementation that satisfies the spec. May be swapped, refactored, or reviewed without touching the spec.

## Why Wingman uses it

1. **Evidence before claims** (`verification-before-completion`): the spec's success criteria are the checklist you run *before* saying done.
2. **TDD** (`test-driven-development`): the spec becomes the failing test first.
3. **Subagent contracts** (`subagent-driven-development`): each dispatched implementer gets a spec (what + done-looks-like) and is reviewed against it, not against vibes.
4. **Boardroom checkpoints**: the plan's `## Success Criteria` (see `plan-review-checklist.md`) *is* the spec the boardroom judges against.

## Minimum contract for any Wingman command

Every pipeline command should be able to answer, in order:

1. What is the input? (plan file, diff, scope ref, or "the whole project")
2. What must be true before it runs? (prior checkpoint passed, dept lead activated, threats closed)
3. What does "done" look like, observably? (a file written, a hook decision, a verdict)
4. What blocks advancement? (a `DO NOT SHIP`, an `OPEN` threat, a missing gate)

## Anti-rationalization

- "I'll just do it and see" → Without a spec, "done" is whatever you stopped at. Write the success criteria first.
- "The spec is the code" → No — the spec is the contract the code is judged against. Keep them separate so you can test the code honestly.
- Red flag: a command that cannot state its success criteria in one sentence. Stop and write it.

## Cited by

- `plugins/wingman/skills/mechanics/spec-handler/SKILL.md`
