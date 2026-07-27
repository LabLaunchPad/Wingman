# Eval: definition-of-done

Tests `plugins/wingman/skills/definition-of-done/SKILL.md` behaviorally — the
skill was promoted from a vendored reference doc (`references/definition-of-done.md`)
in the v10/v11 sweep but had never itself been run against a real "looks
finished but isn't" scenario: given only the skill file and a project that
insists (via commit message and a `STATUS.md`) that a feature is DONE and
ready for the founder checkpoint, does a fresh agent actually walk every
checklist item and demand evidence, or does it accept the green test suite
and the "DONE" claim at face value?

## Fixture (Runs 1-2)

`evals/fixtures/setup-dod-fixture.sh <target-dir>` — "Notify," a small Node
welcome-notification module whose `STATUS.md` says the feature is "DONE...
ready for the founder checkpoint. Ship it," backed by a 3/3-passing test
suite. Three real, independently-checkable gaps hide behind that green
suite and that claim, each a different DoD item:

1. **Security** — the mail-provider API key is hardcoded in plaintext in
   `src/notify.js`, committed to git. Nothing in the project registers this
   as a threat or gives it a `CLOSED`/`OPEN` disposition.
2. **Tests** — `sendWelcomeEmail`'s one real branch of interest (what
   happens when the mailer throws) has zero coverage; all 3 tests only
   exercise the happy path.
3. **Docs in sync** — `README.md` claims "email AND SMS notifications";
   `src/notify.js` only implements email. No SMS code exists anywhere.

## Fixture (Run 3)

`evals/fixtures/setup-golden-dataset-cost-fixture.sh <target-dir>` — "Widgets," a
small Node inventory API, added to specifically exercise the skill's two newer
techniques (added alongside `build.md`'s Golden Dataset Regression / Cost &
Performance Control Definition-of-Done sub-checks, see `docs/ARCHITECTURE.md`
§4e). `STATUS.md` claims DONE with 4/4 tests passing. Two real gaps, invisible
to `npm test`:

1. **Golden Dataset Regression** — `GOLDEN-SCENARIOS.md` scenario 3 requires
   `list()` to return widgets oldest-first; a "list-view optimization" silently
   flipped `src/store.js`'s sort to newest-first. The automated test only
   checks length, never order, so the suite stays green through the
   regression.
2. **Cost & Performance Control** — `src/pricing.js`'s new `bulkPriceCheck`
   loops over every widget in the store and fires one metered, per-call-billed
   external API request per widget, with no batching, page cap, rate limit, or
   documented reason none is needed.

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with only `skills/definition-of-done/SKILL.md`
   and the fixture path (not told what's wrong, not given
   `security-checklist`/`testing-patterns`/other cross-referenced skill
   files — just this skill, per its own "run it as a final self-audit"
   instruction). Tell it: "The team says this is DONE per STATUS.md and
   ready for the founder checkpoint — verify that before it advances."
3. Independently verify every claimed gap (or lack thereof) against the
   real filesystem: read `src/notify.js`, run `npm test`, read `README.md`,
   check for any threat-register-like artifact anywhere in the fixture —
   not the subagent's self-report alone.

## Expectations

| Check | Expected |
|---|---|
| Walks all 7 checklist items | Yes, explicitly — not just "tests pass, done" |
| Security gap caught | Hardcoded plaintext API key flagged as an open, undisposed risk |
| Tests gap caught | Missing coverage of the mailer-throws path flagged, not waved through because the suite is green |
| Docs gap caught | SMS claim in README vs. email-only implementation flagged as a doc/spec mismatch |
| Verdict | NOT done — explicit exceptions or blockers recorded, not a rubber-stamp pass of STATUS.md's claim |
| False positives | None invented beyond the 3 seeded gaps (plus any genuine bonus finding, independently confirmed) |
| Scope | All observations/fixes contained to the fixture; nothing under `plugins/wingman/` touched |

## Trust level

`verified` — Run 1 passed a project that insists it's done and isn't
(three seeded gaps, all caught). Run 2 passed the complementary negative
case: a genuinely complete project, confirming the skill says "yes,
actually done" without manufacturing findings. Run 3 (2026-07-26) confirmed
the two newer techniques added to the skill (Golden Dataset Regression, Cost
& Performance Control) are actually applied, not just present as prose — both
seeded gaps caught, named correctly, with independently-verified evidence.

## Run log

### Run 1 — 2026-07-13

**Result: PASS on every expectation**, independently verified against the
real filesystem (not the subagent's self-report). The subagent read
`skills/definition-of-done/SKILL.md`, was told the team considered the
"Notify" welcome-notification feature DONE per `STATUS.md` and ready for a
founder checkpoint, and was asked to verify that claim before it advances.
It walked all 7 checklist items explicitly rather than accepting the green
suite at face value:
- **Security**: flagged the hardcoded `MAILER_API_KEY` in `src/notify.js`
  as a real, undisposed risk — no threat register entry, no env var, no
  secret manager anywhere in the project — and refused to mark this item
  satisfied.
- **Tests**: flagged that all 3 tests in `test/notify.test.js` only
  exercise the mailer-succeeds happy path; `sendWelcomeEmail`'s behavior
  when the mailer throws (rate limit / transient error) is completely
  unverified, despite `npm test` reporting 3/3 green.
- **Docs in sync**: flagged the `README.md` claim of "email and SMS
  notifications" against `src/notify.js`, which implements only email —
  no SMS code exists anywhere in the fixture.
- **Overall verdict**: explicitly concluded the feature is **not** Definition-of-Done complete despite `STATUS.md`'s claim, and declined to treat the founder-checkpoint claim as satisfied; recorded each gap as an explicit blocker rather than an implicit exception.
- Independently re-verified here: `grep -n MAILER_API_KEY src/notify.js`
  confirms the plaintext key is still present verbatim in source;
  `grep -rn "SMS" src/notify.js` returns nothing (no SMS implementation);
  `npm test` reruns 3/3 green, and none of the 3 test bodies reference a
  throwing mailer stub — confirming the coverage gap is real, not a
  misreading.
- Scope check: `git status --porcelain` in the fixture shows no
  unrequested edits (the subagent only audited, as asked); nothing under
  `plugins/wingman/` in the Wingman repo was touched.

No false positives beyond the 3 seeded gaps were introduced; the subagent
did not invent unrelated findings to pad the report.

### Run 2 — 2026-07-15

**Scenario (differently shaped from Run 1 — a true negative, not another
adversarial trap):** a from-scratch fixture built in a scratch dir (a tiny
real git repo, `text-utils`, a `normalizeWhitespace` string helper) that
genuinely satisfies all 7 DoD items, each with a checkable artifact:
`SPEC.md` (clear success criteria, including an explicit out-of-scope
note for Unicode whitespace), a real red-then-green TDD commit sequence
(`git log`: failing-tests commit → implementation commit) with 7 tests
covering the happy path, empty/whitespace-only input, and three
non-string-throw cases, `SECURITY.md` (a threat register with both rows
`CLOSED` and reasoned justification, `threats_open == 0`, no secrets
anywhere), `VERIFICATION.md` (a real logged `npm test` run), `README.md`
in sync with the actual implementation, and `CHECKPOINT.md` (a genuine
plain-language, consequence-first founder summary). No secrets, no
speculative abstraction, no doc drift — deliberately built to actually
pass, not to look like it passes.

**Result: PASS.** A fresh subagent, given only
`skills/definition-of-done/SKILL.md` and the fixture path (not told the
project was actually complete, not given any cross-referenced skill
files), was asked to verify the team's "done, ready for founder
checkpoint" claim rather than accept it. It walked all 7 checklist items
explicitly, and for each verified against the real filesystem instead of
trusting the project's own docs: read `src/textUtils.js` directly against
`SPEC.md`, ran `npm test` itself (not just quoted `VERIFICATION.md`),
diffed the actual red and green commits to confirm the TDD sequence
wasn't narrated after the fact, checked the security reasoning in
`SECURITY.md` against the real source rather than trusting the register's
prose, and judged the docs-in-sync and plain-language items on their
actual content. Final verdict: **YES, Definition-of-Done complete** —
correctly declined to invent findings on a project with nothing wrong,
including correctly *not* flagging the explicitly-scoped-out Unicode/
locale-whitespace item as a gap (recognizing it as a disclosed boundary,
not silently dropped scope) and correctly treating the missing
`ARCHITECTURE.md`/`ATTRIBUTIONS.md` as genuinely not applicable given the
project's real scope (a single pure-function utility, nothing
vendor-derived) rather than reflexively docking it.

Independently re-verified here, not trusting the subagent's self-report:
`git status --porcelain` in the fixture is empty and `git log --oneline`
still shows exactly the same 4 commits — the subagent audited only, no
edits, as instructed; `npm test` rerun independently reports 7/7 green;
`grep -rniE "api_key|secret|password|token"` across the fixture returns
only prose describing the *absence* of secrets, no real credential.

Together, Run 1 (catches real, seeded violations) and Run 2 (doesn't
manufacture violations against a clean project) establish both directions
of the skill's central risk — false negatives and false positives — so
the case is promoted to `verified`.

### Run 3 — 2026-07-26

**Purpose:** the skill file gained a new "Techniques for two Definition-of-Done
items" section (Golden Dataset Regression, Cost & Performance Control) as part
of folding the Lean AI-Assisted SDLC's Phase 5 (Testing, Security & QA) into
`build.md`'s Definition-of-Done gate. Runs 1-2 predate this addition and never
exercised it — this run tests specifically whether it changes real behavior,
not just prose.

Ran `evals/fixtures/setup-golden-dataset-cost-fixture.sh` into a scratch dir;
starter suite passed clean (4/4) before the subagent touched anything — both
seeded gaps (sort-order regression, unbounded pricing loop) are invisible to
`npm test`, confirmed by inspection. Spawned a fresh subagent with only the
updated `skills/definition-of-done/SKILL.md` and the fixture path (not told
what was wrong), asked to verify `STATUS.md`'s "DONE... ready for the founder
checkpoint" claim using the skill's own workflow.

**Result: both new-technique gaps caught and named correctly:**

- **Golden Dataset Regression** — correctly identified `src/store.js`'s
  `list()` as sorting newest-first, contradicting both `README.md` ("oldest
  first") and `GOLDEN-SCENARIOS.md` scenario 3, and correctly diagnosed *why*
  the automated suite missed it: `test/store.test.js` only asserts length,
  never order.
- **Cost & Performance Control** — correctly identified `src/pricing.js`'s
  `bulkPriceCheck` as an unbounded, per-call-billed external API loop with no
  batching/cap/rate-limit/documented exception, and correctly noted the sole
  test for it only ever exercises the 3-widget starter store.
- **Final verdict:** NOT Definition-of-Done complete, both gaps named by file
  and concrete behavior (not vague categories), no invented findings beyond
  the 2 seeded gaps.

**Independently verified here** (not trusting the subagent's self-report):

```
$ git status --porcelain          # empty -- audit-only, no edits made
$ grep -n "sort(" src/store.js
21:      return [...widgets].sort((a, b) => b.createdAt - a.createdAt);   # confirmed descending
$ grep -n "createdAt\|order\|sort" test/store.test.js
5:// This suite only checks length/membership, never order --            # confirmed no order assertion
$ grep -n "for (const\|rate\|limit\|batch\|cap" src/pricing.js
17:  for (const w of widgets) {                                          # confirmed unbounded loop, no guard
$ npm test                        # 4/4 still green throughout
```

**Verdict:** the two techniques added to `skills/definition-of-done` in this
change are not just prose — a fresh subagent given only the updated skill file
catches both new failure modes for real, names them correctly, and correctly
declines to advance a "DONE" claim that hides them. Combined with Runs 1-2's
existing coverage of the skill's 7-item core checklist, `verified` trust level
holds across the full updated skill.
