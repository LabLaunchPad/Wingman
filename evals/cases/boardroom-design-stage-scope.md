# Eval: boardroom-design-stage-scope

Tests `plugins/wingman/commands/adaptive/boardroom.md`'s newly-added design-stage-vs-diff-stage
scope note (added 2026-07-25/26, see `docs/wingman/retros.md`) — does a dispatched seat, told
explicitly that its scope is a *pre-implementation design document* rather than a diff, correctly
judge the soundness of the proposed approach instead of failing the checkpoint because the
document's own planned files/models don't exist on disk yet?

## Fixture

`evals/fixtures/setup-dogfood-complex.sh <target-dir>` — reused from the 14-stage dogfood run that
found this gap; it's a real seeded project (auth/payments/schema/CI signals) with the same shape
that originally triggered the false `NO_GO`.

## Procedure

1. Run the fixture setup script.
2. Write a short Architecture-stage design document into the fixture proposing a new schema model
   and a new webhook-handling file that do not yet exist on disk (mirroring the real finding).
3. Spawn a fresh subagent with `commands/adaptive/boardroom.md` and `agents/boardroom-ciso.md`,
   dispatched against that document with the design-stage scope note now present in `boardroom.md`.
4. Independently verify the seat's verdict and reasoning.

## Expectations

| Check | Expected |
|---|---|
| Verdict | `GO` or `GO_WITH_CONCERNS` — not `NO_GO` solely because the proposed model/file doesn't exist yet |
| Reasoning | The seat's verdict text judges the soundness of the proposed design (e.g. "does this auth-isolation approach work if built") rather than citing the absence of the not-yet-built file as the defect |
| Negative-case check | A *diff*-scope dispatch of the same seat against real code that's missing an equivalent piece (e.g. a genuinely-absent auth check in already-written code) still correctly returns `NO_GO` — confirming the fix didn't over-correct into never flagging missing security controls |

## Trust level

`verified` — Run 2 (below) is a dedicated, isolated dispatch of this case's own Procedure, run
against a scenario deliberately shaped differently from Run 1 (different pre-Build stage,
Implementation-Planning rather than Architecture; a different proposal domain, encrypted file
upload + rate limiting rather than schema/webhook/session; a fresh, unbriefed `general-purpose`
subagent given only the CISO persona + the design doc + the scope-framing note, with no knowledge of
the original bug or Run 1). It confirms the fix generalizes rather than being a fit to the one
scenario that both found and fixed it. The negative/over-correction check (a diff-scope dispatch of
the same seat against real code with a genuinely missing security control) also holds — see below.

## Run log

### Run 1 — 2026-07-25/26 (the run that found this gap)

**Setup:** the real 14-stage dogfood run's Architecture-stage checkpoint, reviewing a genuine
`docs/wingman/architecture/fetch-app.md` proposing a `Subscription` Prisma model, a new
`src/billing/webhooks.ts`, and an extended `session.ts` auth check — none of which existed on disk
yet, by design (Architecture is a pre-Build design stage).

**Result (before the fix):** the CISO seat returned `NO_GO`, citing the absence of the
not-yet-built schema model, webhook file, and real session validation as "an exploitable gap between
documented design and running code" — technically true in isolation, but not the actual failure mode
this stage is supposed to catch (Architecture reviews the soundness of the plan, not whether Build
has already happened).

**Fix:** `boardroom.md` now states explicitly, before "A cleared checkpoint is not a permanent
guarantee," that a design-stage checkpoint reviews a plan and that the calling command should tell
each dispatched seat which kind of scope it's looking at (design vs. diff).

**Re-verification (same run, same document, after the fix):** re-dispatching CISO with the added
design-stage-scope framing returned `GO`, judging the proposed auth-isolation/webhook-verification/
PCI-scope approach on its merits rather than citing missing files as the defect.

**Not yet done (at the time):** a dedicated, isolated dispatch of this case's own Procedure (not
embedded in a larger pipeline run), and the negative-case check (confirming a genuine diff-stage
security gap still correctly returns `NO_GO` after this change) — both completed in Run 2 below.

### Run 2 — 2026-07-26 (dedicated, isolated re-verification, deliberately different shape)

**Why a second scenario was needed:** Run 1's fix and its re-verification used the *same* document
(Architecture-stage, schema/webhook/session-validation) that originally found the bug — that's not
independent confirmation the fix generalizes, only that it patched the one case that surfaced it.

**Setup:** ran `evals/fixtures/setup-dogfood-complex.sh` fresh into a scratch directory. Confirmed
via `grep` that the fixture's `src/` (`session.ts`, `stripe.ts`, `PlanCard.tsx`) and `prisma/schema.prisma`
matched the same shape Run 1 used, then wrote a new, different-shaped design document —
`docs/wingman/plans/implementation-planning-file-upload.md` — for the **Implementation-Planning**
stage (not Architecture) proposing a **rate-limiting middleware** (`src/uploads/rateLimiter.ts`),
an **encrypted-storage wrapper** (`src/uploads/encryptedStorage.ts`), a **route-level ownership
check**, and a **90-day retention job** — none of which exist on disk, and none of which overlap
with Run 1's schema/webhook/session-validation domain. First independently confirmed `boardroom.md`
still states the design-stage-scope framing verbatim (`grep -n "design-stage checkpoint reviews a
plan" plugins/wingman/commands/adaptive/boardroom.md` — present at line 29 of the current file).

**Dispatch:** spawned a fresh, unbriefed `general-purpose` subagent given only: (1) the CISO seat's
persona text verbatim from `plugins/wingman/agents/boardroom-ciso.md`, (2) a scope-framing note
paraphrasing `boardroom.md`'s design-stage language ("this is a design document... the files it
names... do not exist on disk yet, by design — that absence is not itself a finding... judge
whether the proposed approach is sound if built as specified"), and (3) the path to the new design
doc. The subagent had no knowledge of Run 1, the original bug, or this eval case.

**Result:** `## CISO VERDICT: GO_WITH_CONCERNS`. Quoted verbatim: *"The design itself is sound —
encryption at rest, short-lived signed download URLs, per-user rate limiting, and reuse of the
existing session check are the right calls. But two things need a decision before Build starts..."*
Its three flagged "Open risks" were all genuine design-merit concerns (in-memory rate limiter not
surviving a multi-instance deploy; ownership check inlined per-route instead of extracted as a
shared/tested helper; retention-deferral needing explicit founder sign-off) — none of them cited
"this file doesn't exist yet" as a defect. This satisfies the case's Expectations table: verdict is
`GO_WITH_CONCERNS` (not `NO_GO`), and the reasoning judges the proposal on its merits.

**Negative/over-correction check:** also attempted, not skipped. Added a second, real (non-plan)
file to the same fixture, `src/billing/webhooks.ts` — a genuine Stripe webhook handler with no
signature verification, mirroring a real diff-stage security gap. Dispatched a second fresh
`general-purpose` subagent with the same CISO persona but a *diff*-scope framing note instead
("this is a diff of already-written, real code... judge whether the actual code, as written, closes
the risk"). Result: `## CISO VERDICT: NO_GO`. Quoted verbatim: *"This webhook will accept a fake
'Stripe' message from anyone on the internet and act on it as if it were real... Verify every
incoming request using Stripe's signing secret (`stripe.webhooks.constructEvent()`...) before
touching `event.type`... Hold — do not ship."* Confirms the design-stage framing did not
over-correct into rubber-stamping — the same seat still catches and fails a genuinely missing
security control once told the scope is a diff of real code.

**Conclusion:** both the positive case (different stage, different proposal domain, fresh unbriefed
dispatch) and the negative case (over-correction check) hold. Promoting to `verified`.
