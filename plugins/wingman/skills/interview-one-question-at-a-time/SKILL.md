---
name: interview-one-question-at-a-time
description: Use when exploring requirements, debugging, or making design decisions with the founder — ask one question at a time instead of dumping several, so the hard ones don't get skipped.
---

<!--
Adapted from addyosmani/agent-skills (Interview One Question At A Time).
Core insight preserved, structure aligned to Wingman skill conventions.
-->

# Interview One Question At A Time

## Overview

When exploring requirements, debugging, or negotiating design decisions, the natural instinct is to dump every question at once. This fails predictably: the user answers the easy ones and silently skips the hard ones, leaving critical ambiguity unresolved.

**Core principle:** one question → one answer → process fully → next question.

## When To Use

- Requirements exploration (discovering what the user actually needs)
- Debugging (isolating root cause through structured inquiry)
- Design decisions (resolving ambiguity before implementation)
- Scope negotiation (determining what's in/out)
- Any conversation where multiple unknowns need resolution

## Question Types

### Clarifying

Resolve ambiguity about expected behavior.

> "What exactly should happen when the user clicks submit with an empty form?"

Use when the user's description has gaps or vague language. Don't assume you know what they mean — ask.

### Disqualifying

Distinguish requirements from nice-to-haves.

> "Is real-time sync a hard requirement, or would near-real-time (5-minute delay) be acceptable?"

Use when scope is fuzzy. Force explicit priority decisions before building.

### Constraint

Surface hidden limits.

> "What's the timeline, budget, or technology constraint we're working within?"

Use when the user hasn't stated limits but one likely exists. Unstated constraints surface as surprises late — surface them early.

### Tradeoff

Force a choice between competing goods.

> "Would you prefer option A (fast to build but limited to 100 users) or option B (takes 3x longer but scales to 10k)?"

Use when two valid approaches exist and the user hasn't expressed a preference. Don't pick for them — frame the tradeoff clearly.

### Evidence

Request grounding for beliefs.

> "What would convince you this is the right approach? A prototype? A benchmark? A comparable?"

Use when the user is confident but the basis for that confidence is unclear. This isn't adversarial — it's helping them articulate what they actually know.

## Rules

1. **Never ask more than one question per message.** If you have five questions, ask them in five separate messages.
2. **Process the answer fully before asking the next question.** Don't skim the answer and jump to the next question on your list. Reflect back what you heard, confirm understanding.
3. **Summarize understanding before moving to implementation.** After the last question, produce a concise summary of what you now understand. Get explicit confirmation.
4. **Track decisions in a decisions log.** Each answer that resolves an ambiguity is a decision. Log it. Future questions should reference past decisions, not re-explore them.

## Decisions Log

Maintain a running decisions log during the interview:

```
DECISIONS
========
1. [2026-07-13] Form must validate on submit, not on blur — user confirmed.
2. [2026-07-13] Near-real-time acceptable for sync — user confirmed.
3. [2026-07-13] Must support 10k users — user selected option B.
```

Reference this log to avoid re-asking settled questions and to provide context for new ones.

## Workflow

1. Identify all open questions. List them privately.
2. Pick the highest-leverage question — the one whose answer most constrains the solution space.
3. Ask it. Wait for the answer.
4. Reflect back: "So to confirm, [restate answer]. Is that right?"
5. Log the decision.
6. Repeat from step 2 until all questions are resolved.
7. Produce a summary of the full picture. Get explicit sign-off.
8. Proceed to implementation.

## Verification

The interview is unfinished until the founder has explicitly confirmed the synthesized picture — not until you've asked the last question. Check:

- Every open question was asked **one at a time**, never bundled (re-read your last few messages; a multi-question message is the failure mode this skill exists to prevent).
- Each answer was reflected back and logged before the next question; the decisions log has no re-explored settled items.
- A plain-language summary of the full understanding was produced and the founder gave explicit sign-off before implementation.
- No ambiguity was skipped "because it's probably fine" — every vague answer was probed, per `verification-before-completion`.

## Anti-Rationalization Defense

### Common Rationalizations

| Excuse | Reality |
|---|---|
| "Asking all at once saves time" | It costs time. The user answers easy questions and skips hard ones. You end up with partial information and build the wrong thing. |
| "I already know the answer to this one" | If you're right, asking costs one message. If you're wrong, building the wrong thing costs hours. Ask anyway. |
| "The user seems impatient, I should move fast" | Impatient users who get the wrong thing are more impatient than users who spend five extra messages getting it right. |
| "This is a simple change, I don't need to interview" | Simple changes have simple assumptions. Simple assumptions are often wrong. One clarifying question prevents one bug. |
| "I'll just ask two questions at once, it's basically the same" | It's not the same. Two questions means the user will answer the easier one and skip the harder one. That hard question is probably the important one. |
| "I can infer the answer from context" | You can hypothesize the answer. Hypothesis ≠ knowledge. One question confirms or corrects your inference. |

### Red Flags

- You're about to ask two questions in one message.
- You're skipping a question because you "already know" the answer.
- You're moving to implementation without a summary and explicit confirmation.
- You're asking questions out of convenience order, not leverage order.
- You haven't updated the decisions log in the last three exchanges.
- The user gave a vague answer and you're moving on instead of probing.

### Anti-Pattern Callouts

- **Question dumps:** Sending five questions at once. The user answers the easy ones and ignores the hard ones. You build on incomplete information.
- **Skipped processing:** Asking a question, getting an answer, and immediately asking the next question without reflecting back. Misunderstandings compound.
- **Inference-as-fact:** Assuming you know the answer based on context. One question confirms. Assumptions are technical debt.
- **Speed-over-accuracy:** Rushing through questions to "get to coding." The interview IS the work — bad requirements are the most expensive bug.
