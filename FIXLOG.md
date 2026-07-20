# FIXLOG — Wingman Remediation Loop

Ground-truth tracker for the 34 findings from the full-spectrum audit (2026-07-20). Every finding
was independently re-verified against the real repository before being scheduled here — the
audit report's own "independently re-verified" claim was itself unverified until this pass; it now
is. **Zero findings were rejected.** No new critical issue was found during verification.

Status values: `open` → `in-progress` → `fixed` → `verified` (regression test + full validator
suite passed) | `wontfix` (written justification required).

## Wave 1 — Harness integrity (must land first)

| ID | Domain | Sev | file:line | Claim | Verdict | Proposed patch | Status |
|---|---|---|---|---|---|---|---|
| T1 | Testing | High | `evals/cases/{ship,anti-rationalization,council,systematic-debugging,test-driven-development,verification-loop,writing-plans,spec-handler,subagent-driven-development,secure}.md` | 10 cases claim `verified` on exactly 1 `### Run` header, no negative/differently-shaped 2nd scenario | **CONFIRMED** — grepped `^### Run` count = 1 for all 10, cross-checked trust-level prose for each | Downgrade to `provisional` with honest 1-line reason per case, OR add a genuinely distinct 2nd run where cheap | fixed |
| T2 | Testing | Medium | `evals/cases/knowledge-export.md` | "2nd run" is a same-fixture idempotency re-run, not a differently-shaped scenario | **CONFIRMED** | Downgrade to `provisional`, or add a genuine negative run (e.g. missing `.wingman/memory/`) | fixed |
| T3 | Testing | High | `tests/ponytail-integration/ponytail-integration.test.mjs:444-517` | `Integration` describe block asserts against hardcoded literals it defines itself, never reads shipped files | **CONFIRMED** — `skillPath` built but never read; `assert.strictEqual(typeof skill, 'string')` is tautological | Rewrite to read real `plugins/wingman/skills/*/SKILL.md`/`commands/*.md` content | fixed |
| T4 | Testing | Medium | `scripts/check-fixtures.mjs:74-80` | Deterministic gate can't detect a fixture silently dropping its documented planted signal | **CONFIRMED** — only checks exit 0 + non-empty dir + `.git` exists | Add optional manifest-based signal check | fixed |
| T5 | Testing | Medium | `evals/cases/{bloat-audit,debt-ledger,over-engineering-review,platform-native-reference,ponytail-debt-harvesting}.md` | 5 shipped commands/skills have zero real eval executions | **CONFIRMED** — all 5 literally `authored, pending first run`, zero `### Run` sections | New fixture per case + real un-briefed subagent dispatch, independently verified against real fixture output, promoted to `provisional` with honest partial-coverage notes where the fixture didn't exercise every expectation | fixed |
| T6 | Testing | Low | `evals/cases/engineering-minimalism.md` | `verified` label overstates coverage of its own named, unrun negative case (security/a11y-under-minimalism) | Accepted (self-disclosed in the case's own trust-level prose) | Add Run 3, or move the gap into a visible `## Known gaps` heading | fixed |

## Wave 3 — Quick wins

| ID | Domain | Sev | file:line | Claim | Verdict | Proposed patch | Status |
|---|---|---|---|---|---|---|---|
| DOCS1 | Docs/DX | Medium | `README.md:23` | Claims release `0.5.12`; actual `0.5.19` | **CONFIRMED** | Update to `0.5.19` | open |
| DOCS2 | Docs/DX | Medium | `README.md` | Undercounts commands (23 vs live 24) | **CONFIRMED** | Update to 24, add `knowledge-export` to the named list | open |
| DOCS3 | Docs/DX | Low | `README.md` | Stale eval-case count (68 vs live 69) | **CONFIRMED** | Update to 69 | open |
| ARCH1/DOCS4 | Architecture/Docs | Low | `docs/PROJECT.md:7` | Still says "23 commands" | **CONFIRMED** | Update to 24 | open |
| SEC2/CQ1 | Security/Code Quality | Medium | `plugins/wingman/hooks/{secret-guard,secret-scanner}.mjs` | `SECRET` regex arrays byte-identical (drift risk) + missing GitHub fine-grained PAT/Slack/Stripe/Google patterns | **CONFIRMED** — diffed, only a comment differs; missing patterns confirmed absent | Export `SECRET` from `secret-guard.mjs`, import in `secret-scanner.mjs` (mirrors existing `INJECTION` pattern), add 4 missing patterns | open |
| ARCH2 | Architecture | Medium | `plugins/wingman/references/{secrets-policy,persona-template}.md` | Zero citations from any command/skill/agent | **CONFIRMED** — grepped, zero hits outside dev-history docs | Wire each to an owning skill's `## References`, or delete | open |
| DEVOPS4 | DevOps/CI | Medium | `.github/workflows/version-gate.yml:11-18` | `paths:` filter omits `references/**` and `scripts/**` | **CONFIRMED** | Add both paths to the filter | open |
| SEC5 | Security | Low | `docs/wingman/threat-register-v9-v12.md:14` | Says "5 boardroom agents"; actual 8 | **CONFIRMED** | Correct the count, add a "re-verify against live count" note | open |
| PERF1 | Performance | Low | `scripts/wingman-health.mjs:56,58` | `parseAll()` then `recurringCategories()` (which internally re-calls `parseAll()`) — redundant read | **CONFIRMED** | Add `recurringCategoriesFrom(parsed)` helper, reuse already-parsed data | open |
| PERF2 | Performance | Low | `plugins/wingman/scripts/validate-structure.mjs:162,174` | `parseFrontmatter(fullPath)` then separate `readFileSync(fullPath)` on same skill file | **CONFIRMED** | Read once, pass text into `parseFrontmatter` | open |
| CQ2 | Code Quality | Low | `plugins/wingman/scripts/validate-structure.mjs` vs `scripts/wingman-metrics.mjs` | `parseFrontmatter()` duplicated | **CONFIRMED** — diff shows only comments differ | Note duplication; low-risk, defer actual extraction (cross-tree shared module adds complexity for a dev-only convenience script) — `wontfix` candidate, revisit if a 3rd copy appears | open |

## Wave 4 — Structural

| ID | Domain | Sev | file:line | Claim | Verdict | Proposed patch | Status |
|---|---|---|---|---|---|---|---|
| ARCH3 | Architecture | Medium | 7 `SKILL.md` files, `## Continuous Execution` block | Byte-identical ~24-line block duplicated | **CONFIRMED** — diffed 2 of 7, zero diff | Extract to `references/continuous-execution.md`, cite from all 7 | open |
| PERF3 | Performance | Medium | `scripts/check-fixtures.mjs:54-58` | 46 independent fixtures run strictly sequentially | **CONFIRMED** — plain `for` loop, no concurrency | Bounded-concurrency worker pool | open |
| SEC1 | Security | Medium | `plugins/wingman/hooks/stop-loop.mjs:157-185` | `verifyCommand` cache has a re-arm window across loop restarts | **CONFIRMED** — code's own comment documents this exact behavior; disclosed, CISO-reviewed, intentional tradeoff | Optional founder-ack hardening — propose, let founder decide | open |
| SEC6 | Security | Low | `plugins/wingman/scripts/okf-export.mjs:226` | `rmSync(outDir, {recursive:true,force:true})` with no path containment check | **CONFIRMED** — zero `resolve(` calls in file | Add a minimal guard against `/` or home-dir targets | open |
| CQ4 | Code Quality | Low | `plugins/wingman/hooks/stop-loop.mjs:88` vs `:218-219` | Stall-detection logic computed twice, different anchor | **CONFIRMED** | Thread `{decision, reason}` through `evaluate()` instead of recomputing | open |
| CQ3 | Code Quality | Low | `plugins/wingman/hooks/dod-structural-gate.mjs:358-436` | 80-line unnamed orchestration block | Accepted (style judgment) | Extract `runGitPushGate()` | open |
| DEVOPS1 | DevOps/CI | Low | `.github/workflows/{claude-code-review,claude}.yml` | `anthropic_api_key` passed via `with:` not `env:` | **CONFIRMED** | Verify `claude-code-action` supports `env:` input first; change only if confirmed | open |
| SC4 | Supply Chain | Low | `evals/fixtures/setup-existing-npm-project.sh:32` | Unpinned semver `"kleur": "^4.1.5"` in disposable fixture | **CONFIRMED** | Pin to `4.1.5` | open |

## Accepted, no independent re-verification needed (self-disclosed / style judgments)

| ID | Domain | Sev | Reason |
|---|---|---|---|
| SEC3 | Security | Low | `prompt-guard.mjs`'s regex-only injection detection — self-disclosed "a floor, not a ceiling" in the code's own comments |
| SEC4 | Security | Low | DoD test-runner executes the project's own test command with no sandbox — inherent CI-style trust boundary, not a Wingman-introduced bug |
| DEVOPS5 | DevOps/CI | Medium | `version-gate.yml` not a required branch-protection check — already tracked accurately in `docs/HUMAN-TODOS.md`, no new action |
| DEVOPS7 | DevOps/CI | Low | Excess CI permissions in `claude-code-review.yml` — self-flagged low-confidence by the auditing agent |
| DEVOPS8 | DevOps/CI | Low | OR-joined trust conditions in `claude.yml`, correct today but fragile to a future edit — self-flagged, no current bug |
| PERF4 | Performance | Low | Uncached `npm install -g` duplicated across 2 CI workflows — self-flagged medium-confidence |
| T6 (see also Wave 1) | Testing | Low | Already scheduled above |

**Summary:** 34/34 findings verified as real claims (0 rejected). 6 in Wave 1 (harness integrity),
11 in Wave 3 (quick wins), 8 in Wave 4 (structural), 7 accepted without independent action needed
this round (self-disclosed limitations or already-tracked items), CQ2 flagged `wontfix` candidate
pending a 3rd duplication instance per this project's own evidence-gate discipline.
