# Eval: wireframes

Tests `plugins/wingman/commands/pipeline/wireframes.md` behaviorally — the eighth of Wingman's 14
pipeline stages. The distinctive behavior under test: does the command produce a `WF-*`-tagged
low-fidelity screen-layout table where each row cites a real `UX-*` state, regions are genuinely
specific to what that screen actually needs (not a copy-pasted generic template), and record its own
solo Boardroom checkpoint against its stage-specific gate (layout clear and usable)?

## Fixture

`evals/fixtures/setup-wireframes-fixture.sh <target-dir>` — the base waitlist app with pre-seeded
discovery, define (`DEF-001..004`), architecture (`ARCH-001..004`, including `ARCH-004`, the one
user-facing decision: a server-rendered unsubscribe confirmation page), and uxflow output with two
distinct `UX-*` states both tracing to `ARCH-004`: `UX-001` (success confirmation) and `UX-002`
(not-found confirmation).

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with `commands/pipeline/wireframes.md` (and its referenced
   `pipeline-gate-checklist.md` / `visual-founder-output` skill) and the pre-seeded discovery +
   define + architecture + uxflow docs, not told the expected answer.
3. Independently verify the output against the expectations below by reading the real files the
   subagent produced, not its self-report.

## Expectations

| Check | Expected |
|---|---|
| `WF-*` table produced | `docs/wingman/wireframes/<slug>.md` contains a `WF-*` table with region-by-region layout |
| Real evidence citation | `WF-001` cites `UX-001`, `WF-002` cites `UX-002` — no fabricated IDs |
| Screen-specific regions | The success screen's regions differ meaningfully from the not-found screen's (not the identical layout with only the heading text swapped) |
| 8-part gate output | Phase summary, decisions, open issues, risks, gate check (pass/fail per item), gap register updates, carry-forward items, go/no-go status all present |
| Checkpoint recorded | `.wingman/checkpoints.jsonl` has an entry with `"stage": "wireframes"` and a bottom-line verdict |

## Trust level

`verified` — Run 1 (positive: a real UI surface, 2 distinct `UX-*` states) plus Run 2 (negative:
zero user-facing surface, confirming the stage correctly skips entirely rather than manufacturing
screens) — two genuinely differently-shaped scenarios, independently verified against the real
filesystem.

## Run log

### Run 1 — 2026-07-24 (dedicated wireframes-only dispatch)

**Setup:** `setup-wireframes-fixture.sh`'s base fixture (waitlist app + discovery + define +
architecture with ARCH-004 + uxflow with UX-001/UX-002).

**Dispatch** (fresh `general-purpose` subagent, given only `commands/pipeline/wireframes.md` + its
referenced `pipeline-gate-checklist.md` and `visual-founder-output`, not told the answer): activated
`dept-design` (first activation check in this fixture run — no prior `.wingman/state.json` existed),
correctly checked and skipped Management Board activation (only 1 conditionally-activated department
lead, below the 3+ threshold). Produced `docs/wingman/wireframes/waitlist-unsubscribe.md` with a
2-row `WF-001`/`WF-002` table (`WF-001` satisfies `UX-001`, `WF-002` satisfies `UX-002`), ASCII
Tier-B layout sketches, the pipeline-status tree, and the full 8-part gate output. Also published a
Tier-A Artifact (a bordered-box HTML sketch rendering both screens side by side, no color system since
that's Visual Design System's job, not this stage's) — fetched live and confirmed real (not a
404/error): `https://claude.ai/code/artifact/907b2cf4-90e6-4e35-8656-93f16db2bf4f`. Recorded a
checkpoint into `.wingman/checkpoints.jsonl` (`bottom_line: "GO"`, `founder_decision: "ship_it"`,
`next_stage: "visual-design-system"`) and the accompanying full-detail file, since no real invokable
`/wingman:boardroom` exists inside a subagent dispatch — disclosed this synthesis explicitly.

**Independently verified** (real filesystem, not the subagent's self-report):
`docs/wingman/wireframes/waitlist-unsubscribe.md` — confirmed `WF-001`/`WF-002` cite the real
`UX-001`/`UX-002` IDs; confirmed the two screens' regions are genuinely distinct — `WF-001` (success)
includes a confirmation icon/message and a "back to site" link, `WF-002` (not-found) includes an
explanatory not-found message and the same "back to site" link but no confirmation icon, matching the
two states' actually different purposes rather than a copy-pasted template with swapped text.
Confirmed `.wingman/traceability.json` correctly advanced past `WF-001`/`WF-002` and stayed consistent
with the pre-seeded `DEF`/`ARCH`/`UX` counters. Confirmed `.wingman/checkpoints.jsonl` — one real
`schema_version: 5` entry, `"stage": "wireframes"`, `details_ref` pointing at a checkpoint-details
file that genuinely exists on disk with unabridged seat verdicts.

**No bugs found in `wireframes.md` itself this run** — the screen-specific region breakdown, the
correct `UX-*` citation, and the gate-checklist output all behaved exactly as the command spec
requires on first try. `provisional` pending a second, differently-shaped scenario (e.g. a UX flow
with 3+ states including a loading/empty state, to confirm state coverage genuinely scales rather
than only being tested at 2 states).

### Run 2 — 2026-07-24 (negative case: zero user-facing surface)

**Setup:** new fixture `evals/fixtures/setup-wireframes-fixture-negative.sh` — same waitlist base
app, but this time a pure-API feature (waitlist CSV export) where discovery/define/architecture are
all backend-only. `docs/wingman/architecture/waitlist-export.md` has three decisions, none of them
user-facing: `ARCH-001` (`toCsv(entries)`, a pure formatting function), `ARCH-002` (`GET
/waitlist/export.csv` behind a bearer token), `ARCH-003` (401 JSON error on bad/missing token).
`docs/wingman/uxflow/waitlist-export.md` is pre-seeded exactly as `uxflow.md` documents it should
behave when there's nothing to do: "This project has no user-facing surface... Skipping UX flow
entirely; no UX-* IDs minted." No `.wingman/state.json` and no `.claude/agents/` exist yet — nothing
in the chain has ever activated Design. This is the one shape Run 1 never touched: Run 1's fixture
had `dept-design` already active from uxflow; this one deliberately has it inactive because the
underlying signal (frontend framework, HTML templates, or a UI component directory) is genuinely
false — confirmed directly (`grep -il "html|template|jsx|tsx|react|vue"` over `src/` and
`package.json` returned nothing; `src/` contains only `server.js` and `waitlist.js`, a JSON API).

**Dispatch** (acted as the fresh subagent myself, following only `wireframes.md`'s actual text, not
told the answer in advance): per "Confirm the Design department is active," checked the Design
activation signal against the real fixture and found it false — no frontend framework, no HTML
templates, no UI component directory, and `uxflow.md`'s own prior output already recorded the same
conclusion. Per the command's own text ("If there's no user-facing surface, skip this step (and the
rest of this stage) entirely and say so in one plain sentence"), stopped immediately: did not create
`dept-design`, did not run the Management-Board-activation check (correctly gated behind "only if
`dept-design` is active"), did not sketch any `WF-*` rows, did not invoke `visual-founder-output`,
did not run the gate checklist, and did not record a checkpoint. Output was the one plain sentence:
"This project has no user-facing surface, so I'm skipping the wireframes stage entirely (no `WF-*`
screens to sketch, no checkpoint to record)."

**Independently verified** (real filesystem, not self-report, checked after the dispatch): `ls
docs/wingman/wireframes` — directory does not exist. `ls .claude/agents` — does not exist (no
`dept-design` created). `ls .wingman` — does not exist (no `state.json`, no `checkpoints.jsonl`).
`git status --short` — clean, zero side effects of any kind. Every one of these is exactly the
expected outcome of a genuine skip: no fabricated screens, no spurious department-lead creation, no
checkpoint recorded for a stage that did nothing.

**No bugs found this run** — `wireframes.md`'s skip clause is a faithful mirror of `uxflow.md`'s own
documented skip behavior, and it held on first try against a fixture with a genuinely false Design
signal (not just an absent one — the underlying codebase evidence was checked directly, not assumed).
Combined with Run 1's positive 2-state scenario, this closes the negative-case requirement for
`verified`: **promoted to `verified`.**
