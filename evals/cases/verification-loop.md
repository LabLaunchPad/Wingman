# Eval: verification-loop

Tests `plugins/wingman/skills/verification-loop/SKILL.md` behaviorally. This skill runs a comprehensive 8-phase verification after code changes.

## Fixture

A minimal TypeScript project with: (1) a type error in `src/utils.ts` (string assigned to number), (2) a lint warning (unused variable), (3) a failing test in `tests/add.test.ts`, (4) a hardcoded API key in `src/config.ts`.

## Procedure

1. Give a fresh subagent only the skill file and the project directory.
2. Instruct it to run the verification loop.
3. Verify it catches all issues across all phases.

## Expectations

| Check | Expected |
|---|---|
| Build phase run | The subagent attempts to build the project |
| Type check phase run | The subagent runs the type checker and reports the type error |
| Lint phase run | The subagent runs the linter and reports the unused variable |
| Test phase run | The subagent runs tests and reports the failure |
| Security phase run | The subagent detects the hardcoded API key |
| Report produced | A structured verification report is produced with pass/fail per phase |
| Overall status correct | The report correctly states "NOT READY" due to failures |

## Trust level

`verified` — Run 1 passed all expectations.

## Run log

### Run 1 — 2026-07-15

**Setup:** No fixture script exists for this case, so the fixture was built by hand in a scratch dir (minimal TS project, not committed to the repo): `src/utils.ts` with `export const maxRetries: number = "5";` (type error) plus an unused-variable warning (`unusedVar` inside an otherwise-unused `unusedHelper()`, flagged via a local `@typescript-eslint/no-unused-vars` flat-config eslint setup — lint *was* trivially available, no need to skip), `src/config.ts` with a hardcoded `sk_live_...`-style API key literal, and `tests/add.test.ts` with `assert.strictEqual(add(2, 2), 5)` (deliberately wrong, using Node's built-in `node --test` runner). `package.json` wired `build`/`typecheck`/`lint`/`test` scripts to `tsc`, `tsc --noEmit`, `eslint`, and `node --test` respectively.

**Procedure:** Spawned a fresh general-purpose subagent given only the path to `plugins/wingman/skills/verification-loop/SKILL.md` and the path to the scratch project directory, instructed to read the skill and run the verification loop, with no other repo context.

**Result — the subagent's actual report:**

```
VERIFICATION REPORT
==================

Build:     FAIL (src/utils.ts(6,14): TS2322 - Type 'string' is not assignable to type 'number')
Types:     FAIL (1 error) — same TS2322 on maxRetries: number = "5"
Lint:      PASS (0 errors, 1 warning: 'unusedVar' assigned but never used, @typescript-eslint/no-unused-vars, src/utils.ts:10)
Tests:     FAIL (0/1 passed, coverage N/A — no coverage tool configured)
Security:  FAIL (2 issues: hardcoded live-looking API key literal in src/config.ts:2 "sk_live_51H8x..."; console.log in production code path src/utils.ts:11 inside unusedHelper)
Diff:      3 files reviewed (src/config.ts, src/utils.ts, tests/add.test.ts) — no git history available to diff against, reviewed as full files
Bloat:     2 tags found — #delete/#yagni on unusedHelper() in src/utils.ts (dead code); #stdlib/#shrink candidate on its unusedVar
Debt:      N/A (debt-ledger not run in this project)

Overall:   NOT READY for next step

Issues to Fix:
1. src/utils.ts:6 — maxRetries is typed number but assigned the string "5" ...
2. tests/add.test.ts:6 — test asserts add(2,2) === 5, mathematically wrong ...
3. src/config.ts:2 — hardcoded live-pattern API key literal committed in source ...
4. src/utils.ts:11 — console.log left in a function that ships in production code ...
5. src/utils.ts:9-12 — unusedHelper() is dead code ...
```

**Expectations check:**

| Check | Result |
|---|---|
| Build phase run | Pass — ran `npm run build` (`tsc -p tsconfig.json`), reported FAIL with the exact TS2322 line |
| Type check phase run | Pass — ran `npm run typecheck`, correctly identified and quoted the type error |
| Lint phase run | Pass — ran `npm run lint` (eslint flat config), correctly reported the `unusedVar` unused-variable warning by name and line |
| Test phase run | Pass — ran `npm test` (`node --test`), correctly reported 0/1 passed and identified the assertion as the wrong side (test bug, not implementation bug) |
| Security phase run | Pass — correctly flagged the hardcoded `sk_live_...` API key literal (plus, as a bonus, a stray `console.log`) |
| Report produced | Pass — structured report matches the skill's exact Output Format template, including phases 6-8 (Diff/Bloat/Debt) which it ran and reported honestly as N/A/reduced-scope where the project had no git repo or debt-ledger history |
| Overall status correct | Pass — report states `Overall: NOT READY for next step`, consistent with 3 of 5 core phases failing |

No gaps found. The subagent also did not stop early after the first failing phase (build) — it continued through all 8 phases per the skill's "Anti-Rationalization Defense" and "Continuous Execution" sections, which is the harder-to-fake behavior this eval is really probing for.
