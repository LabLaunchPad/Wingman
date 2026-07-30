# Engine: Research

**Status:** built
**Purpose:** grounds a decision in real evidence — named pioneers, fetched sources, competitive
awareness — before it gets built, and enforces that ordering for Wingman's own dev-repo development.

## Inputs

A capability about to be built (a command, skill, hook, or engine layer), or a founder decision that
needs competitive/technical-landscape context.

## Output artifacts

`RS-*` research-synthesis findings (founder-facing, per `commands/pipeline/research-synthesis.md`);
`research/<domain>/TRUTH-<capability>.md` documents (maintainer-facing, dev-repo-only, following the
locked 5-study framework in `research/template-truth-doc.md`).

## Members

- `commands/pipeline/research-synthesis.md`
- `commands/adaptive/research.md`
- `skills/research/SKILL.md`
- `skills/research-gate/SKILL.md`

## State read + written

Reads: the founder's stated problem, prior `research/*.md` documents. Writes: `RS-*` rows tracing to
`DISC-*`; `TRUTH-*.md` documents (dev-repo-only, never shipped — see `research/README.md`).

## Escalation

`skills/research-gate` blocks forward progress and names the specific missing study when a genuinely
new capability has no completed research — never a generic "needs more research."

## Permitted tool tiers

Read-only / draft (`references/permission-model.md` Level 0-1) — research never writes production
code or infrastructure.
