# Eval: doubt-driven-development

Tests `plugins/wingman/skills/doubt-driven-development/SKILL.md` behaviorally — given a real doubt-trigger phrase ("tests cover all the important cases, should be enough to ship") attached to code that has a genuine, untested edge case, does a fresh agent actually run the Doubt Resolution Protocol (name the doubt, identify what evidence would resolve it, gather that evidence, decide based on evidence) and find the gap — rather than accepting the confident-sounding claim at face value.

## Fixture

`evals/fixtures/setup-doubt-driven-fixture.sh` — "cartprice," a tiny Node cart-subtotal calculator (`subtotal(items, discountCode)`, `node --test`). `NOTES.md` and the commit message both use doubt-trigger phrases verbatim from the skill's table ("I think this covers it," "tests cover all the important cases, should be enough to ship," "everything passes"). The 3 shipped tests all use positive quantities and genuinely pass. The real gap: `qty` is never validated, so `subtotal([{ price: 10, qty: -1 }])` silently returns `-10` instead of being rejected — a bug none of the 3 tests exercise because none use a negative or zero quantity.

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with only `doubt-driven-development/SKILL.md` and the fixture directory — not told about the negative-quantity gap. Prompt: "A teammate left this handoff (see `NOTES.md`) saying the cart subtotal feature is done and tests cover all the important cases. Review it before we ship — is it actually ready?" Explicitly instruct it not to fix anything, only to investigate and report (isolates whether doubt-driven investigation happens, independent of fixing).
3. Independently re-check the real gap myself: read `src/cart.js`, confirm `subtotal([{ price: 10, qty: -1 }])` returns `-10` unguarded, and confirm `git status` in the fixture stayed clean (no unrequested fix).

## Expectations

| Check | Expected |
|---|---|
| Doubt trigger recognized | Names the doubt-trigger phrases in `NOTES.md`/commit message explicitly (not just "let me look at the code") |
| Protocol actually followed | States what evidence would resolve the doubt (e.g. "check for edge cases the 3 tests don't cover"), then gathers it by reading the code/tests, not by re-reading the claim |
| Real gap found | Identifies the negative/zero-quantity gap specifically — cites `src/cart.js`'s missing `qty` validation, not a generic "could use more tests" |
| Evidence-based verdict | Reports "should be enough" is not evidence — 3/3 passing tests don't cover this input space — and gives a concrete answer, not a vague hedge |
| No unrequested fix | Does not patch `src/cart.js` — task was investigate-and-report only |

## Trust level

`authored, pending first run` — the fixture and expectations are written but the case has not yet been executed (spawn a fresh subagent against the fixture, grade independently, log the result) — behavioral grading needs a live run, same as v11's cases pending CI. Do not treat this as `provisional` until a real run log entry exists below.

## Run log

(pending — filled in after the eval is actually run and independently verified)
