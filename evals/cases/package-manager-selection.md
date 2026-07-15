<!-- eval:no-fixture-needed: pending first run and creation of new-node-project-setup.sh and existing-npm-project-setup.sh fixtures on disk, currently verified via unit tests -->

# Eval: package-manager-selection

Tests `plugins/wingman/skills/package-manager-selection/SKILL.md` — does it correctly default a
genuinely new Node/JS project to a corepack-pinned pnpm, correctly fall back to npm if pnpm/corepack
fails, and — the higher-stakes negative case — correctly leave an *existing* project's package
manager choice completely untouched?

## What's needed

Two differently-shaped fixtures:
- `new-node-project-setup.sh` (pending creation) — a genuinely new Node/JS project scaffold with no lock file and no `package.json` `packageManager`
  field — the positive case (should default to a corepack-pinned pnpm).
- `existing-npm-project-setup.sh` (pending creation) — a Node/JS project that already has an existing lock file (e.g. a committed `package-lock.json`
  from a prior npm install) — the negative case (this skill must not touch it at all).

## Expectations

| Check | Expected |
|---|---|
| New project, no lock file | `corepack enable` run, `package.json`'s `packageManager` field set to an exact pinned version (e.g. `pnpm@9.12.1`, never a bare `"pnpm"`), install succeeds |
| pnpm/corepack unavailable or fails | Falls back to npm silently — no error surfaced to the founder, `packageManager` set to a pinned npm version instead |
| Existing lock file present | Skill does not fire at all — the existing lock file and any `packageManager` field are left byte-for-byte unchanged |
| Founder-facing output | Exactly one plain-language sentence, no technical explanation of phantom dependencies or the fallback mechanics |

## Trust level

`authored, pending first run` — this skill was written and reviewed against a real 7-seat
Boardroom dispatch (see `docs/PROJECT.md`'s decisions log, 2026-07-15) that named the 3 specific
gaps it closes (corepack pinning, npm fallback, reuse of `vendor/ecc`'s detection pattern — see
`ATTRIBUTIONS.md`), but has not yet been exercised by a fresh subagent against a real fixture. The
negative case (an existing lock file being left untouched) is the higher-stakes scenario to verify
first, since silently overriding a founder's existing choice would be a real regression, not a
missed opportunity.
