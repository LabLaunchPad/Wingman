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

`verified` — two runs, differently shaped: Run 1 exercises the fixture's own designed positive/
negative pair (an unproven `proven`-claiming entry vs. a genuinely evidenced `draft`-claiming
entry); Run 2 tests a different failure mode entirely — a catalog entry whose front matter claims
the higher `standard` tier by miscounting one real incident, described from 3 different narrator
angles, as "3 independent confirmations."

## Run log

### Run 1 — 2026-07-15

Ran `evals/fixtures/setup-evidence-gated-fixture.sh`, producing `proposals/proposal-unproven.md`
and `proposals/proposal-with-evidence.md`. A fresh subagent, given only `evidence-gated-catalog/SKILL.md`
and the `proposals/` directory, was asked to assess both against their claimed tiers.

- **`proposal-unproven.md` (claims `proven`)** — correctly demoted to `draft`: Gate 1 fails (its
  "evidence" is "it clearly works, I've seen it work many times," an anecdote with no reproducible
  test case — the subagent quoted the skill's own rationalization-table entry for this almost
  verbatim), Gate 2 fails (a straw-man negative test: "someone tries to use this for a completely
  unrelated thing" / "it's obviously not for that"), Gate 3 fails (vague outcome, "things are more
  reliable now," no stated baseline/after numbers).
- **`proposal-with-evidence.md` (claims `draft`)** — correctly recognized as passing all 3 gates:
  a specific, dated, reproducible incident (the `stripe-webhook-handler` double-email bug,
  verified by re-POSTing the captured payload and diffing the `emails_sent` row count), a realistic
  (not straw-man) negative test (a read-only audit-log handler where idempotency is unnecessary),
  and a real baseline/after metric (3 vs. 0 duplicate emails per 1,000 deliveries). The subagent
  correctly flagged this entry as *under*-tiered — it qualifies for `proven` despite being marked
  `draft` — but correctly declined to call it `standard`, since the entry's own text says "single
  project... one data point," short of the 3+-independent-contexts bar for that tier.

Independently re-read both proposal files myself against the same 3 gates; the subagent's
gate-by-gate reasoning matched my own read exactly, with no rubber-stamping in either direction
(neither trusting `proposal-unproven.md`'s self-declared `proven` status, nor reflexively
distrusting `proposal-with-evidence.md` for still being marked `draft`).

### Run 2 — 2026-07-15

A different failure mode than Run 1's clean proven-vs-evidenced pair: a constructed catalog entry
(a `billing-worker` queue-stall incident with a DLQ-after-5-retries fix) whose front matter claims
`status: standard` on the stated basis of "3 independent confirmations" — but all 3 "Test Cases"
turn out to be the identical 2026-05-11 incident described from 3 different narrator angles (a
direct account, an on-call investigation transcript, and a postmortem), not 3 independent
projects/contexts.

A fresh subagent, given only the skill file and this entry, correctly identified that all 3 test
cases trace to the same queue, same date, same root cause, same fix, same single replay test — and
demoted the claimed `standard` down to `proven` (Gates 1-3 individually pass on the strength of the
one real incident, but the entry doesn't clear Standard's explicit "3+ independent projects/
contexts" bar, which the front matter's own confidence claim conflates with "3 sources describing
the same incident"). The subagent's reasoning cited the skill's own Anti-Rationalization Defense
entries ("other projects use this pattern" → "document those projects specifically") almost
verbatim, and correctly named the specific gate-bypass rationalization pattern being attempted
rather than giving a vague verdict.

Independently re-verified the entry's own text: all 3 "Test Case" sections do share the identical
date, queue name, and root-cause description, confirming the demotion was correct and not a false
positive against a genuinely-evidenced entry.
