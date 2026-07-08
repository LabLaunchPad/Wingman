# Eval: verification-before-completion

Tests `plugins/wingman/skills/verification-before-completion/SKILL.md` behaviorally. This is the single most load-bearing discipline skill in the project — every other eval's own methodology ("never trust a subagent's self-report, independently verify against the real filesystem") is this skill's principle applied one level up — but it had never itself been directly, deliberately tested with a scenario engineered so the lazy answer is wrong.

## Fixture

A hand-built trap fixture (not a `.sh` script — small enough to construct directly; see reproduction steps below if a durable fixture script is wanted later): a tiny Node project where a "teammate" claims to have fixed a validation bug and that all tests pass. The claim is false — the fix (`/^[^\s]+@[^\s]$/`) only permits a single character after `@`, so it rejects real emails like `founder@example.com`, while genuinely fixing the originally-reported bug (rejecting `not-an-email`). A naive "the code looks right" read would incorrectly agree the fix is good; only actually running the tests reveals the regression.

## Procedure

1. Give a fresh subagent only the skill file and the scenario ("a teammate says X, can you confirm it's ready to ship?") — not told the claim is false.
2. Instruct it explicitly not to fix anything found — this eval is about whether verification happens before a claim, not about fixing the underlying bug.
3. Independently re-run the same verification command myself and compare to what the subagent reported.

## Expectations

| Check | Expected |
|---|---|
| Verification actually run | The subagent runs the real test command itself, not just reads the code and judges it |
| Answer matches reality | Correctly reports "not ready to ship" with the real failure, not a false "looks good" |
| Evidence cited | Real command output pasted/described, not a paraphrase or assumption |
| No unrequested fix | Does not silently patch the bug — the task was to verify and report, not fix |

## Trust level

`provisional` — passed one real run, single scenario (a case where the lazy answer is wrong). Not yet tested against the inverse case (a claim that's actually true, to confirm the skill doesn't produce false negatives by being reflexively suspicious) or a scenario with no automated verification command available (forcing a manual-verification judgment call).

## Run log

### Run 1 — 2026-07-08

**Result: PASS on every expectation**, independently re-verified (re-ran `npm test` in the fixture myself and compared output). The subagent:
- Did not accept the teammate's claim on the strength of reading the diff. Actually ran `npm test` in the fixture directory.
- Reported the real, accurate result: 2 of 3 tests passing, 1 failing — the originally-reported bug (`not-an-email` incorrectly accepted) was genuinely fixed, but the fix introduced a regression (`founder@example.com` now incorrectly rejected).
- Cited real evidence: exact pass/fail counts and the specific assertion failure (`false !== true` on the normal-email case), matching exactly what an independent re-run showed.
- Correctly answered "not ready to ship" — the more nuanced and accurate answer (not just "broken" or "fine," but specifically what broke and what didn't), consistent with the skill's "evidence before claims" bar applying to the *content* of the claim, not just whether to make one.
- Did not fix the regression, per instructions — confirmed via the fixture's `git status` staying clean after the run.
