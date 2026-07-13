# Retros

## Retro: Wingman vendor-pattern integration (v9–v12) — 2026-07-13

**What went well:**
- TDD discipline held end to end (red → green → refactor); 84/84 tests green, `validate-structure` and `check-repo-consistency` both pass with zero warnings.
- Found and fixed a real bug that had fully broken the plan-mode gate: a template literal in `boardroom-checkpoint.mjs` was closed with `"` instead of a backtick.
- A dead-reference-doc audit surfaced 9 orphaned docs; 5 were promoted into enforced skills (`spec-handler`, `definition-of-done`, `security-checklist`, `testing-patterns`, `doc-index`), closing a genuine quality gap.

**What was harder than expected:**
- Wingman's `vendor/` submodules are pinned but **empty on disk** in this environment — integration had to be design/knowledge-based, not runtime.
- `check-fixtures.mjs` (and eval grading) require `/bin/bash`, which doesn't exist on Windows PowerShell — so 6 v11 eval cases are authored but pending behavioral grading in CI, not locally verifiable here.

**What we'd do differently next time:**
- Wire `// minimal:` debt comments into `DEBT.md` from the first shortcut taken, instead of discovering the `debt-ledger` rule late. (Confirmed: the 13 `// minimal:` occurrences are test-fixture strings, not real debt — but the discipline should still be automatic.)

**Anything for you to know:**
- The Wingman plugin is markdown-only (commands/agents/skills + hook config). A `secure` pass comes back clean because there is no runtime/secret/auth surface — but the stage is still mandatory per the pipeline, and the threat register documents that the hunt was real, not skipped.
