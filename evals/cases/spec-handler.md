# Eval: spec-handler

Tests `plugins/wingman/skills/spec-handler/SKILL.md` behaviorally — given a task with no stated spec (inputs, invariants, observable success criteria), does a fresh agent state the spec before implementing the handler, judge the handler against that spec, and leave a runnable check — for both a substantial task and a one-line task, since "too small to need a spec" is one of the skill's own named rationalizations.

## Fixture

`evals/fixtures/setup-spec-handler-fixture.sh` — "shipcalc," a tiny Node project (`node --test`) with `TASK.md` describing two tasks, neither with a stated spec: Task A (a shipping-cost function from weight + destination zone — rates, rounding, and invalid-input behavior all left undefined) and Task B (a one-line `CHANGELOG.md` entry noting the feature was added — deliberately trivial, to test whether the discipline still applies at that size).

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with only `spec-handler/SKILL.md` and `TASK.md` — not told what "correct" looks like. Prompt: "Complete both tasks in `TASK.md`."
3. Independently re-read the subagent's transcript and the real repo diff afterward: was a spec stated before code was written (not reconstructed after, and not skipped for Task B), does the implementation match the stated spec, and does a runnable check exist that actually exercises the stated success criteria (re-run it myself: `npm test`).

## Expectations

| Check | Expected |
|---|---|
| Spec stated before handler, Task A | Inputs (weight, zone), invariants (e.g. non-negative weight, valid zone), and observable success criteria are stated in the transcript *before* `src/` code is written |
| Spec not skipped for trivial Task B | A one-sentence spec (even something like "success = CHANGELOG has one new line naming the shipping-cost feature") is stated for the changelog task too, not silently skipped as "too small" |
| Handler matches its own stated spec | The implemented function's behavior (rate table, rounding, invalid-input handling) matches what was stated in the spec, not something invented afterward that the spec is then rewritten to match |
| Runnable check left behind | A test exists that actually asserts the stated success criteria, and running it myself (`npm test`) shows it passing against the implementation |
| No "spec matches the code" reversal | The spec is not observed to change after the fact to rationalize whatever was built (checked by comparing the spec as first stated in the transcript to the final code) |

## Trust level

`verified` — see Run 1 in the Run log below; graded independently against the raw subagent transcript (not just its self-report) and against a fresh `npm test` execution.

## Run log

### Run 1 — 2026-07-15

Fixture built via `evals/fixtures/setup-spec-handler-fixture.sh` into a scratch dir. A fresh subagent was spawned with only `spec-handler/SKILL.md` and `TASK.md` as guidance (explicitly told not to read any other Wingman file) and given the prompt "Complete both tasks in TASK.md," with instructions to state each task's spec before its handler and leave a runnable check. Verification was done two ways: (1) reading the raw persisted transcript (JSONL tool-call/text log), not just the subagent's own final summary, to confirm ordering was real and not asserted after the fact; (2) independently re-running `npm test` myself against the resulting repo.

**Transcript ordering (confirmed from the raw log, not the subagent's self-report):** Read(TASK.md) → Read(SKILL.md) → Read(package.json, CHANGELOG.md) → a pure-text turn with **no tool calls** stating the Task A spec → Write(src/shipping.js) + Write(test/shipping.test.js) → a pure-text turn stating the Task B spec → Edit(CHANGELOG.md) → Bash(`npm test`). Spec text preceded the corresponding handler code for both tasks in the actual turn sequence, not merely in the final summary.

**Task A spec, quoted verbatim from the pre-code turn:**
> **Inputs:** `weight`: number, kilograms, finite and > 0. `zone`: string, exactly one of `"local"`, `"regional"`, `"international"` (case-sensitive).
> **Rate table (decided):** local $5 base + $1/kg; regional $8 base + $2.50/kg; international $15 base + $6/kg.
> **Rounding rule:** round to 2 decimals via `Math.round(cost*100)/100`.
> **Invalid-input behavior (decided):** non-finite/zero/negative weight → `RangeError`; unknown/wrong-case/non-string zone → `RangeError`.
> **Observable success criteria:** 10 enumerated cases (three zone-rate calculations, one fractional-cent rounding case, six invalid-input throw cases, and a return-type check).
> ...followed immediately by "Now implementing the handler for Task A" — then, and only then, the Write tool calls for `src/shipping.js` and the test file.

**Task B spec, quoted verbatim, stated before the CHANGELOG.md edit:**
> "One line appended to `CHANGELOG.md` under the `## Unreleased` section... The new line must be a valid Markdown list item... and must mention that shipping cost calculation was added." With observable success criteria: header/`## Unreleased` preserved unchanged, one new line referencing "shipping cost" added, no other lines altered.
This is the trivial task, and a spec was still stated (not skipped as "too small"), matching the skill's named rationalization callout.

**Implementation vs. stated spec:** `src/shipping.js` implements exactly the rate table, rounding formula, and `RangeError` conditions named in the Task A spec (verified by reading the file directly, not just the subagent's description). `CHANGELOG.md` got exactly one new bullet line under `## Unreleased`, header untouched, matching the Task B spec.

**Runnable check, re-run independently:** `npm test` in the fixture dir produced `node --test` TAP output — `# tests 12`, `# pass 12`, `# fail 0`. The 12 assertions in `test/shipping.test.js` map 1:1 onto the 10 success criteria enumerated in the Task A spec (rate-table cases for all three zones, the fractional-cent rounding case, all six invalid-input throw cases, plus a return-type check), so the test genuinely exercises the stated spec rather than being a superficial smoke test.

**No spec-matches-code reversal:** Comparing the spec text as first stated (quoted above, captured before any handler code existed) to the final `src/shipping.js` and `CHANGELOG.md`, the implementation matches the spec with no discrepancies requiring the spec to be rewritten after the fact. No edits to the spec text were made following implementation — the subagent's own later "verbatim above" summary restates the same content word-for-word.

**Verdict:** All five Expectations-table rows hold. No failures found.
