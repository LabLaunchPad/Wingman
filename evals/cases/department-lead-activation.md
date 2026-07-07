# Eval: department-lead-activation

Tests `plugins/wingman/skills/department-lead-activation/SKILL.md` behaviorally — does a fresh agent, given only this skill and a realistic project, actually create the right department-lead files in the right place with the right content, and correctly withhold the ones that shouldn't activate?

## Fixture

`evals/fixtures/setup-fetch-app.sh <target-dir>` — "Fetch," a hypothetical dog meal-plan subscription app with deliberate signals: a Next.js frontend (Design), a Prisma schema with migrations (Data), auth + Stripe billing code (Legal/Security), and a Dockerfile + CI config (DevOps). No prior ship record, no Growth-department request.

## Procedure

1. Run the fixture setup script against a throwaway directory.
2. Spawn a fresh subagent with **only**: the path to the Wingman repo (to read `department-lead-activation/SKILL.md` and its `references/template.md`), the fixture directory path, and an instruction to act as if it is `/wingman:build` + `/wingman:secure` + `/wingman:ship` running against this project for the first time — i.e., check every department this skill covers except Product (which only `/wingman:plan` checks) and Growth (which requires an explicit founder request this scenario doesn't include).
3. Do not tell the subagent which departments should activate — that's what's being tested.
4. After it finishes, inspect the fixture directory against the expectations below. Do not trust the subagent's self-report alone — check the actual file tree and content.

## Expectations

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

## Trust level

`provisional` — single scenario, one run, graded by manual inspection rather than an automated assertion script. Sufficient to catch a broken or misunderstood skill; not a substitute for exercising this against a second, differently-shaped fixture (e.g. a project with *no* design/data/security/devops signals at all, to confirm the skill correctly creates *nothing* beyond the two Always departments) before relying on it heavily.

## Run log

### Run 1 — 2026-07-07

**Result: PASS on every expectation.** A fresh subagent, given only the skill file, its template, and the fixture (not this eval document), correctly:
- Created exactly the 6 expected files (`dept-design`, `dept-engineering`, `dept-data`, `dept-qa`, `dept-legal-security`, `dept-devops`), each with concrete, file-and-line evidence for its activation (verified independently by inspecting the fixture, not just trusting the subagent's self-report).
- Did **not** create `dept-growth.md` (correctly refused to infer it without an explicit request) or `dept-product.md` (correctly out of scope for this test).
- Wrote every file under `<fixture>/.claude/agents/` — confirmed via `git status --porcelain -- plugins/wingman/` in the Wingman repo returning empty, i.e. nothing leaked into Wingman's own plugin directory.
- Left zero unfilled `{{placeholder}}` tokens across all 6 files; every `name:` frontmatter field matched its filename.
- Produced genuinely project-specific content, not generic catalog text — e.g. `dept-legal-security.md` named the exact hardcoded placeholder token in `src/auth/session.ts`, the unchecked `STRIPE_SECRET_KEY!` non-null assertion, and the missing input validation on `chargeCustomer`'s `amountCents` parameter, none of which were prompted for — the subagent found them by actually reading the fixture code.
- Did not violate the "personas never call personas" orchestration rule in any created file.

**Not yet tested** (see Trust level above): the negative case — a project with none of the conditional signals present, to confirm the skill creates *only* the two Always departments and nothing else. Recommended before this skill is considered fully verified.
