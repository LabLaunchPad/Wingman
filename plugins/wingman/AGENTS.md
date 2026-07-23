# AGENTS.md — plugins/wingman/

Nested per the monorepo "nearest wins" convention: an agent working directly inside this directory
gets this file's content in preference to the repo-root `AGENTS.md` (which stays the single source
for cross-repo navigation — its Repository map, skill/command category table, and Portability
section are not restated here). This file is package-scoped: the conventions specific to authoring
*inside* `plugins/wingman/`, the directory that actually ships when a founder installs the plugin.

## Immutable identity

- A command's identity is its filename (minus `.md`); a skill's identity is its `name:` frontmatter
  field; an agent's identity is its `name:` frontmatter field. None of these are ever renamed once
  shipped — a rename breaks any `/wingman:<command>` invocation or cross-reference already in a
  founder's own project files (`.wingman/checkpoints.jsonl`, `docs/wingman/*`). If a name is
  genuinely wrong, add a new file/entry and deprecate the old one; don't rename in place.
- `scripts/validate-structure.mjs` enforces frontmatter shape and cross-reference integrity — it is
  the mechanical backstop for this rule, not the rule itself.

## Frontmatter schema per file type

- **Commands** (`commands/{pipeline,adaptive}/*.md`): no required frontmatter — identity is the
  filename. Content is plain instructions to whichever agent is executing `/wingman:<name>`.
- **Agents** (`agents/boardroom-*.md`): YAML frontmatter with `name`, `description` (must include
  "Use when..." framing per this project's own description-quality convention),
  `tools` (comma-separated Claude Code tool names), `model` (`inherit` or a tier name — never a
  pinned model *version*), `permissions`. Body ends with a mandated `## <SEAT> VERDICT: <GO |
  GO_WITH_CONCERNS | NO_GO>` block — see any existing `agents/boardroom-*.md` for the exact shape.
- **Skills** (`skills/<name>/SKILL.md` — flat, no category subdirectory as of 2026-07-23, see
  `docs/ARCHITECTURE.md` §8b): YAML frontmatter with `name`, `description` ("Use when..." framing,
  same convention as agents). Discipline-category skills (see root `AGENTS.md`'s conceptual
  category table) additionally carry a Constraints/Rationalizations/Red-Flags/Verification
  structure (e.g. `skills/engineering-minimalism/SKILL.md`) — this is the bar every skill should
  meet, not just that conceptual category.

## Before making a structural change (new command, agent, skill, or department)

Read `docs/ARCHITECTURE.md` first (repo root, does not ship — see "docs/ isn't installed" below).
Then run these four validators — all must exit 0:
- `node scripts/validate-structure.mjs` (run from `plugins/wingman/`, or
  `node plugins/wingman/scripts/validate-structure.mjs` from repo root)
- `node ../../scripts/check-repo-consistency.mjs` (repo root, dev-only)
- `node ../../scripts/check-fixtures.mjs` (repo root, dev-only)
- `node scripts/check-traceability.mjs`

## The one thing to never get wrong: `docs/` does not ship

Nothing under this directory (`plugins/wingman/`) may cite a `docs/` path for *operational* logic —
a skill or agent that reads `docs/ARCHITECTURE.md` at runtime to know what to do will silently fail
in a founder's own installed project, where no such file exists. This exact bug class has recurred
more than once (see `LEARNINGS.md`'s occurrence-tracking entries for it) — if a template or skill
needs the *content* of a `docs/` file, inline that content instead of pointing at the path.

## Cross-harness adapters

`references/harness-adapters/` holds Codex CLI and OpenCode translations of the Boardroom seats and
the git-push safety gate, honestly labeled by verification status (most are `authored, unverified`
— no live install of either harness exists in this dev repo). See that directory's own `README.md`
before extending it, and `docs/ARCHITECTURE.md` §8a/§8b (repo root) for the full portability
accounting this content is scoped against.

## Founder-org reference template

`references/org-template/` holds static reference content for context a founder builds up across
projects (a project-type catalog + 7 playbooks, plus `founder-preferences.md`/`capability-map.md`
guidance) — cited from `commands/pipeline/discovery.md` and `skills/knowledge/memory`. Deliberately
scoped down from a much larger founder-org-scaffold proposal; see that directory's own `README.md`
and `docs/PROJECT.md`'s decisions log (2026-07-22) for what was excluded and why.
