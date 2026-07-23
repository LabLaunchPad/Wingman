# Eval: management-board-activation

Tests `plugins/wingman/skills/management-board-activation/SKILL.md` behaviorally — does a fresh agent, given only this skill and its template, correctly create Management Board manager files once a project has crossed the 3+ active-department-lead complexity threshold, and correctly withhold them when it hasn't? Mirrors `department-lead-activation.md`'s positive/negative shape one layer up.

## Fixtures

- **Positive case**: `evals/fixtures/setup-fetch-app.sh <target-dir>` — reused from `department-lead-activation.md`. "Fetch" activates 6 department leads (design, engineering, data, qa, legal-security, devops), well past the 3+ threshold.
- **Negative case**: `evals/fixtures/setup-minimal-cli.sh <target-dir>` — reused from `department-lead-activation.md`. "linecount" activates only 2 department leads (engineering, qa — the two Always departments), below the 3+ threshold.

Since `management-board-activation` operates on `.wingman/state.json`'s `active_department_leads` array rather than re-deriving activation signals from the project itself, both fixtures are used with a **pre-seeded `state.json`** (simulating that department-lead-activation already ran), rather than requiring the tested agent to also run the department-lead check from scratch.

## Procedure

1. Run the fixture setup script.
2. Seed `.wingman/state.json`'s `active_department_leads` with the department leads that fixture's own eval case already confirmed activate (6 for Fetch, 2 for linecount).
3. Spawn a fresh subagent with **only**: `management-board-activation/SKILL.md`, its `references/template.md`, and the fixture directory. Ask it to apply the skill's real activation logic and, where it fires, actually create the resulting manager file(s) with real project-specific content, then update `active_managers`.
4. Independently verify the real file writes and `state.json` contents against the filesystem — do not trust the subagent's self-report alone.

## Expectations — positive case (Fetch, 6 dept leads active)

| Check | Expected |
|---|---|
| Managers created | One per department lead with a defined mapping and a department lead that's actually active: `mgr-design`, `mgr-engineering`, `mgr-data`, `mgr-qa`, `mgr-security` (for `dept-legal-security`), `mgr-platform` (for `dept-devops`) — 6 total |
| Managers NOT created | `mgr-product` (no `dept-product` active in this scenario), `mgr-growth` (no `dept-growth` active) |
| `permissions:` frontmatter | `read` on every created manager file — never `approve` (Boardroom-exclusive) or `write` |
| Content specificity | Each file references Fetch-specific details (Prisma `Dog`/`Plan` models, Stripe billing, session auth) — not generic catalog text |
| File location | All created files under `<fixture>/.claude/agents/` — none under Wingman's own `plugins/wingman/` |
| `state.json` | `active_managers` updated to list exactly the 6 created managers, `active_department_leads` left untouched |

## Expectations — negative case (linecount, 2 dept leads active)

| Check | Expected |
|---|---|
| Managers created | **None** — even though `dept-engineering` and `dept-qa` each individually map to a manager role, the complexity gate (3+ active leads) hasn't been crossed |
| `.claude/agents/` | Empty — no manager files at all |
| `state.json` | `active_managers` stays `[]`, `active_department_leads` untouched |

## Expectations — negative case 2 (health-check, 3 leads but all unconditionally-active)

| Check | Expected |
|---|---|
| Managers created | **None** — `dept-product`, `dept-engineering`, `dept-qa` are all active (3 total, naively meeting the old raw threshold), but none of them are *conditionally*-activated departments, so the conditional count is 0 |
| `.claude/agents/` | Empty of `mgr-*.md` files |
| `state.json` | `active_managers` stays `[]` |

## Trust level

`verified` — Run 1 covered the positive (6 managers, correct mapping) and a basic negative (2 leads, below any threshold) scenario. Run 2 covers the exact boundary case Run 1's trust-level note called for: a project with 3 active department leads that still correctly withholds Management Board activation, because all 3 are the unconditionally-active departments (Product/Engineering/QA) rather than genuine complexity signals — this is the real bug a dogfooding pass found and fixed (see `docs/wingman/retros.md`), and this run directly confirms the fix holds.

## Run log

### Run 1 — 2026-07-14

**Result: PASS on every expectation in both scenarios**, independently re-verified against the real filesystem (not the subagent's self-report):

**Positive (Fetch, `.wingman/state.json` seeded with all 6 department leads):** created exactly `mgr-design.md`, `mgr-engineering.md`, `mgr-data.md`, `mgr-qa.md`, `mgr-security.md`, `mgr-platform.md` under `.claude/agents/` — confirmed via direct `ls`. All 6 carry `permissions: read` — confirmed via `grep -n "^permissions:"` across all 6 files, none showed `approve` or `write`. Content was genuinely fixture-specific: `mgr-data.md` named the actual `Dog`/`Plan` Prisma models and the applied migration, `mgr-security.md` named the actual `src/auth/session.ts` and `src/billing/stripe.ts` files, not generic catalog text. `mgr-product` and `mgr-growth` were correctly not created (`dept-product`/`dept-growth` were never active in this scenario) — confirmed by their absence from the `ls` output and from `active_managers`. Re-read `state.json` directly: `active_managers` contains exactly the 6 created manager names, `active_department_leads` unchanged from the 6 seeded values.

**Negative (linecount, `.wingman/state.json` seeded with only `dept-engineering`/`dept-qa`, 2 leads):** `.claude/agents/` confirmed empty via direct `ls` — zero manager files, despite both active department leads individually having a defined manager mapping in the roster table. This is the main failure mode the negative case is designed to catch: the skill correctly gated on the **count** (3+), not merely "does an active department lead have a corresponding manager row." Re-read `state.json` directly: `active_managers: []`, `active_department_leads` unchanged.

### Run 2 — 2026-07-14/15 (real dogfooding pass, exposed and fixed a real bug)

While dogfooding the simplest possible real feature ("add a `/health` endpoint" to a tiny internal status API — no UI, no database, no auth, no payments), the project genuinely reached Build stage with exactly 3 active department leads: `dept-product`, `dept-engineering`, `dept-qa` — the 3 departments that are **unconditionally** active on every project per `department-lead-activation`'s own table. Before this run's fix, the skill counted *all* active leads toward the 3+ threshold, meaning the Management Board would have activated on this genuinely trivial project — the "complexity gate" was met by Build time on literally every project, since those 3 departments always exist regardless of real complexity.

**Fix**: the threshold now counts only the 5 *conditionally-activated* departments (`dept-design`, `dept-data`, `dept-legal-security`, `dept-devops`, `dept-growth`) — `dept-product`/`dept-engineering`/`dept-qa` never count toward it, though their own managers remain eligible once the conditional count independently crosses 3.

**Result: PASS after the fix**, independently re-verified against the real fixture: `.wingman/state.json` at the end of a full 7-stage run (Discovery → Ship, real founder `AskUserQuestion` decisions, real test-driven implementation, a real `git push` through the actual `dod-structural-gate.mjs` hook) shows `active_department_leads: [dept-product, dept-engineering, dept-qa]` (3 entries) and `active_managers: []` — confirmed via direct file read, not a subagent's self-report. Exactly 3 checkpoints recorded (Planning Milestone, Build, Ship), matching the design, with the Management Board correctly dormant throughout. This is the genuine common-case confirmation this project's own architecture always claimed ("most projects should never need this layer") but had never actually verified end to end before this run.

**Repo cleanliness**: `git status --porcelain -- plugins/wingman/` in the Wingman repo shows only this session's own pre-existing, already-tracked MVP1 work (the 7-seat Boardroom rewrite, the skill's own creation, pipeline-command wiring) — nothing new leaked in from this eval run; every write this run performed landed under the two `/tmp/.../scratchpad/eval-mgmt-board-*` fixture directories.

**Ambiguity surfaced**: the manager table's Research Manager row ("no department-lead equivalent; activates alongside Product once threshold is met") doesn't spell out its gating condition as explicitly as the other 8 rows — is it tied to `dept-product` being active, or does it fire on count≥3 alone regardless of which leads are active? The subagent resolved this conservatively (no `dept-product` active in this scenario → no `mgr-research` created), consistent with the skill's own general "don't create a manager for a department lead that doesn't exist yet" rule, but this row is worth a one-line clarification in the skill file since it's the one manager without a 1:1 department-lead mapping.
