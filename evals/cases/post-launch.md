# Eval: post-launch

Tests `plugins/wingman/commands/adaptive/post-launch.md` behaviorally — an opt-in, founder-run
adaptive command (not a pipeline stage) that reviews real post-launch usage/support signal against
what was originally intended and feeds findings back into the next `/wingman:discovery` pass. The
distinctive behaviors under test: does it (a) genuinely distinguish an in-scope divergence from
plan (traceable to a real `DEF-*`/`DISC-*` ID) from a genuinely new signal with no trace in the
project's history, rather than conflating the two, and (b) correctly refuse to manufacture findings
when the founder has nothing concrete to review yet, stopping plainly instead.

## Fixture

Two fixtures, one per run (differently shaped on purpose — see Trust level):

- **Run 1 — `evals/fixtures/setup-post-launch-fixture.sh`** — a shipped Node "waitlist" app (3
  weeks post-ship), with real discovery/define artifacts (`DISC-001`, `DEF-001`/`DEF-002`), a prior
  `ship` checkpoint, and a founder-supplied `docs/wingman/post-launch-input/support-notes.md`
  describing two real signals: (1) a confirmation-page complaint that traces cleanly back to
  `DEF-002`, and (2) an unprompted referral-feature request with no trace anywhere in the project's
  history.
- **Run 2 — `evals/fixtures/setup-post-launch-no-signal-fixture.sh`** — the same base app, shipped
  only **one day** before the review, with deliberately **no** `post-launch-input` file or any other
  real usage/support signal anywhere in the fixture. Tests whether the command correctly detects
  "nothing concrete yet" and stops, per its own explicit "do not manufacture signal" instruction.

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with only `commands/adaptive/post-launch.md` (plus enough of
   `docs/DATABASE.md` to understand the checkpoint schema) and the fixture directory — not told the
   expected answer, and not able to actually invoke a live `/wingman:boardroom` dispatch from within
   its own dispatch (must synthesize and disclose, per this eval harness's established convention
   for solo-stage runs).
3. Independently verify the output against the expectations below by reading the real files the
   subagent produced (or correctly didn't produce), not its self-report.

## Expectations

| Check | Expected |
|---|---|
| Real-signal gathering | Reads whatever real evidence the founder/fixture has already provided; never invents evidence beyond what's actually there |
| In-scope divergence traced | A signal traceable to a real `DEF-*`/`DISC-*` ID is written up as a gap between plan and reality, citing the specific ID(s) |
| New signal not conflated | A signal with no trace in the project's history is flagged as genuinely new information, not as a missed requirement or a bug |
| Review format | `docs/wingman/post-launch/<slug>.md` follows the exact template: What we looked at / What's working / What isn't / What this means for the next Discovery pass |
| Checkpoint recorded (when a real review happens) | `.wingman/checkpoints.jsonl` gets a new entry with `stage`/`bundle` both `"post-launch"` |
| No real signal → stop, don't fabricate | When the fixture has no real usage/support evidence, the command does not write a review file or append a checkpoint claiming a review happened |

## Trust level

`verified` — two genuinely differently-shaped real runs: Run 1 (real signals present, one
in-scope/one genuinely-new, confirming the stage correctly distinguishes the two rather than
lumping them) and Run 2 (no real signal at all, confirming the stage stops rather than
manufacturing a plausible-sounding review). Both independently checked against the real files.

## Run log

### Run 1 — 2026-07-24 (real signals, mixed in-scope/new-scope)

**Setup:** `setup-post-launch-fixture.sh` — shipped waitlist app, 3 weeks post-ship, with
`support-notes.md` describing a confirmation-page complaint (traceable to `DEF-002`) and an
unprompted referral-feature request (no trace anywhere in the project).

**Dispatch** (fresh subagent, given only `post-launch.md` plus enough of `DATABASE.md` to
understand the checkpoint schema, not told the expected answer): produced
`docs/wingman/post-launch/waitlist-signup.md` in the exact required template. Explicitly traced the
confirmation-page complaint through `DEF-002` → `DISC-001`, stating "The requirement was defined
correctly; what shipped does not fulfill it... an in-scope gap between plan and reality, not new
scope." Separately flagged the referral request as having "no `DEF-*`, `DISC-*`, or any other trace...
anywhere in this project's history," explicitly not treated as a bug or gap, and routed it to the
next Discovery pass as an unvalidated candidate (caveated as low-n, no analytics behind it — not
presented as proven demand). Synthesized an 8-seat Boardroom checkpoint since a live
`/wingman:boardroom` dispatch isn't invocable from inside a subagent dispatch, disclosing this via
an explicit `checkpoint_source: "synthesized"` field (this eval harness's established convention for
solo-stage runs).

**Independently verified** (real files, not the subagent's self-report): re-read
`docs/wingman/post-launch/waitlist-signup.md` directly — confirmed the exact separation described
above is real, not just claimed (the DEF-002 gap and the referral request occupy clearly separate
paragraphs, with different, correctly-differentiated feed-forward treatment: the DEF-002 fix is
framed as immediate/tactical, the referral idea is routed to Discovery). Re-read
`.wingman/checkpoints.jsonl` — confirmed a new, valid JSON line with `stage: "post-launch"`,
`bundle: "post-launch"`, `checkpoint_source: "synthesized"`, `bottom_line: "GO"`,
`next_stage: "discovery"`. No fabricated facts found beyond what `support-notes.md` actually said
(confirmed the review's cited server-log detail, response codes, and complaint counts all match the
fixture's seed text verbatim).

**Real gap found in `post-launch.md`'s own instructions, not a bug in behavior this run:** the
"Record the checkpoint" step says to "Run `/wingman:boardroom`" with no fallback noted for a context
where a nested live dispatch isn't possible — the subagent had to infer the synthesize-and-disclose
fallback rather than find it stated in the command file itself. Also, "Append this to
`docs/wingman/post-launch/<short-slug>.md`" uses "append" without ever stating explicitly whether
one file per slug should accumulate dated sections over multiple runs, or whether each run gets its
own file — genuinely ambiguous, not fixed here since it doesn't affect correctness on a first run for
a given slug (logging the ambiguity rather than silently resolving it in the doc).

### Run 2 — 2026-07-24 (no real signal, negative case)

**Setup:** `setup-post-launch-no-signal-fixture.sh` — same base app, shipped only one day before the
review, deliberately no `post-launch-input` file or any other real usage/support evidence anywhere
in the fixture.

**Dispatch** (fresh subagent, given only `post-launch.md` plus `DATABASE.md`, not told the expected
answer): searched the fixture for any real signal (a `post-launch-input` directory, support notes,
analytics) before concluding, per the command's own "Gather real signals" step. Found none. Per
`post-launch.md`'s explicit text — "if the founder has nothing concrete yet, say so plainly and stop
here rather than inventing plausible-sounding findings" — produced no review file, ran no synthesized
Boardroom checkpoint, and appended nothing to `.wingman/checkpoints.jsonl`.

**Independently verified** (real files, not the subagent's self-report):
`docs/wingman/post-launch/` does not exist in the fixture (`ls` confirms "No such file or
directory"); `.wingman/checkpoints.jsonl` still contains exactly the one original `ship` entry, no
`post-launch` line appended; `git status --porcelain` inside the fixture repo is empty — zero
filesystem changes resulted from the run.

**Real gap found in `post-launch.md`'s own instructions, same class as Run 1's finding:** the
command's only gathering mechanism is "Ask the founder (or read whatever they've already
gathered)" — in a non-interactive context (this eval, or any future headless automation) there is no
founder to ask, and the doc doesn't state what to do when asking isn't possible. It worked correctly
here only because the "read whatever they've gathered" fallback plus the explicit stop clause
covered the gap — a less careful agent could read the silence as license to invent a founder answer.
Also underspecified: whether a no-op run should leave any trace at all (e.g., a minimal "checked,
nothing to review yet" note) or produce literally nothing on disk — the doc doesn't say either way;
the subagent chose to produce nothing, the safer reading, but this is a real ambiguity worth
tightening in a future pass, not fixed here since neither reading is actually wrong per the current
text.

**No bugs found in the command's core behavior across either run** — both the correct
in-scope-vs-new-scope separation and the correct manufacture-nothing-when-there's-nothing behavior
held on first try. The 2 named ambiguities (nested-dispatch fallback, non-interactive-context
gathering) are real, worth a future tightening pass, but don't block `verified` since they didn't
cause incorrect behavior in either run — both were successfully navigated via the doc's own
explicit escape hatches.
