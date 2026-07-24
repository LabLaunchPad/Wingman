# Eval: research-synthesis

Tests `plugins/wingman/commands/pipeline/research-synthesis.md` behaviorally — the 2nd of Wingman's
14 pipeline stages. The distinctive behaviors under test: does the command (a) actually synthesize
Discovery's raw notes into an `RS-*`-tagged table of themes/risks/opportunities/open-questions
rather than just restating them, (b) honestly tag each row known/unknown/assumed instead of letting
an assumption pass as a known fact, (c) cite the real `DISC-*` finding(s) each row is grounded in,
(d) give a genuinely honest source-confidence assessment rather than inflating confidence when the
underlying evidence is thin, and (e) actually record its own solo Boardroom checkpoint with
`stage: "research-synthesis"`.

## Fixture

`evals/fixtures/setup-research-synthesis-fixture.sh <target-dir>` — the base waitlist app, with a
pre-seeded `docs/wingman/discovery/waitlist-reminder-nudge.md` for a plausible next feature
(a re-engagement nudge for waitlisted users who never convert). The Discovery doc mints three real
`DISC-*` findings (a ~3% return-rate stat from informal founder analytics, 3 self-selected DM quotes
about "forgetting the product existed," and a direct code-inspection finding that no automated
follow-up exists today) and 3 genuinely open questions (whether users want a reminder at all, what
cadence, what channel) — deliberately thin, anecdote-grade evidence so a research-synthesis pass has
to make a real judgment call about confidence rather than rubber-stamping strong data.

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with only `commands/pipeline/research-synthesis.md` (plus the skill/reference
   files it names) and the pre-seeded Discovery doc — not told the expected answer.
3. Independently verify the real filesystem output against the expectations below.

## Expectations

| Check | Expected |
|---|---|
| RS-* table produced | `docs/wingman/research-synthesis/<slug>.md` exists with a real `RS-*` table, not a restatement of Discovery's prose |
| Known/Unknown/Assumed honesty | Every row is tagged; no row treats an assumption (e.g. "a nudge will help") as a known fact |
| DISC-* grounding | Every row's `Satisfies` column cites a real `DISC-*` ID that actually exists in the Discovery doc |
| Source confidence is honest | Explicitly flagged low/weak, since the fixture's evidence is founder anecdotes and informal analytics, not primary research — not inflated to "high confidence" |
| 8-part gate output present | Phase summary, decisions, open issues, risks, gate check, gap register updates, carry-forward items, go/no-go, per `references/pipeline-gate-checklist.md` |
| Checkpoint recorded | `.wingman/checkpoints.jsonl` has a real line with `stage: "research-synthesis"` |

## Trust level

`provisional` — single real run, single scenario. Would need a second, differently-shaped scenario
(e.g. a Discovery doc with strong primary-research evidence, to confirm the stage doesn't
under-state confidence just as reflexively as it might over-state it; or a Discovery doc with
genuinely contradictory findings, to test the "contradictions" gate item on a case that actually has
one) before promoting to `verified`.

## Run log

### Run 1 — 2026-07-24 (first real dispatch)

**Setup:** `setup-research-synthesis-fixture.sh` against a scratch target directory. Fixture ran
clean (base waitlist app's own test suite passed, 3/3), then committed the pre-seeded
`docs/wingman/discovery/waitlist-reminder-nudge.md` with `DISC-001`..`DISC-003` and 3 open questions.

**Dispatch** (fresh `general-purpose` subagent, given only `research-synthesis.md` plus the
`traceability-linking` skill and `pipeline-gate-checklist.md` reference, not told the answer): wrote
`docs/wingman/research-synthesis/waitlist-reminder-nudge.md` with a 10-row `RS-001`..`RS-010` table,
`docs/wingman/gap-register.md` (GAP-001 open/high, GAP-002 deferred/medium), `.wingman/traceability.json`
with correct next-ID counters (`DISC: 4`, `RS: 11`), and `.wingman/checkpoints.jsonl`.

**Independently verified** (real files read directly, not the subagent's self-report):
- The RS-* table is a genuine synthesis, not a restatement: RS-004/RS-005/RS-010 (an assumed benefit,
  an assumed spam/unsubscribe risk, an assumed "probably safe to try") are all correctly tagged
  **Assumed**, not Known — the subagent did not let "a nudge could help" pass as an established fact.
  RS-007/008/009 (want-a-reminder, cadence, channel) are correctly carried forward as **Unknown**,
  matching Discovery's own open questions almost verbatim rather than being silently dropped.
- Every `Satisfies` cell cites `DISC-001`, `DISC-002`, or `DISC-003` — all three real IDs that exist
  in the fixture's Discovery doc; no fabricated `DISC-*` numbers.
- Source confidence: the doc states **"Low"** in a dedicated section, explicitly naming *why* (a
  founder-pulled analytics count with no dashboard backing, 3 self-selected DM replies, no survey, no
  A/B test, no signal at all on the ~385 users who neither returned nor replied) and explicitly warns
  downstream stages not to over-trust RS-002/004/005/010. This is the specific behavior most worth
  checking for — a weaker run could have papered over thin evidence with a generic "moderate
  confidence" — and it didn't happen here.
- The 8-part gate output is present and each gate-check line is marked pass with a specific reason,
  not just an overall verdict (e.g. "Contradictions — pass, none found... though RS-006 flags that the
  DM sample and the analytics number describe different scales and shouldn't be blended into one
  confidence level" — a real self-critique catch, not boilerplate).
- `.wingman/checkpoints.jsonl` has one well-formed JSON line with `"stage": "research-synthesis"`,
  `"verdict": "conditional-pass"`, and correctly lists `next_stage: "personas-jobs"` — matching
  `research-synthesis.md`'s own instruction to hand off to `/wingman:personas-jobs` only once the
  gate returns a passing verdict.

**One caveat, not a bug:** the sandboxed subagent had no real `/wingman:boardroom` command available
to dispatch, so it recorded the checkpoint line directly instead, noting this honestly in the
checkpoint's own `checkpoint_source` field ("manual... boardroom command unavailable in this
environment") rather than silently faking a full Boardroom review. This is an environment constraint
of the eval harness itself (no fresh subagent in this sandbox can actually invoke another slash
command), not a defect in `research-synthesis.md` — the same constraint every other eval case in this
repo that references a Boardroom checkpoint accepts.

**No bugs found in `research-synthesis.md` itself this run** — the command's synthesis instructions,
the honesty-about-confidence behavior, the `DISC-*` grounding, and the gate/checkpoint mechanics all
worked as written on first try. Recorded as `provisional`.
