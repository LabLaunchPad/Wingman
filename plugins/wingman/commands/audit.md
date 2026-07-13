---
description: Run a rigorous, multi-angle audit of the current project (or a specified area) on demand, and report findings in plain language.
argument-hint: "[optional: specific area to focus the audit on]"
---

# Wingman: Audit

This is the explicit, on-demand entry point for the level of scrutiny `systematic-auditing` describes — for whenever the founder wants to be sure something holds up, beyond what a single review pass would catch.

$ARGUMENTS

## Run the audit

Follow the `systematic-auditing` skill's Core Workflow: scope into 3–5 distinct concern areas relevant to `$ARGUMENTS` (or the whole project if unspecified), dispatch one narrowly-scoped parallel subagent per concern with an exact file list, and independently verify every finding against the real filesystem or a real execution before trusting it.

## If gaps are found

Fix the highest-leverage ones now, following the same test-first discipline as `/wingman:build` — or log a genuinely larger one via `/wingman:learn` if it's a known tradeoff being accepted for now rather than fixed immediately (mirrors `/wingman:harness`'s same choice).

## Report

```markdown
## Audit: <one-line description of what was audited>

**Bottom line:** <plain language — is this solid, or does it need work first>
**What was checked:** <the concern areas, one line each>
**What was found and fixed:** <bulleted, plain language>
**What's logged for later:** <anything deliberately deferred, and why>
```

Translate every finding through `plain-language-checkpoint`'s bar before it reaches the founder — this report is not the place for raw technical findings.

## References

- `references/orchestration-patterns.md` — the multi-angle parallel audit pattern this command operationalizes.
- `skills/systematic-auditing` — the deeper audit discipline for when a surface needs more than the standard pass.
