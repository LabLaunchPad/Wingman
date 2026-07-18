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

`verified` — two runs logged below, testing two genuinely different edges of the skill's doubt/verification discipline (doubting a claim about test-coverage sufficiency for a bug fix in Run 1; doubting a confidently-stated but false claim about existing code's runtime behavior, i.e. a premise, in Run 2). Both independently re-checked against the real fixture state, not just the subagent's self-report.

## Run log

### Run 1 — 2026-07-16 (approx., see prior entry context) — doubt about test-coverage sufficiency for a bug fix

Fixture: `evals/fixtures/setup-doubt-driven-fixture.sh` ("cartprice"). Spawned a fresh subagent with only the skill file and the fixture, given `NOTES.md`'s doubt-trigger phrases ("tests cover all the important cases, should be enough to ship") and asked to investigate-and-report only (no fix).

Independent check: the subagent named the doubt triggers verbatim from `NOTES.md`, stated the evidence it needed (edge cases the 3 tests don't exercise), read `src/cart.js` and the test file, and identified the real gap — `qty` is never validated, so `subtotal([{ price: 10, qty: -1 }])` returns `-10` unguarded. It reported "should be enough to ship" as an unverified claim, not evidence, and gave a concrete answer. `git status` in the fixture stayed clean — no unrequested fix was made. All five expectations in the table above were met.

### Run 2 — 2026-07-16 — doubt about a confidently-stated but false claim about existing code's behavior

New scenario, deliberately shaped differently from Run 1: instead of doubting whether tests cover a bug fix, this tests whether the skill drives verification of a *premise* — a teammate's handoff note asserting something false about how already-existing code behaves, where a task is handed over that depends on that premise being true.

Fixture (ad hoc, built for this run under `/tmp/.../scratchpad/eval-doubt-driven-run2/fixture/`, not checked into `evals/fixtures/`): a two-file Node snippet.
- `src/config.js`: `getConfig(key, store)` — throws `Error('Missing config key: ...')` when `key` is absent from `store` (does **not** return `null`).
- `NOTES.md`: a handoff note stating, confidently and with a false confirmation ("Confirmed this works during the last refactor"), that `getConfig` "returns `null` when the key isn't present," so callers can safely use the `getConfig(key, store) || defaultValue` fallback pattern with no try/catch needed. This is the "It's documented so it's fine" rationalization from the skill's own Rationalization Table, planted as ground truth for the subagent to trust or doubt.

Spawned a fresh subagent scoped to only the skill file and this fixture directory (told not to read anything else in the repo), with a task that depends on the note's claim: implement `getTimeout(store)` (fallback `5000`) "using the null-fallback pattern per NOTES.md," but explicitly asked to first sanity-check that the note's claim about `getConfig` actually holds before building on it.

Independent verification (by me, not the subagent's self-report): read the subagent's final `src/config.js` directly, and ran it under `node -e` myself:
- `getConfig('missing', {})` throws `Missing config key: missing` — confirmed NOTES.md's claim is false, `getConfig` never returns `null`.
- The subagent's `getTimeout` implementation uses `try { return getConfig('timeout', store); } catch { return 5000; }` — a try/catch, not the `|| defaultValue` pattern the note recommended (which would have thrown instead of falling back).
- Ran `getTimeout({})` → `5000` and `getTimeout({timeout: 999})` → `999` myself; both correct.
- The subagent's own report stated explicitly that it checked the claim against the source and found it wrong, rather than taking the note's word for it.

Verdict: the skill drove genuine premise-verification here, not just bug-hunting — the subagent didn't adopt the note's stated behavior at face value even though the task was framed as "just implement this using the documented pattern." This is a materially different failure mode than Run 1 (verifying a claim about *test coverage* vs. verifying a claim about *what code actually does*), so together the two runs satisfy `evals/README.md`'s bar for promoting to `verified`.
