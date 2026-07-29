# Evaluation dimensions: the 12-dimension map onto the 8 Boardroom seats

The Evaluation Engine's real evaluation surface is the 8 Boardroom seats (`agents/boardroom-*.md`),
each already rendering a `GO | GO_WITH_CONCERNS | NO_GO` verdict per
`skills/plain-language-checkpoint`. This document names the **12 concrete dimensions** those 8 seats
already check — derived directly from each seat's own real "What you check" section, not invented —
so a checkpoint's completeness can be verified mechanically (every dimension actually covered by some
seat) without introducing a second, competing numeric-scoring system next to the existing
GO/GO_WITH_CONCERNS/NO_GO verdict contract. Per `references/constitution.md` rule 3 (reuse before
reinvent) and rule 4 (clarity before complexity): this is a naming and completeness map over what
already exists, not a new scoring mechanism.

**Why 12 dimensions and not one per seat:** several seats' "What you check" sections cover two
materially distinct concerns (e.g. CFO checks both cost exposure and reversibility of that cost,
which are different failure modes) — collapsing those into a single dimension would hide which
specific concern was actually reviewed. Design deliberately owns zero dimensions on the founder-
facing table below: it renders a `DESIGN VERDICT`, but the *standard* it checks against lives in the
Design Engine (`skills/design-taste`, `references/accessibility-checklist.md`), not in this table —
naming a 13th dimension here just to give Design a row would be inventing structure for its own sake.

## The map

| # | Dimension | Owning seat | Grounded in (real "What you check" text) |
|---|---|---|---|
| 1 | Vision/strategy fit | CEO | "does the plan actually serve the stated goal... or has it quietly drifted" |
| 2 | Reversibility (business) | CEO | "can this be undone easily if it turns out to be a mistake, or is it a one-way door" |
| 3 | Real user value & scope | CPO | "does this solve a genuine problem for a real user... is this the right slice to ship now" |
| 4 | Positioning & go-to-market readiness | CMO | "is the claim clear and evidenced... is there a plan for how people find out" |
| 5 | Correctness & architecture fit | CTO | "does the plan/change actually do what it claims... does this fit how the rest of the project is built" |
| 6 | Maintainability & blast radius | CTO | "will the next person be able to understand and extend this... what breaks if this is wrong" |
| 7 | Secrets & injection surface | CISO | "API keys, tokens, credentials hardcoded... SQL injection, command injection, XSS" |
| 8 | Auth, data exposure & dependency risk | CISO | "missing authentication/authorization checks... sensitive data logged, over-fetched... new third-party packages without a reason" |
| 9 | New cost exposure & dependencies | CFO | "does this plan/change introduce a new third-party service... does this touch anything billed per-request" |
| 10 | Budget/alert threshold compliance | CFO | "verify a budget alert or usage cap was actually configured, not just mentioned in passing" |
| 11 | Evidence grounding & reinvention check | Research | "are the plan's claims backed by something real... does this duplicate something that already exists" |
| 12 | Innovation vs. risk | Research | "if this is a genuinely novel approach, is the novelty actually necessary" |

## What this is not

- **Not a numeric score.** No dimension gets a 1-10 rating; each seat still renders the existing
  plain-language `GO | GO_WITH_CONCERNS | NO_GO` verdict. This table exists to make *completeness*
  checkable (did every dimension actually get looked at), not to replace the verdict contract with a
  second, parallel scale — that would violate the constitution's reuse-before-reinvent rule and
  create exactly the "two systems that can disagree" failure this project avoids elsewhere (see
  `docs/status/PROJECT.md`'s repeated declines of a second risk taxonomy).
- **Not a completeness gate on every checkpoint.** A routine, well-precedented change genuinely
  doesn't need all 12 dimensions freshly re-derived — several seats' own files say so explicitly
  (e.g. Research: "if there's nothing materially unsupported or novel to check... say so and return
  GO with a one-line reason rather than manufacturing a concern"). This table is a reference for
  what a *full* review covers, not a per-checkpoint checklist to force through mechanically.

## Referenced by

- `plugins/wingman/engines/evaluation-engine/ENGINE.md`
- `agents/boardroom-ceo.md`, `boardroom-cfo.md`, `boardroom-ciso.md`, `boardroom-cmo.md`,
  `boardroom-cpo.md`, `boardroom-cto.md`, `boardroom-research.md` (the 7 seats owning at least one
  dimension above; `boardroom-design.md` is the 8th Evaluation Engine member, its standard sourced
  from the separate Design Engine)
