# Eval: department-lead-activation

Tests `plugins/wingman/skills/department-lead-activation/SKILL.md` behaviorally — does a fresh agent, given only this skill and a realistic project, actually create the right department-lead files in the right place with the right content, and correctly withhold the ones that shouldn't activate?

## Fixtures

- **Positive case**: `evals/fixtures/setup-fetch-app.sh <target-dir>` — "Fetch," a hypothetical dog meal-plan subscription app with deliberate signals: a Next.js frontend (Design), a Prisma schema with migrations (Data), auth + Stripe billing code (Legal/Security), and a Dockerfile + CI config (DevOps). No prior ship record, no Growth-department request.
- **Negative case**: `evals/fixtures/setup-minimal-cli.sh <target-dir>` — "linecount," a single-file Node CLI with none of the conditional signals: no frontend, no schema, no auth/payments, no CI/Dockerfile. Tests that the skill correctly creates *only* the two Always departments and doesn't over-trigger.

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

## Trust level

`verified` — passed both the positive case (all 6 conditionally/always-active departments correctly created with evidence) and the negative case (only the 2 Always departments created, all 5 conditional departments correctly withheld with no false positives), each independently checked against the real file tree rather than the tested agent's self-report.

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
