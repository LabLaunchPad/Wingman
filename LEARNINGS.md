# Learnings

Durable, reusable facts captured during Wingman work. Append-only; prune stale entries during a later `/wingman:evolve` pass.

### 2026-07-13 — vendor submodules are empty on disk
Wingman's `vendor/` submodules are pinned (MIT references) but not checked out in this environment. Treat vendor integration as design/knowledge reference, never as runtime — don't try to execute or read their source locally.

### 2026-07-13 — Windows PowerShell lacks /bin/bash
`check-fixtures.mjs` and the behavioral eval grading run `.sh` fixtures via `bash`, which doesn't exist on Windows. A local `check-fixtures` failure is an environment limitation, not a code defect; the deterministic gate only runs on the ubuntu CI runner. Behavioral grading (`ANTHROPIC_API_KEY` + bash) is likewise CI-only.

### 2026-07-13 — skill-anatomy standard is enforced by validate-structure
`plugins/wingman/scripts/validate-structure.mjs` requires each skill's `description` to contain a `Use when…` trigger clause and the body to contain a `## Verification` section. Missing either emits a warning (not a hard exit failure). The trigger clause also avoids the "description trap" where auto-routing misclassifies the skill.

### 2026-07-13 — stale PROJECT.md violates the project's own living-doc rule
The plugin's docs say "stale status is worse than no status doc." Keep `docs/PROJECT.md` and `docs/ARCHITECTURE.md` in sync after every version bump; log maintenance passes (e.g. v12) so the founder can see what changed without reading diffs.

### 2026-07-13 — secure passes clean on a markdown-only plugin
Because Wingman has no runtime, secrets, auth, or datastore, a `/wingman:secure` pass legitimately returns `threats_open = 0`. That is not the "zero risks because I didn't look" red flag — document the concrete STRIDE/OWASP/prompt-injection hunt in a threat register so the pass is evidence-based.

### 2026-07-13 — audit caught a workflow-breaking hook over-block that 84 green tests missed
The gstack EXIT PLAN MODE GATE in `boardroom-checkpoint.mjs` originally validated required plan sections against **every** source, including the inline `ExitPlanMode` `plan` text (a short summary that never has the 7 `##` sections). That denied **every** legitimate ExitPlanMode — a silent, total workflow break. The node test suite stayed green because its fixtures put sections in the inline text too. A `/wingman:audit` multi-angle pass (executable-code concern, verified by actually running the hook with an approved plan *file* + short inline text) caught it. Lesson: a single test-suite pass is not evidence about wiring/config correctness; scope audits into distinct concerns and verify findings against real execution. Fix: a source is an approved checkpoint only if it has the marker AND all sections; sources are judged independently, so a source without the marker is "not approved," never "missing sections."
