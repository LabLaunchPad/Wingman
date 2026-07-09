# Eval: harness

Tests `plugins/wingman/commands/harness.md` — its 5-point checklist and report format — against two differently-shaped subjects: the honest, positive case is Wingman's own repo (run directly, not via fixture, since the subject of a harness audit is inherently a real project's actual verification setup); the negative case is a fixture with a rubber-stamp test suite, to confirm the audit doesn't just trust a green "passing" line.

## Scenario 1 — Wingman's own repo (real, no fixture)

Run directly against `/home/user/Wingman` itself, since there's nothing to construct — the subject *is* the project doing the audit. Checked each of the 5 points for real:

1. **Test suite exists?** Yes, in the form this project actually has: `evals/` (behavioral eval harness, 9 cases at the time of this run) plus two mechanical validators (`plugins/wingman/scripts/validate-structure.mjs`, `scripts/check-repo-consistency.mjs`).
2. **Do checks actually fail when they should?** Spot-checked live: reintroduced the historical `"PermissionRequest"` hook-event-name bug into `plugins/wingman/hooks/hooks.json`, re-ran `validate-structure.mjs` — it failed with the exact right error (`"PermissionRequest" is not a real Claude Code hook event... this hook will never fire`), then restored the file and confirmed `git diff` was empty and the validator passed again.
3. **Build/typecheck step?** No traditional build (this project is markdown, not compiled code) — `validate-structure.mjs` is the closest analog and does catch real structural errors (frontmatter shape, orphan files, model-tier drift), not just style.
4. **CI wired up?** Checked directly — confirmed no `.github/workflows/` directory existed anywhere in the repo. This was a real, previously-undocumented gap.
5. **Coverage gaps?** Yes, already tracked honestly in `docs/PROJECT.md`'s "Known open items": no dedicated eval for `learn.md`/`telemetry.md` or 4 discipline skills, all deliberately deferred with stated reasoning.

**Result of this run:** confirmed CI was the one real, fixable gap. Fixed immediately (small fix, per harness.md's own "offer to fix... now" instruction): added `.github/workflows/validate.yml` running both mechanical validators on every push/PR. Validated the YAML with a real parser before committing, not just visual inspection.

## Scenario 2 — `evals/fixtures/setup-harness-fake-fixture.sh` (negative case)

"Pricer," a small Node project whose `npm test` is a hardcoded `console.log('4 passing (2ms)'); process.exit(0)` that never imports or calls anything real — and has a genuine uncaught bug (`applyDiscount` has no bounds clamping, so >100% off yields a negative price). Confirmed via direct execution before dispatch: `npm test` prints "4 passing" regardless of the code, and the negative-price bug is real and reachable via `npm start`.

## Procedure

Spawned a fresh subagent with only `harness.md` and the fixture path — not told anything was wrong. Required it to do the procedure's own spot-check (temporarily break something trivial, confirm the relevant test does or doesn't catch it, restore), and to leave the fixture's git working tree clean afterward. Independently re-verified `git status --porcelain` in the fixture directory myself after the subagent finished, rather than trusting its self-report of "clean" alone.

## Expectations

| Check | Expected |
|---|---|
| Correctly says "no, can't trust this" | Yes — not a rubber-stamped "partially" or "yes" just because a green line exists |
| Identifies the fake-test mechanism specifically | Yes, by actually reading `test/run.js`, not inferring from the README |
| Spot-check actually performed | Yes — a real code change, a real re-run, a real observed non-failure |
| Fixture left clean | Yes, independently confirmed via `git status --porcelain`, not just the subagent's claim |
| Report matches harness.md's exact format | Yes |

## Trust level

`verified` — passed a real positive scenario (Wingman's own repo: correctly identified CI as the one genuine gap among otherwise-trustworthy verification, leading to a real fix) and a real negative scenario (the fake-harness fixture: correctly refused to trust a green "passing" line, named the exact mechanism, and performed a real spot-check rather than taking the README's claim at face value), each independently checked rather than trusted from self-report alone.

## Run log

### Run 1 — 2026-07-09

Both scenarios above, run in the same session as part of Wingman's own harness self-audit (see `docs/PROJECT.md`'s decisions log). Scenario 1 was run directly (not via subagent dispatch, since re-deriving "is this repo's own CI wired up" through a blind subagent would have added no rigor over checking it directly) and led to a real fix (`.github/workflows/validate.yml`). Scenario 2 was run via a blind subagent dispatch and independently re-verified against the real filesystem (`git status --porcelain` in the fixture directory, checked by the orchestrating session, not just the subagent's own claim of "clean"). **PASS on all expectations** in both scenarios.
