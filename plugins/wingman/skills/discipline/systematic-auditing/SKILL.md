---
name: systematic-auditing
description: Use when asked to audit, review, or verify something thoroughly — triggers on phrases like "audit this," "evidence-driven," "test-driven," "make sure this is production-grade/production-ready," "find all the gaps/bugs," "review with multiple experts/angles," "make sure everything is correct." Also the mechanism behind /wingman:audit. Packages a proven multi-angle-parallel-review pattern discovered from this project's own dogfooding, so a founder gets full rigor without needing to know these exact phrases.
---

# Systematic Auditing

## Overview

A single review pass, however careful, only catches what that one pass's frame of reference is looking for. Different failure classes need differently-shaped checks, not more repetitions of the same one — a test suite proves code correctness, but says nothing about whether a hook is registered under a real event name, whether two docs have drifted apart, or whether a skill's own instructions produce the behavior it claims. This skill exists to catch what a single pass structurally cannot.

**Core principle:** scope the audit into distinct concerns, review each with a narrowly-focused independent pass, and never trust a finding until it's been checked against the real filesystem or a real execution.

## When To Use

Whenever thoroughness is explicitly signaled — "audit this," "evidence-driven," "test-driven," "make sure this is production-grade," "find all the gaps/bugs," "review with multiple experts," "make sure everything is correct" — or via `/wingman:audit`. Also worth applying proactively before a significant `/wingman:ship`, even without the founder using these words, if the change is large or touches something high-stakes.

## Core Workflow

**1. Scope the audit into 3–5 distinct, non-overlapping concern areas.** What these are depends on what's being audited — for a plugin/codebase, a reasonable default split is: architecture/consistency (do the pieces still agree with each other and with their own docs), content/behavioral quality (does the actual content/logic hold up, not just its structure), executable-code/security (anything that actually runs — scripts, hooks, config), and eval/test coverage (what's actually been verified to work vs. just written). Don't force exactly these four if the thing being audited has a different natural shape.

**2. Dispatch one subagent per concern, in parallel** (single message, multiple Task calls), each given an **exact file list** to read — never open-ended "explore the codebase." This is both more thorough (a scoped reviewer reads everything in its lane) and more token-efficient (no wasted exploration budget). Cap each subagent's output length (e.g. "under 350 words, findings only, ranked most severe first") so the audit's own cost stays proportionate to its value.

**3. Never trust a subagent's self-report alone.** Before acting on any finding, independently verify it against the real filesystem or a real execution — read the actual file, run the actual command, check the actual output. A finding that turns out to be wrong on inspection should be discarded, not passed through.

**4. Fix real, contained findings immediately.** Don't let an audit produce a list of problems nobody acts on — that's strictly worse than not auditing, since it creates the appearance of rigor without the substance. Log genuinely larger or ambiguous findings as durable follow-ups (a roadmap, a tracked backlog) rather than either fixing them hastily or letting them evaporate.

**5. Record durable lessons — including *why* this pass caught what a single pass didn't.** Append to this project's existing durable-learning location (`LEARNINGS.md`, a decisions log, `docs/wingman/retros.md` — whichever this project already uses). The mechanism-level lesson (what kind of check this was, why it needed a separate pass) is often more valuable long-term than the specific bug found.

## Constraints

**MUST:**
- Scope each subagent to an exact file list, not open-ended exploration.
- Independently verify every finding against the real filesystem/execution before acting on it.
- Fix real, contained findings immediately rather than only logging them.

**MUST NOT:**
- Skip a differently-shaped check just because a same-shaped one already passed (e.g. "tests are green" is not evidence about configuration or wiring correctness).
- Spawn two subagents auditing the same concern from the same angle — that's redundant cost, not more thoroughness.
- Treat a subagent's "PASS" self-report as sufficient evidence on its own.

## Rationalizations

| Excuse | Reality |
|---|---|
| "Tests are green, no need to audit further" | Tests prove code correctness, not configuration or wiring. A real example from this project: 100% passing tests coexisted with an entire safety-gate hook being silently inert, because one hook was registered under an event name that doesn't exist in Claude Code's hooks system — nothing a test suite would ever touch. |
| "One thorough reviewer is enough" | A single reviewer's blind spots are exactly what a second, differently-scoped reviewer exists to catch — that's the whole mechanism, not redundancy. |
| "The subagent said PASS, that's good enough" | Self-reports aren't evidence — see `verification-before-completion`. Every finding (including a clean bill of health) needs independent confirmation before it's trusted. |
| "We already ran an audit last week" | A prior audit only covers the concerns it was scoped to. New code, new configuration, or new integration surfaces need their own pass — re-running the identical scope on unchanged material is waste, but a differently-shaped or newly-relevant concern is not covered just because *an* audit happened once. |

## Red Flags — Stop and Reconsider

- You're about to audit with a single broad "review everything" pass instead of scoped, parallel, narrow ones.
- You're about to report a finding without having independently checked it yourself.
- You're producing a findings list with no plan to fix or track any of it.
- You're re-running the same check a second time and calling it "more auditing."
- You're skipping a check because "it probably still holds" rather than because it's actually out of scope.

## Verification

After the audit, re-read every file you changed as a fix, and re-run any command a subagent claimed passed. Confirm the audit's own summary (what was checked, what was found, what was fixed vs. logged) matches what actually happened, not what was intended.

## Output

No fixed founder-facing template — this is an internal engineering-discipline skill, not itself a checkpoint. Findings that need founder attention (an accepted-risk decision, a business tradeoff) still route through `plain-language-checkpoint` and, where the finding is a project-level business risk rather than an engineering one, the `docs/wingman/founder-todos.md` convention.

## Continuous Execution

See `references/continuous-execution.md` — maintain momentum through a workflow once started; don't pause to narrate or summarize mid-flight.


## Anti-Rationalization Defense

### Common Rationalizations

| Excuse | Reality |
|---|---|
| "Tests are green, no need to audit further" | Tests prove code correctness, not configuration or wiring. A real example from this project: 100% passing tests coexisted with an entire safety-gate hook being silently inert. |
| "One thorough reviewer is enough" | A single reviewer's blind spots are exactly what a second, differently-scoped reviewer exists to catch — that's the whole mechanism, not redundancy. |
| "The subagent said PASS, that's good enough" | Self-reports aren't evidence — see `verification-before-completion`. Every finding needs independent confirmation. |
| "We already ran an audit last week" | A prior audit only covers the concerns it was scoped to. New code, new config, or new integration surfaces need their own pass. |
| "I'll skip the independent verification, the subagent seems reliable" | Subagent self-reports are the *least* trustworthy evidence. Verify against the real filesystem or a real execution. |
| "The audit is taking too long, I'll wrap up early" | An incomplete audit creates the appearance of rigor without the substance — strictly worse than not auditing at all. |

### Red Flags

- You're about to audit with a single broad "review everything" pass instead of scoped, parallel, narrow ones.
- You're about to report a finding without having independently checked it yourself.
- You're producing a findings list with no plan to fix or track any of it.
- You're re-running the same check a second time and calling it "more auditing."
- You're skipping a check because "it probably still holds" rather than because it's actually out of scope.
- You're trusting a subagent's self-report without verifying it against the real filesystem.

### Anti-Pattern Callouts

- **Verification theater:** Dispatching subagents but not independently checking their findings. The audit's value is in the cross-check, not in the dispatch.
- **Same-angle redundancy:** Running two subagents on the same concern from the same angle. That's duplicate cost, not additional rigor.
- **Findings-without-action:** Producing a list of problems and not fixing or tracking any of it. This is strictly worse than not auditing — it creates the appearance of rigor.

## Referenced by

- `commands/adaptive/audit.md`

See `docs/ARCHITECTURE.md` for this skill's place in Wingman's overall architecture.
