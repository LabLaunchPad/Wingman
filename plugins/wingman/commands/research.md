---
description: Deep, source-grounded research for a founder decision — decomposes a question, searches and reads evidence, and returns a plain-language brief with citations. Use when the founder needs to investigate or compare before deciding.
---

# /wingman:research

Investigate a topic with evidence and return a plain-language brief. This is the
founder-facing entry point to the `research` skill.

## When to use
- "What do other vendors do about X?"
- "Find the best practice for Y."
- "Is there a standard pattern for Z before we decide?"

## Steps
1. Load the `research` skill and follow its method.
2. Decompose the founder's question into 2-4 sub-questions.
3. Search and read primary sources; prefer vendor docs and the pinned
   `vendor/` references where relevant.
4. Synthesize a brief: bottom-line paragraph, bulleted findings each with a
   source link, and a confidence note (high/medium/low).
5. End with a plain-language recommendation and any open gaps.
6. If the question implies a build/plan decision, suggest `/wingman:plan` or
   `/wingman:advisory` as the next step — do not skip the Boardroom checkpoint
   convention.

## Guardrails
- Never fabricate citations; only cite sources you actually opened.
- Lead with consequence, not mechanism.
- Do not write or edit code; this is research only.
