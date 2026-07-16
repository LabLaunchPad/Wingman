# Eval: simplify

<!-- eval:no-fixture-needed: shares code-review.md's inline fixture description, not a dedicated setup-*.sh script -->

Tests `plugins/wingman/skills/simplify/SKILL.md` — does it produce a real simplification plan,
apply it visibly (plan and diff together, never a silent edit), and verify behavior is unchanged
via the project's real tests before and after?

## Run 1 — 2026-07-15 (consolidated 8-skill session)

Part of a single continuous founder session (see `evals/cases/code-review.md` for the shared
fixture and the `ValidationPipeline` over-engineering `code-review` had just flagged). A fresh
subagent applied this skill for real: proposed collapsing the class into
`if (!isValidEmail(email) || existingEmails.includes(email))`, a genuine, correctly-targeted
simplification. Ran `npm test` before (3/3 passing), applied the edit, ran `npm test` after (3/3
passing) — a real, verified behavior-preserving change, not asserted.

**A real documentation gap found and fixed as a direct result of this run**: the skill's original
Core Workflow step 4 read "Hand the plan back (or apply it visibly)" — genuinely ambiguous between
two different behaviors with no rule for which applies when. The subagent reasonably took the
"apply it visibly" branch, which worked correctly here, but flagged the ambiguity itself as worth
tightening for consistency across different agents/sessions. Fixed: step 4 now states plainly that
"silently" (not "immediately") is the operative constraint — the plan and the diff always travel
together in the same pass, with before/after test verification as part of that same pass, not a
separate later step or a different sanctioned path.

## Run 2 — 2026-07-16 (negative case)

A fresh subagent, given only `simplify/SKILL.md`, reviewed a differently-shaped, deliberately clean
diff: a new "slug-utils" project (`src/slugify.js`, a single 13-line `slugify` function; plus
`test/slugify.test.js`, 5 passing scenarios — plain word, accented characters, mixed punctuation
and whitespace, already-hyphenated input, all-punctuation input). The diff was constructed to be
genuinely appropriately simple: one flat chain of string-method calls, no duplication anywhere in
the diff, no wrapper-around-wrapper indirection, no dead branches (every step in the chain is
exercised by a distinct test), well under the ~50-line function / ~200-line file size thresholds,
and its one terse regex (Unicode combining-mark stripping after NFKD normalization) already carries
an inline comment explaining it.

The subagent correctly walked the skill's ordered checklist (duplication → indirection → dead
branches → cleverness → size), concluded none of the five applied, and made **zero edits** —
explicitly declining to invent an extraction or restructuring just to have something to report,
citing the skill's own "extracting a shared helper used only once" and "shrinking so far the intent
is lost" red flags as the reasoning for leaving it alone.

Independently verified against the actual fixture, not just the subagent's self-report:
`git status`/`git diff HEAD --stat` after the run still show only the original two new files with no
modifications, `md5sum` on both files matches their pre-run content, and `npm test` still passes
5/5 both before and after. The subagent's stated reasoning (no duplication, no dead branches, size
far under threshold) also holds up against a direct read of the 13-line function itself.

This is the negative-direction scenario Run 1's trust-level note called for: confirms the skill
does not manufacture churn or "simplifications" on code that's already appropriately simple, as a
genuinely different edge from Run 1's over-complicated-diff case.

## Trust level

`verified` — Run 1 found a genuine, correctly-targeted simplification in an over-complicated diff,
verified behavior-preserving via real before/after tests, and directly surfaced (and helped fix) a
real ambiguity in the skill's own step-4 wording. Run 2, run against the now-clarified wording,
confirms the opposite edge: given a diff with nothing genuinely worth simplifying, the skill
correctly recognizes that and makes zero edits rather than manufacturing busywork — independently
confirmed against the actual fixture state (git status, file hashes, and passing tests unchanged),
not just the subagent's own report.
