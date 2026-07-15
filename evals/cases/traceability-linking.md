# Eval: traceability-linking

<!-- eval:no-fixture-needed: evidence comes from this project's own real dogfooding history, not a dedicated setup-*.sh script -->

Tests `plugins/wingman/skills/traceability-linking/SKILL.md` — the judgment/instruction layer
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

## Trust level

`provisional` — the multi-ID gap-and-fix is strong real-world evidence of one specific failure mode
being found and closed, and two independent post-fix runs show the corrected instructions produce
correct behavior. Not yet `verified`: the "IP-* warning is expected, not alarming" claim in this
skill's own Verification section has never been directly, deliberately tested against a fresh
subagent asked to react to it.
