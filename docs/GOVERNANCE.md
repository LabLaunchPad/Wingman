# Governance, Policy & Benchmarks — where each already lives

This doc is a pure index, not a new mechanism. It exists because "governance," "policy," and
"benchmarks" are each real in this repo but scattered across several files — this ties them
together in one place for anyone auditing the project, instead of asking them to re-derive it from
source. Nothing here duplicates or overrides the documents it points to; if this doc and the
document it cites ever disagree, the cited document is correct.

## Org governance — who reviews, who builds, who coordinates

Wingman's governance model is the four-tier agent population described in full in
[`docs/ARCHITECTURE.md`](ARCHITECTURE.md) §3–§5a:

| Layer | What it does | Where it's defined |
|---|---|---|
| **Boardroom** (fixed, 7+1 seats) | Reviews and gates — never writes code, only renders a plain-language go/no-go verdict at a checkpoint. | `docs/ARCHITECTURE.md` §4, `plugins/wingman/agents/boardroom-*.md` |
| **Management Board** (grows 0→9) | Coordinates department-lead execution once a project is complex enough (3+ active conditionally-created department leads). Never renders Boardroom verdicts. | `docs/ARCHITECTURE.md` §5a, `plugins/wingman/skills/governance/management-board-activation` |
| **Department leads** (grows 0→8) | Build-time workers, one per corporate department, created lazily per real project need. | `docs/ARCHITECTURE.md` §5, `plugins/wingman/skills/governance/department-lead-activation` |
| **Specialists** (uncapped) | Narrow sub-roles, promoted one at a time only after 2+ evidenced occurrences of repeated friction. | `docs/AGENT-ROSTER.md`, `plugins/wingman/skills/governance/evolve-promotion` |

The gate rule and human-escalation mapping (which risk tier routes to whom) are in
`docs/ARCHITECTURE.md` §4's "Gate rule" and "Human Escalation Framework" subsections.

## Policy — the rules and what enforces them

Wingman's policy layer is markdown rules plus `.mjs` mechanical enforcement — not a YAML/OPA
policy-as-code system, because there's no cluster or deployed service to apply one to (see
`docs/ARCHITECTURE.md` §2).

**Rules** (stated, not just implied — each names explicit MUST/MUST NOT constraints):

- `plugins/wingman/skills/governance/security-checklist` — STRIDE + OWASP + prompt-injection hunt, blocks
  advancement while `threats_open > 0`.
- `plugins/wingman/skills/governance/definition-of-done` + `plugins/wingman/references/definition-of-done.md`
  — the ship gate: spec met, tests pass, type checker clean, coverage, security threats closed,
  docs in sync.
- `plugins/wingman/skills/discipline/engineering-minimalism` — the decision ladder and the explicit "MUST NOT
  simplify away" list (input validation, error handling, security checks, accessibility).
- `plugins/wingman/skills/mechanics/spec-handler` + `plugins/wingman/skills/discipline/test-driven-development` — spec
  before code, then strict red-green-refactor; "NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST."

**Mechanical enforcement** (`plugins/wingman/hooks/hooks.json` wires these in):

- `hooks/boardroom-checkpoint.mjs` — blocks `ExitPlanMode` unless a checkpoint carries the marker,
  no `DO NOT SHIP`, and an explicit `Founder decision: ship it`.
- `hooks/secret-guard.mjs` — blocks tool calls that would commit a secret.
- `hooks/dod-structural-gate.mjs` (and its plain-CLI twin `plugins/wingman/scripts/dod-pre-push-check.mjs`,
  runnable as a real git `pre-push` hook with zero Claude Code involvement) — structural
  Definition-of-Done checks before a push.

## Benchmarks & metrics — what's measured, and what deliberately isn't

Wingman has **no persistent runtime and no request traffic** (`docs/ARCHITECTURE.md` §2), so its
metrics are not a service-style benchmark suite — there is no p95 latency, throughput, cache hit
rate, or IOPS to measure, and building instrumentation for a service that doesn't exist would mean
fabricating numbers. What's real and computable instead:

| Tool | Measures | Kind |
|---|---|---|
| `evals/` (see `evals/README.md`) | Whether a skill/command's *instructions* produce correct behavior | Pass/fail against real filesystem evidence, human-graded |
| `scripts/wingman-health.mjs` | Plugin surface size, eval trust-level coverage, decisions logged | Structural/categorical snapshot |
| `scripts/query-wingman-knowledge.mjs` | `wingman:log` markers by type/category/status, occurrence counts | Structured query over parsed logs |
| `scripts/wingman-metrics.mjs` | Boardroom model-tier cost shape, eval verified/provisional ratio, `DEBT.md` ceiling rate, occurrence-threshold visibility, agent-weakness coverage | Real cost/quality/debt signals, not a performance benchmark |
| `docs/AGENT-WEAKNESS-BENCHMARK.md` (scored by `wingman-metrics.mjs` §5) | Coverage of community-verified coding-agent failure modes: % with a rule, % measured by a `verified` eval (its positive/negative A/B pair) | Coverage benchmark; self-verifying (re-derives each entry's status from the real rule/eval files) |

See `docs/PROJECT.md`'s decisions log for the record of why a proposed local/edge/cloud +
p95/throughput/IOPS benchmark architecture was assessed and declined in favor of the tools above —
the coverage benchmark above is the honest, computable alternative for a repo with no runtime to
instrument.

## Root narrative & historical-ledger files — ownership and cadence

Three root-level files read as narrative rather than governance/policy, so they don't fit the
tables above. Named here so ownership is never ambiguous:

| File | Status | Owner action | Update cadence |
|---|---|---|---|
| `ANNOUNCEMENT.md` | **Active, pending founder action.** Marketplace-listing release draft. | Tracked in `docs/HUMAN-TODOS.md` as the one remaining account-level submission step; content side already complete. | Re-drafted on each marketplace-facing release; content owner is whoever ships that release. |
| `FIXLOG.md` | **Closed.** All 4 waves of the 2026-07-20 full-spectrum audit remediation loop are `fixed`/`verified`/`wontfix` — no open items. | Referenced by path from `CHANGELOG.md`; kept at root rather than moved so that reference stays valid. | Re-opened only if a future full-spectrum audit produces a new remediation loop of comparable scope — not for routine fixes (those go through `LEARNINGS.md`/retros per the promotion chain in the "Org governance" section above). |
| `docs/wingman/*.md` (point-in-time audits: `architecture-audit-2026-07-15.md`, `enhancement-review-2026-07-15.md`, `audit-reorg-2026-07-20.md`) | **Historical record.** Each is a dated snapshot; not living docs. | No owner needed to keep current — they're intentionally frozen at their audit date. `docs/audit/` (numbered dossier) is the *current* audit convention; new audits go there, not into `docs/wingman/`. | Never updated in place — a new audit gets a new dated file or a new numbered `docs/audit/NN-*.md` entry. |

## Reuse — how this whole model gets applied to a new project

The reuse mechanism already exists: installing the plugin (`.claude-plugin/marketplace.json` +
`plugins/wingman/.claude-plugin/plugin.json`) brings the entire governance/policy model above into
any founder's project in one step — see the README's Quickstart. A separate "wrapper repo" to
clone instead of install would duplicate this mechanism rather than add to it, which is why one
doesn't exist here.
