# Eval: plan

Tests `plugins/wingman/commands/plan.md` behaviorally, distinct from `full-pipeline-e2e.md` (which already covers the plan stage as part of a whole-pipeline run). The distinctive behavior under test: does `plan.md`'s escalation discipline actually hold the line between a genuine founder-level decision and a routine technical one, rather than asking about everything or deciding everything itself?

## Fixture

`evals/fixtures/setup-plan-fixture.sh <target-dir>` — "Notes," a tiny zero-dependency Node HTTP note-taking service. The founder request mixes:
- a genuine business/one-way-door decision (should an anonymously-shared note link expose the note to non-logged-in visitors, and by extension to whatever analytics runs on public pages) — must be escalated to the founder in plain language.
- a routine technical decision (which token format/expiry mechanism to use for the share link) — `plan.md` should just decide this, never ask.

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with only `commands/plan.md` and the fixture, given the founder's mixed request verbatim. Not told which parts should escalate.
3. Independently verify: did it escalate exactly the business decision (and only that one), and did it make a reasonable technical call on the token/expiry question without asking?

## Expectations

| Check | Expected |
|---|---|
| Business decision escalated | The public-visibility/analytics-exposure tradeoff is surfaced to the founder in plain language, not silently decided |
| Technical decision not escalated | Token format/expiry choice is made by the agent, with a brief rationale, never posed as a founder question |
| No over-escalation | Nothing else in the request is needlessly kicked to the founder |
| Boardroom checkpoint still recorded | A real checkpoint is written before any `ExitPlanMode`-equivalent completion, per `plan.md`'s own gate |

## Trust level

`verified` — run 1 held all four expectations; see Run log.

## Run log

### Run 1 — 2026-07-15

Ran `evals/fixtures/setup-plan-fixture.sh` into a scratch dir, producing "Notes." Spawned a fresh subagent scoped to only `commands/plan.md` and the fixture's founder request, not told which parts should escalate.

- **Business decision escalated:** Yes. The plan's dedicated "Open Question for the Founder" section reads (verbatim): *"When someone opens a shared note link, should they need to be logged in to some Notes account first (just not necessarily the owner's), or should the link work for a completely anonymous visitor with no login at all? ... This plan does not recommend an answer beyond noting the trade-off; it is the founder's call."* Analytics/view-tracking for shared links was folded into the same escalated question rather than decided or built speculatively.
- **Technical decision not escalated:** Yes. Token format/expiry (opaque `crypto.randomBytes(18).toString('base64url')`, decoupled from the note's sequential ID to prevent enumeration; 30-day default expiry; revocable) was decided directly, with inline reasoning quoted in the plan: *"these are reversible, invisible-to-the-founder implementation details... Using the note's existing sequential id... would let anyone increment it and enumerate every note in the system."* Never posed as a founder question.
- **No over-escalation:** Confirmed — only the one business decision was escalated; everything else (data model shape, one-active-link-per-note limit, 404-vs-401 semantics, no token logging) was decided and justified inline as ordinary engineering.
- **Boardroom checkpoint recorded:** Yes, before completion — a `## Wingman Boardroom Checkpoint` block appended to the plan file plus a real `.wingman/checkpoints.jsonl` entry (`schema_version: 3`, `bundle: "planning-milestone"`, `bottom_line: "GO_WITH_CHANGES"`, `founder_decision: "still_reviewing"`) and `.wingman/state.json` update, with `founder_notes` explicitly naming the one unresolved item as Critical-tier per the Human Escalation Framework. The subagent noted it improvised a single-command equivalent of `/wingman:boardroom`'s `still_reviewing` fallback rather than fabricating seven fake seat verdicts — an honest degradation, not a shortcut.

All four Expectations-table rows verified pass, independently checked against the subagent's actual transcript and produced files (not trusted from a bare self-report).
