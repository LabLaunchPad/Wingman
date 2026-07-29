# Eval: traceability-chain

<!-- eval:no-fixture-needed: constructed inline, mirrors dod-pre-push-check.md's own convention for tiny multi-file fixtures -->

Tests the repaired vision→code chain end to end: `/wingman:discovery` minting `DISC-*` IDs as the
chain root, each later stage's `Satisfies` column linking upward, and
`plugins/wingman/scripts/check-traceability.mjs` resolving the whole thing — including its
`--chain` mode, which answers *"does this code trace back to the vision?"* mechanically rather than
as a judgment call.

Also covers the second enforcer, `hooks/dod-structural-gate.mjs`'s
`checkPlanningMilestoneTraceability()`, which shares the same 12-prefix constant. Before 2026-07-29
these two carried separate hand-written prefix lists and had silently diverged: the gate knew 5 of
12 and matched only one ID per marker.

Fully deterministic — no model-judgment component — verified by running the real script and the
real exported function against real fixtures and checking exit codes/output directly, same method
as `dod-pre-push-check.md`.

## Procedure

1. Build a founder-shaped project directory with the stage artifacts each command's own template
   produces: `docs/wingman/discovery/<slug>.md` (prose fields **plus** the `DISC-*` findings table),
   `docs/wingman/define/<slug>.md`, `docs/wingman/architecture/<slug>.md`,
   `docs/wingman/plans/<date>-<feature>.md`, and a source file carrying a `wingman:req` marker.
2. Run `node plugins/wingman/scripts/check-traceability.mjs <dir>` and check exit code + output.
3. Run the same with `--chain <ID>` and `--orphans`.
4. Sever exactly one `Satisfies` value and re-run all three.
5. Call `checkPlanningMilestoneTraceability()` directly on plan text for each of the 12 prefixes.

## Expectations

| Fixture | Expected exit code | Expected output |
|---|---|---|
| Fully chained project (DISC→DEF→ARCH→IP→code marker) | `0` | `PASS`; no `unlinked` warning for `DISC-001` or `DEF-001` |
| `--chain IP-001` on that project | `0` | `TRACED`, listing **both** routes to the root, not just the shortest |
| `--orphans` on that project | `0` | `0 chain break(s)` |
| Code marker citing an ID no stage ever minted | `1` | `orphaned marker: "DISC-001" …` — the exact pre-fix founder-path failure |
| One `Satisfies` value severed, then `--chain IP-001` | `1` | `BROKEN … does not trace back to the vision` |
| Same, `--orphans` | `1` | names every downstream ID as `unrooted`, not just the severed one |
| An ID covered only via a later stage's `Satisfies` row (no marker) | `0` | **no** `unlinked` warning for it — the pre-fix false positive |
| An `IP-*` ID with nothing downstream | `0` | **no** `unlinked` warning — terminal prefix, exempt by design |
| A `Satisfies` cycle | `1` | reports `cycle`, terminates rather than recursing forever |
| Project with no traceability content at all | `0` | `PASS` — a non-Wingman project is never blocked |
| Plan gate: orphan for each of the 12 prefixes | n/a | `ok: false`, naming that prefix's ID |
| Plan gate: multi-ID marker whose **second** ID is unminted | n/a | `ok: false`, naming the second ID |
| Plan gate: non-Wingman plan text | n/a | `ok: true` — untouched |

## Trust level

`verified` — every shape above ran for real. 16 of them are locked in as automated regression tests
(`tests/hooks-integration/traceability-chain.test.mjs`, part of the `node --test` suite CI enforces),
and the founder-path reproduction was additionally run by hand against a throwaway project before
any fix was written.

## Run log

### Run 1 — 2026-07-29 (pre-fix reproduction, then post-fix verification)

**Before the fix**, built a project following the *then-shipped* templates literally — Discovery's
8 prose fields with no ID table, plus `research-synthesis.md`'s own template row
`| RS-001 | … | DISC-001 |`:

- Documents alone → `PASS`, exit `0`. Notable: the `Satisfies` column did **not** trigger the
  failure, because the checker never parsed that column at all. The chain was dead data.
- Adding `// wingman:req DISC-001` to a source file — exactly what `traceability-linking` instructs
  build-stage code to carry → `orphaned marker: "DISC-001" is referenced via wingman:req in
  src/invoices.js but was never minted in any requirement/decision/flow table`, `FAIL`, exit `1`.

**After the fix**, rebuilt the same project using the repaired templates:

- Full check → `PASS`, exit `0`; `DISC-001` no longer warns as unlinked, because downstream rows
  name it.
- `--chain IP-001` → exit `0`:
  ```
  IP-001  ->  DEF-001  ->  DISC-001
  IP-001  ->  ARCH-001  ->  DEF-001  ->  DISC-001
  TRACED — reaches a DISC-* root; this descends from the vision.
  ```
- Severed `DEF-001`'s `Satisfies` value (the single link nearest the vision) → `--chain IP-001`
  exit `1`, `BROKEN — no path reaches a DISC-* root, so this does not trace back to the vision`;
  `--orphans` exit `1`, naming `ARCH-001`, `DEF-001` **and** `IP-001` as unrooted — correctly
  propagating the break downstream rather than reporting only the severed row.
- `--chain DEF-999` (never minted) → exit `1`, `NOT MINTED`.

**Plan gate**, called directly on real plan text:

- Every one of the 12 prefixes: an unminted ID → `{ok: false, reason: "references ID(s) never
  minted in this plan: <ID>"}`. Pre-fix, the 7 prefixes added by the 14-stage expansion
  (`RS/PJ/JM/IA/WF/VS/PT`) returned `ok: true` — the gate reported success while enforcing nothing.
- `<!-- wingman:req DEF-001 ARCH-999 -->` with only `DEF-001` minted → `ok: false`, naming
  `ARCH-999`. Pre-fix the second ID was silently dropped and this returned `ok: true`.
- Non-Wingman plan text, empty string, and `null` → `ok: true`, untouched.

**One real bug found by these tests, in the new code itself**: the `--chain` argument parser
excluded `argv[0]` on every run *without* `--chain`, since `chainIndex` is `-1` and `-1 + 1 === 0`.
The checker silently ran against the cwd instead of the target project. 6 of the 16 tests failed —
precisely the ones passing a directory without `--chain` — and the two using `--chain` passed,
which is what localized it. Fixed with an explicit guard; all 16 then passed.
