# Engine: Engineering

**Status:** built
**Purpose:** writes and verifies the actual code — the largest single engine by member count, since
it owns every build-time discipline skill (TDD, debugging, minimalism, verification) as well as the
Build stage itself and its follow-on maintenance commands.

## Inputs

`ARCH-*` architecture decisions (Architecture Engine) and the plan file (Planning Engine).

## Output artifacts

Working, tested code; the Definition-of-Done gate's pass/fail; debt-ledger and bloat-audit findings.

## Members

- `commands/pipeline/build.md`
- `commands/adaptive/hotfix.md`
- `commands/adaptive/over-engineering-review.md`
- `commands/adaptive/bloat-audit.md`
- `commands/adaptive/debt-ledger.md`
- `commands/adaptive/test.md`
- `skills/test-driven-development/SKILL.md`
- `skills/subagent-driven-development/SKILL.md`
- `skills/systematic-debugging/SKILL.md`
- `skills/systematic-auditing/SKILL.md`
- `skills/engineering-minimalism/SKILL.md`
- `skills/doubt-driven-development/SKILL.md`
- `skills/anti-rationalization/SKILL.md`
- `skills/verification-before-completion/SKILL.md`
- `skills/verification-loop/SKILL.md`
- `skills/simplify/SKILL.md`
- `skills/package-manager-selection/SKILL.md`
- `skills/testing-patterns/SKILL.md`
- `skills/ponytail-debt-harvesting/SKILL.md`
- `references/testing-patterns.md`

## State read + written

Reads: Architecture/Planning Engine output. Writes: the founder's actual codebase, test results,
`.wingman/checkpoints.jsonl`'s Build.5 (Definition-of-Done) checkpoint.

## Escalation

A failing Definition-of-Done gate blocks Ship — this engine never lets an unverified claim ("it
should work") substitute for a real passing test suite.

## Permitted tool tiers

Scoped-write (`references/permission-model.md` Level 2) — writes code within the project, no
deploy-class actions.
