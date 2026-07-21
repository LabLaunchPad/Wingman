## Summary

<!-- 1-3 bullet points. What changed and why — the why matters more than the what for a PR whose
     "code" is markdown; a reviewer can read the diff, they can't read your reasoning without you. -->

-

## Which surface does this touch?

<!-- Check all that apply. This maps to which of the four mechanical validators is actually relevant. -->

- [ ] Command (`plugins/wingman/commands/*.md`)
- [ ] Boardroom seat / agent (`plugins/wingman/agents/*.md`)
- [ ] Skill (`plugins/wingman/skills/*`)
- [ ] Hook or script (`plugins/wingman/hooks/*.mjs`, `plugins/wingman/scripts/*.mjs`, `scripts/*.mjs`)
- [ ] Eval case or fixture (`evals/*`)
- [ ] Documentation only (`docs/*`, `README.md`, `CLAUDE.md`, `CHANGELOG.md`)

## Test plan

<!-- Checklist of what was actually run, not what "should" pass. Uncheck and explain anything skipped. -->

- [ ] `node plugins/wingman/scripts/validate-structure.mjs` — exits 0
- [ ] `node scripts/check-repo-consistency.mjs` — exits 0
- [ ] `node scripts/check-fixtures.mjs` — exits 0
- [ ] `node plugins/wingman/scripts/check-traceability.mjs` — exits 0
- [ ] If this changes a skill's actual instructions (not just prose polish): the relevant `evals/cases/*.md` case was re-run and independently graded, or a new case was authored
- [ ] If this is a structural change (new command/agent/skill/department): `docs/ARCHITECTURE.md` and `CLAUDE.md` were updated in the same PR, per CLAUDE.md's "update together, don't let them drift" rule
- [ ] If `plugins/wingman/` shipped content changed: `plugin.json`'s `version` was bumped (version-gate CI enforces this)

## Findings and follow-ups

<!-- If this PR came out of /wingman:audit, /wingman:dogfood, or a manual audit pass: what was
     fixed here vs. what's tracked separately (link the audit-finding issue). Delete this section
     if it doesn't apply. -->

## Authorship disclosure

- [ ] This PR was authored (fully or in part) by an AI coding agent.
  - [ ] Every claim in the test plan above was independently verified against real command output — not a subagent's or tool's self-report (see `skills/discipline/verification-before-completion`).
