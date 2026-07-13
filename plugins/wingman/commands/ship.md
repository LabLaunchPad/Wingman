---
description: Run preflight checks, open a pull request with a founder-readable summary, and report shipping status in plain language.
argument-hint: "[optional: target branch, defaults to the repo's default branch]"
---

# Wingman: Ship

This is the last stop before code leaves the founder's laptop and becomes real. Nothing here should require the founder to understand git, CI, or pull requests — they get a plain-language "here's what's going out and why" summary and a single decision to make.

$ARGUMENTS

## Preflight checks

Use the `department-lead-activation` skill to check the DevOps activation signal: if this project has CI config, a Dockerfile, or has shipped once already (check `.wingman/checkpoints.jsonl` for a prior `ship` stage entry), create `dept-devops` (if it doesn't exist yet) and delegate the deployment-mechanics portion of this stage to it.

Before shipping, confirm all of the following, and stop with a plain-language explanation if any fail:

1. **Verified** — the build stage's tests/checks passed with fresh evidence (see `verification-before-completion`), and the secure stage cleared with no open risks.
2. **Clean working tree** — no stray uncommitted changes that shouldn't ship (`git status`). If there are unexpected changes, ask the founder before including or discarding them.
3. **On a feature branch** — not committing straight to the default branch. `build.md`'s "Before starting" step checks this out before any commit lands, so this should already be satisfied; if it isn't (e.g. a manual commit landed outside the pipeline), stop and offer to create one now rather than shipping straight from the default branch.
4. **Remote + auth available** — a git remote is configured and, if opening a PR, the `gh` CLI (or the GitHub MCP tools available in this session) can actually create it.

## Push and open the change for review

1. Push the branch.
2. Generate a pull request description written for two audiences at once: a short plain-language summary at the top (what this does, why it matters, what to watch for), followed by the normal technical summary/test plan for anyone who does read code. Follow this repository's PR template if one exists.
3. Open the PR.

## Report in plain language

Tell the founder:

```
## Shipped: <one-line description>

**What's going live:** <plain language>
**Where to see it:** <PR link>
**What happens next:** <e.g. "this needs your approval / a merge click" or "it will merge automatically once checks pass">
```

## Boardroom checkpoint

Run `/wingman:boardroom diff` one last time before merging, so the founder gets a final plain-language go/no-go rather than being asked to interpret CI output themselves — every pipeline stage ends in a checkpoint, `ship` included, not just the "meaningful" ones (that judgment call is exactly the kind of code-review-substitute decision the Boardroom exists so the founder never has to make alone).

## After shipping

Suggest the adaptive stages that make sense next, without forcing them:
- `/wingman:launch` if this is worth telling users/customers about publicly (a changelog entry, docs, or an announcement).
- `/wingman:retro` if this was a substantial piece of work worth reflecting on.
- `/wingman:learn` to capture anything durable that was discovered (a gotcha, a decision, a pattern) so it isn't relearned next time.
- `/wingman:telemetry` if this shipped something worth watching in production.
