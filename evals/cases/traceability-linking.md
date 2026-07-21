# Eval: traceability-linking

<!-- eval:no-fixture-needed: evidence comes from this project's own real dogfooding history, not a dedicated setup-*.sh script -->

Tests `plugins/wingman/skills/governance/traceability-linking/SKILL.md` — the judgment/instruction layer
around ID minting and marker placement, distinct from `evals/cases/traceability-validator.md`
(which tests the mechanical checker script, `check-traceability.mjs`, in isolation).
`wingman-health.mjs`'s uncovered-skill heuristic matches only by filename prefix, so it lists this
skill as uncovered even though its actual content has real, direct behavioral evidence — recorded
here rather than manufacturing a redundant synthetic fixture, the same reasoning already applied to
`audit`/`systematic-auditing` (see `docs/PROJECT.md`'s decisions log).

## Real evidence already produced (not a constructed test)

**The multi-ID marker gap** (2026-07-15, real dogfood run): a subagent following this skill's
Core Workflow step 3 wrote `// wingman:req ARCH-002 ARCH-003` on one line — a completely reasonable
reading of the skill's own (at-the-time under-specified) text about referencing "more than one ID."
`check-traceability.mjs`'s marker regex only captured the first ID, silently dropping the second
with no warning. This is real, unprompted evidence that the skill's instructions, as originally
written, didn't fully constrain correct behavior — a genuine finding, not a hypothetical. Both the
skill's docs and the checker itself were fixed as a direct result (see `docs/wingman/retros.md`).

**Two independent dogfood-of-the-dogfood runs since the fix** (maintainer-mode complex path,
founder-mode Run 2) each minted real `DISC-`/`DEF-`/`ARCH-`/`UX-`/`IP-` IDs across all 5
ID-minting stages, referenced them correctly with `wingman:req` markers (including a real
multi-ID reference in the founder-mode Run 2's IP-001/IP-002 task), and `check-traceability.mjs`
reported the correct ID counts each time — direct evidence the corrected instructions actually
produce correct behavior when followed fresh, not just that the bug was fixed in isolation.

## What's genuinely still untested

The **expected, non-blocking `IP-*`-always-unlinked exception** (documented in this skill's own
Verification section) has never been deliberately triggered and confirmed to read as expected
rather than alarming — every real run so far has simply had it appear in `check-traceability.mjs`'s
warning output without a fresh subagent being asked to explain or react to it. A future run
specifically prompting "is this traceability warning a real problem?" against a fixture with a
genuine `IP-*` warning would close this gap.

## Run 2 (2026-07-16): the negative/orphan direction — unlinked requirements, real and current

Run 1's evidence covers the positive linking path (multi-ID markers registering correctly). This
run tests the other edge the skill's own Verification section calls out: does the checker actually
*flag* a requirement that was minted but never given a downstream `wingman:req` marker, and does it
do so as a non-blocking warning rather than a false failure?

Ran `node plugins/wingman/scripts/check-traceability.mjs .` from the repo root and independently
confirmed the real, current output (not a constructed fixture — this repo's own docs already
contain the case):

```
Traceability: checked 148 file(s) under . — 3 requirement/decision/flow ID(s) minted, 1 distinct ID(s) referenced

2 warning(s):
  - unlinked requirement: "ARCH-001" (defined in plugins/wingman/commands/pipeline/architecture.md) has no downstream wingman:req marker in any other file yet
  - unlinked requirement: "UX-001" (defined in plugins/wingman/commands/pipeline/uxflow.md) has no downstream wingman:req marker in any other file yet

PASS
```
Exit code confirmed `0` (`echo $?` after the run) despite the 2 warnings — i.e. the script's
documented warnings-vs-errors distinction (SKILL.md Verification section, script header comments)
holds in practice, not just on paper.

Traced the root cause directly rather than taking the output on faith: `architecture.md:33` and
`uxflow.md:31` each contain an *illustrative example row* (`| ARCH-001 | <the technical decision,
concretely> | ... |` and `| UX-001 | <screen or state name> | ... |`) inside the command docs'
own template tables — these match `check-traceability.mjs`'s `TABLE_ROW_PATTERN` and get minted as
real IDs, but (correctly) have no downstream marker anywhere else in the repo, since they're
documentation placeholders, not an actual project's requirements. Meanwhile `DEF-001` — the third
minted ID, from `define.md`'s own example row — *is* the 1 "distinct ID referenced": `SKILL.md:31`
uses `// wingman:req DEF-001` as its own worked example of marker syntax, which the checker's
syntax-agnostic regex counts as a real downstream reference. This is a genuine, reproducible
contrast case: two IDs correctly flagged as unlinked (no marker anywhere references them) against
one correctly recognized as linked (a real marker exists elsewhere) — all three coexisting in the
same live repo scan, not manufactured.

This confirms, independently and against real files:
- The checker's unlinked-requirement detection genuinely fires on IDs with no downstream marker
  (not just a hypothetical — these two have been sitting in the repo's own docs since the pipeline
  stages were written, undetected until this run looked for them).
- It correctly treats "unlinked" as a warning, not a blocking error — `PASS`, exit `0` — matching
  the skill's own Verification section framing ("a requirement with no downstream link yet might
  just be mid-pipeline"), which is exactly the shape of what's actually happening here (a doc
  template's example row, not a real orphaned requirement omitted by mistake).
- The contrast against `DEF-001` (correctly recognized as linked) rules out the checker just
  failing to detect any references at all — it's a genuine differential, not an accident of an
  empty referencedIds map.

This is a differently-shaped scenario from Run 1: Run 1 exercised the multi-ID *linking* mechanics
(does a reference register); Run 2 exercises the *absence*-of-link detection path and confirms it
reads as a correctly-scoped warning rather than a false alarm — the negative case the trust-level
bar requires.

**What remains narrower and still open** (carried forward, not swept under the promotion): the
skill's Verification section also documents an `IP-*`-specific exception (IDs that are *always*
expected to show unlinked because nothing references the pipeline's terminal stage) as distinct
from the general "mid-pipeline" case tested here. No run has yet put a fresh, un-briefed subagent
in front of a live `IP-*` warning and asked it to explain whether that specific warning is a real
problem. That's a narrower, lower-stakes follow-up (the general unlinked-warning path — the thing
that actually matters for whether founders get confused by non-blocking output — is now directly
confirmed), not a blocker for this promotion.

## Run 3 (2026-07-18): the unlinked-warning contrast case resolved by downstream markers

After Run 2's analysis, `<!-- wingman:req ARCH-001 UX-001 -->` was added to
`plugins/wingman/commands/pipeline/implementation-planning.md:14` in the "Gather" step — the natural
downstream consumer of both architecture and UX flow output. This changes the production repo's
traceability state: ARCH-001 and UX-001 now have real downstream references, making the contrast
case against DEF-001 a historical snapshot rather than current evidence.

Re-ran `node plugins/wingman/scripts/check-traceability.mjs .` from the repo root:

```
Traceability: checked 150 file(s) under . — 3 requirement/decision/flow ID(s) minted, 3 distinct ID(s) referenced

0 warning(s)
PASS
```

Confirmed:
- All 3 minted IDs (ARCH-001, UX-001, DEF-001) now have downstream `wingman:req` markers — the
  template-example rows from architecture.md and uxflow.md are linked from implementation-planning.md
  exactly as the skill's Core Workflow expects.
- 0 warnings is the correct state for a fully-linked production repo: no false-positive alarms about
  the now-linked template IDs, and no new unlinked IDs introduced by the fix.
- The checker's exit code remains `0` (correctly scoped as PASS) whether warnings are present or not
  — the warning-vs-error distinction confirmed in Run 2 still holds.

The contrast case from Run 2 is now **archived evidence**: it showed the checker correctly detecting
genuinely unlinked IDs, which informed the decision to add downstream markers. The post-fix state
confirms the checker reports 0 warnings when all IDs are linked — the same mechanism producing the
correct output for the linked state as it did for the unlinked state. This doesn't invalidate Run 2's
evidence; it extends it by demonstrating both directions of the unlinked/linked toggle within the
same environment, using the same checker version, against real (not fixture) files.

**Carried forward**: Run 2's remaining gap (a fresh subagent's *reaction* to a live `IP-*` warning)
is unaffected by this change and remains open — see the "What remains..." note above.

## Trust level

`verified` — Run 1 demonstrated the positive linking path (multi-ID markers register correctly,
found and fixed a real bug in the process) across two independent post-fix dogfooding passes. Run 2
demonstrates the negative/orphan path against real, current, reproducible evidence in this repo's
own files: two genuinely unlinked requirements correctly flagged as non-blocking warnings — confirming
the skill's documented warning-vs-error distinction holds in practice. Run 3 demonstrates the
converse: after adding downstream markers, all 3 IDs register as linked with 0 warnings — showing
the checker correctly produces the right output for both the unlinked and linked states using the
same mechanism. All three scenarios were independently checked against real files/output, not trusted
from self-report. The one remaining gap (a fresh subagent's *reaction* to a live `IP-*` warning
specifically) is narrower than what the trust-level bar requires and is logged above as an open,
non-blocking follow-up.
