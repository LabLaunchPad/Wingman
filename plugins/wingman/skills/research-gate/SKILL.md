---
name: research-gate
description: Use before building any new Wingman capability (a new command, skill, engine, or hook) — enforces Research Complete? -> Architecture Approved? -> Requirements Complete? -> Implementation Starts, and blocks with the specific missing study when research isn't real yet. Dev-repo-only: only applies to Wingman's own plugin development, never a founder's installed project.
effort: low
---

# Research Gate

## Overview

The founder's research-first philosophy, translated into a real gate: *"Don't build first and
research after."* Before this skill, nothing enforced that ordering — a maintainer could go
straight from idea to implementation with no mechanical check that the idea had actually been
studied.

**Scope: this is a maintainer-facing gate for Wingman's own dev-repo development, never a
founder-facing pipeline stage.** Like `skills/dogfood-gap-classification`, it only applies when
working inside Wingman's own checkout (a real `research/` directory at the repo root, a real
`plugins/wingman/` tree to modify) — never inside a founder's installed project, which has neither.

**Core principle:** a capability earns the right to be built by being studied first, with evidence
— named pioneers, real fetched sources, real trade-off analysis — not by a maintainer's confidence
that they already understand the space.

## Inputs

The capability about to be built (a command, skill, hook, or engine layer) and its owning domain
in `research/` (see `research/README.md`'s 13 domains).

## Escalation

A capability that seems to need building faster than real research allows — surface this to the
founder directly rather than skipping the gate. "This felt urgent" is never a reason to build
unresearched; if it's genuinely urgent, say so and ask whether to proceed anyway (a real,
disclosed override, per `references/constitution.md`'s own override framing), not a silent skip.

## When To Use

- Before any `docs/status/ARCHITECTURE.md`-structural change (new command, skill, engine, or
  department) — this skill runs *before* the existing "read ARCHITECTURE.md first" step, not
  instead of it.
- Before creating a new specialist agent, ahead of `docs/roadmap/AGENT-ROSTER.md`'s own
  2+-occurrence evidence gate — research and evidence are two different gates; both must pass.
- Whenever a maintainer is about to write architecture or implementation code for something with
  no existing `research/<domain>/TRUTH-*.md` document.

## Core Workflow

**1. Identify the capability's owning domain** in `research/`'s 13 folders. If none genuinely fits,
say so rather than forcing a fit — a new domain is itself a decision worth surfacing, not something
to silently create.

**2. Check whether a real `TRUTH-<capability>.md` already exists** for this exact capability (not a
loosely-related one). If it does, read it — do not re-research from scratch, and do not proceed past
a **Confidence: Low** or explicitly incomplete synthesis section without addressing the gap it names.

**3. If no real document exists, the gate blocks here.** Run `scripts/check-research-truth-doc.mjs`
against the proposed document (or against nothing, if none was written yet) to name exactly which
of the 5 studies is missing:

```
node scripts/check-research-truth-doc.mjs research/<domain>/TRUTH-<capability>.md
```

Then do the actual research, per `research/template-truth-doc.md`'s 5-study shape:
1. The pioneers — named concretely, not "common knowledge."
2. Current best implementations — real, fetched/read sources, never assumed from a name.
3. Community experience — recurring complaints/workarounds, the pain-point signal.
4. Engineering trade-offs — why this design, what was rejected and why.
5. Our synthesis — Our Principle / Our Architecture / Our Improvements / What We Will Not Do /
   Open Questions.

**4. The Decision Gates, in order — never skip ahead:**

```
Research Complete?  →  Architecture Approved?  →  Requirements Complete?  →  Implementation Starts
```

If Research isn't complete, stop; do not draft architecture "in parallel" to save time. If
Architecture isn't approved (a real Boardroom or founder review for anything structural), stop; do
not start implementation on the strength of a draft design.

**5. Apply the Human Approval Framework** to decide whether this specific capability needs the
founder's direct input, or can proceed on the maintainer's own judgment:

| Tier | Examples | What happens |
|---|---|---|
| Must ask | Product direction, MVP scope, trade-offs with no clearly-better option, naming, architecture changes, irreversible migrations | Stop; get an explicit founder decision before proceeding |
| Should ask | UX alternatives, framework/library preferences, rollout strategy | Propose a default, but surface the alternative and let the founder redirect |
| Can decide automatically | Formatting, refactoring, internal code organization, linting, repetitive implementation matching an established pattern | Proceed without asking |

**6. Record the decision** using the Decision Record shape in Output below — every "Must ask" or
"Should ask" item that actually got a decision, not every trivial choice.

## Constraints

**MUST:**
- Confirm a real, complete `TRUTH-*.md` exists (or write one) before starting architecture work on
  a genuinely new capability.
- Name the specific missing study when blocking, never a generic "needs more research."
- Apply the Must-ask/Should-ask/Can-decide framework honestly — don't downgrade a Must-ask item to
  avoid the friction of asking.
- Only apply this gate inside Wingman's own dev-repo checkout.

**MUST NOT:**
- Fabricate a pioneer, an implementation citation, or a community-experience claim to make a
  `TRUTH-*.md` look complete faster. A fabricated citation is worse than an honest "not yet
  researched" — this project's own `docs/roadmap/AGENT-ROSTER.md` has already caught fabricated
  citations in pasted proposals; the same standard applies to this skill's own output.
- Run this gate against a founder's installed project — it has no `research/` directory and this
  concept doesn't apply there.
- Treat "the founder said this is urgent" as silent permission to skip research — surface the
  tension and let the founder make that call explicitly.

## Rationalizations

| Excuse | Reality |
|---|---|
| "I already know this space well enough" | Confidence isn't evidence — the whole point of this gate is a checkable trail, not a maintainer's self-assessment. |
| "Writing the TRUTH doc after building it is basically the same" | It isn't — research written to match a decision already made will always confirm that decision, which is the exact failure mode `skills/acceptance-criteria` warns against for retrofitted criteria. |
| "This capability is small, it doesn't need the full 5-study treatment" | Size doesn't change whether the idea has been checked against prior art — a small capability built on a wrong assumption is still wrong. |
| "I'll just cite what I remember from training" | Training data may be stale or wrong; `references/constitution.md` rule 1 (grounding truth before generation) requires checking, not recalling. |

## Red Flags — Stop and Reconsider

- About to write architecture or implementation for a capability with no `TRUTH-*.md` and no
  research in progress.
- About to invent a pioneer, source, or community-experience claim rather than checking one.
- About to treat a "Must ask" decision as obvious and proceed without asking.
- About to apply this gate inside a founder's installed project.

## Verification

Before treating research as complete: re-open the `TRUTH-*.md` and confirm all 5 study sections
have real content (not placeholder text), every citation in Section 2/References was actually
fetched or read (not assumed), and the synthesis section states a real principle rather than
restating the problem.

## Output

**The `TRUTH-*.md` document itself** (per `research/template-truth-doc.md`), plus a Decision Record
for any Must-ask/Should-ask item that got resolved along the way:

```markdown
## Decision Record — <capability>

**Decision:**
**Context:**
**Options Considered:**
**Evidence:**
**Recommendation:**
**Trade-offs:**
**Risks:**
**Unknowns:**
**Human Approval Required?:** <yes/no, and which tier from the framework above>
**Final Decision:**
**Review Date:**
```

## Anti-Rationalization Defense

### Common Rationalizations

| Excuse | Reality |
|---|---|
| "The research gate is bureaucracy for a solo-maintainer project" | It's the mechanism that keeps "steal like an artist" from becoming "guess like an artist" — the whole value of the founder's philosophy is the checkable trail. |
| "I'll batch the research for several capabilities at once, faster that way" | Research written for a capability not yet decided tends to fit whatever gets built anyway — do it capability-by-capability, right before building each one. |

### Red Flags

- A `TRUTH-*.md` with unfilled template sections treated as "good enough."
- A citation that, if checked, doesn't actually say what the document claims.

### Anti-Pattern Callouts

- **Retrofitted research:** writing the `TRUTH-*.md` after the implementation exists, so it
  documents the choice rather than informing it — the same failure mode
  `skills/acceptance-criteria` names for retrofitted criteria.
- **Speculative domain population:** creating all 13 `research/` domain folders' `TRUTH-*.md`
  entries "to be thorough" with no real capability driving each one — the bulk-creation pattern
  `skills/evidence-gated-catalog` already forbids elsewhere in this project.

## Referenced by

- `research/README.md` — the structure this gate enforces.
- `references/constitution.md` — rule 1 (grounding truth) and rule 7 (architecture before
  implementation).

See `docs/status/ARCHITECTURE.md` for this skill's place in Wingman's overall architecture.
