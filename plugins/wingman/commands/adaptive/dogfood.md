---
description: Run the real 7-stage pipeline end to end against a throwaway or real small project to find genuine pipeline bugs and friction — no shortcuts, no simulation.
argument-hint: "[optional: simple|complex|both (maintainer mode) or a feature idea in your own words (founder mode)]"
---

# Wingman: Dogfood

This command exists because a structural review of Wingman's own files can't catch everything —
some bugs only surface when the actual 7-stage pipeline runs for real, with a real founder-in-the-
loop decision, real Boardroom dispatch, real test-driven implementation, and a real `git push`
through the actual installed hooks. Two real runs of this kind (documented in
`docs/wingman/retros.md`) each found and fixed a genuine bug that no amount of reading the plugin's
own files would have caught. This command formalizes that process instead of leaving it to happen
only when a session happens to do it by hand.

$ARGUMENTS

## Step 1: Detect which mode applies

Check whether `scripts/validate-structure.mjs` exists relative to the repo root. That file ships
**only** in Wingman's own GitHub source checkout — it is never declared in `plugin.json`, so it
never ships to a founder's installed copy of the plugin.

- **If it exists → maintainer mode.** You're running inside Wingman's own dev repo. Proceed to
  Step 2a. A real gap found here can be promoted into `plugins/wingman/` itself, via the
  `dogfood-gap-classification` skill.
- **If it doesn't exist → founder mode.** You're running inside a founder's own project. Proceed
  to Step 2b. Nothing in this mode ever writes to `plugins/wingman/`; findings flow into the
  founder's own `LEARNINGS.md`/`docs/wingman/retros.md`/`/wingman:evolve`, exactly like any other
  session's work.

## Step 2a: Maintainer mode

**Pick the path(s) to run**, from `$ARGUMENTS` (default: both, sequentially):

- **Simple path**: generate a fresh fixture via `evals/fixtures/setup-dogfood-simple.sh <target-dir>`
  — a genuinely minimal project with zero conditional signals (no auth, no payments, no schema, no
  user-facing surface). Purpose: prove the gates that are supposed to stay dormant on a trivial
  project actually do — `management-board-activation`'s conditional-department threshold,
  `department-lead-activation`'s conditional signals, `dod-structural-gate.mjs`'s checks. This is
  the path that caught the real complexity-gate miscounting bug (see `docs/wingman/retros.md`,
  2026-07-14/15) — do not skip it just because "nothing should happen" makes it feel like a no-op.
- **Complex path**: generate a fresh fixture via `evals/fixtures/setup-dogfood-complex.sh
  <target-dir>` — seeded with deliberate conditional signals (an auth/payments touchpoint, a
  user-facing surface, a schema change) chosen to cross each conditional-activation threshold at
  least once. Purpose: prove those same gates correctly activate, and that a real Boardroom
  dispatch produces real, substantive findings on a real plan.

**Run the real pipeline, no shortcuts**, against whichever fixture(s) were generated:
1. `/wingman:discovery` through `/wingman:ship`, in order, for real — this session stands in as the
   founder for every `AskUserQuestion` the pipeline calls for. Answer as a real founder would,
   don't assume or pre-script an answer.
2. Real `Agent`-tool dispatch for every Boardroom seat, department lead, and Management Board
   manager the pipeline activates — never a simulated or hand-written verdict. Dispatch these
   synchronously (not as further background agents) and wait for each result directly before
   continuing — a real dogfood run stalled twice on 2026-07-15 by dispatching a checkpoint's seats
   as background calls and then ending its own turn with a vague "waiting for the results" message
   instead of actually finishing. There is no other process advancing a dogfood run forward; it
   must drive its own dispatches to completion in the same turn.
   **Every dispatch reviewing real code (any checkpoint after Discovery) must include the actual
   on-disk file path(s) being reviewed, not just a pasted diff snippet** — a real 2026-07-21 run
   dispatched a Build-checkpoint re-verification with only an inline diff, and the seat correctly
   searched the only repository it could see (Wingman's own dev repo), found nothing matching, and
   correctly returned `NO_GO` for lack of traceable evidence rather than trusting an unverified
   claim. That's the seat behaving exactly as it should — the gap was the dispatch omitting where
   the code actually lives (a throwaway fixture directory, not Wingman's own repo).
3. Real test-driven implementation during Build: a real failing test, a real fix, a real passing
   test — never write the passing version first.
4. A real `git push` from inside the fixture, through the actual installed hooks
   (`dod-structural-gate.mjs`, `boardroom-checkpoint.mjs`) — never mock the hook's stdin/stdout.

**Allowed shortcuts** (document which ones were taken, never take one silently): research-stage web
lookups may stub if no live lookup is available; a specialist/advisory dispatch may be skipped on
the simple path specifically because no signal would activate it anyway. **Never shortcut**: hook
execution, real `AskUserQuestion` decisions, the TDD red-then-green sequence, the real `git push`.

**Record the structured run output** at `evals/dogfood-runs/<ISO-8601-timestamp>-<path>.json`:

```json
{
  "run_id": "<ISO-8601-timestamp>-<simple|complex>",
  "mode": "maintainer",
  "path": "simple",
  "fixture": "evals/fixtures/setup-dogfood-simple.sh",
  "stages_run": ["discovery", "define", "architecture", "uxflow", "implementation-planning", "build", "ship"],
  "gates_expected_dormant": ["management-board-activation", "dod-structural-gate.mjs threat-register"],
  "gates_expected_active": [],
  "gates_actual_dormant": ["management-board-activation"],
  "gates_actual_active": [],
  "observed_gaps": [
    { "description": "<what didn't match the expected behavior>", "stage": "<which stage surfaced it>", "evidence": "<file path, command output, or exit code that proves it>" }
  ],
  "timestamp": "<ISO-8601>"
}
```

This is what `dogfood-gap-classification` consumes programmatically — it diffs
`gates_expected_*`/`gates_actual_*` and reads `observed_gaps` directly, rather than re-parsing
prose. An empty `observed_gaps` array is a legitimate, healthy outcome — do not manufacture a
finding to avoid an empty array.

**If `observed_gaps` is non-empty**, invoke the `dogfood-gap-classification` skill against each
entry before considering this run complete.

**Always** write a `## Retro:` entry to `docs/wingman/retros.md`, in the existing format, whether
or not a gap was found — a clean run is real signal too, not a no-op.

## Step 2b: Founder mode

If `$ARGUMENTS` names a feature idea, use it. If not, propose a tiny, genuinely low-stakes one (a
single small addition with no real business risk) so the founder can safely see the pipeline work
end to end before trusting it with something that matters.

Run the real 7-stage pipeline against the founder's own actual project — not a synthetic fixture —
exactly like a normal `/wingman:discovery` through `/wingman:ship` sequence, real `AskUserQuestion`
decisions, real Boardroom dispatch, real TDD, a real `git push` on a feature branch. This is
functionally identical to using the pipeline commands directly; the only difference is this command
frames it explicitly as a low-stakes "try it and see" pass and reminds the founder they can discard
the branch afterward with no cost if they were just kicking the tires.

Any friction found here is captured the normal way: `/wingman:learn` for a durable lesson,
`docs/wingman/retros.md` for a fuller retrospective, `/wingman:evolve` if the same friction repeats
2+ times. **Never** invoke `dogfood-gap-classification` in this mode, and never write to
`plugins/wingman/` — that skill and that directory are maintainer-mode-only, by design (see Step 1).

## References

- `skills/governance/dogfood-gap-classification` — maintainer-mode-only; classifies a maintainer-mode gap into
  hook / skill / command-instruction / out-of-scope, and drives the fix through implementation,
  reproduction, eval coverage, and a retro before considering it done.
- `commands/adaptive/harness.md` — audits whether the *existing* test/build harness is honest; this command
  instead *generates and runs* a fixture/feature end to end. Different operations, complementary.
- `commands/adaptive/audit.md` — on-demand deep review of *existing* project state; same distinction as
  above.
- `commands/adaptive/evolve.md` / `skills/governance/evolve-promotion` — founder-project-scoped promotion (never writes
  to `plugins/wingman/`); the mirror image of `dogfood-gap-classification`'s maintainer scope.

<!-- See docs/ARCHITECTURE.md for this command's place in Wingman's overall architecture. -->
