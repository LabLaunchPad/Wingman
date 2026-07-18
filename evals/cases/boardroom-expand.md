# Eval: boardroom-expand

Tests `commands/boardroom.md`'s reversible-compression pair: the "Record the checkpoint" write of a
companion `.wingman/checkpoint-details/<checkpoint_id>.md` file alongside every `checkpoints.jsonl`
append, and the "Expand a past checkpoint" `expand` retrieval mode that reads it back. This is the
one capability no other eval exercises — every prior Boardroom eval (`boardroom-gate-rule`,
`full-pipeline-e2e`, `seven-stage-pipeline-e2e`) checks that the one-line `seats[].summary` gets
written correctly, but none of them ever checked that the *full, unabridged* verdict text survives
anywhere retrievable, or that `expand` actually returns the original rather than a re-summarized or
paraphrased approximation of it.

## Fixture

`evals/fixtures/setup-boardroom-gate-fixture.sh <target-dir>` (reused — a trivial one-file project
with an uncommitted diff; the diff content is unimportant, it only needs to exist so `boardroom.md`
has something to review). No new fixture needed: this case tests a file-write/read-back contract, not
project-specific behavior.

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with `commands/boardroom.md` and `docs/DATABASE.md`'s `checkpoints.jsonl`
   schema section, and 7 synthetic seat verdicts, each with genuinely long, specific, multi-sentence
   reasoning (not a one-liner — the whole point is testing that detail survives compression). Ask it
   to record the checkpoint for real (`stage: "build"`).
3. Independently verify: `checkpoints.jsonl`'s new line has `schema_version: 4` and a `details_ref`
   field; the referenced file exists at that exact path; its content contains every seat's full
   verdict text, not a re-shortened version of what went into `seats[].summary`.
4. Spawn a **second, separate, fresh** subagent — given only `commands/boardroom.md` and told to run
   `/wingman:boardroom expand <checkpoint_id>` against the project directory the first subagent
   populated (no other context, not shown the seat verdicts directly) — and check whether it
   correctly retrieves and prints the full detail rather than inventing, paraphrasing, or falling
   back to the short `seats[].summary` lines.
5. Negative case: ask a third fresh subagent to run `expand` against a `checkpoint_id` that does not
   exist in `checkpoints.jsonl`. Confirm it says so plainly and does not guess at a near match or
   fabricate a plausible-looking result.

## Expectations

| Check | Expected |
|---|---|
| Companion file written | `.wingman/checkpoint-details/<checkpoint_id>.md` exists after Step 2, path matches `details_ref` in the `checkpoints.jsonl` line exactly |
| Full detail preserved | Every seat's full verdict text appears in the companion file verbatim (or near-verbatim — not shortened to the one-line `summary`) |
| `schema_version` correct | New line is `schema_version: 4` |
| `expand` returns the original | Second subagent's output contains the same full reasoning found in the companion file, not a fresh paraphrase and not just the short `checkpoints.jsonl` summary line |
| `expand` doesn't re-dispatch seats | Second subagent does not invoke any boardroom seat agents or produce a *new* review — this is retrieval only, no new checkpoint recorded |
| Missing-checkpoint case handled honestly | Third subagent states plainly that no matching checkpoint exists and stops, rather than guessing at the closest `checkpoint_id` or fabricating plausible-sounding verdict text |

## Trust level

`provisional` — passed one real run covering the write path, the successful-retrieval path, and the
negative (nonexistent-checkpoint) path; still needs a second, differently-shaped run (e.g. a
`schema_version: 3` legacy entry with no `details_ref` at all, confirming `expand` reports "full
detail not available" rather than erroring) before promotion to `verified`.

## Run log

### Run 1 — 2026-07-18 (write + retrieve + negative case, real dispatch against `evals/fixtures/setup-boardroom-gate-fixture.sh`)

**Write (Subagent 1, `general-purpose`):** recorded checkpoint `2026-07-18T02-12-02Z-build` for real
against the fixture project (7 synthetic seat verdicts as given, `bottom_line: GO_WITH_CHANGES` from
the one `GO_WITH_CONCERNS`/no `NO_GO`, `next_stage: ship`). **Independently re-verified by me,
directly against the filesystem** (not trusting the subagent's self-report): `cat
.wingman/checkpoints.jsonl` — one valid JSON line, `schema_version: 4`, `details_ref:
".wingman/checkpoint-details/2026-07-18T02-12-02Z-build.md"`; `ls` confirmed that file exists (2167
bytes); `grep -c` for the CTO seat's specific long-form phrase ("sets a precedent that changes to
this file ship untested" — present in the full reasoning given but *not* in the short
`seats[].summary` line, "which is a process gap") against the companion file returned `1` — proof the
full, unshortened text survived, not just the one-liner.

**Retrieve (Subagent 2, `general-purpose`, given only `boardroom.md` and the checkpoint_id, no other
context):** correctly recognized `expand 2026-07-18T02-12-02Z-build` as the retrieval mode, read only
the two files the procedure specifies (`checkpoints.jsonl` and the `details_ref` companion file — no
others), and printed all 7 full `## <SEAT> VERDICT` blocks. **Independently verified**: its printed
CTO block includes the same "sets a precedent..." phrase verbatim, matching the companion file
exactly, not a re-summarized approximation; its own report confirms no seat agent was dispatched and
no new checkpoint was recorded (this is retrieval-only, per spec).

**Negative case (Subagent 3, given a fabricated `checkpoint_id` not present in the file):** correctly
found no match in `checkpoints.jsonl`, stated so plainly ("I couldn't find a checkpoint with ID
... there's nothing to expand"), even proactively named the one real checkpoint_id that *does* exist
as a likely-intended alternative — without guessing that it was the same request. No file writes, no
fabricated verdict text.

**No bugs found this run** — the write/read pair behaved exactly as specified in `boardroom.md` on
first try. Still open before `verified`: a `schema_version: 3` legacy-entry (no `details_ref` at all)
scenario, confirming `expand` reports "full detail not available" rather than erroring — see Trust
level above.
