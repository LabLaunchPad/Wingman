# Eval: anti-rationalization

Tests `plugins/wingman/skills/discipline/anti-rationalization/SKILL.md` behaviorally — a meta-skill no other eval exercises directly. Its own description names the testable trigger used here: "auditing existing skills for completeness."

## Fixture

`evals/fixtures/setup-anti-rationalization-fixture.sh <target-dir>` — a tiny stand-in plugin project with one discipline skill file, `code-review-discipline/SKILL.md`, written in Wingman's own skill format but missing the mandatory closing "Anti-Rationalization Defense" section every Wingman discipline skill must have.

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with only `skills/discipline/anti-rationalization/SKILL.md` and the fixture. Asked to audit `code-review-discipline/SKILL.md` for completeness.
3. Independently verify: did it (a) notice the missing section, and (b) write a genuinely domain-specific (code-review) rationalizations table rather than copy-pasting the meta-skill's own generic table verbatim?

## Expectations

| Check | Expected |
|---|---|
| Gap noticed | Explicitly flags the missing "Anti-Rationalization Defense" section |
| Domain-specific table written | The added table's rationalization/red-flag rows are about code review specifically, not generic placeholders |
| Not a verbatim copy | Confirmable by diff that the added content isn't the meta-skill's own Universal Rationalizations Table pasted unchanged |
| Correct location/format | Section is added in the position and heading format Wingman's other skills use |

## Trust level

`provisional` — run 1 passed all four expectations (see Run log); not yet re-run against a second, differently-shaped scenario including a negative case, per `evals/README.md`'s bar for `verified`. Corrected 2026-07-20 from a `verified` label the run log doesn't actually support (see `FIXLOG.md` T1).

## Run log

### Run 1 — 2026-07-15

- Ran `evals/fixtures/setup-anti-rationalization-fixture.sh` into a scratch dir; confirmed the generated `skills/mechanics/code-review-discipline/SKILL.md` ends at its "Quick Reference" table with no `## Anti-Rationalization Defense` section.
- Acting as the fresh subagent, working only from `plugins/wingman/skills/discipline/anti-rationalization/SKILL.md` and the fixture file, audited the skill for completeness.
- **(a) Gap noticed:** Yes — explicitly flagged the missing "Anti-Rationalization Defense" section (with its required `Common Rationalizations` / `Red Flags` / `Anti-Pattern Callouts` subsections) as the completeness gap before writing anything.
- **(b) Domain-specific, not verbatim:** Wrote a 6-row Common Rationalizations table and Red Flags/Anti-Pattern Callouts specific to code review (trusting an experienced author's description, treating green CI as sufficient, skimming large diffs, assuming extra files are "just formatting," confirming coverage by test file name instead of reading assertions, deferring to an author's past PRs). Ran `diff` between the meta-skill's Universal Rationalizations Table and the added table: zero overlapping rows — confirmed not a copy-paste.
- **Location/format:** Section appended at the end of the file as `## Anti-Rationalization Defense` with `### Common Rationalizations`, `### Red Flags`, `### Anti-Pattern Callouts` subheadings, matching the meta-skill's "How to Apply Per Skill Type" template exactly.
- All four Expectations table rows verified pass. Artifacts (fixture copy with the addition, diff output) were produced in a scratch dir under `/tmp/claude-0/...` and not committed to the repo.
