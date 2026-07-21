# Eval: doc-index

Tests `plugins/wingman/skills/knowledge/doc-index/SKILL.md` behaviorally — the skill
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
2. Spawn a fresh subagent with only `skills/knowledge/doc-index/SKILL.md` and the
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

`verified` — passed two differently-shaped scenarios. Run 1 was a single
real orphan among two correctly-wired docs (an easy discovery case). Run 2
(below) was structurally harder: three *pre-existing* orphans of different
flavors in one project, forcing the skill to discriminate rather than
pattern-match "found an orphan, wire it in" — two had a genuine existing
owner and were fixed, one had no genuine owner and was correctly left
unfixed with an explicit flag rather than forced into a fabricated citation
or silently deleted. That discrimination is the closest available proxy for
the negative case originally proposed here (a project where nothing needs
fixing) — it proves the skill doesn't over-fix as reliably as a from-scratch
"everything's fine" fixture would, but a literal zero-orphan fixture is
still a cheap future addition if this ever needs re-confirming.

## Run log

### Run 1 — 2026-07-13

**Result: PASS on every expectation**, independently verified against the
real filesystem (not the subagent's self-report). The subagent read
`skills/knowledge/doc-index/SKILL.md`, was asked to audit "Fleetdesk" for doc-index
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

### Run 2 — 2026-07-16

**Scenario (genuinely different shape from Run 1):** a fresh scratch fixture,
"Notionly" (`commands/onboard.md`, `skills/api-versioning/SKILL.md`,
`references/{style-guide,deprecation-policy,webhook-retry-strategy}.md`,
`docs/DATABASE.md`), built with **three pre-existing orphans already in the
tree** rather than Run 1's single "add one new doc" case — and, critically,
the three orphans were deliberately not uniform: one (`deprecation-policy.md`)
has an obvious existing owner (`api-versioning`'s deprecation-window step),
one (`docs/DATABASE.md`) is a `docs/`-tree orphan per the skill's own
canonical-index definition rather than a `references/` one, and one
(`webhook-retry-strategy.md`) has **no genuine owner anywhere in the
project** — nothing in `commands/` or `skills/` touches webhooks at all — to
test whether the skill would fabricate a forced citation rather than
correctly flagging it.

A fresh subagent, given only `skills/knowledge/doc-index/SKILL.md` and the fixture
path (not told which docs were orphaned or how many), was asked to run a
documentation audit/pass.

**Result: PASS on every expectation, independently re-verified against the
real filesystem** (not the subagent's self-report):
- Correctly identified `references/style-guide.md` as already properly
  cited by `commands/onboard.md` — not falsely flagged. Re-grep confirmed
  it is still cited exactly once, untouched.
- Correctly found all three orphans by grepping each `references/*.md` (and
  `docs/DATABASE.md`, per the skill's own step 3 canonical-index scope, not
  just `references/`) across `commands/` and `skills/`.
- Discriminated rather than pattern-matched a single response for all three:
  - `references/deprecation-policy.md` — fixed. Added a real `##
    References` section to `skills/api-versioning/SKILL.md` citing it with
    a genuine "when to consult" note tying it to the skill's own deprecation-
    window and retirement steps. Re-grep confirmed the citation exists with
    real content, not a bare filename.
  - `docs/DATABASE.md` — fixed. Added a second `## References` entry to
    `commands/onboard.md` (the natural owner — walking a new engineer
    through the codebase before their first schema-touching change) with a
    genuine "when to consult" note. Re-grep confirmed.
  - `references/webhook-retry-strategy.md` — correctly left uncited.
    Recognized no command or skill in the project has any relationship to
    webhooks, so it explicitly flagged the doc for the project owner as a
    scope judgment call (build a real owning skill, or delete the doc) per
    the skill's own "wire it in or delete it" guidance, rather than forcing
    a fabricated citation into an unrelated file or silently leaving it
    unresolved. Re-grep confirmed it remains at zero citations by design,
    not by omission.
- Scope respected: `git status --porcelain` in the Wingman repo returned
  nothing — only the scratch fixture outside the repo was modified.

This is a harder and differently-shaped test than Run 1 (multiple
simultaneous pre-existing orphans instead of one, plus a doc with no valid
owner at all) and the skill held up: no false positives, no forced/fabricated
citations, correct fix-vs-flag discrimination on each of the three.
