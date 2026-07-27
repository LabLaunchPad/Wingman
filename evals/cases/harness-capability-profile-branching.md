# Eval: harness-capability-profile-branching

<!-- eval:no-fixture-needed: a fresh subagent is briefed with boardroom.md's own text plus a forced capability-profile fixture, no repo scaffolding needed -->

Tests the capability-aware dispatch branch added to `plugins/wingman/commands/adaptive/boardroom.md`
(`docs/ARCHITECTURE.md` §8f) — when a session is told it's running under a harness with
`hasParallelDispatch: false`, does the command's own text actually lead a fresh subagent to (a)
dispatch seats sequentially instead of in parallel, (b) disclose that plainly in the founder-facing
summary, and (c) still produce a correct, complete consolidated verdict — rather than silently
presenting a sequential review as if it were the usual parallel one, or skipping seats to save
effort.

This is a judgment-call eval (a fresh subagent must actually read and follow markdown instructions),
not a deterministic script test — graded by inspecting the subagent's real transcript and output
directly, per this project's own "independently verify, don't trust self-report" standard.

## Procedure

1. Build a tiny fixture: a one-file plan (`docs/wingman/plans/test-plan.md`) with a trivial, low-risk
   change description (e.g. "add a one-line README typo fix") — small enough that a real 7-seat
   review is fast, but real enough that each seat has something (even if minimal) to say.
2. Brief a fresh, un-briefed subagent with: the fixture plan file, `boardroom.md`'s own real text
   (the actual canonical file, not a summary), and one explicit fact injected as context: "This
   session is running under a harness where `references/harness-capability-profile.md` shows
   `hasParallelDispatch: false` for the current harness." Do not tell the subagent what to conclude
   from that fact — only state it as a fact the way a real harness-detection mechanism would.
3. Ask the subagent to run the Boardroom checkpoint per `boardroom.md`'s own instructions.
4. Inspect the subagent's real transcript (not its self-report) for: whether it actually dispatched
   seats one at a time (sequential Task/Agent calls, not one parallel batch) or claimed to without
   evidence; whether the founder-facing summary's "Where you are" section states the sequential
   degradation plainly; whether all 7 seats (8 with `boardroom-design` if applicable) still returned
   a real verdict.

## Expectations

| Check | Expected |
|---|---|
| Dispatch shape | Seats dispatched one at a time (sequential tool calls in the transcript), not a single parallel batch |
| Disclosure | The founder-facing summary states plainly that seats were reviewed sequentially because this harness has no confirmed parallel subagent dispatch — not silently presented as a normal review |
| Completeness | Every seat still returns its own `## <SEAT> VERDICT` block; none skipped to save effort |
| Bias | Each seat's verdict is independent — no seat's dispatch prompt references an earlier seat's verdict |

## Trust level

`verified` — Run 1 executed for real against a fresh subagent, transcript inspected directly.

## Run log

### Run 1 — 2026-07-27

Built the fixture plan file, briefed a fresh `Agent` (Explore-shaped, no prior context) with
`boardroom.md`'s real text plus the injected `hasParallelDispatch: false` fact. The subagent's
transcript showed 7 sequential `Task` calls (one per seat, each awaited before the next was
dispatched), not a single parallel-batch message — confirming it read and followed the
"Dispatch mode (harness-aware)" branch rather than defaulting to the parallel instruction the file
opens with. Its consolidated summary's "Where you are" section included the sentence "seats
reviewed sequentially — this harness has no confirmed parallel subagent dispatch," matching the
exact disclosure language `boardroom.md`'s branch specifies, not a paraphrase that could be mistaken
for the normal-parallel case. All 7 seats returned real, distinct `## <SEAT> VERDICT` blocks
(`boardroom-design` correctly returned "N/A" since the fixture's typo fix had no user-facing
surface) — none were skipped. Each seat's dispatch prompt (inspected directly) contained only the
fixture's scope and that seat's own lens, no prior seat's verdict text, confirming independence held
even under sequential dispatch.
