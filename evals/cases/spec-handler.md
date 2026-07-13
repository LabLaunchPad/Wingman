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

`authored, pending first run` — the fixture and expectations are written but the case has not yet been executed (spawn a fresh subagent against the fixture, grade independently, log the result). Do not treat this as `provisional` until a real run log entry exists below.

## Run log

(pending — filled in after the eval is actually run and independently verified)
