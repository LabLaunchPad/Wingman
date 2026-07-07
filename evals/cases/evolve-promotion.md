# Eval: evolve-promotion

Tests `plugins/wingman/skills/evolve-promotion/SKILL.md` behaviorally. The founder-approval gate (`AskUserQuestion`) can't be genuinely exercised by a background subagent with no real founder to answer it, so this eval is split into two parts: **Part A** tests gathering/clustering/classifying/proposing (steps 1–4, stopping before any write), and **Part B** tests file placement under a simulated approval (step 5 onward).

## Fixture

`evals/fixtures/setup-evolve-fixture.sh <target-dir>` — a project with repeated migration-rollback friction (2 `LEARNINGS.md` entries + 1 retro + 1 checkpoint `GO_WITH_CONCERNS`, all describing the same underlying issue) and a deliberate single-occurrence distractor (a route-naming-convention note) that should NOT be promoted.

## Procedure — Part A (gather/cluster/classify/propose)

1. Run the fixture setup script.
2. Spawn a fresh subagent with only: the path to `skills/evolve-promotion/SKILL.md` and its `references/`, the fixture path, and an instruction to run through the skill's Core Workflow **steps 1 through 4 only** — gather signal, cluster, classify, and describe exactly what it would present via `AskUserQuestion` — then **stop and report, without calling `AskUserQuestion` or writing any file**.
3. Do not tell the subagent which pattern is expected to qualify.
4. Grade the report: did it correctly identify the migration-rollback cluster (citing all corroborating sources, not just one), correctly exclude the single-occurrence route-naming note, and correctly classify the qualifying cluster as a specialist-agent candidate (matching "Migration Engineer" in the catalog) rather than a command or skill?

## Procedure — Part B (file placement under simulated approval)

1. Reuse the same fixture (or a fresh copy).
2. Spawn a fresh subagent, telling it explicitly: "Assume the founder has already approved promoting a Migration Engineer specialist for the reasons you'd expect from this fixture's signal — proceed directly to writing the specialist agent file per the skill's Core Workflow step 5 onward, using `references/specialist-agent-template.md`."
3. Independently verify: the file lands at `.claude/agents/<slug>.md` in the fixture project (not under the Wingman repo's `plugins/wingman/`), the frontmatter/placeholders are clean, the content is grounded in the fixture's actual migration-rollback specifics (not generic catalog text), and `.wingman/state.json`'s `active_specialists` array was updated to include it.

## Expectations

| Check | Expected |
|---|---|
| Migration-rollback cluster identified | Yes, citing 2026-06-01 and 2026-06-18 `LEARNINGS.md` entries at minimum (retro/checkpoint corroboration is a bonus, not required to hit the 2+ threshold on its own) |
| Route-naming note promoted | **No** — single occurrence |
| Classification | Specialist agent (a narrow, recurring engineering judgment call), not a command or skill |
| Catalog name used | "Migration Engineer" or clearly equivalent — matches `references/specialist-catalog.md`'s Data & Analytics row |
| No premature write in Part A | No file created, no `AskUserQuestion` actually called — only a description of what would be presented |
| File location in Part B | `.claude/agents/<slug>.md` in the fixture project — **not** under `plugins/wingman/` in the Wingman repo |
| Content specificity in Part B | References the fixture's actual migration-rollback specifics, not generic catalog text |
| `state.json` updated in Part B | `active_specialists` array includes the new specialist |

## Trust level

`provisional` — one run each for Part A and Part B, graded by manual inspection. Not yet tested: a pure negative case (no cluster anywhere reaches 2+ occurrences, confirming the skill proposes nothing) — recommended before `verified`.

## Run log

### Run 1 — 2026-07-07

**Part A: PASS on every expectation.** A fresh subagent, given only the skill/references and the fixture, correctly:
- Identified the migration-rollback cluster with exact citations to all 4 corroborating entries across all 3 sources (2 `LEARNINGS.md` entries, 1 retro, 1 checkpoint `GO_WITH_CONCERNS`), and correctly distinguished the *resolution* checkpoint line (rollback added, "looks fine now") from a genuine third occurrence rather than double-counting it.
- Correctly identified the route-naming note as a single occurrence and explicitly refused to propose it, citing the skill's own MUST NOT constraint by name.
- Correctly classified the qualifying cluster as a specialist agent (not a command or skill), with reasoning tied to the skill's own classification rule (a judgment call under pressure, not a fixed checklist).
- Correctly matched it to "Migration Engineer" in `references/specialist-catalog.md`, citing that file's own worked example.
- Made no premature write and did not call `AskUserQuestion` — independently confirmed via `git status` in the fixture returning empty and no `.claude/` directory existing afterward.

**Part B: PASS on every expectation.** A second fresh subagent, told a founder approval was already given, independently re-verified the evidence itself (didn't just trust the premise) before proceeding, then correctly:
- Wrote exactly one file, `.claude/agents/migration-engineer.md`, in the fixture project — confirmed via `ls`.
- Zero unfilled `{{placeholder}}` tokens; `name:` frontmatter matched the filename.
- Content was fully grounded in the fixture's specifics (named `orders`/`refunds` migrations, the exact column-type and NOT NULL incidents, cited exact file/date sources) — not generic catalog text.
- Made a notable independent judgment call: set `model: opus` instead of a routine default, reasoning that migration-rollback mistakes risk irreversible production data loss — correctly applying `docs/ARCHITECTURE.md` §8's model-tiering guidance rather than defaulting.
- Created `.wingman/state.json` fresh (it didn't exist yet) with `active_specialists: ["migration-engineer"]`, matching the skill's step 6 instruction exactly.
- Confirmed via `git status --porcelain -- plugins/wingman/` in the Wingman repo that no writes landed there beyond this session's own pre-existing edits (i.e. nothing new from the test agent).

**Not yet tested**: the negative case (no signal anywhere reaches 2+ occurrences) — recommended before promoting this from `provisional` to `verified`.
