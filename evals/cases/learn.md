# Eval: learn

Tests `plugins/wingman/commands/learn.md` — its low-ceremony `LEARNINGS.md` capture discipline: one file, plain language, append-only, only durable facts.

## Fixture

`evals/fixtures/setup-waitlist-app.sh <target-dir>` — a realistic Node/Express waitlist app (server, route, test). Provides a concrete codebase with genuine, capturable facts (e.g. an unusual constraint in `src/waitlist.js`).

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with `learn.md` and the fixture path — not told what to log. Ask it to capture one durable learning genuinely implied by the codebase (e.g. a non-obvious constraint a future session would otherwise rediscover the hard way), in its own words.
3. Independently verify the real `LEARNINGS.md` file at the project root against the filesystem — never trust the subagent's claim of "captured" alone.

## Expectations

| Check | Expected |
|---|---|
| Creates `LEARNINGS.md` at project root with a one-line purpose header if absent | Yes |
| Appends a dated entry (`### <YYYY-MM-DD> — <short title>`) | Yes |
| Entry is 1-3 sentences, plain language, states why it matters | Yes |
| Captures a *durable, non-obvious* fact, not a routine/obvious/transient one | Yes |
| Append-only — does not rewrite or replace prior content | Yes |
| Confirms to founder in one sentence what was captured and where | Yes |

## Trust level

`provisional` — passed at least one real run (single scenario), manually graded. Promote to `verified` after a negative case confirms it refuses to log an obvious/transient fact.

## Run log

### Pending — scheduled behavioral eval workflow

Graded via `.github/workflows/evals.yml` (requires `ANTHROPIC_API_KEY` + `/bin/bash`, unavailable in this authoring environment). Case defined to the verified-case format above; grade on next weekly run and record the actual result here.
