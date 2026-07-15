# Enhancement review: structured/AI-native logging layer + pnpm-for-generated-projects decision

This is a maintainer-side review package for Wingman's own Boardroom (the same 7-seat mechanism
that reviews founder-project checkpoints), covering two related changes to Wingman's own
self-improvement mechanisms — not a founder-facing feature. Dispatched for a real, independent
7-seat verdict per the founder's explicit request to have the Boardroom decide while being
observed, followed by an independent final check.

## What changed (already implemented, not proposed)

Wingman's own `LEARNINGS.md`, `docs/wingman/retros.md`, `docs/PROJECT.md`'s decisions log, and
`docs/HUMAN-TODOS.md` were pure prose — genuinely rich narrative, but zero machine-parseable
fields. `scripts/wingman-health.mjs` already had to resort to fragile regex-over-prose to extract
anything structured (e.g. counting `- **` bullets as a decision-count proxy). This is now fixed,
additively:

1. **A new marker convention**: `<!-- wingman:log type=learning|retro|decision|todo
   category=<free-text> status=<open|active|resolved|superseded> occurrence=<N> -->` — an HTML
   comment placed directly above each entry, invisible when rendered, reusing the exact pattern
   already proven for `check-traceability.mjs`'s `wingman:req` markers rather than inventing a
   second mechanism. Fields are an open vocabulary (only `type` is fixed to 4 values) — this is
   deliberately *not* a rigid schema forced onto everything.
2. **Backfilled onto every existing entry** — 7 in `LEARNINGS.md`, 3 in `docs/wingman/retros.md`,
   34 in `docs/PROJECT.md`'s decisions log, 26 in `docs/HUMAN-TODOS.md` (70 total). Purely
   additive — no prose was edited, reworded, or reordered.
3. **A new parser**, `scripts/parse-wingman-logs.mjs` — read-only, no network, reads all four
   files' markers plus `docs/wingman/GAPS.md`'s existing table (already well-structured, no
   change needed there), emits one JSON view. Exports `recurringCategories()` for mechanical
   2+-occurrence counting.
4. **Wired in**: `scripts/wingman-health.mjs` now reports real structural-log coverage (100%,
   verified) instead of a prose regex; `scripts/check-repo-consistency.mjs` gained a new check
   that fires if a future entry is appended without a marker (verified: passes clean at 70/70,
   and genuinely fires — tested by deliberately removing one marker and confirming the warning,
   then restoring); `commands/learn.md` and `commands/retro.md` now instruct writing the marker on
   every *new* founder-project entry going forward; `evolve-promotion`'s gather step now reads the
   marker where present for exact occurrence-counting, falling back to free-text clustering
   exactly as before when absent (no behavior change for older/founder projects that predate this
   convention); `dogfood-gap-classification` (maintainer-mode-only) safely invokes the parser
   script directly, since that skill only ever runs against Wingman's own dev-repo checkout where
   the script physically exists — deliberately *not* wired into `evolve-promotion` that way, since
   that skill ships to founder installs where a repo-root `scripts/` file never exists (this
   project has hit that exact "shipped file depends on a non-shipped path" bug class before).
5. **A documentation clarification**: `traceability-linking/SKILL.md` now explicitly states that
   `IP-*` IDs (and any ID covered only transitively) showing "unlinked" is an expected, non-blocking
   quirk of the current non-transitive checker — a real gap from the first dogfooding pass,
   previously flagged once and never written down.

All existing validators (`validate-structure.mjs`, `check-fixtures.mjs`, `check-traceability.mjs`)
plus `node --test` were re-verified green after these changes — nothing here touches shipped
command/skill/agent *behavior* other than the additive skill-reference lines above.

## Decision needed: pnpm for Wingman-generated projects

This is a real, previously-reasoned-but-never-decided proposal sitting in `docs/PROJECT.md`'s
decisions log (now tagged `status=open`), explicitly logged there as "routed through a Boardroom
checkpoint, not asserted" — and never actually was. Surfaced now specifically because the new
structured-marker layer makes stale `status=open` items like this one visible and queryable for
the first time, instead of sitting invisibly in prose.

**The proposal, as already reasoned in the decisions log:**
- **Not for Wingman's own repo** — no `package.json`, no dependencies, nothing to manage. Already
  settled, not in question here.
- **For projects `/wingman:build` generates for founders**: default new Node/JS projects to pnpm at
  the point they first need a package manager, with:
  - A one-line plain-language rationale surfaced to the founder (disk/speed savings, phantom-
    dependency prevention).
  - A hard escape hatch — the founder can decline.
  - A hard rule to never rip out an existing working lockfile in an existing project.
  - This decision is NOT a blanket mandate — it only applies the first time a *new* Node/JS project
    needs a package manager at all.

**What the Boardroom is being asked to decide**: go / no-go / defer on wiring this into
`build.md`'s (or a future DevOps-lead's) remit as described above. This is a genuine business/
technical tradeoff (a founder-facing default affecting every future generated project), not a
mechanical change — exactly the kind of decision this project's own culture says shouldn't be
asserted unilaterally.

## What's being asked of each seat

Review both the structured-logging change (already implemented — flag anything genuinely wrong,
don't just rubber-stamp) and the pnpm proposal (undecided — render a real go/no-go/defer verdict
with reasoning). Standard verdict format: `GO` / `GO_WITH_CONCERNS` / `NO_GO`, one paragraph each.
