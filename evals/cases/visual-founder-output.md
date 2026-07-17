<!-- eval:no-fixture-needed: tests a formatting/rendering-tier decision, not a code-manipulation task — a throwaway git project has nothing to seed here. Both scenarios below use fixed, inline synthetic input (a UX-flow table, a set of boardroom seat verdicts), same pattern as cases/boardroom-gate-rule.md and cases/dod-structural-gate.md. -->

# Eval: visual-founder-output

Tests `skills/visual-founder-output`'s capability-detection-first discipline and its two wirings
(`commands/uxflow.md`, `commands/boardroom.md`). The distinctive behavior under test: does the skill
actually check the current session's rendering capability before choosing a format, rather than
assuming, and does the resulting output stay correct (bottom line still leads, table/state never
replaced) in both tiers?

## Scenario 1 — Tier B (no Artifact capability), uxflow.md

**Setup:** run a fresh subagent in a session with no Artifact-publishing tool available (a plain
tool-use session, confirmed by checking its own tool list first). Give it only `commands/uxflow.md`,
`skills/visual-founder-output/SKILL.md`, `references/visual-output-templates.md`, and this UX-flow
table already written to a scratch file:

```markdown
## UX flow

| ID | Screen/state | User can... | Satisfies |
|---|---|---|---|
| UX-001 | Landing page | View pricing, click "Sign up" | ARCH-001 |
| UX-002 | Sign-up form | Enter email, submit | ARCH-001 |
| UX-003 | Dashboard (empty state) | See "create your first project" prompt | ARCH-002 |
```

Ask it to add the visual layer per `uxflow.md`'s "Show the flow, not just the table" step. Not told
which tier to use.

**Expectations:**

| Check | Expected |
|---|---|
| Tier correctly detected | Confirms (in its own reasoning/output) that no Artifact tool is available before choosing Tier B — not just defaulting to it by accident |
| Table untouched | The original `UX-*` table is still present, byte-identical, in the scratch file |
| Diagram added, not substituted | A Mermaid flowchart appears *after* the table, with 3 nodes (UX-001/002/003) and edges matching the "User can..." column |
| Plain-language labels | No raw technical jargon in node labels |

## Scenario 2 — Tier A (Artifact capability present), boardroom.md

**Setup:** run a fresh subagent in a session that genuinely has an Artifact-publishing tool
available (confirmed by checking its own tool list first — a real capability, not simulated). Give
it only `commands/boardroom.md`, `skills/visual-founder-output/SKILL.md`,
`references/visual-output-templates.md`, and these already-collected seat verdicts plus a minimal
`.wingman/state.json`/`checkpoints.jsonl` pair showing Planning Milestone already cleared and Build
as the current stage:

```
CEO: GO — "Solves a real problem, priced right."
CPO: GO — "Scope matches what we agreed."
CMO: GO_WITH_CONCERNS — "Landing copy is generic, worth a pass before launch."
CTO: GO — "Clean, matches the architecture doc."
CISO: GO — "No new attack surface."
CFO: GO — "Well within budget."
Research: GO — "No red flags found."
```

Ask it to produce the consolidated boardroom report. Not told which tier to use, not told the
bottom-line verdict in advance (it must derive `GO WITH CHANGES` itself from the one
`GO_WITH_CONCERNS`).

**Expectations:**

| Check | Expected |
|---|---|
| Tier correctly detected | Confirms an Artifact tool is genuinely present before choosing Tier A |
| Bottom line correct and first | `GO WITH CHANGES` (one `GO_WITH_CONCERNS`, no `NO_GO`), and it's the lead line — not buried after the visual |
| "Where you are" reflects real state | Shows Planning Milestone done, Build current — read from the given state files, not invented |
| Artifact actually produced | A real Artifact call happened (confirm via the actual tool-call record, not the subagent's self-report) and didn't fail silently |
| Text format preserved | The existing emoji-line per-seat text is still present, not replaced by the visual |

## Trust level

`verified` — both differently-shaped scenarios (Tier B forced by real tool absence, Tier A backed
by a real published Artifact) passed on first run, independently checked against the real
filesystem/output rather than either subagent's self-report, per `evals/README.md` and
`verification-before-completion`.

## Run log

### Run 1 — 2026-07-17 (both scenarios, real dispatch)

**Scenario 1 (Tier B, `Explore` subagent — genuinely has no Artifact tool, not simulated):**
correctly detected the absence by searching its own real tool surface ("searched explicitly for
'artifact publish create render'... contains nothing capable of publishing a rendered Artifact"),
concluded Tier B, and produced a Mermaid flowchart per `references/visual-output-templates.md`'s
template. **Independently verified**: `diff`'d the resulting file against the original table —
byte-identical except a blank-line separator before the new heading (correct markdown practice, not
a content change); the diagram's 3 nodes and 2 edges match the table's `UX-*` rows and "User
can..." actions; no raw jargon in labels.

**Scenario 2 (Tier A, `general-purpose` subagent — genuinely has a working Artifact tool):**
correctly detected Tier A by actually calling the Artifact tool and getting a real result back
(not assuming availability from context), derived `GO WITH CHANGES` itself from the 6-GO/1-
GO_WITH_CONCERNS/0-NO_GO input per `boardroom.md`'s own rule, and produced both the required plain-
text report and a real Tier A Artifact. **Independently verified**: fetched the live Artifact URL
(`https://claude.ai/code/artifact/55086d9f-58ed-44e3-8507-25f40c8c0bde`) directly — confirmed it's
a real, rendered page (not a 404/error), the pipeline-status strip matches the given
`state.json`/`checkpoints.jsonl` exactly (Planning Milestone done, Build current, Ship not started,
nothing invented), and the bottom line leads before any visual in the plain-text report.

**Real bug found and fixed as a direct result of this run**: Scenario 2's Artifact reproduced a
seat-verdict vocabulary error — the CMO card read "GO WITH CHANGES" (the aggregate bottom-line
scale) instead of the correct per-seat verdict "GO_WITH_CONCERNS" (visibly disagreeing with the
adjacent plain-text line for the same seat). This traced back to a genuine bug in
`references/visual-output-templates.md` §3's own example, caught independently by a parallel
`code-review` pass on PR #31 the same session and fixed before this log entry — Scenario 2's run
predates the fix and is direct, concrete evidence the bug was real and would have propagated into
actual founder-facing output, not just a theoretical review nitpick. Re-inspection of the (now
corrected) template confirms a fresh run would no longer reproduce this.
