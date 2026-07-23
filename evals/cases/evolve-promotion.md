# Eval: evolve-promotion

Tests `plugins/wingman/skills/governance/evolve-promotion/SKILL.md` and `commands/adaptive/evolve.md` behaviorally. The founder-approval gate (`AskUserQuestion`) can't be genuinely exercised by a background subagent with no real founder to answer it, so this eval is split into two parts: **Part A** tests gathering/clustering/classifying/proposing (steps 1–4, stopping before any write), and **Part B** tests file placement under a simulated approval (step 5 onward). **Run 3** separately tests the command wrapper specifically: a fresh subagent given only `commands/adaptive/evolve.md` (not the skill file directly) must locate and read the skill itself — the one thing Runs 1–2 (which handed the subagent the skill file directly) never actually exercised.

## Fixtures

- **Positive case**: `evals/fixtures/setup-evolve-fixture.sh <target-dir>` — a project with repeated migration-rollback friction (2 `LEARNINGS.md` entries + 1 retro + 1 checkpoint `GO_WITH_CONCERNS`, all describing the same underlying issue) and a deliberate single-occurrence distractor (a route-naming-convention note) that should NOT be promoted.
- **Negative case**: `evals/fixtures/setup-evolve-fixture-negative.sh <target-dir>` — a project with three topics, each appearing in exactly 2 files but describing the *same single incident* recorded twice (a learning entry plus the retro or checkpoint for that same piece of work), not genuinely separate occurrences. Deliberately harder than a trivial "everything mentioned once" fixture: it tests whether the skill can tell "same event, two logs" apart from "two separate incidents" rather than naively counting file-mentions as occurrences.

## Procedure — Part A (gather/cluster/classify/propose)

1. Run the fixture setup script.
2. Spawn a fresh subagent with only: the path to `skills/governance/evolve-promotion/SKILL.md` and its `references/`, the fixture path, and an instruction to run through the skill's Core Workflow **steps 1 through 4 only** — gather signal, cluster, classify, and describe exactly what it would present via `AskUserQuestion` — then **stop and report, without calling `AskUserQuestion` or writing any file**.
3. Do not tell the subagent which pattern is expected to qualify.
4. Grade the report: did it correctly identify the migration-rollback cluster (citing all corroborating sources, not just one), correctly exclude the single-occurrence route-naming note, and correctly classify the qualifying cluster as a specialist-agent candidate (matching "Migration Engineer" in the catalog) rather than a command or skill?

## Procedure — Part B (file placement under simulated approval)

1. Reuse the same fixture (or a fresh copy).
2. Spawn a fresh subagent, telling it explicitly: "Assume the founder has already approved promoting a Migration Engineer specialist for the reasons you'd expect from this fixture's signal — proceed directly to writing the specialist agent file per the skill's Core Workflow step 5 onward, using `references/specialist-agent-template.md`."
3. Independently verify: the file lands at `.claude/agents/<slug>.md` in the fixture project (not under the Wingman repo's `plugins/wingman/`), the frontmatter/placeholders are clean, the content is grounded in the fixture's actual migration-rollback specifics (not generic catalog text), and `.wingman/state.json`'s `active_specialists` array was updated to include it.

## Expectations — positive case

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

## Expectations — negative case

| Check | Expected |
|---|---|
| Raw mention count per topic | Correctly counted as 2 per topic across files (not undercounted) |
| Same-incident recognition | For each topic, correctly recognizes both mentions describe the *same single incident* (matching date, matching fix), not two separate occurrences |
| Final proposal count | **Zero** — no topic gets proposed, explicitly stated as such with reasoning, not silently omitted |
| No premature write | No file created, no `AskUserQuestion` called |

## Trust level

`verified` — passed the positive case (all 6 checks) and the negative case (correctly withheld promotion on all 3 topics despite each appearing in 2 files, by correctly distinguishing same-incident double-logging from genuine repetition), each independently checked rather than trusted from the tested agent's self-report.

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

### Run 2 — 2026-07-07 (negative case)

**Result: PASS on every expectation, including a subtler distinction than the department-lead-activation negative case required.** This fixture deliberately gave every topic exactly 2 raw mentions (not zero or one) to test whether the skill mistakes "appears in 2 files" for "2 genuine occurrences." A fresh subagent, given only the skill/references and the fixture, correctly:
- Counted all three topics' raw mention counts accurately (2 each) — did not undercount or miss any.
- For every topic, correctly recognized that both mentions shared the same date and described the same single piece of work (e.g. the timezone fix's `LEARNINGS.md` entry and its build checkpoint both dated 2026-06-10, both about the identical fix) — a learning-note and a checkpoint/retro naturally exist for the same event, and that's one occurrence logged twice, not two occurrences.
- Concluded explicitly that **zero** topics qualified for promotion, citing the skill's own step 2 clustering rule ("genuine topical overlap, not superficial keyword match") and step 7 ("if nothing has genuinely repeated, say so plainly and don't force a promotion") by name.
- Noted, as independent corroborating evidence (not required, but a good sign of genuine reasoning rather than pattern-matching), that two of the three topics were self-labeled as one-off in the source material itself ("One-off customization, not a general pattern").
- Made no premature write and did not call `AskUserQuestion` — independently confirmed via `git status` in the fixture returning empty and no `.claude/` directory existing afterward.

Both the positive and negative cases now pass. Promoted to `verified` (see Trust level above).

### Run 3 — 2026-07-23 (command-wrapper coverage, `commands/adaptive/evolve.md`)

**Motivation:** `wingman-health.mjs`'s eval-manifest-based coverage check (see `scripts/generate-eval-manifest.mjs`) correctly flagged that Runs 1–2 only ever handed a subagent the skill file directly — the `evolve` *command* itself (a thin `/wingman:evolve` entry point that just says "use the evolve-promotion skill now") had never actually been exercised. Testing whether a subagent given only the command file correctly locates and follows through to the skill is the one thing distinct from Runs 1–2.

**First attempt — FAIL, real bug found.** A fresh subagent, given only `commands/adaptive/evolve.md` and the same positive fixture as Run 1, correctly located `skills/governance/evolve-promotion/SKILL.md` on its own, correctly gathered and clustered the migration-rollback friction (2 genuine occurrences, correctly excluding the single-occurrence route-naming note), but then **misclassified it as a new skill** (`.claude/skills/migration-rollback-required/SKILL.md`) instead of the specialist agent "Migration Engineer" — even though `references/specialist-catalog.md`'s own "Using this catalog" section names this exact scenario as its worked example. The subagent's own report showed why: it checked the catalog "since specialist was a candidate path" only *after* already leaning toward "skill" via the abstract command/skill/specialist test in step 3, rather than checking the catalog first as the more concrete, evidence-backed signal.

**Root cause confirmed, fixed directly:** `SKILL.md` step 3 presented the catalog check as a naming detail subordinate to the specialist bullet, not as a classification signal to check before the abstract test. Added an explicit priority instruction: check `references/specialist-catalog.md` for a matching row first, and let a match override the abstract judgment call. See `docs/PROJECT.md`'s decisions log for the fix.

**Re-run after the fix — PASS.** A second fresh subagent (fresh fixture copy, same procedure) correctly classified the same cluster as the **Migration Engineer** specialist agent, explicitly citing the new priority rule as the reasoning that resolved what it independently noted "reads ambiguously in isolation." Independently verified: `git status --porcelain` empty, no `.claude/` directory created, no `AskUserQuestion` called, matching Run 1's Part A discipline.

This closes the real coverage gap the manifest-based check surfaced: the command wrapper is now genuinely exercised, not just assumed to inherit the skill's correctness, and the run found and fixed a real classification-ordering bug the skill-direct runs couldn't have caught (they never made the subagent independently resolve the ambiguity — they'd already implicitly framed it by which files were handed over).
