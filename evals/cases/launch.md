# Eval: launch

Tests `plugins/wingman/commands/adaptive/launch.md` behaviorally — does it correctly self-activate `dept-growth` (the one department whose signal is "this command was invoked at all," not something inferred from the codebase), draft only the launch materials the feature actually needs (no invented pricing/billing scope), and gate them through `/wingman:boardroom`'s "content passed directly" review path — the one boardroom scope type nothing else in this eval suite exercises, since every other case reviews a plan file or a diff.

## Fixture

`evals/fixtures/setup-launch-fixture.sh <target-dir>` — "Reminders," a tiny app with a feature that's already shipped (recurring daily/weekly reminders), `.wingman/checkpoints.jsonl` pre-seeded with real `plan` and `ship` entries, `dept-product` already active. `dept-growth` doesn't exist yet.

**Founder request fed to the agent:** "Announce that reminders can now repeat daily or weekly."

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with `launch.md`, `department-lead-activation`, `boardroom.md`, and the 5 personas, plus the fixture and the request.
3. Independently verify: does `dept-growth` get created correctly, is the drafted content actually scoped to the request, does the checkpoint reflect the directly-passed-content review path correctly, and does the department-lead merge preserve `dept-product` (the same state-persistence check used throughout this eval suite).

## Expectations

| Check | Expected |
|---|---|
| `dept-growth` created | Yes, unconditionally — this command's own invocation *is* its activation signal |
| `dept-product` preserved | `active_department_leads` in `state.json` contains both `dept-product` and `dept-growth` after the merge — not overwritten |
| Drafted scope | A changelog entry and announcement copy (short + long); a docs update only if genuinely needed (this fixture's README already covers it, so correctly skippable); no pricing/billing content anywhere, since none exists in this app and the request doesn't call for it |
| Checkpoint scope | Reviews the drafted content directly (`boardroom.md`'s "content passed directly" path), not a diff or plan file |
| Checkpoint mandatory | Recorded even though this is a "small" launch — `launch.md` explicitly makes this unconditional, unlike `ship.md` |
| `stage` / `next_stage` | `stage: "launch"`; `next_stage` reflects a genuinely post-launch state |
| File location | Everything under the fixture's own `.claude/`/`.wingman/` — nothing under `plugins/wingman/` |

## Trust level

`verified` — passed Run 1 (all-`GO`, docs correctly skipped because the README already covered the feature) and Run 2 (docs-update correctly produced for a feature that genuinely needs it), each independently verified against the real filesystem, showing the docs-update decision is a real judgment call in both directions. Not yet tested against a genuine non-`GO` launch outcome (e.g. overselling copy the Boardroom rejects) — a possible third dimension, not required for `verified`. (Full Run 2 detail below.)

## Run log

### Run 1 — 2026-07-07

**Result: PASS on every expectation**, independently verified against the real filesystem. The subagent:
- Created `dept-growth.md` with zero placeholders, correctly treating the command's own invocation as the activation signal rather than looking for a codebase signal that wouldn't exist for this department.
- Merged `state.json` correctly: `active_department_leads` ended up `["dept-product", "dept-growth"]` — confirmed the pre-existing `dept-product` entry survived the write, the same merge-preservation check used elsewhere in this suite.
- Drafted a `CHANGELOG.md` entry and a separate announcement file (short + long copy), correctly judged that no further docs update was needed since the README already covered the feature, and drafted zero pricing/billing content — confirmed via a direct grep across all drafted files finding no matches except the department-lead file's own constraint text *against* drafting such copy.
- Recorded the checkpoint with `stage: "launch"`, all 5 seats `GO`, reviewing the drafted content directly rather than a diff or plan path.
- Made no writes under the Wingman repo's own `plugins/wingman/` — confirmed via `git status --porcelain`.

**Real finding surfaced and fixed**: `boardroom.md`'s checkpoint schema only documented `scope_ref` as a plan-file path or `"diff"`, leaving undefined what to record when content was passed directly (exactly launch.md's path). The subagent improvised a reasonable free-text description (`"content passed directly: CHANGELOG.md [0.2.0] entry + announcements/... (short + long copy)"`); `boardroom.md` now documents this pattern explicitly as the convention, rather than leaving each future caller to improvise its own format.

### Run 2 — 2026-07-08 (docs-update path: a feature that genuinely needs docs)

The complement of Run 1, which correctly *skipped* a docs update because the README already covered the feature. Here the shipped feature (a `search()` with five non-obvious options — filters, sort, pagination, fields) is genuinely unusable without documentation, and the README does not yet cover it. Fixture: `evals/fixtures/setup-launch-docs-fixture.sh`. Tests that `launch.md`'s "draft a docs update *only if* this feature needs user-facing documentation to be usable" is a real judgment call, not a reflexive skip.

**Result: PASS**, independently verified. The subagent produced an **actual README docs update** — a `## Advanced search options` table documenting all five options with types, defaults, and plain-language effects, plus a usage block and worked examples — verified against `src/search.js` (all five option keys and defaults match). It correctly did *not* default past the docs step. `dept-growth` was created and merged into `state.json` preserving `dept-product` (both present, independently confirmed), the mandatory Boardroom checkpoint ran on the directly-passed content and came back `GO` (the design seat's ship-stage `GO_WITH_CONCERNS` about undocumented options is now resolved), and no pricing/billing scope was invented (grep confirmed). With Run 1 (docs correctly skipped) and Run 2 (docs correctly written), the docs-update decision is shown to be a genuine judgment call in both directions.
