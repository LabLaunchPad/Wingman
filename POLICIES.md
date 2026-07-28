# Wingman Policies

A human-facing statement of Wingman's operating principles and permission model. This restates
`plugins/wingman/references/permission-model.md`, which is the version agents actually read at
runtime (this file never ships with the plugin — a founder's installed copy of Wingman has no
`POLICIES.md`, per `plugins/wingman/AGENTS.md`'s "nothing under `plugins/wingman/` may cite a
`docs/`-or-root path for operational logic" rule, which cuts both ways: nothing operational should
depend on this file existing either). **If this file and `permission-model.md` ever disagree, the
shipped reference is correct** — `scripts/check-repo-consistency.mjs` mechanically checks they stay
in sync.

## Operating principles

- Read-only by default; the smallest safe change that satisfies the task.
- Verification before completion — a claim without fresh evidence is not a claim (`verification-before-completion`).
- Human approval for risky or irreversible actions — the founder always makes the final call via
  `AskUserQuestion`; the Boardroom informs the decision, it never makes it (`docs/status/ARCHITECTURE.md` §4).
- Plain-language summaries for every founder-facing decision (`plain-language-checkpoint`).

## Permission model

See `plugins/wingman/references/permission-model.md` for the 5 tiers (Read only / Draft and propose
/ Scoped write / Conditional action / Break-glass), the permission matrix, and which tier maps onto
each `permissions:` frontmatter value.

## Precedence

Nearest repo instructions override broader ones. Project-specific rules override generic Wingman
defaults. Within this project specifically: `plugins/wingman/references/permission-model.md` over
this file; `docs/status/ARCHITECTURE.md` over any prose summary of it elsewhere (`docs/status/GOVERNANCE.md`'s own
stated rule, restated here since it applies just as much to this file).
