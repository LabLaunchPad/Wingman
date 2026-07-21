# Attributions

Wingman's own code (commands, agents, skills, hooks, scripts, docs) is MIT licensed. Some of it adapts ideas or content from the reference repositories pinned under `vendor/` (see `docs/ARCHITECTURE.md` §9 for the full research writeup behind each). This file is the per-file provenance record.

None of the repositories below are runtime dependencies of the installed Wingman plugin — they are pinned git submodules for reference, design inspiration, and license-compliant attribution only.

## Vendor repository index

| Repo | License | Used for |
|---|---|---|
| `obra/superpowers` | MIT (Jesse Vincent) | `verification-before-completion`, `writing-plans`, `systematic-debugging` |
| `garrytan/gstack` | MIT (Garry Tan) | Boardroom parallel-review concept, `ExitPlanMode` gate pattern — **implemented** in `hooks/boardroom-checkpoint.mjs` as the required-plan-sections "EXIT PLAN MODE GATE" (7 mandatory `##` sections) |
| `jnuyens/gsd-plugin` | MIT | `/wingman:secure` threat-gate pattern, `/wingman:ship` preflight pattern, state-store design reference — **implemented** in `commands/secure.md` as the `CLOSED`/`OPEN` threat register that blocks advancement while `threats_open > 0` |
| `affaan-m/ECC` | MIT (Affaan Mustafa) | `/wingman:evolve` and `/wingman:secure` checklist shape |
| `anthropics/claude-plugins-official` | Apache-2.0 | Immutable-slug convention, LLM-as-gate-reviewer validation |
| `wshobson/agents` | MIT (Seth Hobson) | Doc-index discipline, agent-name-uniqueness convention, severity-tier findings model |
| `davila7/claude-code-templates` | MIT (Daniel Ávila) | Studied as anti-pattern reference; `owasp-security` skill as future `/wingman:secure` content source |
| `VoltAgent/awesome-claude-code-subagents` | MIT | Studied as anti-pattern reference; category-as-plugin packaging idea |
| `Leonxlnx/taste-skill` | MIT | `design-taste` — countable-rule checklist discipline |
| `pbakaus/impeccable` | Apache-2.0 | `design-taste` — slop-vs-quality/accessibility category split |
| `nextlevelbuilder/ui-ux-pro-max-skill` | MIT | `design-taste` — product-type reference table (condensed, not the full CSV database) |
| `DietrichGebert/ponytail` | MIT | `engineering-minimalism` — decision ladder, "when NOT to be lazy" carve-out, intensity levels, one-check rule, `minimal:` comment convention, output rule; `platform-native-reference` — cross-layer native solutions reference; `ponytail-debt-harvesting` — debt ledger, ceiling tracking, harvest protocol; `verification-before-completion` — one-check rule, output rule integration; `/wingman:over-engineering-review` — 5-tag taxonomy; `/wingman:bloat-audit` — whole-repo complexity scan; `/wingman:debt-ledger` — debt status/harvest/add commands |
| `JuliusBrussee/caveman` | MIT | `token-economy` — scoped to internal-only channels |
| `multica-ai/andrej-karpathy-skills` | MIT (declared in `plugin.json`, `README.md`, and the `SKILL.md` frontmatter — no standalone `LICENSE` file, corrected 2026-07-08 from an earlier "no license" claim in this doc) | `engineering-minimalism` — assumption-surfacing, verifiable success criteria |
| `jeffallan/claude-skills` | MIT | The "description trap" finding; two-tier `SKILL.md`/`references/` structure |
| `addyosmani/agent-skills` | MIT (Addy Osmani) | Skill/Persona/Command model, "personas never call personas," parallel-fan-out-then-merge pattern, Rationalizations/Red-Flags/Verification triad |

## Non-vendored attribution (design principle only, not a pinned submodule)

Unlike the repositories above, `github.com/fivetaku/fablize` is not vendored under `vendor/` —
nothing from it is copied, executed, or pinned as a submodule. It was fetched directly (web fetch
of its public `hooks.json`/`router.sh`/`gate_stop.py`/`gate_post_tool.py`) at the user's direct
request to study its hook design and apply a reusable principle to Wingman's own hooks.

| Repo | License | Used for |
|---|---|---|
| `fivetaku/fablize` | Not verified in this pass (fetched web content only, no LICENSE file reviewed) — attribution recorded on a design-principle basis regardless | The wiring/logic separation discipline (harness-specific event wiring kept separate from generic-signal decision logic) — see `plugins/wingman/references/fablize-pattern.md` for the full writeup. Confirmed Wingman's own `hooks/dod-structural-gate.mjs` already follows this discipline; the concrete artifact produced is `plugins/wingman/scripts/dod-pre-push-check.mjs`, a git-`pre-push`-runnable fallback reusing the exact same exported functions. |
| `alirezarezvani/claude-skills` | MIT (Alireza Rezvani) | Declared in `.gitmodules` at one point but never actually pinned as a submodule (corrected 2026-07-18 — see decisions log) — used only as a browsed discovery/design reference for `research`, `memory`, `code-review`, `incident-response`, `accessibility` gaps (G6/G9/G11/G12) |
| `jeremylongshore/claude-code-plugins-plus-skills` | MIT (Jeremy Longshore) | Same correction as above — browsed-only, large plugin/skill catalog used as a coverage-breadth cross-check for the GAPS mining loop |
| `ComposioHQ/awesome-claude-skills` | MIT (Composio) | Same correction as above — browsed-only, curated index used as a discovery source for the curated founder-lens mining loop |
| `avelikiy/great_cto` | MIT (Anton Velikiy) | Same correction as above — browsed-only, CTO-advisory persona model used as design inspiration for `founder-cfo`/`founder-cmo`/`founder-cro` business-advisory skills (G7) |

## Per-file adaptation record

### `plugins/wingman/skills/discipline/verification-before-completion/SKILL.md`
Adapted near-verbatim from `obra/superpowers/skills/discipline/verification-before-completion/SKILL.md` (MIT, Copyright (c) 2025 Jesse Vincent). Change: added a "Why This Matters in Wingman" section; otherwise substantively the same content, since the original is already self-contained and portable.

### `plugins/wingman/skills/discipline/writing-plans/SKILL.md`
Adapted from `obra/superpowers/skills/discipline/writing-plans/SKILL.md` (MIT, Copyright (c) 2025 Jesse Vincent). Changes: references to superpowers' own execution skills (`subagent-driven-development`, `executing-plans`, `using-git-worktrees`), which Wingman doesn't bundle, replaced with `/wingman:build`; plan save path changed to `docs/wingman/plans/`; added the required "Plain-Language Summary" section for Boardroom consumption.

### `plugins/wingman/skills/discipline/systematic-debugging/SKILL.md`
Adapted from `obra/superpowers/skills/discipline/systematic-debugging/SKILL.md` (MIT, Copyright (c) 2025 Jesse Vincent). Changes: removed references to supporting files not bundled with Wingman (`root-cause-tracing.md`, `defense-in-depth.md`, `condition-based-waiting.md`) and to superpowers' own `test-driven-development` skill; generalized "your human partner" to "the founder or reviewer."

### `plugins/wingman/references/spec-handler-pattern.md`
Pattern (not code) adapted from `obra/superpowers`' discipline of separating a *spec* (inputs, invariants, success criteria) from a *handler* (implementation), and validating the spec before executing. Restated in Wingman's own words and mapped to how Wingman commands, TDD, subagent contracts, and Boardroom checkpoints each use a spec/contract form.

### `plugins/wingman/skills/output/design-taste/SKILL.md`
Merged from three sources:
- `Leonxlnx/taste-skill` (MIT, Copyright (c) 2026 Leonxlnx) — the countable/checkable rule discipline and "route to an official design system first" instinct.
- `pbakaus/impeccable` (Apache-2.0) — the slop-vs-quality/accessibility category split, and checking against a project's own established tokens.
- `nextlevelbuilder/ui-ux-pro-max-skill` (MIT, Copyright (c) 2024 Next Level Builder) — the product-type → palette/tone mapping, condensed to a small table rather than the upstream 161/85/74-row CSV database.

Explicitly excluded: `ui-ux-pro-max-skill`'s `banner-design` sub-skill (requires a paid Gemini image-generation API) and `impeccable`'s browser extension / local live-overlay server (real running infrastructure) — neither fits a markdown-only Claude Code plugin.

### `plugins/wingman/skills/discipline/engineering-minimalism/SKILL.md`
Primary source: `DietrichGebert/ponytail` (MIT, Copyright (c) 2026 DietrichGebert) — the decision ladder, "when NOT to be lazy" carve-out, intensity levels (lite/full/ultra), one-check rule, `// minimal:` comment convention, and output rule are drawn directly from that skill's structure. Secondary source: ideas publicly described by Andrej Karpathy and packaged in `multica-ai/andrej-karpathy-skills` (MIT — declared in that repo's `plugin.json`, `README.md`, and `SKILL.md` frontmatter, though it has no standalone `LICENSE` file; an earlier version of this document incorrectly stated it had no license at all). Its content is still not quoted regardless — the assumption-surfacing and verifiable-success-criteria concepts are restated entirely in Wingman's own words, which remains the right approach independent of the license correction.

### `plugins/wingman/skills/knowledge/token-economy/SKILL.md`
Concept adapted (not literal text) from `JuliusBrussee/caveman` (MIT, Copyright (c) 2026 Julius Brussee). Scope deliberately narrowed from upstream: caveman applies terseness broadly across an entire session; this skill applies it only to channels a founder will never read, and explicitly defers to `plain-language-checkpoint` on any conflict.

### `plugins/wingman/hooks/boardroom-checkpoint.mjs`
Pattern (not code) adapted from two sources: `jnuyens/gsd-plugin`'s `secure-phase` gate (blocks phase advancement while `threats_open > 0`) and `garrytan/gstack`'s `plan-ceo-review` "EXIT PLAN MODE GATE" (verifies the plan file ends with a required report section before allowing `ExitPlanMode`). The implementation itself is original.

### `plugins/wingman/commands/adaptive/boardroom.md`
Orchestration pattern adapted from `addyosmani/agent-skills`' `commands/ship.toml` (MIT, Copyright (c) 2025 Addy Osmani): parallel fan-out to independent reviewers in a single turn, followed by a merge step in the *orchestrating command's own context* (never a persona), defaulting to the most severe verdict on any conflict. The multi-perspective-review concept itself traces further back to `garrytan/gstack`'s `plan-ceo-review`/`plan-eng-review`/`plan-design-review`/`plan-devex-review` family.

### `plugins/wingman/scripts/validate-structure.mjs`
Concept adapted from two sources, implementation original: `wshobson/agents`' agent-name-collision checker (`tools/check_agent_name_collisions.py`) and `jeffallan/claude-skills`' `scripts/validate-skills.py` frontmatter/schema validator, including the "description trap" check (trigger conditions belong in the frontmatter `description`, not only in the body).

### `docs/DATABASE.md` and the flat-file state store
Design reference: `jnuyens/gsd-plugin`'s bundled MCP server pattern (`mcp/server.cjs` exposing project state as MCP resources/tools backed by flat files) — studied as the proof that this approach works, but not yet built for Wingman; see that document's "Why no server yet" section for the reasoning.

### `plugins/wingman/skills/governance/department-lead-activation/`
Original to Wingman — no single vendor source. Informed by the general pattern (seen across `gsd-plugin`'s phase-gates and `wshobson/agents`' generated-per-target artifacts) of deriving runtime state from a project's actual signals rather than a fixed manifest, and by `addyosmani/agent-skills`' persona/command orchestration split (department leads are personas; the delegating commands and this skill do the orchestrating).

### `plugins/wingman/skills/governance/evolve-promotion/`
Original to Wingman, extending `department-lead-activation`'s own file-placement precedent (specialist agents go to the founder's `.claude/agents/`, never Wingman's plugin directory) to the specialist-promotion mechanism described in `docs/AGENT-ROSTER.md`. Fixes an inconsistency in the original `evolve.md`/`AGENT-ROSTER.md` text, written before that precedent was established, which had instructed writing promoted specialists into Wingman's own plugin directory.

### `plugins/wingman/skills/mechanics/package-manager-selection/`
Design-adapted (not copied) from `affaan-m/ECC`'s `scripts/lib/package-manager.js` (MIT, Copyright (c) 2026 Affaan Mustafa) — specifically its detection-priority ordering (lock file → `package.json` `packageManager` field → config → default) and its explicit warning against spawning child processes to probe for installed package managers during hot paths (a documented cause of session/hook slowdowns in that repo's own history). Adapted as prose/procedure for a Wingman skill rather than ported as executable code, since Wingman's own scripts stay dependency-free and this decision belongs to founder-generated projects, not Wingman's own repo. Adds a corepack-pinned-version requirement and an automatic-npm-fallback rule not present in the original, per this project's own Boardroom review (`docs/PROJECT.md` decisions log, 2026-07-15).

### `plugins/wingman/scripts/dod-pre-push-check.mjs`
Original to Wingman; the design principle behind why it exists (see above) is reverse-engineered from `fivetaku/fablize`'s hook architecture, not copied from it. Pure reuse of `dod-structural-gate.mjs`'s own already-exported, already-tested functions — no new decision logic.

### `plugins/wingman/commands/adaptive/launch.md`
Original to Wingman. Structurally mirrors `commands/pipeline/ship.md` (preflight/activation → do the work → plain-language report → Boardroom checkpoint → suggest next steps), per the pattern shared across all Wingman pipeline commands.

### `plugins/wingman/commands/adaptive/hotfix.md`
Original to Wingman. Structurally mirrors `commands/secure.md`'s gate pattern (build a picture → gate on disposition → Boardroom checkpoint), and explicitly delegates its root-cause step to the existing `systematic-debugging` skill (from `obra/superpowers`) by phase name rather than re-describing debugging methodology.

### `plugins/wingman/skills/discipline/systematic-auditing/SKILL.md` and `plugins/wingman/commands/adaptive/audit.md`
Original to Wingman, no vendor source — codified directly from this project's own build process after noticing that specific founder phrasing ("audit this," "evidence-driven," "test-driven") reliably triggered a multi-angle-parallel-review pattern that found real bugs a single review pass had repeatedly missed. Named in the same paired-skill style as `systematic-debugging` (from `obra/superpowers`) but shares no text or structure with it beyond that naming convention.

### `plugins/wingman/skills/knowledge/platform-native-reference/SKILL.md`
Adapted from `DietrichGebert/ponytail` (MIT, Copyright (c) 2026 DietrichGebert) — `docs/platform-native.md`. Cross-layer reference mapping "what you think you need" to "what the platform ships" condensed for Wingman's build-time use. Covers HTML elements, CSS capabilities, JS/Browser APIs, Node.js stdlib, Python stdlib, and database features.

### `plugins/wingman/skills/response/ponytail-debt-harvesting/SKILL.md`
Adapted from `DietrichGebert/ponytail` (MIT, Copyright (c) 2026 DietrichGebert) — `skills/ponytail-debt/SKILL.md`. Debt harvesting pattern formalized for Wingman's build-time use: `// minimal:` comment convention, DEBT.md ledger, ceiling tracking, harvest protocol, and debt decay rules.

### `plugins/wingman/skills/discipline/verification-before-completion/SKILL.md`
Enhanced with patterns from `DietrichGebert/ponytail` (MIT): one-check rule, output rule, and deliberate shortcut verification. These additions bridge minimalism and verification: the minimum code that works is unfinished without the minimum check that proves it works.

### `plugins/wingman/commands/adaptive/over-engineering-review.md`
New command implementing the ponytail-review 5-tag taxonomy (`#delete`, `#stdlib`, `#native`, `#yagni`, `#shrink`) from `DietrichGebert/ponytail` (MIT). Focused surgical audit for over-engineering patterns.

### `plugins/wingman/commands/adaptive/bloat-audit.md`
New command implementing the ponytail-audit whole-repo bloat scan pattern from `DietrichGebert/ponytail` (MIT). Ranks files by complexity, identifies simplification opportunities using the 5-tag taxonomy.

### `plugins/wingman/commands/adaptive/debt-ledger.md`
New command implementing the ponytail-debt debt ledger management from `DietrichGebert/ponytail` (MIT). Maintains DEBT.md, scans for `// minimal:` comments, flags ceiling hits, and reports debt trends.

### `plugins/wingman/commands/adaptive/harness.md`
Enhanced with bloat detection and debt ceiling check from `DietrichGebert/ponytail` (MIT). New checks 6-7 scan for files over 200 lines, functions over 50 lines, and `// minimal:` comments that have hit their ceiling.

### `plugins/wingman/skills/mechanics/spec-handler/SKILL.md`
Pattern (not code) adapted from `obra/superpowers`' discipline of separating a *spec* (inputs, invariants, success criteria) from a *handler* (implementation) and validating the spec before executing. Restated in Wingman's own words; pairs with `references/spec-handler-pattern.md`.

### `plugins/wingman/skills/governance/definition-of-done/SKILL.md`
Original to Wingman — codifies the standing cross-skill quality gate previously only described in `references/definition-of-done.md`, promoting it from an unread doc to an enforced skill. Cross-references `spec-handler`, `testing-patterns`, `security-checklist`, and `verification-before-completion`.

### `plugins/wingman/skills/governance/security-checklist/SKILL.md`
Security checklist shape adapted from `affaan-m/ECC` (MIT) and the OWASP/STRIDE canon; the enforced `CLOSED`/`OPEN` disposition model (which this skill drives into `secure.md`) is `jnuyens/gsd-plugin`'s phase-gate pattern. Pairs with `references/security-checklist.md` and `references/threat-register.md`.

### `plugins/wingman/skills/mechanics/testing-patterns/SKILL.md`
Testing discipline adapted from `affaan-m/ECC` (MIT) — AAA structure, boundary mocking, and a meaningful (>=80%) coverage floor. Pairs with `references/testing-patterns.md` and `skills/discipline/test-driven-development`.

### `plugins/wingman/skills/knowledge/doc-index/SKILL.md`
Discipline adapted from `wshobson/agents` (MIT, Seth Hobson) — its "doc-index discipline" (maintain a discoverable index of artifacts so they stay findable and don't rot). Restated in Wingman's own words; the concrete trigger was the v10 finding that all 9 `references/*.md` files were uncited until deliberately wired in. Pairs with `references/` and `/ATTRIBUTIONS.md`.

### `plugins/wingman/skills/knowledge/memory/SKILL.md`
Original to Wingman — fills gap G5 (persistent cross-session context). Inspiration only from the memory/dispatcher pattern in `anthropics/claude-plugins-official` and the broad skill conventions in `alirezarezvani/claude-skills` (MIT) — no upstream text quoted; written in Wingman's own words. Pairs with `references/context-handoffs.md` and `/wingman:learn` (from `obra/superpowers`).

### `plugins/wingman/skills/knowledge/research/SKILL.md` and `plugins/wingman/commands/adaptive/research.md`
Original to Wingman — fills gap G6 (deep, source-grounded founder research). Design reference from the deep-research pattern in `alirezarezvani/claude-skills` (MIT) and `ComposioHQ/awesome-claude-skills` (MIT, discovery). No upstream text quoted; the methodology is restated in Wingman's own words and wired to the Boardroom checkpoint convention.

### `plugins/wingman/skills/personas/founder-cfo/SKILL.md`, `plugins/wingman/skills/personas/founder-cmo/SKILL.md`, `plugins/wingman/skills/personas/founder-cro/SKILL.md`, `plugins/wingman/commands/adaptive/advisory.md`
Original to Wingman — fill gap G7 (Business Advisory for non-technical founders). Persona/model inspiration from `avelikiy/great_cto` (MIT, CTO-advisory persona) and the persona/command split in `addyosmani/agent-skills` (MIT). Three C-level lenses (finance, marketing, revenue) each render plain-language verdicts only, never code, consistent with the Boardroom seats' "verdict, not code" bar. Dispatched in parallel by `commands/adaptive/advisory.md`.

### `plugins/wingman/hooks/secret-guard.mjs`
Original to Wingman — fills gap G1 (secret-exposure + destructive-command guard). Closes the `PreToolUse` coverage gap surfaced in the gap analysis (only `ExitPlanMode` had a PreToolUse guard). Scans `Bash`/`Write`/`Edit` inputs for destructive patterns and high-entropy secrets; denies with founder-friendly guidance. Pairs with `commands/secure.md`'s threat register.

### `plugins/wingman/hooks/stop-loop.mjs`
Original to Wingman — fills gap G2 (autonomous loop guard). Implements the "ralph-loop" Stop-hook pattern (seen in `anthropics/claude-plugins-official` and the broader Stop-hook convention), gated behind an explicit `.wingman/loop.json` opt-in so it never forces looping by default. Pure `evaluate()` logic is unit-tested.

### `plugins/wingman/hooks/prompt-guard.mjs`
Original to Wingman — fills gap G3 (prompt-injection defense at the prompt boundary). `UserPromptSubmit` hook that flags classic injection patterns (instruction-override, exfiltration, system-prompt reveal). Denies high-risk prompts with plain-language guidance. Pure `evaluate()` logic is unit-tested.
