# Eval: department-lead-activation

Tests `plugins/wingman/skills/department-lead-activation/SKILL.md` behaviorally — does a fresh agent, given only this skill and a realistic project, actually create the right department-lead files in the right place with the right content, and correctly withhold the ones that shouldn't activate?

## Fixtures

- **Positive case**: `evals/fixtures/setup-fetch-app.sh <target-dir>` — "Fetch," a hypothetical dog meal-plan subscription app with deliberate signals: a Next.js frontend (Design), a Prisma schema with migrations (Data), auth + Stripe billing code (Legal/Security), and a Dockerfile + CI config (DevOps). No prior ship record, no Growth-department request.
- **Negative case**: `evals/fixtures/setup-minimal-cli.sh <target-dir>` — "linecount," a single-file Node CLI with none of the conditional signals: no frontend, no schema, no auth/payments, no CI/Dockerfile. Tests that the skill correctly creates *only* the two Always departments and doesn't over-trigger.
- **Skill-materialization case** (Core Workflow step 6): `evals/fixtures/setup-skill-catalog-fixture.sh <target-dir>` — "single-signal-app," a minimal fixture with exactly one tech-stack catalog signal (`next` in `package.json` dependencies, matching only `nextjs-app-router` in `docs/SKILL-ROSTER.md`) and deliberately no other roster signal (no `react` dependency line, no schema/migrations, no Dockerfile, no `.mcp.json`) — isolates the "materialize exactly one, nothing else" check from the multi-signal noise the positive-case fixture would add.

## Procedure

1. Run the fixture setup script against a throwaway directory.
2. Spawn a fresh subagent with **only**: the path to the Wingman repo (to read `department-lead-activation/SKILL.md` and its `references/template.md`), the fixture directory path, and an instruction to act as if it is `/wingman:build` + `/wingman:secure` + `/wingman:ship` running against this project for the first time — i.e., check every department this skill covers except Product (which only `/wingman:plan` checks) and Growth (which requires an explicit founder request this scenario doesn't include).
3. Do not tell the subagent which departments should activate — that's what's being tested.
4. After it finishes, inspect the fixture directory against the expectations below. Do not trust the subagent's self-report alone — check the actual file tree and content.

## Expectations — positive case (Fetch)

| Check | Expected |
|---|---|
| `dept-design.md` created | Yes — Design signal present (Next.js pages/components) |
| `dept-engineering.md` created | Yes — always active |
| `dept-data.md` created | Yes — Data signal present (Prisma schema + migrations) |
| `dept-qa.md` created | Yes — always active |
| `dept-legal-security.md` created | Yes — Legal/Security signal present (auth + billing code) |
| `dept-devops.md` created | Yes — DevOps signal present (Dockerfile + CI) |
| `dept-growth.md` created | **No** — no explicit founder request in this scenario; must not be inferred |
| `dept-product.md` created | **No** — only `/wingman:plan` checks this signal, not tested here |
| File location | All created files under `<fixture>/.claude/agents/` — **none** under the Wingman repo's own `plugins/wingman/` |
| Content specificity | Each created file references fixture-specific details (e.g. "Fetch," dogs, Stripe, Prisma) — not generic catalog text copied from `docs/AGENT-ROSTER.md` |
| Frontmatter validity | Each file has `name: dept-<x>` matching its filename, a `description` with an explicit trigger clause, and no unfilled `{{placeholder}}` tokens from the template |
| Orchestration rule | No created agent file itself invokes another agent — matches the "personas never call personas" constraint |

## Expectations — negative case (linecount)

| Check | Expected |
|---|---|
| `dept-engineering.md` created | Yes — always active |
| `dept-qa.md` created | Yes — always active |
| `dept-design.md`, `dept-data.md`, `dept-legal-security.md`, `dept-devops.md`, `dept-growth.md` created | **No, all of them** — none of their signals are present in this fixture; over-triggering here would indicate the skill defaults to "create when unsure" instead of requiring real evidence |
| File location, frontmatter validity, orchestration rule | Same bar as the positive case |

## Expectations — skill-materialization case (single-signal-app)

| Check | Expected |
|---|---|
| `.claude/skills/nextjs-app-router/SKILL.md` created | Yes — `next` in `package.json` dependencies is a real, concrete signal |
| Any other `.claude/skills/*` created | **No** — no other roster signal is present in this fixture; over-triggering here would indicate the skill materializes speculatively rather than off a real signal |
| File location | Under `<fixture>/.claude/skills/`, never under the Wingman repo's own `plugins/wingman/` |
| Content specificity | References this fixture's actual code (its `src/app/` structure), not generic catalog boilerplate copied verbatim from `skill-roster.md` |
| Second run (same fixture, file already present) | No new file created, existing file not overwritten/duplicated — byte-identical before and after |

## Trust level

`verified` — passed the positive case (all 6 conditionally/always-active departments correctly created with evidence), the negative case (only the 2 Always departments created, all 5 conditional departments correctly withheld with no false positives), and the skill-materialization case (exactly one narrowly-scoped skill file materialized off a real signal, nothing else, and correctly left alone on a second run) — each independently checked against the real file tree rather than the tested agent's self-report.

## Run log

### Run 1 — 2026-07-07

**Result: PASS on every expectation.** A fresh subagent, given only the skill file, its template, and the fixture (not this eval document), correctly:
- Created exactly the 6 expected files (`dept-design`, `dept-engineering`, `dept-data`, `dept-qa`, `dept-legal-security`, `dept-devops`), each with concrete, file-and-line evidence for its activation (verified independently by inspecting the fixture, not just trusting the subagent's self-report).
- Did **not** create `dept-growth.md` (correctly refused to infer it without an explicit request) or `dept-product.md` (correctly out of scope for this test).
- Wrote every file under `<fixture>/.claude/agents/` — confirmed via `git status --porcelain -- plugins/wingman/` in the Wingman repo returning empty, i.e. nothing leaked into Wingman's own plugin directory.
- Left zero unfilled `{{placeholder}}` tokens across all 6 files; every `name:` frontmatter field matched its filename.
- Produced genuinely project-specific content, not generic catalog text — e.g. `dept-legal-security.md` named the exact hardcoded placeholder token in `src/auth/session.ts`, the unchecked `STRIPE_SECRET_KEY!` non-null assertion, and the missing input validation on `chargeCustomer`'s `amountCents` parameter, none of which were prompted for — the subagent found them by actually reading the fixture code.
- Did not violate the "personas never call personas" orchestration rule in any created file.

### Run 2 — 2026-07-07 (negative case)

**Result: PASS on every expectation.** A second fresh subagent, run against the `linecount` fixture (none of the conditional signals present), correctly:
- Created **only** `dept-engineering.md` and `dept-qa.md` — independently confirmed via `ls` that none of `dept-design.md`, `dept-data.md`, `dept-legal-security.md`, `dept-devops.md`, `dept-growth.md`, or `dept-product.md` exist in the fixture.
- Gave a specific, evidence-based reason for each withheld department (e.g. "no frontend framework, no HTML templates... the only files are `index.js`, `package.json`, `README.md`") rather than a generic "not applicable."
- Did not default to creating a department "to be thorough" despite the ambiguity of a genuinely minimal project — this was the main failure mode this run was designed to catch.
- Confirmed no writes outside the fixture's own `.claude/agents/`; the Wingman repo's `plugins/wingman/` stayed clean per `git status --porcelain`.
- Both created files passed frontmatter/placeholder checks identically to Run 1.

Both the positive and negative cases now pass. Promoted to `verified` (see Trust level above).

### Run 3 — 2026-07-07 (targeted regression check, post-fix)

A 2026-07-07 multi-expert audit found the skill never wrote to `.wingman/state.json` at all despite `docs/DATABASE.md`/`evolve-promotion` assuming it populates `active_department_leads` — fixed by adding that step to Core Workflow step 3. Since this changed the skill's actual behavior, Runs 1–2 (which predate the fix) no longer fully cover it; re-running the whole positive/negative case from scratch would re-test unchanged logic at real token cost for no new information, so this run targets only what changed, plus a quick spot-check that the untouched parts didn't regress — reusing the existing `setup-fetch-app.sh` fixture rather than writing a new one.

**Procedure:** one fresh subagent, given only the skill/template and the fixture, asked to (1) simulate `/wingman:build`'s check (Design/Engineering/Data/QA) against the fixture from a clean `.wingman/`, (2) verify `state.json` was created fresh with the right 4 leads and an empty `active_specialists`, (3) hand-seed `active_specialists: ["migration-engineer"]` to simulate an earlier specialist promotion, (4) simulate `/wingman:secure`'s check (Legal/Security) on the same fixture, (5) verify the new lead was appended without disturbing the seeded specialist, (6) spot-check that `dept-devops` — whose signal is present in this fixture but is only checked by `/wingman:ship`, not simulated here — was correctly not created.

**Result: PASS on every step**, independently verified against the real filesystem (not the subagent's self-report):
```json
{
  "active_department_leads": ["dept-design", "dept-engineering", "dept-data", "dept-qa", "dept-legal-security"],
  "active_specialists": ["migration-engineer"]
}
```
All 5 department-lead files present under `.claude/agents/` with zero unfilled placeholders, `active_specialists` survived the second write intact (the exact failure mode the fix targeted), `dept-devops.md` correctly absent, and `git status --porcelain -- plugins/wingman/` in the Wingman repo returned empty. Trust level remains `verified` — this run reconfirms it holds after the fix rather than re-establishing it from zero.

### Run 4 — 2026-07-10 (skill-materialization case, v8 extension)

Tests the new Core Workflow step 6 (tech-stack/MCP skill catalog check) added for the v8 "four-command extension" (see `docs/ARCHITECTURE.md` §12). Fresh subagent, given only `SKILL.md`, `references/skill-roster.md`, and the new `setup-skill-catalog-fixture.sh` fixture (not this eval document), asked to (1) simulate step 6 against the fixture, materializing any genuinely-signaled skill, and (2) immediately re-run the identical check against the same now-modified fixture.

**Result: PASS on every expectation, independently re-verified against the real filesystem (not the subagent's self-report):**
- First run: found exactly one real signal (`next` in `package.json` dependencies, cross-checked against every other roster row with none matching — no lockfile, no `Dockerfile`/`wrangler.toml`/`.mcp.json`, no `schema.prisma`/migrations), and materialized exactly one file, `.claude/skills/nextjs-app-router/SKILL.md`, under the fixture's own `.claude/`. Content is fixture-specific (names the project's actual `src/app/page.js`, App Router status derived from the real file tree), not generic roster text.
- Independently confirmed via `find`: only that one file exists under `.claude/`. Independently confirmed via `git status --porcelain -- plugins/wingman/` in the Wingman repo: empty — nothing leaked into Wingman's own plugin directory.
- Second run: correctly created no new file and did not touch the existing one — confirmed by comparing the file's md5sum before and after the second run (identical: `394a1cb9e1dba2fdacdd1f816c769379`), matching Core Workflow step 6's "this check runs at most once per matched signal per project" rule.
- Judgment call flagged by the subagent, not a gap: step 6 doesn't specify a skill-file template the way step 3 points department leads at `references/template.md`; the subagent used the plugin's own skill files (frontmatter `name`/`description` + Overview/Core Workflow/Constraints/Verification shape) as the closest existing convention, and produced a well-formed, non-generic result — worth a template pointer in a future pass if this becomes a recurring point of variance, not a defect to fix now.

Promoted to `verified` (see Trust level above) — third differently-shaped scenario now covered, all three independently checked against the real filesystem.
