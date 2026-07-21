# Eval: learn

Tests `plugins/wingman/commands/adaptive/learn.md` — its low-ceremony `LEARNINGS.md` capture discipline: one file, plain language, append-only, only durable facts.

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

`verified` — passed one positive run (new learning captured correctly) and one negative run (duplicate correctly recognized and not double-logged).

## Run log

### Pending — scheduled behavioral eval workflow

Graded via `.github/workflows/evals.yml` (requires `ANTHROPIC_API_KEY` + `/bin/bash`, unavailable in this authoring environment). Case defined to the verified-case format above; grade on next weekly run and record the actual result here.

### Run 2 (2026-07-16) — negative case: duplicate/repeat, not a new learning

Manually graded, ad hoc fixture (not `evals/fixtures/`): a scratch Node "waitlist app" project seeded with an existing `LEARNINGS.md` already containing one dated entry — "Mailgun sandbox domain silently caps outbound mail at 5/hour" (2026-05-14), plus `src/mailer.js`/`src/waitlist.js` reflecting that same constraint in code. A fresh subagent, scoped only to `learn.md` and this fixture, was told (in a founder's own words, differently phrased, no mention of Mailgun/5-per-hour/sandbox) about a new incident: welcome emails silently stopped sending during manual load testing, no errors logged, requests still returned 200.

The subagent correctly traced the incident to the same underlying Mailgun sandbox cap already on file, judged it a repeat rather than a new learning, and made **no edit** to `LEARNINGS.md` — consistent with `learn.md`'s instruction not to log facts already captured. Independently verified by diffing `LEARNINGS.md` byte-for-byte against the pre-run fixture (identical, confirmed via `md5sum`) and confirming no files outside the scratch fixture were touched (`git status --porcelain` on the Wingman repo came back empty). The subagent's own summary named the exact existing entry it matched against, rather than a vague "seems familiar" — good evidence it read and reasoned over the existing file rather than guessing.

This confirms `learn.md` avoids the double-logging trap seen elsewhere in this project (`evolve-promotion`) — at least for a duplicate that is textually and mechanistically obvious once read. It does not test a harder paraphrase (e.g. same root cause described with no shared nouns at all, or a duplicate buried among many existing entries), which would be a reasonable next case if this command shows drift later.
