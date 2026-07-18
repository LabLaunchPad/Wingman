# Contributing to Wingman

Wingman's "code" is markdown (commands/agents/skills) plus a hooks config — there's no build step
and no traditional unit-test runner. Read [`CLAUDE.md`](CLAUDE.md) first; it's the canonical guide
for working in this repo (both for Claude Code sessions and for a human maintainer, since the two
need the same context here). This file only covers what's specific to opening an issue or PR.
Participation here is governed by the [Code of Conduct](CODE_OF_CONDUCT.md).

## Before you start

- **Structural changes** (new command, agent, skill, or department) — read
  [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) first for the activation-signal model, and
  [`docs/AGENT-ROSTER.md`](docs/AGENT-ROSTER.md) before adding any specialist subagent. Specialists
  are promoted via `/wingman:evolve` on evidenced, repeated need — not created speculatively. The
  [feature request template](.github/ISSUE_TEMPLATE/feature_request.yml) reflects this bar.
- **Bug fixes** — [the bug report template](.github/ISSUE_TEMPLATE/bug_report.yml) asks which
  surface is affected (command/skill/hook/validator/eval/doc) because the fix mechanics differ a lot
  by surface. If you're not sure, say so in the issue rather than guessing.
- **Audit findings** you're not fixing immediately — use the
  [audit finding template](.github/ISSUE_TEMPLATE/audit_finding.yml), which mirrors
  `systematic-auditing`'s "fix now or log it as a durable follow-up" rule.

## Before opening a PR

Run the four mechanical validators — all must exit 0:

```
node plugins/wingman/scripts/validate-structure.mjs
node scripts/check-repo-consistency.mjs
node scripts/check-fixtures.mjs
node plugins/wingman/scripts/check-traceability.mjs
```

If `plugins/wingman/`'s shipped content changed (skills, commands, agents, hooks), bump
`plugins/wingman/.claude-plugin/plugin.json`'s `version` — `version-gate` CI blocks merges
otherwise. Add a matching entry to [`CHANGELOG.md`](CHANGELOG.md).

If you changed a skill's actual instructions (not just prose), the corresponding behavioral eval
case in `evals/cases/` needs re-running and independent grading — see
[`evals/README.md`](evals/README.md). There's no per-case flag; grading is a fresh subagent run
against the fixture, graded by a human or independent reviewer, not the tested agent's own
self-report.

The [PR template](.github/PULL_REQUEST_TEMPLATE.md) walks through all of this as a checklist.

## AI-agent contributions

This project is built largely by AI coding agents (Claude Code sessions doing planning,
implementation, and auditing), and that's expected, not a special case requiring extra process.
The bar is the same either way: every claim in an issue or PR ("this validator passes," "this fixes
the bug") needs to be something actually observed — real command output, a real diff, a real eval
run — not a subagent's or tool's self-report. Both the issue and PR templates have an authorship
disclosure checkbox for exactly this reason: not to gatekeep agent contributions, but so a reviewer
knows whether "verified" means "a human checked it" or "an agent checked it against real output,"
which is still real verification, just worth naming.

## Getting help

For "how does X work" questions, check `CLAUDE.md` and `docs/ARCHITECTURE.md` first, then use
[Discussions](https://github.com/LabLaunchPad/Wingman/discussions) rather than opening an issue.
For a security vulnerability, see [`SECURITY.md`](SECURITY.md) — do not open a public issue.
