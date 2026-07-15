# Eval: incident-response

<!-- eval:no-fixture-needed: shares code-review.md's inline fixture description, not a dedicated setup-*.sh script -->

Tests `plugins/wingman/skills/incident-response/SKILL.md` and `commands/incident.md` — does the
calm, ordered runbook (triage → diagnose before touching code → smallest safe fix) hold up against
a real bug, and does it correctly diagnose the *actual* root cause rather than accepting a plausible
but wrong hint?

## Run 1 — 2026-07-15 (consolidated 8-skill session)

Part of a single continuous founder session (see `evals/cases/code-review.md` for the shared
fixture). The scenario handed to the subagent was: "production reports show `signup()` is throwing
an unhandled error for some emails — investigate," with an internal (not told to the subagent)
planted hint suggesting `isValidEmail(null)` was the cause.

**The most important result of this run: the hinted cause did not reproduce, and the subagent
found the real one instead of accepting the plausible-sounding lead.** It tested
`isValidEmail(null)`/`isValidEmail(undefined)` directly and confirmed both return `false` safely
(`RegExp.test()` coerces to string, no throw) — then kept investigating edge cases per the runbook's
own "diagnose before fixing" discipline, and found the actual reproducible crash:
`signup(email, null)` throws `Cannot read properties of null (reading 'includes')`, because JS
default parameters only trigger on `undefined`, not an explicit `null`. Fixed with
`Array.isArray(existingEmails) ? existingEmails : []`, added a regression test, confirmed 4/4
passing after. Logged the ruled-out hypothesis in the memory store (see `evals/cases/memory.md`) so
a future session doesn't re-chase the same wrong lead.

This is genuine evidence the runbook's sequencing (triage → diagnose, never guess-and-patch) works
as designed — a less disciplined process could easily have "fixed" the hinted (non-existent) null
regex issue, declared victory, and left the real crash live.

## Trust level

`provisional` — one real run, correctly resisted a plausible-but-wrong lead and found the actual
bug. Not yet `verified`: needs a second, differently-shaped scenario — ideally one where the
obvious/hinted cause *is* correct, to confirm the runbook doesn't over-correct into needless
extra investigation when the first hypothesis is actually right.
