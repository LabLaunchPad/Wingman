---
name: code-review
description: Use when the founder wants a plain-language second pass on code quality before shipping — correctness, security, simplicity, and test coverage called out in founder terms, not jargon. Renders a review verdict only; never writes or edits code itself.
---

# Code Review

A focused, plain-language second pass on code quality, for founders who want a
real review before ship but don't want a wall of diffs. This is the code-specific
lens that complements the engineering Boardroom seat and `/wingman:audit` — it
goes one level deeper on the actual changes.

## When to use
- The founder asks "is this code good?" / "review this before we ship."
- After a build stage and before `/wingman:ship`.
- A PR is open and needs a readable verdict, not just a green check.

## Method
1. Scope the review to what changed (the diff / the files touched), not the
   whole repo.
2. Review across four lenses, in founder terms:
   - **Correctness** — does it do what it claims? Edge cases, error paths.
   - **Security** — secrets, injection, authz, untrusted input (pair with the
     `security-checklist` skill and `/wingman:secure`'s threat register).
   - **Simplicity** — could it be smaller/clearer? (pair with
     `engineering-minimalism`; flag `#yagni`/`#shrink` candidates).
   - **Tests** — is the behavior covered? Does a change need a new test?
3. Rate each finding: **Blocker** (must fix before ship), **Should-fix**
   (fix soon), **Nit** (optional).
4. Lead with the bottom line in one sentence: "Ship it" / "Fix the 2 blockers
   first" / "Almost there."
5. Never edit code yourself — hand the findings back for the builder to act on.

## Output shape
- One-line bottom line.
- Bulleted findings, each: severity + file + plain-language what/why.
- A suggested next step (fix, or proceed to `/wingman:ship`).

## Rationalizations
- "Green CI means it's reviewed." — CI checks build, not quality or intent.
- "It's a small change, skip the review." — Small changes ship bugs too.
- "I'll just fix it while reviewing." — Review and edit are separate passes;
  mixing them hides what was found vs. changed.

## Red Flags
- Reviewing code you just wrote without a fresh eye (ask for the Boardroom or a
  second agent).
- Rating everything "nit" to avoid friction — name the real blockers.
- Dumping raw diffs at the founder instead of a plain-language verdict.

## Verification
After the review, re-read your bottom line against the actual findings: every
Blocker is named with a file and a reason, the severity labels are honest, and
you did not edit the code yourself. If a finding lacks a file or a why, it isn't
done.
