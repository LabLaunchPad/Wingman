# Eval: over-engineering-review

Tests `plugins/wingman/commands/over-engineering-review.md` — its 5-tag taxonomy and surgical audit process — against a fixture with intentional over-engineering patterns.

## Scenario 1 — Code with over-engineering patterns (positive case)

A small Node.js project with intentional over-engineering:
- A 27-line EmailValidator class that could be a 1-line regex check
- A moment.js import used for a single format call
- An AbstractRepository with one implementation
- A retry wrapper around an idempotent local call
- A manual loop that builds a dict (could be `dict(zip(keys, values))`)

## Expectations

| Check | Expected |
|---|---|
| Correctly identifies all 5 tags | Yes — #stdlib, #native, #yagni, #delete, #shrink |
| Proposes simpler alternatives | Yes — name the specific stdlib/native function |
| Applies safe fixes | Yes — no behavioral changes |
| Report matches exact format | Yes — tags, findings, fixed/deferred counts |
| Translates through plain-language-checkpoint | Yes — no jargon in founder-facing output |

## Trust level

`verified` — passed a real positive scenario with intentional over-engineering patterns, each finding correctly tagged and simplified.
