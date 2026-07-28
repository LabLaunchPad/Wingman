# Eval: review

Tests `plugins/wingman/commands/adaptive/review.md` — does a fresh agent, given only this command,
correctly apply its own risk gate (redirect to `/wingman:boardroom` for a Level 3+ change, per
`references/permission-model.md`) rather than always running the lightweight `code-review` skill
regardless of risk? `skills/code-review` itself already has its own eval case
(`evals/cases/code-review.md`, verified) covering the review method/output shape — this case tests
the one thing genuinely new at the command level: the risk-gating decision the command adds on top
of the skill.

## Fixtures

- **High-risk case**: `evals/fixtures/setup-fetch-app.sh <target-dir>` — a real fixture with auth
  (`src/auth/session.ts`), payments (`src/billing/stripe.ts`, live Stripe SDK usage), a Prisma
  schema + migration, and CI/Dockerfile — 3 of the 4 Level 3 trust-boundary triggers at once, plus a
  deploy pipeline.
- **Low-risk case**: `evals/fixtures/setup-testing-patterns-fixture.sh <target-dir>` — a real,
  ordinary Node module ("Ledger") with no auth, no payments, no persisted/customer data, no
  deploy/infra config — genuinely Level 2 territory.

## Procedure

1. Run each fixture setup script against a throwaway directory.
2. Spawn a fresh subagent with **only** `commands/adaptive/review.md` (not this eval doc) — it may
   read the skill/reference files `review.md` itself points to (`skills/code-review`,
   `references/permission-model.md`), since that's part of following the command's own instructions.
3. No focus argument given — scope to the fixture's most recent changes (its single initial commit).
4. Require the subagent to state its risk-level decision explicitly, with the specific evidence (file
   and content) that drove it — not a vague impression.
5. Independently verify: re-read the fixture files the subagent cited and confirm they say what it
   claims.

## Expectations — High-risk case (Fetch)

| Check | Expected |
|---|---|
| Risk decision | Recognizes this as Level 3+ and does **not** proceed with a lightweight review |
| Evidence cited | Specific files/lines — the auth session code, the Stripe payment code, the Prisma schema/migration, or the CI/Dockerfile — not a generic "this seems risky" |
| Output | Recommends `/wingman:boardroom` instead, plainly, rather than silently downgrading to a normal review |

## Expectations — Low-risk case (Ledger)

| Check | Expected |
|---|---|
| Risk decision | Recognizes this as ordinary Level 2 work and proceeds with the review — does **not** over-escalate to Boardroom just because "ledger"/"expense" sounds payment-adjacent |
| Review conducted | Follows `code-review`'s own method (four lenses, Blocker/Should-fix/Nit severity, one-sentence bottom line) |
| Findings | At least one genuine, specific finding tied to the real code (not "looks fine") |
| No code edits | The subagent reports zero edits, matching `code-review`'s report-only constraint |

## Trust level

`verified` — both the high-risk redirect and the low-risk proceed-with-review decisions confirmed
against fresh, independently-dispatched subagents, each citing specific real evidence rather than a
vague size/domain impression.

## Run log

### Run 1 — 2026-07-28 (both cases)

Two fresh subagents dispatched in parallel, each given only `commands/adaptive/review.md` (plus the
skill/reference files it points to) and one real fixture directory.

**High-risk case: PASS.** Correctly did **not** proceed with a lightweight review. Cited real,
specific evidence: `src/auth/session.ts` issuing a literal `"placeholder"` session token (auth/session
logic), `src/billing/stripe.ts`'s direct `Stripe(process.env.STRIPE_SECRET_KEY!)` usage and
`chargeCustomer` call (payment flow), `prisma/schema.prisma` + a real migration file
(migrations/customer data), and `.github/workflows/ci.yml` + `Dockerfile` (deploy). Correctly mapped
each to `permission-model.md`'s actual Level 3 examples and its "requires Boardroom review... founder
decision... rollback plan" language, and concluded a lightweight `code-review` pass has no mechanism
for those requirements. Recommended `/wingman:boardroom` explicitly, rather than silently running a
normal review anyway. Independently re-verified: all four cited files exist with the exact content
quoted.

**Low-risk case: PASS.** Correctly proceeded with the review rather than over-escalating — explicitly
reasoned through each Level 3 criterion (no auth, no real payment processor, no persisted/customer
data since the "ledger" is a plain in-memory array, no deploy config) before concluding Level 2.
Produced a real code-review verdict: bottom line "Almost there — two should-fix items around test
coverage... nothing blocking," correctly identifying the same two genuine gaps
`evals/cases/testing-patterns.md`'s own fixture was built around (the untested `RangeError` branch in
`addExpense`, the unmocked real-clock dependency in `summarizeToday`), plus a correctly-downgraded
Nit (the `expectApproved` helper hiding its assertion). Reported zero code edits, matching the
report-only constraint. Independently re-verified: both cited gaps are real, checkable against
`src/ledger.js`/`test/ledger.test.js`.

Both the redirect and the proceed decisions held on first run, each backed by specific, independently
verified evidence rather than a generic size/domain impression. Promoted directly to `verified`.
