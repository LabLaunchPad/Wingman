---
name: anti-rationalization
description: Meta-skill that defines the universal anti-rationalization defense system for all Wingman discipline skills. Every skill that governs agent behavior must include skill-specific rationalizations and red flags drawn from this system. Use when creating new skills, auditing existing skills for completeness, or when an agent catches itself making excuses.
---

<!--
Inspired by the "Common Rationalizations" and "Red Flags" patterns found
in addyosmani/agent-skills and obra/superpowers (MIT-licensed). Adapted
for LLM behavioral defense — the target is not human cognitive bias but
the tendency of language models to generate plausible-sounding excuses for
skipping discipline steps.
-->

# Anti-Rationalization Defense System

## Overview

Every discipline skill in Wingman exists because the behavior it governs will be skipped without enforcement. The most dangerous moment is not ignorance of the rule — it's the generation of a plausible-sounding excuse for why this particular situation is an exception.

**Core principle:** If you're explaining why the rule doesn't apply here, you're rationalizing.

This meta-skill defines the universal defense pattern. Every discipline skill must include its own skill-specific table and red flags at the end. This file is the reference; the skill files are the enforcement.

## How Rationalization Works (Persuasion Science)

LLMs generate text that sounds reasonable. When a discipline step is inconvenient, the model doesn't "feel lazy" — it produces a completion that happens to justify skipping the step because the justifying text is statistically plausible given the context. Robert Cialdini's principles of persuasion map directly onto these failure modes:

| Cialdini Principle | LLM Manifestation | Defense |
|---|---|---|
| **Commitment/Consistency** | "I already wrote the code, keeping it is consistent with my effort" | Sunk cost is irrelevant. Delete and redo. The Iron Law doesn't care about prior turns. |
| **Social Proof** | "Most code in this codebase doesn't have tests, so skipping is normal" | The codebase's existing debt is not permission to add more. |
| **Authority** | "I'm a capable model, I can tell this works without running it" | Confidence is not evidence. Run the command. |
| **Scarcity** | "There's no time for the full process in this emergency" | Systematic is faster than thrashing. The process exists most when you think you can't afford it. |
| **Liking** | "The founder asked me to move fast, so they'd prefer I skip verification" | The founder asked for working software. Unverified "done" is not that. |
| **Reciprocity** | "I did the hard part already, the test is optional paperwork" | The test is part of the work. Doing 90% is not doing the job. |

The defense is the same across all six: **name the rationalization, then do the thing anyway.**

## Universal Rationalizations Table

These apply to every discipline skill. Skill-specific tables extend (not replace) this one.

| Excuse | Reality |
|---|---|
| "This situation is different" | That's what every situation says. The rule exists because situations feel different. Check the table. |
| "The rule is too rigid for this case" | Rigidity is the point. Flexibility is how discipline erodes. If the rule genuinely doesn't fit, name the exception explicitly and justify it — don't silently skip. |
| "I'll come back to it later" | You won't. The next task has its own urgency. Do it now or acknowledge the debt. |
| "It's not worth the overhead" | The overhead exists because the failure mode is worse. You're comparing the cost of the step to zero, not to the cost of the failure. |
| "The founder didn't ask for this level of rigor" | The founder asked for working software. Rigor is how you deliver that. |
| "I can see it works" | You haven't run the command. Seeing is not verifying. |
| "It's too simple to need the full process" | Simple code breaks too. Simple bugs have root causes too. The process is fast for simple cases — that's by design. |
| "I've done this a hundred times" | Pattern completion is exactly when errors sneak in. Trust the process, not memory. |
| "Just this once" | No exceptions. The first exception is the only one that matters. |
| "I'll explain the shortcut in the output" | Explaining a shortcut doesn't make it not a shortcut. The output rule limits explanation to three lines — if you need more, you're defending, not explaining. |

## Red Flags — Universal Thought Patterns That Mean "Stop"

These thoughts, in any skill context, indicate rationalization is in progress:

1. **"It's basically done"** — "Basically" is the sound of approximation replacing verification.
2. **"I'm confident this works"** — Confidence is not evidence. What command did you run?
3. **"The previous step already covered this"** — Cross your t's. Each step verifies its own claim.
4. **"This is just a formality"** — Formalities are how you catch the things that feel obvious but aren't.
5. **"I don't want to slow things down"** — You're trading long-term speed for short-term speed. That's the definition of technical debt.
6. **"The code looks correct"** — Looks like. Sounds like. These are not verification verbs.
7. **"I already know the answer"** — Then prove it. Run the test. Show the output.
8. **"Nobody will notice"** — You'll notice when it breaks in production.
9. **"I'll fix it in the next task"** — Carried-forward debt is the most expensive kind.
10. **"The rule doesn't account for X"** — X is usually a rationalization ingredient, not a genuine exception. Check the skill-specific table.

## How to Apply Per Skill Type

Each discipline skill must include at its end:

```markdown
## Anti-Rationalization Defense

### Common Rationalizations

| Excuse | Reality |
|---|---|
| [Skill-specific excuse] | [Reality check tied to this skill's domain] |
| ... | ... |

### Red Flags

- [Thought pattern specific to this skill that indicates rationalization]
- ...

### Anti-Pattern Callouts

- [Specific behavior to watch for that violates this skill's discipline]
- ...
```

The rationalizations must be **domain-specific**, not generic. "This is too simple" means different things in TDD (simple code breaks) vs. systematic-debugging (simple bugs have root causes) vs. writing-plans (simple plans still need the summary).

## When This Skill Fires

- At the start of any `/wingman:*` pipeline command
- When an agent catches itself generating a justification for skipping a step
- During `/wingman:audit` when reviewing whether skills were followed
- During `/wingman:retro` when analyzing what went wrong and why

## The Bottom Line

The anti-rationalization system is not about distrust — it's about the empirical observation that LLMs (like humans) will generate plausible justifications for skipping hard steps unless those justifications are explicitly named and blocked. Every discipline skill in this plugin is a wall against a specific failure mode. This meta-skill is the concrete in those walls.
