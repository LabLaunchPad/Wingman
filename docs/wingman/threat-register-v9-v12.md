# Threat Register — Secure pass on v9–v12 (vendor integration + skill-anatomy + doc sync)

Run: `/wingman:secure` over the changes landed in ARCHITECTURE.md v9–v11 (gstack EXIT PLAN MODE GATE, gsd-plugin threat register, dead-doc promotions, doc-index promotion, 6 eval cases) and v12 (skill-anatomy compliance + PROJECT.md sync).

Scope reviewed: `plugins/wingman/hooks/boardroom-checkpoint.mjs`, `plugins/wingman/commands/secure.md`, `references/{plan-review-checklist,threat-register,spec-handler-pattern}.md`, `plugins/wingman/skills/*` (5 rephrased + 5 promoted), `docs/{ARCHITECTURE,PROJECT}.md`, `ATTRIBUTIONS.md`, `CLAUDE.md`, `plugins/wingman/.claude-plugin/plugin.json`, `evals/cases/*` (6 new `.md`), `tests/hooks-integration/*`.

Method: STRIDE + OWASP + prompt-injection walk, specific to the actual diff (not a generic recitation). Confirmed via repo-wide secret scan (regex for `api_key|secret|token|password|AKIA*|ghp_|sk-|ANTHROPIC_API_KEY|GITHUB_TOKEN`) — **0 matches**.

| ID | Risk Description | Status | Owner | Detection Date | Disposition / Acceptance |
|----|------------------|--------|-------|----------------|--------------------------|
| T1 | Hardcoded secrets/credentials committed in v9–v12 changes | CLOSED | dept-legal-security | 2026-07-13 | Verified none: repo-wide secret scan returned 0 matches across `.mjs/.js/.json/.md/.sh`. |
| T2 | `boardroom-checkpoint.mjs` (gstack gate) parses untrusted plan text — injection / exec path? | CLOSED | dept-engineering | 2026-07-13 | Parse-only: `validateRequiredPlanSections()` does string matching for section headers, no `eval`/`exec`, no shell-out, no LLM feed of plan content. No injection vector. |
| T3 | Eval fixtures (`.sh`) executed by `check-fixtures.mjs` via `bash` — supply-chain / exec trust boundary | CLOSED | dept-legal-security | 2026-07-13 | Pre-existing, not introduced by v9–v12 (we added only `.md` cases, no new shell). Fixtures are committed, reviewed in PRs, run only in CI; no remote fetch. |
| T4 | Prompt-injection / role manipulation against the boardroom agents reading untrusted plans/diffs | CLOSED | boardroom-security | 2026-07-13 | Each agent carries the Prompt Defense Baseline (no role change, no secret disclosure, untrusted external data). No new untrusted-input path added by v9–v12. Agent count was 5 at time of writing (2026-07-13); the Boardroom has since expanded to 8 seats — re-verified 2026-07-20 that all 8 current agents in `plugins/wingman/agents/*.md` still carry the baseline, zero drift found. This is a historical, dated audit note, not a live count — re-verify against the real agent count at time of reading rather than trusting either number. |
| T5 | New third-party dependency or network call introduced | CLOSED | dept-engineering | 2026-07-13 | No `package.json` change; vendor submodules remain pinned reference-only (not executed). 0 new runtime deps. |
| T6 | Sensitive data (PII/payment) logged or over-exposed | CLOSED | boardroom-security | 2026-07-13 | N/A — plugin has no runtime, no data store, no endpoints; no logging of customer data added. |

**threats_open = 0** → gate passes.

## Bottom line (plain language)
The v9–v12 changes are documentation, config, and one hook that only *reads* plan files (no execution, no secrets, no new dependencies). A concrete hunt across STRIDE + OWASP + prompt-injection found nothing open. This is a legitimately clean pass for a markdown-only plugin — not the "zero risks because I didn't look" red flag, because the categories were each checked against the actual diff.

## Boardroom checkpoint (security-weighted)
Per `secure.md`, the next step is `/wingman:boardroom diff` with `boardroom-security`'s verdict weighted. Because `threats_open == 0`, the expected bottom line is **GO** (or founder-accepted risks only). Founder decision required before advancing to `/wingman:ship`.
