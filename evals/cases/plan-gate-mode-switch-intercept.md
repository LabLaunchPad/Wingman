# Eval: plan-gate-mode-switch-intercept (Gemini CLI adapter)

<!-- eval:no-fixture-needed: constructed inline, mirrors dod-pre-push-check.md's own convention for tiny fixtures -->

Tests `plugins/wingman/references/harness-adapters/gemini-cli/hooks/plan-gate.mjs` — the disclosed
substitute for Claude Code's `ExitPlanMode` + `boardroom-checkpoint.mjs` gate, built for Gemini CLI
because exiting its real Plan mode auto-escalates straight to YOLO mode with no discrete,
interceptable "plan approved" transition event. This is the one genuinely new piece of hook logic
in the Gemini CLI adapter (every other primitive there is a port of an existing Claude Code hook or
a mechanically generated file) — see `gemini-cli/README.md`'s capability-profile table.

Fully deterministic — no model-judgment component — verified by running the real script directly
against a constructed `docs/wingman/plans/*.md` fixture and checking exit codes/output, same method
`dod-pre-push-check.md` already uses for its own git-hook substitute.

## Procedure

1. Build a minimal real directory with `docs/wingman/plans/<name>.md`.
2. Vary the plan file's content across the shapes in the Expectations table below.
3. Run `node plugins/wingman/references/harness-adapters/gemini-cli/hooks/plan-gate.mjs` with
   `process.cwd()` set to the fixture directory — no stdin payload, matching how a Gemini CLI
   `BeforeAgent` command hook is invoked (this hook reads the plan file from disk, not from stdin).
4. Check the exit code and printed message.

## Expectations

| Fixture | Expected exit code | Expected behavior |
|---|---|---|
| No `docs/wingman/plans/` directory at all | `0` | Silent allow — not a Wingman pipeline run, never block |
| Plan file exists, no `## Wingman Boardroom Checkpoint` marker | `0` | Silent allow — Boardroom hasn't run yet; that's an upstream concern for `/wingman:boardroom`, not this hook |
| Marker present, `Bottom line: DO NOT SHIP` | `1` | stderr names the plan file and says it isn't a fully approved "ship it" checkpoint yet |
| Marker present, all required sections, `Founder decision: ship it` | `0` | Silent allow — a genuinely approved checkpoint |
| Marker present, `Founder decision: ship it`, but missing a required section (e.g. `## Risks`) | `1` | stderr fires (gstack's required-sections bar still applies to an otherwise-approved-looking source) |

## Trust level

`verified` — all 5 shapes ran directly against a real constructed fixture and produced the
documented exit code.

## Run log

### Run 1 — 2026-07-27

Built a real scratch directory, ran `plan-gate.mjs` directly (cwd set via a subprocess `cwd` option,
no stdin) against all 5 shapes:

- No `docs/wingman/plans/` directory → exit `0`, no output.
- Plan file with no marker at all → exit `0`, no output (confirmed this hook does not force a
  Boardroom run — only checks an *existing* marked checkpoint's approval state).
- Marker + `Bottom line: DO NOT SHIP` → exit `1`, stderr: "the most recent plan (...) has a
  Boardroom checkpoint marker but it isn't a fully approved \"ship it\" checkpoint yet."
- Marker + all 7 required sections + `Founder decision: ship it` → exit `0`, no output.
- Same as above but with `## Risks` removed → exit `1`, same stderr message (missing-section case
  correctly falls through to the same "not fully approved" branch, since `isApprovedCheckpoint`
  requires all `REQUIRED_PLAN_SECTIONS` present).

All 5 matched exactly. This confirms the coarse per-turn proxy genuinely reuses the same
marker/section/decision-text logic `boardroom-checkpoint.mjs` runs (duplicated, not imported, per
the self-containment convention every harness adapter here follows so it keeps working once copied
out of this repo) rather than a loosely-approximated reimplementation.
