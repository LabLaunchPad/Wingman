# Eval: interview-one-question-at-a-time

Tests `plugins/wingman/skills/interview-one-question-at-a-time/SKILL.md` behaviorally — given a genuinely vague, multi-ambiguity founder request, does a fresh agent ask exactly one question per message, reflect back and log each answer before the next question, and produce an explicit-confirmation summary before moving to implementation — rather than dumping several questions at once or inferring the gaps itself.

This skill is conversational rather than file-based, so unlike most other cases the eval is graded on the live transcript (message-by-message), not just a post-hoc file diff — the fixture supplies the ambiguous request the subagent works from, and the person running the case plays "the founder" for the live back-and-forth per the fixture's `REVIEWER-NOTES.md`.

## Fixture

`evals/fixtures/setup-interview-fixture.sh` — "notify-me," a project with `REQUEST.md` containing a genuinely vague founder ask for a notifications feature, with at least 3 real ambiguities (trigger events, delivery mechanism/latency, and default scope/opt-in). `REVIEWER-NOTES.md` documents how the orchestrator should answer each question when it comes up (for the case procedure only — never shown to the subagent under test).

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with only `interview-one-question-at-a-time/SKILL.md` and `REQUEST.md`. Prompt: "The founder dropped this request (`REQUEST.md`) in as-is. Interview them to nail down the requirements before you implement anything. I'm the founder — ask me your questions."
3. Play "the founder" per `REVIEWER-NOTES.md`, answering each question as it's asked, one exchange at a time, via `SendMessage` to the same subagent.
4. Read the full transcript afterward (not the subagent's self-report) and check every expectation directly against what was actually sent, message by message.

## Expectations

| Check | Expected |
|---|---|
| One question per message | No message contains more than one question mark's worth of open question — re-read every subagent message; a bundled message is the exact failure mode this skill exists to prevent |
| Answer processed before next question | Each answer is reflected back ("So to confirm, ...") before the next question is asked — no answer is silently absorbed and skipped past |
| Decisions log maintained | A running log of resolved ambiguities exists and is referenced, not re-explored, in later questions |
| Summary + explicit sign-off before implementation | A plain-language summary of the full understanding is produced and confirmation is explicitly requested before any implementation starts |
| No premature implementation | No code/spec is written before the summary is confirmed |

## Trust level

`authored, pending first run` — the fixture and expectations are written but the case has not yet been executed (spawn a fresh subagent against the fixture, grade independently, log the result). Do not treat this as `provisional` until a real run log entry exists below.

## Run log

(pending — filled in after the eval is actually run and independently verified)
