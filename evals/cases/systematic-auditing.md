# Eval: systematic-auditing

Tests `plugins/wingman/skills/discipline/systematic-auditing/SKILL.md` and `plugins/wingman/commands/adaptive/audit.md` behaviorally — the skill was codified directly from this project's own dogfooding (see `docs/PROJECT.md`'s decisions log) but had never itself been tested: does a fresh agent, given only the skill/command and a project it knows nothing about, actually scope an audit into distinct concerns, dispatch scoped checks, independently verify every finding, and fix what's real — or does it just do one generic pass and call it an audit?

## Fixture

`evals/fixtures/setup-audit-fixture.sh <target-dir>` — "Invoicer," a small Node app with 3 deliberately seeded issues, each a **different shape** of problem (mirroring the real categories this project's own audits found), specifically to test whether "scope into distinct concerns" produces genuinely different-shaped checks rather than one lucky broad pass:

1. **Config/wiring**: `package.json`'s `start` script points at `src/server.js`, which doesn't exist (the real file is `src/app.js`) — invisible to `npm test`, which never runs `npm start`. Deliberately mirrors this project's own real `PermissionRequest`-hook-event-name bug.
2. **Doc-drift**: `README.md` claims CSV *or JSON* export; `src/export.js` only implements CSV.
3. **Test-coverage gap**: `src/pricing.js`'s `calculateTax` (with a real edge case — negative amounts should throw) has zero test coverage anywhere. `npm test` passes 100% while this function is completely unverified.

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with the skill + command files and the fixture path, not told what's wrong. Explicitly permitted to attempt real nested subagent dispatch (the skill's own instruction) or fall back to sequential scoped passes if the sandbox doesn't support nesting — and to report honestly which happened, since that's itself informative.
3. Independently verify every claimed finding and fix against the real filesystem/execution — actually run `npm start`, actually re-run `npm test`, actually read the diff — not the subagent's self-report alone.

## Expectations

| Check | Expected |
|---|---|
| Concern scoping | Distinct, non-overlapping concern areas with exact file lists — not one blended "read everything" pass |
| All 3 seeded issues found | Yes, each with real evidence (not assumed) |
| False positives | None, after independent re-verification |
| Fixes | Real, contained findings fixed immediately; anything genuinely a product/business decision (not a pure bug) explicitly deferred rather than fixed unilaterally |
| Re-verification | Every fix confirmed working via a real re-run, not assumed from the diff alone |
| File location | All changes in the fixture only — nothing under `plugins/wingman/` in the Wingman repo |

## Trust level

`verified` — passed Run 1 (a deliberately-flawed project: found all 3 seeded issues plus 2 real bonuses, zero false positives, fixed and verified) and Run 2 (a genuinely clean project: correctly found nothing material, manufactured no findings), each independently checked against the real filesystem — the skill neither over- nor under-triggers. Not yet tested against a large/messy codebase where concern-scoping is a much harder judgment call — a possible third dimension, not required for `verified`.

## Run log

### Run 1 — 2026-07-08

**Result: PASS on every expectation**, independently verified against the real filesystem (not the subagent's self-report). The subagent:
- Scoped the audit into 4 concern areas of its own choosing (runtime/wiring, documentation accuracy, code correctness/security, test/eval coverage) — not forced into a fixed template, matching the skill's own "adapt per project" instruction.
- **Attempted real nested subagent dispatch and it worked** — 4 parallel Task-tool calls from within its own execution, each returning independent findings. This is a notable, useful finding distinct from an established constraint elsewhere in this project's evals: *named custom* `subagent_type`s (`dept-*`, `boardroom-*`) aren't resolvable in this sandbox (no real plugin install exists to register them), but a `general-purpose` agent spawning further `general-purpose` agents apparently works fine. Worth remembering as a more precise statement of the sandbox's actual limits.
- Found all 3 seeded issues, each with real evidence: an actual `npm start` failure (`MODULE_NOT_FOUND`) for the wiring bug, the export module's own code confirming the README claim was stale, and a require-graph check confirming zero tests touch `pricing.js`.
- Found 2 additional genuine issues beyond the seeded 3 — no CSV field escaping (a comma/newline in a field would corrupt row structure) and `calculateTax` returning `NaN` instead of throwing on non-finite input — both independently confirmed via direct `node -e` execution, not assumed.
- Fixed all 5 real, contained issues, and correctly deferred one (CSV formula-injection mitigation for spreadsheet imports) as a genuine product decision rather than fixing it unilaterally.
- Independent re-verification (paste of real output, cross-checked here): `npm start` now genuinely serves (confirmed live via a real HTTP request returning 200), `npm test` went from 2/2 to 11/11 passing, `README.md` now only claims CSV, `src/export.js` has real RFC4180-style field quoting, `src/pricing.js` has real `Number.isFinite` guards. `git status --porcelain` in the Wingman repo confirmed empty.

**One process note, not a defect**: the subagent didn't commit its changes in the fixture (left them as uncommitted working-tree changes). Not required by the task, but worth a light instruction to commit in a future run for tidiness — noted, not treated as a finding against the skill itself.

### Run 2 — 2026-07-08 (negative case: a genuinely clean project)

The complement of Run 1: a small, correct "slugify" project with no seeded issues — correct start script, README matching the code, full test coverage. Fixture: `evals/fixtures/setup-audit-clean-fixture.sh`. Tests the negative failure mode — does the skill *manufacture* low-value findings to look thorough, or correctly conclude "nothing material"?

**Result: PASS**, independently verified. The subagent scoped three concern areas (core logic, executable wiring, docs/consistency), successfully used nested subagent dispatch again, and — actually running `npm test` (4/4), the start script (`your-title-here`, matching the README example), and edge inputs — correctly concluded the project is **materially clean**, manufacturing nothing. It explicitly noted the only observations were non-defects consistent with the documented "a-z0-9 only" contract (`café`→`caf`), and did *not* inflate them into findings. Independently confirmed the fixture was left **unmodified** (nothing to fix) and the Wingman repo was untouched by it. It also correctly identified concurrent edits to *other* eval docs (from this same batch's parallel agents) as out-of-scope and left them alone rather than reverting — good scope discipline. With Run 1 (found all real issues + bonuses, zero false positives) and Run 2 (correctly found nothing on a clean project), the skill is shown not to over- or under-trigger.
