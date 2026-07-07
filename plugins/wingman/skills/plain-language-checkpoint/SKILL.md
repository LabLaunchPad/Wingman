---
name: plain-language-checkpoint
description: Use whenever presenting a plan, diff, review verdict, or completion status to the founder using this plugin — translates technical findings into a short, jargon-free decision the founder can actually act on. Triggers on "explain this to a founder", "plain language", "non-technical summary", or any Wingman boardroom/checkpoint output.
---

# Plain-Language Checkpoint

Wingman's core promise is that a non-technical founder can run a full SDLC without reading code or diffs. That promise is only as good as the last checkpoint they saw. This skill is the writing bar every Wingman checkpoint (boardroom summaries, stage completions, error reports) must clear.

## The rule

**If a smart 16-year-old with no coding background couldn't act on this sentence, rewrite it.**

That doesn't mean dumbing down the substance — it means translating it. A founder can absolutely understand "if two customers hit 'buy' at the same second, one of them could get charged twice" even though they'd never parse "race condition in the payment mutation."

## How to translate

1. **Name the technical thing once, then never again.** If you must use a term (API, database, deploy), define it in the same breath the first time and then just describe the consequence afterward.
2. **Lead with the consequence, not the mechanism.** Not "there's an unhandled null case in the response parser" — instead "if the server sends back an empty response, the app will crash instead of showing an error."
3. **Every finding needs three things**: what it is (plain), why it matters to the business or user, and what to do about it. A finding missing any of these three is not checkpoint-ready.
4. **Size things founders can act on.** "Small fix, 10 minutes" or "this changes pricing logic, worth a careful look" beats an unqualified list of issues.
5. **Never hide a real risk behind reassurance.** "Looks fine" is not a verdict — a verdict has evidence. If something is genuinely uncertain, say that plainly instead of implying confidence you don't have.

## Anti-patterns — rewrite on sight

| Don't write | Write instead |
|---|---|
| "Refactored the auth middleware to handle edge cases" | "Fixed a bug where some users could get logged out unexpectedly" |
| "Minor lint issues remain" | (usually just omit — not founder-relevant) |
| "LGTM, ship it" | "This does what you asked, I tested it, and I didn't find anything risky — safe to ship" |
| "There's a potential race condition" | "If two people do this at the exact same time, one of their changes could get silently lost" |
| A wall of bullet points with no bottom line | One bottom-line sentence first, details after, only if asked |

## When this applies

Every boardroom agent verdict, every `/wingman:*` stage completion message, and any time this plugin reports status to the user — not just the dedicated `/wingman:boardroom` command.
