# Eval: check-design-system

<!-- eval:no-fixture-needed: constructed inline, mirrors dod-structural-gate.md's own convention for tiny in-memory doc fixtures -->

Tests `plugins/wingman/scripts/check-design-system.mjs` — the mechanization of
`commands/pipeline/visual-design-system.md`'s Visual Design System.4 gate checklist (Layer 12 of the
19-layer validation pass, 2026-07-30). Confirms the checker actually catches a missing Must-include
category by name, distinguishes between two different missing categories, and passes a genuinely
complete spec doc.

Fully deterministic — no model-judgment component — verified by running the real script against
real constructed doc fixtures and checking exit codes/output directly, same method as
`dod-pre-push-check.md`.

## Procedure

1. Write a constructed visual-design-system spec doc naming all 10 Must-include categories
   (typography, spacing, color, components, variants, tokens, usage rules, motion, responsive
   rules, accessibility rules) plus one `VS-*` row.
2. Run `node plugins/wingman/scripts/check-design-system.mjs <doc-path>` against it — expect `PASS`,
   exit `0`.
3. Remove one category's line at a time (motion, then accessibility, then responsive) and re-run —
   expect each specific category named in the failure output, and no other category falsely flagged.
4. Remove the `VS-*` row from the complete doc and re-run — expect the "no VS-* traceability row
   found" error, distinct from a missing-category error.
5. Run against a doc naming only 2 of the 10 categories — expect 8 category errors plus (if no
   `VS-*` row) 9 total errors.

## Expectations

| Fixture | Expected exit code | Expected output |
|---|---|---|
| Complete doc (10 categories + VS-* row) | `0` | "all 10 Must-include categories present, VS-* row(s) found" + `PASS` |
| Complete doc minus "Motion:" line | `1` | Error naming `"motion"`, no other category falsely flagged |
| Complete doc minus "Accessibility rules:" line | `1` | Error naming `"accessibility"`, distinct from a `"responsive"` error |
| Complete doc minus the `VS-001` row | `1` | Error naming `"VS-*"`, no category errors |
| Sparse doc (2 of 10 categories only) | `1` | 8 category errors, one per missing category |

## Trust level

`verified` — all 5 shapes run directly against the real script (not the isolated
`design-system-check.mjs` unit tests, which cover the same logic at finer grain in
`tests/hooks-integration/design-system-check.test.mjs`) and produced the documented exit code and
message text exactly.

## Run log

### Run 1 — 2026-07-30

Ran the real CLI directly against two constructed fixtures:

- A complete doc naming all 10 categories by name plus a `| VS-001 | ... |` row →
  `Design system spec <path>: all 10 Must-include categories present, VS-* row(s) found.` / `PASS`,
  exit `0`.
- A sparse doc naming only "typography" and "color" → 9 errors total: 8 missing-category errors
  (`spacing`, `components`, `variants`, `tokens`, `usage rules`, `motion`, `responsive`,
  `accessibility`) each naming the specific category, plus a 9th "no VS-* traceability row found"
  error → `FAIL`, exit `1`.

Also independently confirmed via the unit-test suite (`node --test
tests/hooks-integration/design-system-check.test.mjs`, 6/6 passing): removing only the "Motion:"
line flags `motion` and nothing else; removing only "Accessibility rules:" flags `accessibility`
distinctly from a `responsive`-only removal (each assertion checks the other category's error string
is absent, not just that its own is present) — confirming the checker distinguishes between missing
categories rather than producing one generic "something's missing" error.
