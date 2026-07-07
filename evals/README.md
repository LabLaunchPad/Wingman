# Wingman Eval Harness

Wingman's "code" is markdown prompts (commands, agents, skills). A structural validator (`plugins/wingman/scripts/validate-structure.mjs`) can check that files exist and frontmatter is well-formed, but it can't tell you whether a skill's *instructions* actually produce the right behavior — that requires running them. This directory is a lightweight behavioral eval harness for exactly that, scoped down from the fuller Tier 1/2/3 pattern studied in `addyosmani-agent-skills` (see `docs/ARCHITECTURE.md` §9) to what Wingman actually needs today.

## How it works

1. **Fixture** (`fixtures/*.sh`) — a script that creates a throwaway, realistic test project with deliberate signals (e.g. a Prisma schema to trigger the Data department, a Dockerfile to trigger DevOps). Wipes and recreates its target directory every run.
2. **Case** (`cases/*.md`) — documents the fixture used, the exact procedure for running the eval, the expected outcome per checkable item, and a **run log** of actual results from real executions — not just what's expected, but what actually happened, verified independently rather than trusted from the tested agent's own self-report.
3. **Run** — spawn a fresh subagent (via the `Agent` tool) that reads only the skill/command under test and the fixture, deliberately not told the expected answer. Grade its actual output against the case's expectations by inspecting the real file tree/content afterward, never by trusting its self-report alone.

## Why this isn't automated CI

Wingman has no build/test toolchain (see `CLAUDE.md`) and no budget for the kind of headless-agent-per-commit pipeline `addyosmani-agent-skills` and `wshobson-agents` run at their scale. Evals here are run manually, on demand — when a skill/command changes in a way that could affect its behavior, or when a skill hasn't been exercised yet at all. The run log in each case file is the record of when it was last actually verified, so staleness is visible rather than silently assumed away.

## Trust levels

Borrowed from `addyosmani-agent-skills`' eval schema:
- **`provisional`** — passed at least one real run, single scenario, manually graded. Most Wingman eval cases will sit here.
- **`verified`** — passed multiple differently-shaped scenarios, including at least one negative case (confirming the skill correctly does *nothing* when it shouldn't act).

## Existing cases

- `cases/department-lead-activation.md` — tests `skills/department-lead-activation`. `verified`: passed both a positive case (all conditional signals present) and a negative case (none present, confirming no over-triggering).
- `cases/evolve-promotion.md` — tests `skills/evolve-promotion`. `verified`: passed a positive case (gather/cluster/classify/propose, then file placement under a simulated approval — the real `AskUserQuestion` gate can't be exercised by a background subagent with no real founder to answer it) and a negative case that specifically tests same-incident-double-logging isn't mistaken for genuine repetition.
- `cases/full-pipeline-e2e.md` — tests the whole SDLC pipeline (`plan` → `build` → `secure` → `ship`) run in sequence against one continuous realistic project, not one skill at a time. `provisional`: passed a full single-scenario run; caught and fixed one real process defect along the way (a build-stage Boardroom checkpoint that was never actually recorded despite all 5 seats reporting — see its run log and the resulting fix in `commands/boardroom.md`).
- `cases/hotfix.md` — tests `commands/hotfix.md`'s root-cause-first discipline end to end against a real, subtle bug. `provisional`: passed a single-scenario run (an unambiguous logic bug); correctly reproduced before fixing, wrote a genuine red-then-green regression test, and recorded the checkpoint correctly.
- `cases/launch.md` — tests `commands/launch.md`'s self-activating Growth signal, scope discipline, and the Boardroom's "content passed directly" review path (the one scope type no other eval exercises). `provisional`: passed a single-scenario run; surfaced and fixed a real gap in `boardroom.md`'s `scope_ref` schema for directly-passed content.
- `cases/boardroom-gate-rule.md` — tests `commands/boardroom.md`'s consolidation logic directly, using synthetic seat verdicts rather than a real review, specifically covering the `DO NOT SHIP` path no other eval had ever hit. `provisional`: confirmed the rule is an unambiguous "any NO_GO" predicate; surfaced and fixed a real gap in what `next_stage` should be on a blocked checkpoint (previously undefined, risked silently advancing a blocked project past its gate).
