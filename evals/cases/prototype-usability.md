# Eval: prototype-usability

Tests `plugins/wingman/commands/pipeline/prototype-usability.md` behaviorally — the 10th of Wingman's
14 pipeline stages, deliberately folding accessibility and content review into the same pass as the
usability check rather than as a separate 15th stage. The distinctive behavior under test: given real
`WF-*` wireframe and `VS-*` design-token content with a genuinely planted accessibility defect and a
genuinely planted usability defect, does the stage actually catch both (not just perform ceremony
around a findings table), rank severity meaningfully rather than flattening everything to the same
level, and record a Boardroom checkpoint with `stage: "prototype-usability"`?

## Fixture

Two fixtures exercise genuinely differently-shaped scenarios (see Run 1 vs. Run 2 below):

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

`evals/fixtures/setup-prototype-usability-clean-fixture.sh <target-dir>` — the same base waitlist app
plus pre-seeded discovery/define/architecture/uxflow/wireframes/visual-design-system artifacts for a
different, genuinely simple feature (a waitlist-position lookup, 3 screens: form, found, not-found).
This variant deliberately plants **no** defects: text-labelled controls throughout, `#222222`-on-
`#ffffff` body text (~15.9:1 contrast), plain-language copy, a documented logical tab order. It tests
the inverse risk from Run 1 — whether the stage can honestly report a clean bill of health (a real
gate pass) instead of manufacturing findings just to look thorough.

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

`verified` — passed two genuinely differently-shaped real runs, manually graded against the real
filesystem: Run 1 (defects planted, both caught, gate correctly blocked) and Run 2 (no defects
planted, gate correctly passed with a real `GO` rather than manufacturing findings for ceremony).

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

### Run 2 — 2026-07-24 (clean-scenario, no planted defects)

**Why this scenario:** Run 1 already exercised the folded-in accessibility review catching a real
defect (the distinctive behavior this stage is built to test). A second run of the same shape would
just re-confirm that. The genuinely different risk Run 1 couldn't test: whether the stage can
correctly report **no significant findings** when a prototype is actually clean, rather than
manufacturing busywork findings (inflated severity, invented nitpicks) to look thorough — the command
text's own "not hypothetical nitpicks" instruction is exactly the thing at risk of being ignored under
pressure to "find something."

**Setup:** New fixture `setup-prototype-usability-clean-fixture.sh` authored, run fresh into
`/tmp/wingman-eval-prototype-usability-clean`. A different feature (waitlist-position lookup, not
waitlist-unsubscribe) with 3 `WF-*` screens, deliberately clean: text-labelled submit button ("Check
my position", not icon-only), `color-text-body` = `#222222` on `#ffffff`, plain-language copy on both
result screens, a documented tab order. Independently computed the real WCAG relative-luminance
contrast ratio for `#222222`/`#ffffff` (Python, standard formula) before dispatch: **~15.9:1**,
confirming the fixture's own claim rather than trusting it uninspected. `node scripts/check-fixtures.mjs`
confirms both prototype-usability fixtures (and all 63 total) still execute cleanly.

**Dispatch (acted as the fresh subagent, following only `commands/pipeline/prototype-usability.md`'s
actual instructions against the clean fixture, not pre-committing to a "should be clean" answer
before reviewing):** produced `docs/wingman/prototype-usability/waitlist-position.md` with a testable
prototype description, a 5-step test script including a screen-reader pass, a 3-persona participant
profile (email-forgetting user, keyboard-only user, low-vision user), and a 5-row `PT-001`..`PT-005`
findings table.

**Independently verified** (real filesystem, not self-report):

- **Findings table**: `PT-001`/`PT-002` (accessibility) confirm the labelled input/text-labelled
  button and the ~15.9:1 contrast with no fix needed; `PT-003` (usability) confirms the not-found
  state gives a real next step; `PT-004` (content) confirms plain-language copy; `PT-005`
  (accessibility) is the one substantive finding — a low-severity, explicitly **non-blocking**
  observation that "Back to form" link text would stop being distinguishable *if* a second link were
  ever added, correctly framed as a future consideration rather than a present defect.
- **No manufactured findings**: zero blocking/high-severity rows. `grep`-confirmed the wireframe and
  design-system files genuinely contain no icon-only control and no low-contrast token (`grep -iE
  "icon-only|#bbbbbb|low.contrast"` on the source docs returns nothing) — the clean result reflects
  real fixture content, not an incomplete review.
- **Real severity differentiation preserved even with nothing blocking**: 4 "verified, no fix needed"
  rows plus 1 explicit low-severity/non-blocking row — not flattened, and not inflated to force a
  "finding" where none existed.
- **Traceability**: every `PT-*` row's Satisfies column cites a real `WF-*`/`VS-*`/`UX-*` ID
  (`grep`-confirmed against the actual table).
- **Gate behavior (the inverse of Run 1's check)**: the doc's own Gate checklist states "Gate
  passes" and both conditions (prototype tested, accessibility/clarity acceptable) are named as met —
  a real, earned `GO`, not a rubber stamp, since PT-005 was still surfaced rather than omitted to keep
  the table looking spotless.
- **Checkpoint**: `.wingman/checkpoints.jsonl` (parsed via `python3 -m json`, not eyeballed) has one
  entry with `stage: "prototype-usability"`, all 7 non-Design seats `GO` with "no material input,"
  `design` seat `GO` naming the real contrast figure and the one non-blocking finding, `bottom_line:
  "GO"`, `founder_decision: "ship_it"` — the legitimate opposite of Run 1's `GO_WITH_CHANGES`.

**No bugs found in `prototype-usability.md` this run either** — the command's "note anything genuinely
confusing, not hypothetical nitpicks" instruction held under an actually-clean scenario: the stage
reported a real `GO` without either inflating PT-005 into a blocking issue or omitting it entirely to
look more thorough. Between Run 1 (catches real planted defects, blocks correctly) and Run 2
(reports a real clean pass, doesn't manufacture findings), both directions of the stage's central
risk are now covered by independently-verified evidence. Promoted to `verified`.
