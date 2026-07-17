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

## Rationalizations

| Excuse | Reality |
|---|---|
| "The founder can just ask if they don't understand" | They can't evaluate what they don't know is missing — the burden is on the checkpoint, not on the founder to catch the gap. |
| "This technical detail is important context" | If it's important, translate its consequence; if it can't be translated, it probably wasn't decision-relevant to begin with. |
| "It's basically fine, no need to hedge" | If you haven't verified it, say what you actually know — false confidence is worse than an honest "not yet checked." |

## Red Flags — Stop and Reconsider

- You're about to send a technical term to the founder without defining it in the same sentence.
- You're about to lead with mechanism ("how it broke") instead of consequence ("what it means for them").
- You're about to write "looks fine" / "should work" without evidence behind it.
- The message has no single bottom-line sentence a founder could stop reading after and still know what to do.

## Verification

Before sending any founder-facing message, check it against the "three things" rule in step 3 above (what it is, why it matters, what to do) and re-read it as if you were the founder with no technical background — if any sentence requires unstated context to act on, rewrite it before sending.

## When this applies

Every boardroom agent verdict, every `/wingman:*` stage completion message, and any time this plugin reports status to the user — not just the dedicated `/wingman:boardroom` command.

## References

- `skills/visual-founder-output` — the visual-layer companion to this skill, for output whose
  underlying content is structurally a flow, tree, or grid (a diagram/tree can help; this skill's
  own bar governs the words either way, and always leads).

## Anti-Rationalization Defense

### Common Rationalizations

| Excuse | Reality |
|---|---|
| "The founder can just ask if they don't understand" | They can't evaluate what they don't know is missing — the burden is on the checkpoint, not on the founder to catch the gap. |
| "This technical detail is important context" | If it's important, translate its consequence; if it can't be translated, it probably wasn't decision-relevant to begin with. |
| "It's basically fine, no need to hedge" | If you haven't verified it, say what you actually know — false confidence is worse than an honest "not yet checked." |
| "I'll just explain the technical term, they'll get it" | If you must use a term, define it in the same breath the first time and then never use it again. One definition, then plain consequences. |
| "The bullet points are clear enough" | A wall of bullet points with no bottom line is not clear. One bottom-line sentence first, details after, only if asked. |
| "Adding the consequence makes it too long" | Lead with consequence in one sentence. The finding is still short — it's just honest about what it means. |

### Red Flags

- You're about to send a technical term to the founder without defining it in the same sentence.
- You're about to lead with mechanism ("how it broke") instead of consequence ("what it means for them").
- You're about to write "looks fine" / "should work" without evidence behind it.
- The message has no single bottom-line sentence a founder could stop reading after and still know what to do.
- You're hiding a real risk behind reassurance — "looks fine" is not a verdict.
- You're using jargon in a founder-facing message that you haven't defined in plain language.

### Anti-Pattern Callouts

- **Jargon-as-communication:** Using technical terms in founder-facing output without translating them to consequences. The founder doesn't need to know what a "race condition" is — they need to know that two people clicking buy at the same time could double-charge one of them.
- **Mechanism-over-consequence:** Explaining how something broke instead of what it means for the user or business. Founders act on consequences, not mechanisms.
- **False confidence:** Saying "looks fine" or "should work" without verification evidence. An honest "I haven't checked yet" is more useful than a false positive.
