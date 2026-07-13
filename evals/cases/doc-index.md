# Eval: doc-index

Tests `plugins/wingman/skills/doc-index/SKILL.md` behaviorally — the skill
was codified from this project's own v10 finding (all 9 `references/*.md`
files were uncited until deliberately wired in) but had never itself been
run against a fresh project: given only the skill file and a small
Wingman-shaped project with a mix of properly-cited and orphaned reference
docs, does a fresh agent actually grep for citations and find the real
orphan — or does it skim the doc titles and assume they're all fine?

## Fixture

`evals/fixtures/setup-doc-index-fixture.sh <target-dir>` — "Fleetdesk," a
miniature plugin project (one command, one skill, three reference docs
under `references/`) deliberately not a trivial "everything is broken"
case:

- `references/deploy-checklist.md` — properly cross-linked from
  `commands/deploy.md`'s `## References` section.
- `references/rate-limit-tuning.md` — properly cross-linked from
  `skills/rate-limit-review/SKILL.md`'s `## References` section.
- `references/incident-severity-matrix.md` — **the orphan**. Fully
  written, accurate content, but cited by nothing anywhere in
  `commands/` or `skills/`.

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with only `skills/doc-index/SKILL.md` and the
   fixture path (not told which doc is orphaned). Tell it: "Audit this
   project's documentation for doc-index discipline."
3. Independently verify by grepping the fixture directly for each
   `references/*.md` basename across `commands/` and `skills/` myself —
   not the subagent's self-report alone.

## Expectations

| Check | Expected |
|---|---|
| Correctly-wired docs not flagged | `deploy-checklist.md` and `rate-limit-tuning.md` are recognized as properly cited, not falsely flagged |
| Orphan found | `incident-severity-matrix.md` identified as cited by nothing in `commands/` or `skills/` |
| Method | Actually greps/checks citations across the tree, not just reads doc titles and assumes |
| Resolution | Either wires the orphan into a real owning command/skill with a one-line "when to consult" note, or explicitly proposes deletion — not left silently unresolved |
| False positives | None — doesn't claim the two wired docs are also orphaned |
| Scope | Contained to the fixture; nothing under `plugins/wingman/` touched |

## Trust level

`provisional` — passed a single-scenario run (one real orphan among two
correctly-wired docs). Not yet tested against a negative case (a project
where every doc is already correctly wired, confirming the skill doesn't
manufacture an orphan finding) — a natural second run for promotion to
`verified`.

## Run log

### Run 1 — 2026-07-13

**Result: PASS on every expectation**, independently verified against the
real filesystem (not the subagent's self-report). The subagent read
`skills/doc-index/SKILL.md`, was asked to audit "Fleetdesk" for doc-index
discipline, and:
- Correctly recognized `references/deploy-checklist.md` as cited by
  `commands/deploy.md` and `references/rate-limit-tuning.md` as cited by
  `skills/rate-limit-review/SKILL.md` — did not flag either as an orphan.
- Grepped for `incident-severity-matrix` across `commands/` and `skills/`
  and correctly found zero citations, identifying it as the orphan per
  the skill's own audit step ("Grep the plugin tree for each
  `references/*.md` basename/key term. Any file with zero citations is a
  dead doc").
- Resolved it rather than just reporting it: added a real owning
  citation. It judged `commands/deploy.md` the natural owner (severity
  triage is relevant when deciding whether a deploy needs to be rolled
  back) and added a `## References` line citing
  `references/incident-severity-matrix.md` with a one-line "when to
  consult" note, rather than leaving it unresolved or deleting accurate
  content.
- Independent re-verification performed here: `grep -rn
  "incident-severity-matrix" commands/ skills/` in the fixture now
  returns a real hit in `commands/deploy.md` with a genuine one-line
  usage note (not a bare filename); `grep -rn "deploy-checklist\|rate-limit-tuning"
  commands/ skills/` still shows their original correct citations
  untouched.
- No false positives: the two correctly-wired docs were left alone.
  `git status --porcelain` in the Wingman repo confirmed nothing under
  `plugins/wingman/` was touched.
