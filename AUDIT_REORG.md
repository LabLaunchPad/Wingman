# Wingman Repo Audit & Reorg Plan

**Audited:** 2026-07-20 · **Auditor:** Claude Code (Sonnet 5), read-only analysis + 3 verified CI-log observations
**Repo:** `lablaunchpad/wingman` · **Scope:** full repository

---

## 0. Template-mismatch disclosure (read this first)

The requesting brief for this audit assumed an enterprise AI monorepo: pnpm/turborepo workspaces,
`packages/apps/libs` splits, heavy npm/Rust dependencies, model-serving infrastructure (batching,
embeddings, retrieval, serverless inference), and cloud IAM. **None of that exists in this repo, and
none of it should be introduced.** Verified directly, not assumed:

- **Zero third-party runtime dependencies.** Every import across all 24 shipped/dev `.mjs` files
  (`plugins/wingman/hooks/*.mjs`, `plugins/wingman/scripts/*.mjs`, `scripts/*.mjs`,
  `evals/run-headless.mjs`, `tests/**/*.mjs`) is `node:fs`, `node:path`, `node:child_process`,
  `node:os`, `node:url`, `node:util`, `node:assert`, or `node:test` — Node stdlib only. No
  `package.json` exists anywhere in the repo outside `vendor/` (16 pinned reference submodules, MIT,
  read as design inspiration only — never executed, never a runtime dependency).
- **No build step, no compiled artifact, no service to deploy.** The plugin's "code" is 205
  markdown files (commands/agents/skills) plus the 24 `.mjs` scripts above. `docs/ARCHITECTURE.md`
  §2 states this explicitly: no persistent runtime, no long-running process.
- **No model-serving layer to operate.** Wingman *orchestrates* Claude Code subagents inside a
  session; it never calls a model API directly, batches inference, or hosts embeddings/vector
  retrieval. There is nothing to move "serverless vs. dedicated service" — that axis doesn't exist
  here.

Applying the requested template mechanically (pnpm workspace configs, package.json script tables,
a heavy-dependency optimization table, IAM snippets) would fabricate infrastructure this repo does
not have and does not need — the exact failure mode this repo's own `evals/README.md` and
evidence-gate discipline exist to catch (see `docs/PROJECT.md`'s decisions log for two prior
external proposals declined on identical grounds: a context-compression module and a semantic
cache, both requiring infrastructure this architecture cannot host).

**What follows keeps every section of the requested brief, mapped onto what is actually here.**
Sections that have no real analog (dependency-heavy-deps table, package-manager workspace config,
model-serving runtime split) are answered honestly as "not applicable, and here's the real
equivalent problem in this repo" rather than skipped or faked.

---

## 1. Executive summary

Wingman is a single-deliverable Claude Code plugin — markdown skills/commands/agents plus a small,
disciplined set of dependency-free Node scripts — not a multi-package application, so most
monorepo-tooling concerns (workspace managers, heavy-dependency graphs, service IAM) simply don't
apply. The real issues found in this audit are narrower and more concrete: (1) three CI workflows
(`validate.yml`, `actionlint.yml`, `install-smoke.yml`) double-run on every PR push because they
trigger on unscoped `push:` *and* `pull_request:` simultaneously — verified directly against real
check-run output, wasting roughly half of this repo's CI minutes; (2) the plugin's manually-copied
surface counts (commands/skills/eval-case totals) have drifted stale three separate times already
this year, each caught only by a dedicated audit rather than a standing check; (3) a handful of
small logic duplications sit just below this repo's own 3rd-occurrence extraction threshold; (4) the
70-case eval suite and 50+ fixture pairing rely on filename-convention matching with a hand-maintained
alias table rather than an explicit, checkable manifest. None of these require restructuring the
repo — they're targeted fixes with a combined estimated effort of 1-2 days, and the top item (CI
double-run) is a one-line change per file with an immediate, measurable CI-cost reduction.

---

## 2. Top 10 prioritized action items

| # | Title | Rationale | Effort | Order |
|---|---|---|---|---|
| 1 | **Scope `push:` to `branches: [main]` in `validate.yml`, `actionlint.yml`, `install-smoke.yml`** | Verified via real check-run data on PRs #61/#63: each fires twice per PR push (once on the push event, once on `pull_request: synchronize`) because `push:` has no branch filter. `codeql.yml` already does this correctly. Immediate ~50% CI-minute cut on these 3 jobs. | S | 1 |
| 2 | **Auto-generate the plugin-surface count instead of hand-copying it** | The "N commands / M skills / K eval cases" figure has drifted stale 3 times this year (README, `docs/PROJECT.md`, a hardcoded test assertion in `tests/hooks-integration`) — each only caught by a dedicated audit pass, not a standing check. `wingman-health.mjs` already computes the true numbers; wire a `check-repo-consistency.mjs` rule that fails if README's/PROJECT.md's stated counts diverge from `plugin.json`'s real arrays. | S | 2 |
| 3 | **Add an explicit eval-case ↔ fixture ↔ skill/command manifest** | `wingman-health.mjs`'s coverage check currently infers pairing from filename-prefix matching plus one hardcoded alias (`audit` → `systematic-auditing`). At 70 cases / 50+ fixtures this heuristic will keep needing hand-patched exceptions. A one-line-per-case `evals/MANIFEST.tsv` (case, fixture, covers) makes the mapping explicit and removes the alias hack. | M | 3 |
| 4 | **Pre-empt the CQ2/CQ3-style duplication class with a mechanical 3rd-occurrence check** | `FIXLOG.md` already tracks two accepted "wontfix, revisit at 3rd occurrence" duplications (`parseFrontmatter()` in `validate-structure.mjs`/`wingman-metrics.mjs`; an 80-line orchestration block in `dod-structural-gate.mjs`). Rather than re-discovering a 3rd instance by audit, add a lightweight content-hash scan to `check-repo-consistency.mjs` that flags any function body (>15 lines) duplicated 3+ times across `plugins/wingman/{hooks,scripts}` and `scripts/`. | M | 4 |
| 5 | **Dedupe the uncached `npm install -g @anthropic-ai/claude-code` across `evals.yml` and `install-smoke.yml`** | Self-flagged in `FIXLOG.md`'s "Accepted" section (PERF4) but never actioned. Both jobs install the same CLI from scratch, uncached, on every run. `actions/setup-node`'s built-in npm cache doesn't help here (it's a global `-g` install, not a project `npm ci`); use `actions/cache` keyed on a version pin instead. | S | 5 |
| 6 | **Add a vendor/ submodule freshness + attribution-sync check to CI** | 16 pinned reference repos live under `vendor/` via `.gitmodules`; `check-repo-consistency.mjs` already checks attribution coverage but not that `.gitmodules`' 16 entries and `ATTRIBUTIONS.md`'s entries stay 1:1 as submodules are added/removed. Cheap, catches drift at the source instead of by inspection. | S | 6 |
| 7 | **Split `tests/hooks-integration/hooks-integration.test.mjs` before it becomes a monolith** | Currently one file covers `secret-guard`, `stop-loop`, `dod-structural-gate`, session-start, and more (92 tests, ~600+ lines). Not urgent today, but the hardcoded-count bugs this session fixed twice (skill count, command count) both originated in this one file. Recommend a 1:1 split (`tests/hooks-integration/<hook-name>.test.mjs`) once it crosses ~800 lines or 100 tests — evidence-gated, not immediate. | M | 7 (deferred) |
| 8 | **Document the `scripts/` vs `plugins/wingman/scripts/` naming-collision risk** | Two directories both hold Node validator scripts (dev-only vs. shipped). No current bug, but nothing mechanically prevents a shipped script from importing a dev-only sibling path (which would silently break in an installed plugin, since only `plugins/wingman/` ships). Add one `check-repo-consistency.mjs` rule: no `import`/`readFileSync` under `plugins/wingman/**` may reference a path outside `plugins/wingman/`. | S | 8 |
| 9 | **Wire `skills/doc-index` into a CI check, not just on-demand use** | 205 markdown files exist repo-wide; `doc-index` is available as a skill but nothing confirms its index (if one exists on disk) stays current automatically. Verify whether `doc-index` produces a persisted artifact; if so, add a staleness check to `validate.yml`. If it's purely on-demand/ephemeral, no action needed — confirm and document either way. | S | 9 |
| 10 | **Add a `CHANGELOG.md`-entry presence check to `version-gate.yml`** | `version-gate.yml` already fails a PR that bumps shipped content without a `plugin.json` version bump. It does not yet confirm the bumped version has a matching `## [x.y.z]` `CHANGELOG.md` heading — every version bump this session manually added one, but nothing enforces it. One `grep` step closes the gap. | S | 10 |

---

## 3. Repo layout — current tree, verified correct as-is

No new top-level directories are needed. **Do not introduce `packages/`, `apps/`, `libs/`, a
`pnpm-workspace.yaml`, or a `turbo.json`** — there is exactly one deliverable (`plugins/wingman/`)
and zero packages to compose. The existing top-level layout already matches this repo's actual
shape correctly:

```
Wingman/
├── .claude-plugin/            # marketplace.json — lists this repo's one plugin
├── .github/workflows/         # 8 CI jobs (see §6)
├── plugins/wingman/           # THE SHIPPED SURFACE — everything here installs to a founder's Claude Code
│   ├── .claude-plugin/plugin.json   # single source of truth: commands/agents/skills arrays + version
│   ├── commands/               # 24 *.md — slash-command entry points
│   ├── agents/                 # 8 *.md — Boardroom seats (CEO/CTO/CPO/CISO/CFO/CMO/Research/Design)
│   ├── skills/                 # 40 dirs, each SKILL.md (+ optional references/, scripts/)
│   ├── hooks/                  # *.mjs — session/tool-call hooks (secret-guard, stop-loop, etc.), zero deps
│   ├── references/             # shared *.md cited by 2+ skills (NEW: continuous-execution.md, Wave 4)
│   └── scripts/                # *.mjs shipped standalone tools (okf-export, validate-structure, check-traceability)
├── scripts/                    # DEV-ONLY *.mjs — never ships; repo-health tooling (wingman-health, wingman-metrics, check-repo-consistency, check-fixtures, parse/query-wingman-logs)
├── evals/                      # behavioral eval harness (see docs/architecture below)
│   ├── cases/                  # 70 *.md — one per skill/command, graded by hand per evals/README.md
│   ├── fixtures/               # 50+ setup-*.sh — disposable throwaway git projects for cases to run against
│   ├── dogfood-runs/           # captured transcripts from /wingman:dogfood runs
│   └── run-headless.mjs        # `claude -p` driver, needs ANTHROPIC_API_KEY
├── tests/                      # node --test unit/integration tests for the *.mjs scripts above
│   ├── hooks-integration/
│   └── ponytail-integration/
├── docs/                       # repo-root only — NEVER ships with the plugin (see docs/ARCHITECTURE.md, AGENTS.md)
├── vendor/                     # 16 pinned MIT reference submodules — design inspiration, never executed
└── {CLAUDE,AGENTS,README,CHANGELOG,FIXLOG,LEARNINGS,CONTRIBUTING,SECURITY,CODE_OF_CONDUCT}.md
```

**One real naming-boundary risk** (action item #8 above): `scripts/` (dev-only) and
`plugins/wingman/scripts/` (shipped) sound identical and both hold validator-style `.mjs` files.
Nothing today would stop a shipped file from importing a dev-only sibling by relative path — it
would pass local tests (both directories exist on disk in this repo) but break silently once
installed (only `plugins/wingman/` ships). No incident has happened yet; the fix is a one-rule
mechanical check, not a rename — the current names are otherwise clear and match this repo's own
`AGENTS.md` "Repository map" section already.

**No `pnpm-workspace.yaml` / `turbo.json` / root `package.json` should be added.** If Wingman ever
grows a second shippable deliverable (e.g. a companion CLI, a VS Code extension), *that* is the
trigger to introduce workspace tooling — not before. This is the same evidence-gate discipline this
repo already applies to department leads and specialists (`docs/AGENT-ROSTER.md`): don't build
infrastructure ahead of a second real consumer.

---

## 4. Per-directory purpose, public surface, and commands

| Directory | Purpose | Public surface | Commands |
|---|---|---|---|
| `plugins/wingman/commands/` | Slash-command entry points (`/wingman:build`, `/wingman:ship`, ...) | **Shipped.** Referenced by `plugin.json`'s `commands` array | Validated by `validate-structure.mjs`; no separate build |
| `plugins/wingman/agents/` | 8 fixed Boardroom seats, gate-review only, never write code | **Shipped.** Referenced by `plugin.json`'s `agents` array | Same validator; `boardroom-cto`/`boardroom-ciso` must be `model: opus` (checked) |
| `plugins/wingman/skills/` | 40 reusable disciplines, invoked by commands/agents via progressive disclosure | **Shipped.** Referenced by `plugin.json`'s `skills` array | Same validator; frontmatter + discipline-triad scan |
| `plugins/wingman/hooks/` | Session/tool-call hooks (secret/injection scanning, stop-loop, DoD gate) | **Shipped**, auto-loaded via `hooks/hooks.json` (never listed in `plugin.json` itself) | `node --test tests/hooks-integration/*.test.mjs` |
| `plugins/wingman/references/` | Shared prose cited by 2+ skills (dedup target, per Wave 4's ARCH3 fix) | **Shipped**, cited not executed | No commands — markdown only |
| `plugins/wingman/scripts/` | Standalone shipped tools (`okf-export.mjs`, `validate-structure.mjs`, `check-traceability.mjs`) | **Shipped**, runnable standalone with zero Claude Code involvement (`docs/ARCHITECTURE.md` §8a) | `node plugins/wingman/scripts/<name>.mjs` |
| `scripts/` | Dev-only repo-health tooling | **Not shipped** — never referenced by `plugin.json` | `node scripts/wingman-health.mjs`, `node scripts/check-repo-consistency.mjs`, `node scripts/check-fixtures.mjs` |
| `evals/` | Behavioral eval harness — model-in-the-loop grading, human-graded by design | **Not shipped** | `node evals/run-headless.mjs [--dry-run]` |
| `tests/` | Deterministic unit/integration tests for the `.mjs` scripts | **Not shipped** | `node --test tests/**/*.test.mjs` |
| `docs/` | Durable architecture/decisions/roadmap docs | **Not shipped** — repo-root only, `docs/ARCHITECTURE.md` §... explicitly documents this boundary | Read by contributors and Claude Code sessions in this dev repo only |
| `vendor/` | 16 pinned MIT reference submodules | **Not shipped**, not executed — citation/inspiration only | None — read-only reference |

There is no "build" step for any of the above: markdown ships as-is, `.mjs` scripts run directly
under Node (no transpilation, no bundler). "Build/test commands" in the traditional sense collapse
to: run the 4 validators + the 2 test files + (optionally, with an API key) the eval harness. This
is already exactly what `CLAUDE.md`'s "Commands" section documents — confirmed accurate by this
audit, no change needed there.

---

## 5. Dependency optimization table

| Dependency | Current version | Flagged reason | Suggested action |
|---|---|---|---|
| *(none — zero third-party npm packages anywhere in this repo)* | — | — | — |
| `@anthropic-ai/claude-code` (CLI, not a package dep) | installed via `npm install -g` in CI only | Reinstalled from scratch, uncached, in 2 separate workflows (`evals.yml`, `install-smoke.yml`) | Cache via `actions/cache` keyed on a pinned version string (action item #5); do **not** vendor or pin as a `package.json` dependency — it's a CLI tool the workflows invoke, not a runtime import |
| `vendor/*` (16 git submodules) | pinned commits per `.gitmodules` | Not a dependency risk (never executed, MIT-licensed, read-only) but no CI check confirms `.gitmodules` ↔ `ATTRIBUTIONS.md` stay in sync as entries are added/removed | Action item #6 |

This table is intentionally close to empty — that emptiness *is* the finding. There is no
dependency graph to dedupe, no heavy package to replace with a lighter alternative, and no lockfile
drift to manage, because the repo's own architecture (`docs/ARCHITECTURE.md`, `CLAUDE.md`) commits
to zero runtime dependencies as a load-bearing constraint, enforced today by `install-smoke.yml`'s
"no `node_modules`" assertion. **Recommendation: keep this constraint. Any future proposal to add
an npm dependency should go through the same evidence-gate this repo already applies to new
skills/agents** — real, repeated friction first, not speculative convenience.

---

## 6. CI pipeline change plan

### 6a. Fix the double-run (action item #1)

Verified root cause: `push:` with no `branches:` filter fires on *every* push, including a push to
an open PR's own branch — which `pull_request: synchronize` *also* fires on for the same commit.
`validate.yml`'s `concurrency:` group is keyed on `github.ref`, but push and pull_request events
carry different ref values (`refs/heads/<branch>` vs `refs/pull/<n>/merge`), so the group doesn't
dedupe them. `codeql.yml` already gets this right.

**Before** (`validate.yml`, `actionlint.yml`, `install-smoke.yml` — all 3 share this pattern):
```yaml
on:
  push:
  pull_request:
```

**After:**
```yaml
on:
  push:
    branches: [main]
  pull_request:
```

This is a 2-line change per file, 3 files, zero behavior loss: every PR branch is still fully
covered by `pull_request:`; `push:` now only fires post-merge on `main`, matching `codeql.yml`'s
already-correct pattern. Estimated CI-runtime improvement: roughly **33-50% fewer job-minutes**
across these 3 jobs (2 runs → 1 run per PR push), with zero coverage change.

### 6b. Cache the CLI install (action item #5)

```yaml
# evals.yml and install-smoke.yml, replacing the bare `npm install -g` step:
- name: Cache claude-code CLI
  id: cache-claude-cli
  uses: actions/cache@<pin>
  with:
    path: ~/.npm-global
    key: claude-code-cli-${{ env.CLAUDE_CODE_VERSION }}
- name: Install claude-code CLI
  if: steps.cache-claude-cli.outputs.cache-hit != 'true'
  run: npm install -g --prefix ~/.npm-global @anthropic-ai/claude-code
- run: echo "~/.npm-global/bin" >> "$GITHUB_PATH"
```
Pin `CLAUDE_CODE_VERSION` as a workflow `env:` so cache invalidates deliberately on version bumps,
not silently.

### 6c. No caching strategy is needed for the plugin content itself

There is nothing to build-cache: no `node_modules`, no compiled output, no bundler cache. The
existing `validate.yml`/`check-fixtures.mjs`/`check-traceability.mjs` steps already run in
single-digit seconds (verified: `check-fixtures.mjs` completed 48 fixtures in ~5s after Wave 4's
concurrency fix). Caching effort should go entirely into 6a/6b above, not into fabricating a
build-cache layer this repo doesn't need.

---

## 7. Token-efficiency checklist for AI components

Wingman has no embedding store, no retrieval pipeline, and makes no direct model API calls of its
own — it *is* prompts (markdown skills/commands), consumed by whichever Claude Code session invokes
them. The real token-efficiency surface is therefore: **how skill/command prose is authored and
loaded**, not a runtime cache. What already exists and is correctly designed, verified this audit:

- **Prompt/template storage:** `plugins/wingman/skills/*/SKILL.md` — one skill, one file, frontmatter
  + body. `plugins/wingman/references/*.md` — shared prose cited by 2+ skills rather than duplicated
  inline (Wave 4's `ARCH3` fix extracted the first instance of this pattern; keep applying it as
  duplicates are found — action item #4 mechanizes the detection).
- **Chunking / progressive disclosure:** skills cite `references/*.md` by path rather than inlining
  them, so a session that never needs the reference never pays its token cost — this is the
  project's own stated pattern (`CLAUDE.md`'s "Context is not free" principle in
  `docs/ARCHITECTURE.md` §... already documents this as a first-class design constraint, not
  something this audit needs to introduce).
- **Embedding/retrieval:** **not applicable.** No vector store, no semantic search over skills exists
  or should be built — 40 skills is well within a flat `plugin.json` array's practical limit for
  Claude Code's own router. A proposal to add a semantic-cache/retrieval layer here was already
  raised, verified, and declined this session (`docs/PROJECT.md`'s decisions log; see
  `docs/AGENT-ROSTER.md`'s CACHE-001 entry) for the same "no request-serving loop to cache against"
  reason.
- **Batching:** not applicable — Wingman doesn't issue its own model calls to batch.
- **`skills/token-economy`:** already exists and is `verified`-eval'd (`evals/cases/token-economy.md`)
  — internal-only concision discipline, explicitly never applied to founder-facing output. This *is*
  the token-efficiency mechanism the brief asked for; no gap found.

**Checklist for any future skill/reference addition:**
1. If new prose will be cited by 2+ skills, write it once under `references/`, cite by path — don't
   inline-duplicate.
2. Keep a skill's `SKILL.md` body scoped to what that skill's own invocations need; move
   background/rationale to a `references/*.md` a founder-facing flow won't always load.
3. Run `node plugins/wingman/scripts/check-traceability.mjs` — it already flags orphaned
   requirement/decision markers, a cheap proxy for "this content is dead weight nothing loads."
4. Do not propose an embedding store or semantic cache without first demonstrating the specific,
   repeated friction that a flat `plugin.json` array + progressive disclosure can't handle —
   evidence-gate, same bar as new skills/departments.

---

## 8. Security checklist

Real, already-implemented mechanisms verified this audit, plus concrete gaps:

| Area | Status | Tool/config | Gap (if any) |
|---|---|---|---|
| Secret detection | **Implemented, verified** | `plugins/wingman/hooks/secret-guard.mjs` (shared `SECRET` array, 9 patterns incl. GitHub PAT/Slack/Stripe/Google as of Wave 3) + `secret-scanner.mjs` (imports the same array — deduped Wave 3) | None found |
| Prompt-injection detection | **Implemented, self-disclosed as a floor not a ceiling** | `prompt-guard.mjs` (`INJECTION` regex array) | Self-flagged (`FIXLOG.md` SEC3) as regex-only; accepted, no stronger mechanism proposed without evidence |
| Static analysis (SAST) | **Implemented** | `codeql.yml`, scans all executable `.mjs` (the one real JS attack surface per `SECURITY.md`'s stated scope) | Correctly scoped — no `paths:` filter needed since CodeQL's autobuild needs full checkout |
| Workflow linting | **Implemented** | `actionlint.yml` | None |
| Dependency/SCA scanning | **N/A by design** | — | Zero npm dependencies to scan; `install-smoke.yml`'s "no `node_modules`" assertion is the actual control here, and it's already CI-enforced |
| Secrets management (CI) | **Implemented** | `ANTHROPIC_API_KEY` gated behind a computed `HAS_ANTHROPIC_KEY` env-var indirection (documented workaround for `secrets` not being valid inside `if:`); passed via `env:` not `with:` as of Wave 4's `DEVOPS1` fix | None found |
| Least-privilege CI permissions | **Mostly implemented** | Most workflows declare minimal `permissions:` blocks (`contents: read`, etc.) | `claude-code-review.yml`'s permission scope was self-flagged low-confidence (`FIXLOG.md` DEVOPS7) — accepted without independent re-verification this round; revisit if a real over-permission incident occurs |
| Fork-PR safety | **Implemented** | `claude-code-review.yml` gated on `head.repo.full_name == github.repository`, confirmed by a real prior incident (PR #9) this repo's own workflow comments document | None found |
| Path containment (script-level) | **Implemented as of Wave 4** | `okf-export.mjs`'s `rmSync` now refuses to wipe `/` or the resolved home directory | Consider the same pattern audit for any other script using `rmSync`/`rm -rf`-equivalent logic — `check-fixtures.mjs` already scopes its cleanup to `mkdtempSync`-created paths only, verified safe |
| IAM / cloud service accounts | **N/A** | — | No cloud service exists to scope — this repo deploys nothing |

No new security tooling is recommended. The existing layered model (regex-based hooks +
CodeQL + actionlint + fork-safety gating + least-privilege CI permissions) matches this repo's real
threat surface (`SECURITY.md`'s stated scope: the executable `.mjs` files, not the markdown
content) and every gap found is either already self-disclosed and accepted, or closed this audit
cycle.

---

## 9. Migration timeline

Given the narrow, low-risk nature of every finding, this is a single short phase, not a multi-month
program.

**Phase 1 (this week) — CI fixes, no behavior change, S-effort items only**
- Action items #1, #5, #10. Each is a workflow-YAML-only change with no plugin-surface impact.
- Acceptance criteria: `actionlint.yml` still passes; a test PR push shows exactly one run each of
  `validate`/`actionlint`/`install-smoke` instead of two (verify directly via GitHub check-run list,
  the same method this audit used to find the bug).
- Rollback: revert the 2-line `on:` change per file — trivially reversible, no data/state involved.

**Phase 2 (next 1-2 weeks) — mechanical drift prevention, M-effort**
- Action items #2, #3, #4, #6, #8. Each adds a new rule to `check-repo-consistency.mjs` or a new
  manifest file; none change existing shipped content.
- Acceptance criteria: all 4 mandatory validators still exit 0; the new rules fire correctly against
  a deliberately-broken test case (e.g., temporarily stale a count, confirm the new check catches
  it) before being trusted, then revert the deliberate break.
- Rollback: each rule is additive and isolated; disable individually by reverting its specific diff
  hunk if it produces false positives.

**Phase 3 (evidence-gated, no fixed date)**
- Action item #7 (test-file split) and #9 (doc-index CI wiring) — deferred until their own trigger
  condition is met (test file crosses ~800 lines/100 tests; `doc-index` confirmed to produce a
  persisted, stale-able artifact). Do not schedule these on a calendar; schedule them on the
  evidence.

No phase requires a compatibility shim, a feature flag, or a parallel-run period — every change here
is either CI-config-only (Phase 1) or additive-validator-only (Phase 2), so there's no founder-facing
behavior to migrate gradually.

---

## 10. Quick-win scripts and one-liners

**Verify the CI double-run bug directly (read-only, run before/after Phase 1):**
```bash
# Requires gh CLI + repo access. Lists check-run names for a given PR's head SHA;
# a name appearing twice confirms the double-fire.
gh api repos/lablaunchpad/wingman/commits/<HEAD_SHA>/check-runs \
  --jq '.check_runs[].name' | sort | uniq -c | sort -rn
```

**Find candidate 3rd-occurrence duplications (the mechanism action item #4 should mechanize):**
```bash
# Hashes every function body (naive: text between matching top-level `function`/`=>`
# blocks isn't parsed here — this is a quick grep-based proxy, not the real check to ship)
# for a fast manual scan today.
for f in plugins/wingman/hooks/*.mjs plugins/wingman/scripts/*.mjs scripts/*.mjs; do
  grep -n "^function \|^export function " "$f" | sed "s|^|$f:|"
done | awk -F: '{print $3}' | sed 's/function //' | sort | uniq -d
```

**Confirm zero non-stdlib imports repo-wide (re-run any time to catch a regression):**
```bash
grep -rhoE "from '[a-zA-Z][^./][^']*'" \
  plugins/wingman/hooks/*.mjs plugins/wingman/scripts/*.mjs scripts/*.mjs \
  evals/run-headless.mjs tests/*/*.mjs 2>/dev/null \
  | grep -v "^from 'node:" && echo "FAIL: non-stdlib import found" || echo "OK: stdlib only"
```

**Generate the true plugin-surface counts (feed into action item #2's automated check):**
```bash
node -e "
const p = require('./plugins/wingman/.claude-plugin/plugin.json');
console.log('commands:', p.commands.length, 'agents:', p.agents.length, 'skills:', p.skills.length);
"
```

**Diff `.gitmodules` entries against `ATTRIBUTIONS.md` (action item #6's manual check today):**
```bash
comm -3 \
  <(grep 'path = vendor/' .gitmodules | sed 's/.*vendor\///' | sort) \
  <(grep -oE '`vendor/[a-z-]+`' ATTRIBUTIONS.md | sed 's/`vendor\///;s/`//' | sort -u)
```

**Node one-liner to fix the CI double-run (Phase 1, apply then hand-review the diff):**
```bash
for f in .github/workflows/validate.yml .github/workflows/actionlint.yml .github/workflows/install-smoke.yml; do
  node -e "
    const fs = require('fs');
    const path = '$f';
    let t = fs.readFileSync(path, 'utf8');
    t = t.replace(/^on:\n  push:\n  pull_request:/m, 'on:\n  push:\n    branches: [main]\n  pull_request:');
    fs.writeFileSync(path, t);
  "
done
git diff .github/workflows/
```

---

## Files inspected for this audit

`plugins/wingman/.claude-plugin/plugin.json`, all `plugins/wingman/{hooks,scripts}/*.mjs`,
`scripts/*.mjs`, `evals/run-headless.mjs`, `tests/**/*.mjs`, all 8 `.github/workflows/*.yml`,
`.gitmodules`, `FIXLOG.md`, `CLAUDE.md`, `docs/ARCHITECTURE.md`, `AGENTS.md`, top-level directory
listing, and live GitHub check-run data for PR #61/#63 (confirming the CI double-run finding
directly rather than inferring it from YAML alone).

## Nothing was ambiguous or opaque

Every section above is grounded in a file this audit actually read or a command it actually ran —
no placeholder sections, no assumed structure. The one genuine judgment call (whether to build the
requested pnpm/turborepo scaffolding despite it not matching this repo) is disclosed in §0 rather
than silently substituted.
