# Eval: evidence-gated-catalog

Tests `plugins/wingman/skills/evidence-gated-catalog/SKILL.md` behaviorally — given one catalog proposal that claims `status: proven` but actually has no real test case, a straw-man negative test, and an unmeasurable outcome, and a second proposal that genuinely satisfies all three evidence gates, does a fresh agent correctly reject/demote the first and approve the second — rather than trusting the claimed status or rubber-stamping both.

## Fixture

`evals/fixtures/setup-evidence-gated-fixture.sh` — a `proposals/` directory with two competing entries:
- `proposal-unproven.md` ("batch-retry-with-backoff") — front matter claims `status: proven`, but Gate 1's "evidence" is "it clearly works, I've seen it work many times" (no reproducible test case), Gate 2's negative test is a straw man ("someone tries to use this for a completely unrelated thing"), and Gate 3's outcome is vague ("things are more reliable now," no stated baseline/after numbers).
- `proposal-with-evidence.md` ("idempotency-key-on-webhook-handler") — `status: draft`, with a specific reproducible Gate 1 incident (a dated double-email bug, with the exact re-POST verification method), a realistic Gate 2 negative test (a read-only audit-log handler where the pattern is unnecessary), and a Gate 3 outcome with real baseline/after numbers (3 vs. 0 duplicate emails per 1,000 deliveries).

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with only `evidence-gated-catalog/SKILL.md` and the `proposals/` directory — not told which one is genuinely evidenced. Prompt: "Review both proposed catalog entries in `proposals/`. For each, decide whether it qualifies for the tier its front matter claims (or a different tier), citing which of the 3 gates pass or fail."
3. Independently re-read both proposal files myself against the skill's Gate 1/2/3 criteria and compare to the subagent's verdict.

## Expectations

| Check | Expected |
|---|---|
| Unproven entry correctly demoted | `proposal-unproven.md` is NOT accepted as `proven` — explicitly identifies it fails Gate 1 (no reproducible test case, only an anecdote), Gate 2 (straw-man negative), and Gate 3 (no stated baseline/after) |
| Evidenced entry correctly assessed | `proposal-with-evidence.md` is recognized as passing all 3 gates (specific reproducible incident + verification method, realistic negative test, real baseline/after numbers) and eligible to move beyond `draft` |
| Reasoning cites the actual gate criteria | Verdict references the specific gate requirements (real-world test case / negative test / measurable outcome), not a vague "looks fine" or "looks sketchy" |
| No rubber-stamping either direction | Doesn't accept `proposal-unproven.md`'s self-declared `status: proven` at face value, and doesn't reflexively distrust `proposal-with-evidence.md` just because it's still marked `draft` |

## Trust level

`authored, pending first run` — the fixture and expectations are written but the case has not yet been executed (spawn a fresh subagent against the fixture, grade independently, log the result). Do not treat this as `provisional` until a real run log entry exists below.

## Run log

(pending — filled in after the eval is actually run and independently verified)
