# Eval: package-manager-selection

Tests `plugins/wingman/skills/package-manager-selection/SKILL.md` — does it correctly default a
genuinely new Node/JS project to a corepack-pinned pnpm, correctly fall back to npm if pnpm/corepack
fails, and — the higher-stakes negative case — correctly leave an *existing* project's package
manager choice completely untouched?

## Fixtures

- `evals/fixtures/setup-new-node-project.sh` — the positive case: a genuinely new Node/JS project
  scaffold with no lock file and no `package.json` `packageManager` field.
- `evals/fixtures/setup-existing-npm-project.sh` — the negative case: a Node/JS project with a
  real, `npm install`-produced `package-lock.json` already committed.

## Expectations

| Check | Expected |
|---|---|
| New project, no lock file | `corepack enable` run, `package.json`'s `packageManager` field set to an exact pinned version (e.g. `pnpm@9.12.1`, never a bare `"pnpm"`), install succeeds |
| pnpm/corepack unavailable or fails | Falls back to npm silently — no error surfaced to the founder, `packageManager` set to a pinned npm version instead |
| Existing lock file present | Skill does not fire at all — the existing lock file and any `packageManager` field are left byte-for-byte unchanged |
| Founder-facing output | Exactly one plain-language sentence, no technical explanation of phantom dependencies or the fallback mechanics |

## Trust level

`provisional` (2026-07-15) — one real run of each of the two differently-shaped scenarios, both
independently verified against the real filesystem, not trusted from self-report alone. Promote to
`verified` after a second, differently-shaped run per scenario (e.g. a genuine pnpm/corepack
failure forcing the npm-fallback path, never yet exercised).

## Run log

### Run 1 — 2026-07-15 (positive + negative, un-briefed)

Two fresh subagents, each given only `SKILL.md` (not this case doc), dispatched in parallel against
independent copies of the two fixtures above.

**Positive case (new project, no lock file)** — PASS. The agent confirmed no lock file/
`packageManager` field, ran `corepack enable` (exit 0), fetched a real pnpm release from the
registry (`corepack pnpm --version` → live download of `pnpm-11.13.0.tgz`, confirming genuine
network access, not a cached/simulated result), pinned `"packageManager": "pnpm@11.13.0"` in
`package.json`, ran `pnpm install` (exit 0, real dependency resolution: `+ kleur 4.1.5`), and
confirmed `node src/index.js` actually printed the greeting. No fallback was triggered (nothing
failed). Independently re-verified myself afterward: `cat package.json` shows the exact pinned
field, `pnpm-lock.yaml` exists, and re-running `node src/index.js` printed the greeting again.
Founder-facing sentence produced exactly per Core Workflow step 3: *"I've set this project up with
pnpm, which is faster and catches a class of dependency bugs npm doesn't — you don't need to do
anything differently, `npm install` still works if you ever prefer it."*

**Negative case (existing `package-lock.json`)** — PASS. The agent correctly stopped at Core
Workflow step 1's very first check (lock file exists → skill does not apply, stop immediately) and
took zero action — no `corepack enable`, no install, no edits. Verification was genuinely
rigorous, not self-reported: SHA-256 checksums of `package.json` and `package-lock.json` taken
before and after were identical (confirmed independently by me afterward — same checksums), and
`git status` stayed clean throughout.

**One honest, non-bug finding** from the negative-case run: `SKILL.md`'s "When To Use" section
phrases its 3-bullet gate as an "all of the following must be true" AND-condition, while Core
Workflow step 1 correctly implements it as a short-circuiting OR-check (a lock file alone is
sufficient to stop, no need to also check `packageManager`). Both converge on the same outcome in
every real case, so this isn't a functional bug — a future wording tightening in "When To Use"
would remove the momentary ambiguity on a literal first read, but nothing was changed as a result
since behavior is already correct.

**One minor observation** from the positive-case run: the skill's suggested way to detect the
version to pin (`corepack pnpm --version`) is not a side-effect-free query in this environment —
running it silently triggers the same real network fetch that `pnpm install` would trigger anyway.
Harmless, and not a reason to change the skill, but worth noting for anyone assuming "checking the
version" and "first network fetch" are two separate events.
