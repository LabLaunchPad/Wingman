# Learnings

Durable, reusable facts captured during Wingman work. Append-only; prune stale entries during a later `/wingman:evolve` pass.

<!-- wingman:log type=learning category=environment status=active -->
### 2026-07-13 — vendor submodules are empty on disk
Wingman's `vendor/` submodules are pinned (MIT references) but not checked out in this environment. Treat vendor integration as design/knowledge reference, never as runtime — don't try to execute or read their source locally.

<!-- wingman:log type=learning category=environment status=active -->
### 2026-07-13 — Windows PowerShell lacks /bin/bash
`check-fixtures.mjs` and the behavioral eval grading run `.sh` fixtures via `bash`, which doesn't exist on Windows. A local `check-fixtures` failure is an environment limitation, not a code defect; the deterministic gate only runs on the ubuntu CI runner. Behavioral grading (`ANTHROPIC_API_KEY` + bash) is likewise CI-only.

<!-- wingman:log type=learning category=tooling status=active -->
### 2026-07-13 — skill-anatomy standard is enforced by validate-structure
`plugins/wingman/scripts/validate-structure.mjs` requires each skill's `description` to contain a `Use when…` trigger clause and the body to contain a `## Verification` section. Missing either emits a warning (not a hard exit failure). The trigger clause also avoids the "description trap" where auto-routing misclassifies the skill.

<!-- wingman:log type=learning category=process status=active -->
### 2026-07-13 — stale PROJECT.md violates the project's own living-doc rule
The plugin's docs say "stale status is worse than no status doc." Keep `docs/PROJECT.md` and `docs/ARCHITECTURE.md` in sync after every version bump; log maintenance passes (e.g. v12) so the founder can see what changed without reading diffs.

<!-- wingman:log type=learning category=security status=active -->
### 2026-07-13 — secure passes clean on a markdown-only plugin
Because Wingman has no runtime, secrets, auth, or datastore, a `/wingman:secure` pass legitimately returns `threats_open = 0`. That is not the "zero risks because I didn't look" red flag — document the concrete STRIDE/OWASP/prompt-injection hunt in a threat register so the pass is evidence-based.

<!-- wingman:log type=learning category=hooks status=resolved occurrence=1 -->
### 2026-07-13 — audit caught a workflow-breaking hook over-block that 84 green tests missed
The gstack EXIT PLAN MODE GATE in `boardroom-checkpoint.mjs` originally validated required plan sections against **every** source, including the inline `ExitPlanMode` `plan` text (a short summary that never has the 7 `##` sections). That denied **every** legitimate ExitPlanMode — a silent, total workflow break. The node test suite stayed green because its fixtures put sections in the inline text too. A `/wingman:audit` multi-angle pass (executable-code concern, verified by actually running the hook with an approved plan *file* + short inline text) caught it. Lesson: a single test-suite pass is not evidence about wiring/config correctness; scope audits into distinct concerns and verify findings against real execution. Fix: a source is an approved checkpoint only if it has the marker AND all sections; sources are judged independently, so a source without the marker is "not approved," never "missing sections."

<!-- wingman:log type=learning category=pipeline status=resolved occurrence=2 -->
### 2026-07-13 — pipeline stages must create the feature branch before the first commit, not after
Found via two independent occurrences (full-pipeline-e2e Run 2, and a later sandboxed-simulation pipeline run against a browser-extension fixture): `plan.md`/`build.md`/`secure.md` had no step that creates or checks out a feature branch, so `ship.md`'s preflight check 3 ("on a feature branch") only ever caught this after 3 stages' worth of commits had already landed on the default branch — "offer to create one now" at that point is cosmetic unless the default branch is also rewound. Fixed by moving branch creation into `build.md`'s "Before starting" step, before the first commit; `ship.md`'s check is now a confirmation, not the first line of defense.

<!-- wingman:log type=learning category=pipeline status=resolved occurrence=3 -->
### 2026-07-21 — the "check branch before committing" lesson recurs outside the founder pipeline too
A third occurrence of the same underlying class as the 2026-07-13 entry above (`occurrence=2`, "pipeline stages must create the feature branch before the first commit, not after") — but this time in the dev-repo's own session workflow, not a founder pipeline command: a commit landed directly on local `main` mid-session (caught before pushing, since `main`'s branch protection blocks direct pushes regardless — recovered by branching off the stray commit and hard-resetting local `main` back to `origin/main`). `skills/mechanics/git-pr-workflow` had no equivalent "confirm you're not on main" step, unlike the founder-pipeline fix already in place. Fixed: added an explicit Step 0 to that skill (check `git branch --show-current` before the first edit or commit of a new round of work, not after) plus a Red Flag row, mirroring the founder-facing fix's own "check before, not after" shape. Same round also documented a second, distinct recurring pattern in the same skill: a PR merge failing with "required status checks are expected" because the base advanced while the PR was pending (hit repeatedly across this project's real merge history, one PR needing the fix re-applied 4+ times) — the fix (update the branch, then wait for checks to actually re-run before retrying) is now Step 5, previously undocumented anywhere.
