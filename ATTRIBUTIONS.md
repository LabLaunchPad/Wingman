# Attributions

Wingman's own code (commands, agents, skills, hooks, scripts, docs) is MIT licensed. Some of it adapts ideas or content from the reference repositories pinned under `vendor/` (see `docs/ARCHITECTURE.md` §9 for the full research writeup behind each). This file is the per-file provenance record.

None of the repositories below are runtime dependencies of the installed Wingman plugin — they are pinned git submodules for reference, design inspiration, and license-compliant attribution only.

## Vendor repository index

| Repo | License | Used for |
|---|---|---|
| `obra/superpowers` | MIT (Jesse Vincent) | `verification-before-completion`, `writing-plans`, `systematic-debugging` |
| `garrytan/gstack` | MIT (Garry Tan) | Boardroom parallel-review concept, `ExitPlanMode` gate pattern |
| `jnuyens/gsd-plugin` | MIT | `/wingman:secure` threat-gate pattern, `/wingman:ship` preflight pattern, state-store design reference |
| `affaan-m/ECC` | MIT (Affaan Mustafa) | `/wingman:evolve` and `/wingman:secure` checklist shape |
| `anthropics/claude-plugins-official` | Apache-2.0 | Immutable-slug convention, LLM-as-gate-reviewer validation |
| `wshobson/agents` | MIT (Seth Hobson) | Doc-index discipline, agent-name-uniqueness convention, severity-tier findings model |
| `davila7/claude-code-templates` | MIT (Daniel Ávila) | Studied as anti-pattern reference; `owasp-security` skill as future `/wingman:secure` content source |
| `VoltAgent/awesome-claude-code-subagents` | MIT | Studied as anti-pattern reference; category-as-plugin packaging idea |
| `Leonxlnx/taste-skill` | MIT | `design-taste` — countable-rule checklist discipline |
| `pbakaus/impeccable` | Apache-2.0 | `design-taste` — slop-vs-quality/accessibility category split |
| `nextlevelbuilder/ui-ux-pro-max-skill` | MIT | `design-taste` — product-type reference table (condensed, not the full CSV database) |
| `DietrichGebert/ponytail` | MIT | `engineering-minimalism` — decision ladder, "when NOT to be lazy" carve-out |
| `JuliusBrussee/caveman` | MIT | `token-economy` — scoped to internal-only channels |
| `multica-ai/andrej-karpathy-skills` | **No LICENSE file** — ideas restated in Wingman's own words only, never quoted | `engineering-minimalism` — assumption-surfacing, verifiable success criteria |
| `jeffallan/claude-skills` | MIT | The "description trap" finding; two-tier `SKILL.md`/`references/` structure |
| `addyosmani/agent-skills` | MIT (Addy Osmani) | Skill/Persona/Command model, "personas never call personas," parallel-fan-out-then-merge pattern, Rationalizations/Red-Flags/Verification triad |

## Per-file adaptation record

### `plugins/wingman/skills/verification-before-completion/SKILL.md`
Adapted near-verbatim from `obra/superpowers/skills/verification-before-completion/SKILL.md` (MIT, Copyright (c) 2025 Jesse Vincent). Change: added a "Why This Matters in Wingman" section; otherwise substantively the same content, since the original is already self-contained and portable.

### `plugins/wingman/skills/writing-plans/SKILL.md`
Adapted from `obra/superpowers/skills/writing-plans/SKILL.md` (MIT, Copyright (c) 2025 Jesse Vincent). Changes: references to superpowers' own execution skills (`subagent-driven-development`, `executing-plans`, `using-git-worktrees`), which Wingman doesn't bundle, replaced with `/wingman:build`; plan save path changed to `docs/wingman/plans/`; added the required "Plain-Language Summary" section for Boardroom consumption.

### `plugins/wingman/skills/systematic-debugging/SKILL.md`
Adapted from `obra/superpowers/skills/systematic-debugging/SKILL.md` (MIT, Copyright (c) 2025 Jesse Vincent). Changes: removed references to supporting files not bundled with Wingman (`root-cause-tracing.md`, `defense-in-depth.md`, `condition-based-waiting.md`) and to superpowers' own `test-driven-development` skill; generalized "your human partner" to "the founder or reviewer."

### `plugins/wingman/skills/design-taste/SKILL.md`
Merged from three sources:
- `Leonxlnx/taste-skill` (MIT, Copyright (c) 2026 Leonxlnx) — the countable/checkable rule discipline and "route to an official design system first" instinct.
- `pbakaus/impeccable` (Apache-2.0) — the slop-vs-quality/accessibility category split, and checking against a project's own established tokens.
- `nextlevelbuilder/ui-ux-pro-max-skill` (MIT, Copyright (c) 2024 Next Level Builder) — the product-type → palette/tone mapping, condensed to a small table rather than the upstream 161/85/74-row CSV database.

Explicitly excluded: `ui-ux-pro-max-skill`'s `banner-design` sub-skill (requires a paid Gemini image-generation API) and `impeccable`'s browser extension / local live-overlay server (real running infrastructure) — neither fits a markdown-only Claude Code plugin.

### `plugins/wingman/skills/engineering-minimalism/SKILL.md`
Primary source: `DietrichGebert/ponytail` (MIT, Copyright (c) 2026 DietrichGebert) — the decision ladder and "when NOT to be lazy" carve-out are drawn directly from that skill's structure. Secondary source: ideas publicly described by Andrej Karpathy and packaged in `multica-ai/andrej-karpathy-skills`. That repository has **no LICENSE file** — its content is not quoted; the assumption-surfacing and verifiable-success-criteria concepts are restated entirely in Wingman's own words.

### `plugins/wingman/skills/token-economy/SKILL.md`
Concept adapted (not literal text) from `JuliusBrussee/caveman` (MIT, Copyright (c) 2026 Julius Brussee). Scope deliberately narrowed from upstream: caveman applies terseness broadly across an entire session; this skill applies it only to channels a founder will never read, and explicitly defers to `plain-language-checkpoint` on any conflict.

### `plugins/wingman/hooks/boardroom-checkpoint.mjs`
Pattern (not code) adapted from two sources: `jnuyens/gsd-plugin`'s `secure-phase` gate (blocks phase advancement while `threats_open > 0`) and `garrytan/gstack`'s `plan-ceo-review` "EXIT PLAN MODE GATE" (verifies the plan file ends with a required report section before allowing `ExitPlanMode`). The implementation itself is original.

### `plugins/wingman/commands/boardroom.md`
Orchestration pattern adapted from `addyosmani/agent-skills`' `commands/ship.toml` (MIT, Copyright (c) 2025 Addy Osmani): parallel fan-out to independent reviewers in a single turn, followed by a merge step in the *orchestrating command's own context* (never a persona), defaulting to the most severe verdict on any conflict. The multi-perspective-review concept itself traces further back to `garrytan/gstack`'s `plan-ceo-review`/`plan-eng-review`/`plan-design-review`/`plan-devex-review` family.

### `plugins/wingman/scripts/validate-structure.mjs`
Concept adapted from two sources, implementation original: `wshobson/agents`' agent-name-collision checker (`tools/check_agent_name_collisions.py`) and `jeffallan/claude-skills`' `scripts/validate-skills.py` frontmatter/schema validator, including the "description trap" check (trigger conditions belong in the frontmatter `description`, not only in the body).

### `docs/DATABASE.md` and the flat-file state store
Design reference: `jnuyens/gsd-plugin`'s bundled MCP server pattern (`mcp/server.cjs` exposing project state as MCP resources/tools backed by flat files) — studied as the proof that this approach works, but not yet built for Wingman; see that document's "Why no server yet" section for the reasoning.
