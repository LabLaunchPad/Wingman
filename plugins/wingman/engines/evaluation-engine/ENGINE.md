# Engine: Evaluation

**Status:** built
**Purpose:** renders the plain-language GO/GO_WITH_CONCERNS/NO_GO verdict at every checkpoint, via
the 8 Boardroom seats, each covering a real slice of a 12-dimension evaluation map. See
`references/evaluation-dimensions.md` for the full map and why it isn't a second numeric score.

## Inputs

Any plan or diff at a pipeline checkpoint, or an on-demand `/wingman:review`/`/wingman:audit`.

## Output artifacts

Per-seat `## <SEAT> VERDICT: <GO | GO_WITH_CONCERNS | NO_GO>` blocks, consolidated into a grouped
Business/Technical/Finance/Research summary by `commands/adaptive/boardroom.md`.

## Members

- `commands/adaptive/boardroom.md`
- `commands/adaptive/audit.md`
- `commands/adaptive/advisory.md`
- `commands/adaptive/review.md`
- `agents/boardroom-ceo.md`
- `agents/boardroom-cfo.md`
- `agents/boardroom-ciso.md`
- `agents/boardroom-cmo.md`
- `agents/boardroom-cpo.md`
- `agents/boardroom-cto.md`
- `agents/boardroom-design.md`
- `agents/boardroom-research.md`
- `skills/code-review/SKILL.md`
- `skills/plain-language-checkpoint/SKILL.md`
- `skills/founder-cfo/SKILL.md`
- `skills/founder-cmo/SKILL.md`
- `skills/founder-cro/SKILL.md`
- `skills/council/SKILL.md`
- `hooks/boardroom-checkpoint.mjs`
- `references/definition-of-done.md`
- `references/persona-template.md`
- `references/evaluation-dimensions.md`

## State read + written

Reads: the plan/diff/artifact under review, plus prior checkpoints for re-litigation context. Writes:
`.wingman/checkpoints.jsonl` — one entry per checkpoint, verdict field mechanically re-checked by
`hooks/boardroom-checkpoint.mjs`'s transcription-match guard.

## Escalation

Any seat's real `NO_GO` blocks unconditionally — never softened to a majority vote or an override
dial (declined three times as a governance regression; see `docs/status/PROJECT.md`).

## Permitted tool tiers

Approve (`references/permission-model.md`, exclusive to Boardroom seats) — this is the only engine
whose agents may render an `approve`-tier verdict.
