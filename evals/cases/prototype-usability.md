# Eval: prototype-usability

Tests `plugins/wingman/commands/pipeline/prototype-usability.md` behaviorally — the 10th of Wingman's
14 pipeline stages, deliberately folding accessibility and content review into the same pass as the
usability check rather than as a separate 15th stage. The distinctive behavior under test: given real
`WF-*` wireframe and `VS-*` design-token content with a genuinely planted accessibility defect and a
genuinely planted usability defect, does the stage actually catch both (not just perform ceremony
around a findings table), rank severity meaningfully rather than flattening everything to the same
level, and record a Boardroom checkpoint with `stage: "prototype-usability"`?

## Fixture

`evals/fixtures/setup-prototype-usability-fixture.sh <target-dir>` — the base waitlist app plus
pre-seeded discovery, define (DEF-001..004), architecture (ARCH-001..004), uxflow (UX-001..002),
wireframes (WF-001..002), and visual-design-system (VS-001..003) artifacts for a waitlist-unsubscribe
feature. The wireframes/design-system content plants two real defects:

- **Accessibility:** WF-002's error message is specified as `color-text-body` (`VS-001`) = `#bbbbbb`
  on `#ffffff` — roughly 1.6:1 contrast, well below WCAG AA's 4.5:1 minimum for normal text, and it is
  the entire content of that screen.
- **Usability:** WF-001's primary action is a circular icon-only button (`VS-003`, "no text label by
  default") showing a refresh/reload glyph, with no accessible name specified, whose actual
  destination ("back to signup form") has no relationship to a reload icon.

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with only `commands/pipeline/prototype-usability.md` (plus whatever
   references it cites) and the pre-seeded project — not told the answer, not hinted at the planted
   defects.
3. Independently verify the real output files against the expectations below.

## Expectations

| Check | Expected |
|---|---|
| Accessibility defect caught | A `PT-*` finding identifies the `#bbbbbb`-on-`#ffffff` contrast failure, citing a real ratio/standard, not a vague "check contrast" placeholder |
| Usability defect caught | A `PT-*` finding identifies the unlabeled/icon-only button as a real usability and/or accessibility problem |
| Both lenses represented | The findings table includes at least one row tagged `usability` and at least one tagged `accessibility` (content lens optional but welcome) |
| Genuine severity ranking | Findings are ranked with real differentiation (e.g. blocking/high/medium/low) — not every finding given the same severity |
| Traceability | Each `PT-*` row links back to the `WF-*`/`VS-*` element it validates |
| Checkpoint recorded | `.wingman/checkpoints.jsonl` gets a new entry with `stage: "prototype-usability"`, a Design-seat verdict reflecting the blocking defects, and a bottom line that is not a bare `GO` given two real blocking issues |
| Gate behavior | The stage's own gate check explicitly marks itself not-yet-passing (blocked / GO_WITH_CHANGES) rather than silently waving through defects it just found |

## Trust level

`provisional` — passed one real run, single scenario, manually graded against the real filesystem.

## Run log

### Run 1 — 2026-07-24 (first dedicated dispatch)

**Setup:** `setup-prototype-usability-fixture.sh` run fresh into `/tmp/wingman-eval-prototype-usability`; confirmed the fixture executes cleanly and produces a real git project with the planted defects verified present in the committed wireframe/design-system docs before dispatch.

**Dispatch (fresh `general-purpose` subagent, given only `commands/pipeline/prototype-usability.md` + its referenced skills/references, not told the answer or hinted at either planted defect):** produced `docs/wingman/prototype-usability/waitlist-unsubscribe.md` with a testable prototype description for both screens, a three-lens test script, a participant profile explicitly including low-vision and keyboard-only personas, and a 7-row `PT-001`..`PT-007` findings table.

**Independently verified** (real filesystem, not the subagent's self-report):

- **Planted accessibility defect caught**: `PT-003` names the exact token (`VS-001`), the exact colors (`#bbbbbb` on `#ffffff`), computes the ratio (~1.6:1) against the real WCAG AA threshold (4.5:1), and marks it **blocking**.
- **Planted usability defect caught**: `PT-002` (accessibility lens: no accessible name, cites WCAG 4.1.2/2.4.4, **blocking**) and `PT-001` (usability lens: icon/action semantic mismatch, **high**) both independently flag the same WF-001 button from different angles — a sharper catch than the fixture's minimum bar.
- **Both lenses represented**: findings table has `usability` (PT-001, PT-004), `accessibility` (PT-002, PT-003, PT-007), and `content` (PT-005, PT-006) rows — all three lenses actually used, not just accessibility.
- **Genuine severity ranking**: 2 blocking, 2 high, 2 medium, 1 low — real differentiation, not flattened.
- **Traceability**: every `PT-*` row's Satisfies column points to a real `WF-*`/`VS-*` ID.
- **Checkpoint**: `.wingman/checkpoints.jsonl` (`cat`'d directly) has one entry with `stage: "prototype-usability"`, `schema_version: 5`, all non-Design seats correctly marked N/A per the command's own note that Design has direct material input here, `design` seat `GO_WITH_CONCERNS` naming both blocking defects by ID, `bottom_line: "GO_WITH_CHANGES"`, `founder_decision: "fix_concerns_first"`.
- **Gate behavior**: the doc's own Gate check section explicitly states "Gate does not pass yet" and marks the stage **blocked** pending PT-002/PT-003, matching `prototype-usability.md`'s "both conditions, not either alone" rule (prototype tested AND accessibility/clarity acceptable) — correctly did not silently pass a gate it had just found blocking defects against.

**No bugs found in `prototype-usability.md` itself this run** — the command's instructions were followed faithfully and produced a genuinely useful, well-differentiated result on first try. No fix was needed. Promoted to `provisional`.
