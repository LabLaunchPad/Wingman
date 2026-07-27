# Regression Checklist

Wingman's regression defense is a **hybrid**: mechanize what's crisp and deterministic (cheap, run-every-time), and route what's genuinely semantic to the `systematic-auditing` skill (expensive, run-on-meaningful-change). This doc is the single source of truth for both layers, and which checks live where — so nothing silently falls between them the way this project's real bugs once did.

## Layer 0 — runtime pipeline-behavior gaps (found via `/wingman:dogfood`, maintainer mode only)

Layer 1 and Layer 2 both check the plugin's own *files* — frontmatter, orphans, hook-event names, prose consistency. Neither covers a different, upstream question: does the pipeline's actual **runtime behavior**, when it genuinely runs end to end, match what a careful agent would actually do? Two real dogfooding passes (`docs/wingman/retros.md`, 2026-07-14/15) found exactly this class of gap — not a malformed file, but a rule that was *structurally* wrong (a threat-register check that only ever looked in one directory; a complexity threshold that counted departments that are always active regardless of real complexity). Both were only findable by actually running the pipeline, not by reading its files.

**`/wingman:dogfood`** (maintainer mode; see `commands/adaptive/dogfood.md` and `skills/dogfood-gap-classification`) is the mechanism: run the real 7-stage pipeline end to end against a throwaway fixture — a "simple path" (zero conditional signals, proves gates stay dormant) and a "complex path" (deliberate conditional signals, proves gates correctly activate) — and classify anything found into a hook, a skill, a command-instruction addition, or explicitly out-of-scope (generic agent competence Wingman shouldn't re-teach). A found gap lands here first, as a Layer 0 entry, before any fix is proposed.

**Graduation**: once a Layer 0 finding is classified as a hook candidate, implemented, and — critically — has cleared the cooling-off requirement (a second, separate real dogfood run confirming it doesn't over-block; see `dogfood-gap-classification`'s Constraints), it becomes a literal new Layer 1 entry below, following the exact same graduation rule Layer 2 already uses ("When a Layer-2 bug is found" §, unchanged — this is the same rule one tier up). A skill or command-instruction finding doesn't graduate to Layer 1 (it's not mechanically checkable), but still gets logged here and in `docs/PROJECT.md`'s decisions log.

## Layer 1 — mechanical (run on every change, seconds, deterministic)

Two zero-dependency Node scripts. Both must exit 0 (warnings are allowed, errors are not) before any structural change is committed. The plugin's `node --test` suite (currently 85 tests, including the gstack `ExitPlanMode` gate regression) is the third deterministic gate and must also pass.

**`node plugins/wingman/scripts/validate-structure.mjs`** — invariants *inside* the shipped plugin:
- Every command/agent/skill/hook declared in `plugin.json` exists on disk.
- Required frontmatter fields present; agent/skill names globally unique.
- **Orphan detection** — a command/agent/skill built on disk but not declared in `plugin.json` (it would silently never load).
- **Hook event names** — every key in `hooks.json` is a real Claude Code event (the `PermissionRequest` bug that made the safety gate silently inert).
- **Model tier** — `boardroom-engineer`/`boardroom-security` are `model: opus` per `ARCHITECTURE.md` §8.
- **Skill anatomy** (warning) — each skill contains the self-detection triad (Rationalizations / Red Flags / Verification) that makes its own failure modes catchable.

**`node scripts/check-repo-consistency.mjs`** — invariants spanning repo-root files that never ship:
- **Command doc-drift** (warning) — every declared command is named in `CLAUDE.md` (how `launch`/`hotfix` went undocumented).
- **Attribution coverage** (error) — every `vendor/*` repo appears in `ATTRIBUTIONS.md`.

CI's `validate.yml` runs two further Layer-1 checks beyond the two scripts above, both scoped to the harness adapters — a real PR (`#120`, 2026-07-26) hit exactly the gap of this checklist not mentioning the second one, so it's documented here now instead of only in a commit message:
- **`node plugins/wingman/scripts/check-harness-adapter-drift.mjs`** — every harness's Boardroom-seat persona adapters (currently Codex CLI, Gemini CLI) and every harness's ported/translated skills haven't drifted from their canonical `agents/`/`skills/` source.
- **`node plugins/wingman/scripts/generate-harness-adapters.mjs --check`** — a *different* check: confirms every generated harness-adapter file (per-harness command mirrors, the `shared/` skill copy, Codex CLI/OpenHands' commands-as-appendable-file docs, Cursor's `.mdc` skill translation) is byte-current with what `--write` would regenerate right now — run it with no flag (no `--check`/`--write`) to see the current file count without touching anything. Drift-checking and generator-freshness are distinct failure modes — a canonical file can change (content edit) without the drift check catching it if the generator itself was never re-run; `--write` regenerates, `--check` only verifies.

## Layer 2 — semantic (run via `/wingman:audit` on meaningful change; not mechanizable without false positives)

These were deliberately *not* mechanized, because a naive keyword check on any of them false-positives often enough to train people to ignore warnings — which is worse than no check (see the `systematic-auditing` skill's own reasoning). Run these as a scoped audit pass instead:

- **Attribution license accuracy** — does each `ATTRIBUTIONS.md` license *claim* match the vendored repo's actual license (a `LICENSE` file, or a `license` field in a manifest)? The one time this mattered, the accurate *correction* text itself contained the words "no license" while explaining the old error — so any keyword heuristic flags its own fix. Human/skill judgment only.
- **Non-shipped-doc runtime dependencies** — does any skill/command *operationally* instruct reading or writing a repo-root `docs/` path (which never ships in `plugins/wingman/`)? Citing a doc for rationale is fine; depending on one at runtime is the bug. Distinguishing the two is semantic.
- **Skill-anatomy adequacy** — the mechanical check confirms the triad's *keywords* exist; whether the Rationalizations/Red-Flags/Verification content is actually *good* (covers the real failure modes) is a judgment call.
- **Plain-language bar** — every founder-facing output clearing `plain-language-checkpoint`'s standard. Inherently semantic.
- **Cross-doc consistency of prose** — `CLAUDE.md` / `ARCHITECTURE.md` / `PROJECT.md` telling the same story about what's built and why (beyond the mechanical command-name check).

## When a Layer-0 or Layer-2 finding graduates

If an audit finds a semantic regression that turns out to *be* mechanizable without noise, move it up to Layer 1 and delete its Layer-2 entry — that's how the hook-event, orphan, and model-tier checks got here. If it's genuinely un-mechanizable, keep it in Layer 2 and make sure the audit actually runs on the changes that could trigger it. The same rule applies one tier down: a Layer 0 finding that clears `dogfood-gap-classification`'s hook-promotion checklist and cooling-off requirement graduates to a new Layer 1 entry; a Layer 0 finding classified as a skill or command-instruction addition stays a Layer 0/`docs/PROJECT.md` record, since it's not mechanically checkable.
