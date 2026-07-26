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

`provisional` — this gap and its fix were found and applied inside a real maintainer-mode dogfood
run (`evals/dogfood-runs/2026-07-25T19-45-00Z-14stage-complex.json`, Build/Architecture-stage
checkpoints), not yet independently re-verified by a dedicated dispatch of this case's own Procedure.

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

**Not yet done:** a dedicated, isolated dispatch of this case's own Procedure (not embedded in a
larger pipeline run), and the negative-case check (confirming a genuine diff-stage security gap
still correctly returns `NO_GO` after this change) — both needed before promoting to `verified`.
