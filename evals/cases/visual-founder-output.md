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

`authored, pending first run` — both scenarios are specified but not yet executed. Run per
`evals/README.md`: spawn each subagent fresh, grade independently against the real output (the
actual scratch file content for Scenario 1; the actual tool-call record and report text for
Scenario 2), not the subagent's own claim of what it did.

## Run log

(pending — filled in after both scenarios are actually run and independently verified)
