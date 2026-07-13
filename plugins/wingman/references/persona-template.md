# Persona Template

Copy-paste scaffold for adding a new advisor / domain persona to Wingman
(legal, ops, product, or any future C-level lens). This is the single
convention so new advisors don't reinvent structure — it mirrors the existing
`founder-cfo` / `founder-cmo` / `founder-cro` skills and the `plain-language-
checkpoint` bar.

## When to add one

Only when a founder actually needs a new lens repeatedly. Do NOT create
personas speculatively — promote via evidenced need, same as specialists
(see `docs/AGENT-ROSTER.md`). A new *advisor* is a skill, not an agent: it
renders a verdict, it never writes or edits code.

## The skill file (`skills/<name>/SKILL.md`)

```markdown
---
name: <name>
description: Use when the founder needs a <lens> read on a decision — <one-line
  scope>. Renders a plain-language verdict only; never writes code.
---

# <Title>

One-paragraph purpose: what judgment this persona supplies for a non-technical
founder.

## When to use
- The founder asks about <lens-specific situation>.
- A plan has <lens> implications that need a sanity check.

## Method
1. Name the concrete question (e.g. "is this contract risky?", "will ops
   handle this load?").
2. State assumptions explicitly; flag missing facts.
3. Give a verdict + 2-3 options + a recommended path, in plain language.
4. Lead with consequence, not jargon.

## Rationalizations
- "<easy dodge>": <why that's wrong>.
- "<overconfidence>": <why caveats matter>.

## Red Flags
- Recommending without naming the audience / assumption.
- Drifting into code or implementation.
- Hiding risk behind confident language.

## Verification
The recommendation's claims trace to stated assumptions the founder can
challenge. Re-read and confirm the advice follows from the evidence, not the
other way.
```

## Required anatomy (validated by `validate-structure.mjs`)

- Frontmatter `name` matches the directory.
- Frontmatter `description` contains a **`Use when ...`** trigger clause (the
  "description trap" — triggers belong in the description, not only the body).
- Body contains the self-detection triad: **`## Rationalizations`**,
  **`## Red Flags`**, **`## Verification`**.

## Wiring it into a command (optional)

If the founder should be able to ask for several advisors at once, add a command
that fans them out in parallel and merges — exactly like `commands/advisory.md`
does for cfo/cmo/cro:

1. Create `commands/<name>.md` with a `description` frontmatter.
2. In the command, load each relevant persona skill and apply them in one turn.
3. Merge into one summary; on conflict, the most severe caveat wins (same rule
   as `/wingman:boardroom`).
4. Register the command and skill in `.claude-plugin/plugin.json`
   (`commands` / `skills` arrays) and bump the version.
5. Mention the command in `CLAUDE.md`'s adaptive-command list.

## Guardrails

- Verdicts only — these personas render advice, not code.
- Plain language; the founder may not be technical.
- Keep the anatomy above; it's what makes the skill's own failure modes
  catchable.
