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

## Trust level

`provisional` — one real run, correct simplification, correct behavior-preservation, and it
directly surfaced and helped fix a real ambiguity in the skill's own wording. Not yet `verified`:
needs a second, differently-shaped scenario re-run against the now-clarified step 4 to confirm the
disambiguation actually produces consistent behavior, plus a negative case (code with nothing worth
simplifying, confirming the skill doesn't manufacture a change to have something to report).
