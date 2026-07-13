# Regression Checklist

Wingman's regression defense is a **hybrid**: mechanize what's crisp and deterministic (cheap, run-every-time), and route what's genuinely semantic to the `systematic-auditing` skill (expensive, run-on-meaningful-change). This doc is the single source of truth for both layers, and which checks live where — so nothing silently falls between them the way this project's real bugs once did.

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

## Layer 2 — semantic (run via `/wingman:audit` on meaningful change; not mechanizable without false positives)

These were deliberately *not* mechanized, because a naive keyword check on any of them false-positives often enough to train people to ignore warnings — which is worse than no check (see the `systematic-auditing` skill's own reasoning). Run these as a scoped audit pass instead:

- **Attribution license accuracy** — does each `ATTRIBUTIONS.md` license *claim* match the vendored repo's actual license (a `LICENSE` file, or a `license` field in a manifest)? The one time this mattered, the accurate *correction* text itself contained the words "no license" while explaining the old error — so any keyword heuristic flags its own fix. Human/skill judgment only.
- **Non-shipped-doc runtime dependencies** — does any skill/command *operationally* instruct reading or writing a repo-root `docs/` path (which never ships in `plugins/wingman/`)? Citing a doc for rationale is fine; depending on one at runtime is the bug. Distinguishing the two is semantic.
- **Skill-anatomy adequacy** — the mechanical check confirms the triad's *keywords* exist; whether the Rationalizations/Red-Flags/Verification content is actually *good* (covers the real failure modes) is a judgment call.
- **Plain-language bar** — every founder-facing output clearing `plain-language-checkpoint`'s standard. Inherently semantic.
- **Cross-doc consistency of prose** — `CLAUDE.md` / `ARCHITECTURE.md` / `PROJECT.md` telling the same story about what's built and why (beyond the mechanical command-name check).

## When a Layer-2 bug is found

If an audit finds a semantic regression that turns out to *be* mechanizable without noise, move it up to Layer 1 and delete its Layer-2 entry — that's how the hook-event, orphan, and model-tier checks got here. If it's genuinely un-mechanizable, keep it in Layer 2 and make sure the audit actually runs on the changes that could trigger it.
