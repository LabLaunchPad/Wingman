---
name: token-economy
description: Use for internal-only, non-founder-facing communication — subagent-to-subagent delegation, tool-call narration, department-lead handoffs, working logs. Never use for anything the founder will read (Boardroom verdicts, checkpoint summaries, plan documents) — those are always governed by plain-language-checkpoint instead, which wins on any conflict.
effort: low
---

<!--
Adapted (concept only, not literal text) from JuliusBrussee/caveman, MIT
License, Copyright (c) 2026 Julius Brussee. See /ATTRIBUTIONS.md for
details. Scope is deliberately narrowed from upstream: caveman applies
terseness broadly; this skill applies it only to channels a founder will
never read, per Wingman's plain-language-checkpoint requirement.
-->

# Token Economy

## Overview

Every internal message an agent writes costs tokens whether or not anyone benefits from the words. When one Wingman component is talking to another Wingman component — not to the founder — verbosity is pure cost with no comprehension benefit on the other end (the reader is another LLM call, not a person who needs context rebuilt).

**Core principle:** spend words where a human needs them; don't spend them where only a machine is reading.

## When To Use

Internal-only channels: a pipeline command's instructions to a boardroom seat or department-lead subagent, a subagent's tool-call narration to itself, working logs, delegation handoffs, intermediate scratch notes.

**Never use for:** anything rendered to the founder — Boardroom verdicts, `/wingman:*` stage completion messages, plan Plain-Language Summaries, `AskUserQuestion` prompts, error messages the founder will see. These are governed by `plain-language-checkpoint`, which always wins if the two skills would conflict. When in doubt about which channel you're in, default to plain language — the failure mode of over-explaining to a founder is mild annoyance; the failure mode of under-explaining is a founder shipping something they didn't actually understand.

## Core Workflow

1. Identify the reader of this specific message: a person (founder) or another agent/process.
2. If a person: stop, this skill doesn't apply — use `plain-language-checkpoint` instead.
3. If another agent/process: drop filler, pleasantries, and restated context the reader can already access (file paths, prior tool output) — keep facts, numbers, file locations, and next actions.
4. Never compress code, commands, error text, file paths, or numbers — these must stay byte-for-byte exact regardless of how terse the surrounding prose gets.
5. If compressing would make the message ambiguous or drop a security-relevant or irreversible-action detail, don't compress it — clarity beats economy the instant there's a real tradeoff.

## Constraints

**MUST:**
- Preserve all code, commands, error output, file paths, and numbers verbatim.
- Default to plain, uncompressed language the moment the reader might be a human.

**MUST NOT:**
- Apply this skill to any Boardroom verdict, checkpoint summary, or other founder-facing output.
- Compress away a security warning, an irreversible-action warning, or genuine ambiguity for the sake of brevity.
- Assume "shorter" and "cheaper" are the same thing — see Verification below.

## Rationalizations

| Excuse | Reality |
|---|---|
| "Terser is always cheaper overall" | Not measured, and not always true — see Verification. A terse reply that gets misunderstood costs a follow-up round-trip, which is more expensive than one clear message. |
| "The founder won't read this anyway" | Then it isn't founder-facing, and this skill applies — but confirm that assumption before compressing; if there's any chance a human reads it, don't compress. |
| "I can drop the reasoning, just keep the answer" | Fine for agent-to-agent handoffs with no downstream audit need; not fine if a later step (e.g. a retro or `/wingman:learn` entry) needs to reconstruct why a decision was made. |

## Red Flags — Stop and Reconsider

- You're about to compress a Boardroom verdict, a checkpoint summary, or anything with `AskUserQuestion` in front of it.
- You're compressing a security warning or a description of an irreversible action to save space.
- You genuinely can't tell whether the reader is a person or another agent — treat it as a person.

## Verification

Don't assume compression saved anything — the caveman research found real cases (small conversational exchanges, per-request-billed tools) where added rule overhead made terse output cost *more* net tokens than plain prose would have. Before relying on this skill for a genuinely high-volume internal channel, spot-check: compare total round-trip tokens (including any follow-up clarification caused by ambiguity) against the uncompressed baseline, not just the length of one message in isolation.

## Output

No fixed template — this skill governs style, not structure. The test is: could another agent reading this message act correctly on the first read, using only facts, file paths, and next actions? If yes, it's compressed enough. If it had to guess at something dropped, it was compressed too far.

## Anti-Rationalization Defense

### Common Rationalizations

| Excuse | Reality |
|---|---|
| "Terser is always cheaper overall" | Not measured, and not always true — a terse reply that gets misunderstood costs a follow-up round-trip, which is more expensive than one clear message. |
| "The founder won't read this anyway" | Confirm that assumption before compressing; if there's any chance a human reads it, don't compress. |
| "I can drop the reasoning, just keep the answer" | Fine for agent-to-agent handoffs with no downstream audit need; not fine if a retro or learn entry needs to reconstruct why. |
| "Compression always saves tokens" | The caveman research found real cases where added rule overhead made terse output cost MORE net tokens than plain prose. Verify, don't assume. |
| "This warning is too verbose, I'll shorten it" | Security warnings and irreversible-action descriptions must stay verbatim. Compression here is a liability. |

### Red Flags

- You're about to compress a Boardroom verdict, a checkpoint summary, or anything with `AskUserQuestion` in front of it.
- You're compressing a security warning or a description of an irreversible action to save space.
- You genuinely can't tell whether the reader is a person or another agent — treat it as a person.
- You're dropping reasoning that a future retro or learn entry might need to reconstruct.
- You're compressing code, commands, error output, file paths, or numbers — these must stay byte-for-byte exact.

### Anti-Pattern Callouts

- **Compression-as-omission:** Dropping a detail that the reader might need is not economy, it's information loss. Compression means removing filler, not facts.
- **Context-blind compression:** Applying token economy to founder-facing output. This skill is internal-only — the moment a human might read it, plain language wins.
- **Measured-shorter-vs-cheaper:** Shorter messages are not always cheaper. A terse message that triggers a clarification round-trip costs more than a clear first message.

See `docs/ARCHITECTURE.md` for this skill's place in Wingman's overall architecture.


---

## Harness note: OpenCode (auto-generated by `generate-harness-adapters.mjs` -- do not hand-edit)

This file is a generated copy of the canonical Claude Code source. It references the following Claude-Code-specific mechanism(s); here is the real OpenCode equivalent:

- **AskUserQuestion**: OpenCode has no structured multi-choice question UI. Ask the same question as plain conversational text, listing the options in prose, and take the reply as free-form text.


---

## Harness note: Codex CLI (auto-generated by `generate-harness-adapters.mjs` -- do not hand-edit)

This file is a generated copy of the canonical Claude Code source. It references the following Claude-Code-specific mechanism(s); here is the real Codex CLI equivalent:

- **AskUserQuestion**: Codex CLI has no structured multi-choice question UI. Ask the same question as plain conversational text, listing the options in prose, and take the reply as free-form text.
