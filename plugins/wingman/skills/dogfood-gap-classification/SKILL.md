---
name: dogfood-gap-classification
description: Use inside /wingman:dogfood's maintainer mode only — classifies each observed_gaps entry from a real dogfood run into hook, skill, command-instruction, or out-of-scope, and drives an approved fix through implementation, reproduction, eval coverage, and a retro. Never runs from a founder's installed copy of the plugin. Triggers whenever a maintainer-mode dogfood run's observed_gaps array is non-empty.
---

# Dogfood Gap Classification

## Overview

Two real dogfooding passes of Wingman's own 7-stage pipeline (see `docs/wingman/retros.md`,
2026-07-14) found real bugs that no structural review of the plugin's files would have caught, and
also surfaced something subtler: the executing agent followed several good practices during those
runs (proper test-cleanup discipline, deliberately reproducing a bug against its own fixture before
trusting a fix, running both a zero-signal and a signal-rich scenario) that aren't written down
anywhere in Wingman's own commands/skills/hooks. A different agent, or a less careful run, might not
reproduce them. This skill is the mechanism that closes that gap — for `/wingman:dogfood`'s
`observed_gaps` output specifically, and adaptively: not everything should become a rigid hook, and
not everything should stay a judgment call.

**This is the mirror image of `evolve-promotion`, not a variant of it.** `evolve-promotion`
promotes repeated *founder-project* friction into the founder's own `.claude/` directory and
**never** writes to `plugins/wingman/`. This skill does the opposite: it promotes a genuine
*pipeline-behavior* gap found via dogfooding into Wingman's own `plugins/wingman/` directory, and it
**never** runs from a founder's installed copy of the plugin — only from Wingman's own dev-repo
checkout (see `commands/dogfood.md`'s Step 1 mode detection). If you're not sure which one applies,
check the write target: founder's `.claude/` → `evolve-promotion`; Wingman's own `plugins/wingman/`
→ this skill.

**Core principle:** the plugin should get better at catching what a good agent actually does,
without over-hardcoding — a rule that's too rigid silently blocks legitimate work (this project's
own history: `boardroom-checkpoint.mjs` v12.1's fail-closed over-block, the
`management-board-activation` threshold that fired on every project regardless of real complexity).
Classify by what the gap actually needs, not by reflex toward the strongest-sounding enforcement.

## When To Use

Only from inside `/wingman:dogfood`'s maintainer mode, when a run's `observed_gaps` array is
non-empty. Never from founder mode. Never as a standalone invocation outside a real dogfood run —
this skill classifies real, evidenced gaps, not speculative ones.

## Core Workflow

**1. Read the `observed_gaps` entry** (`description`, `stage`, `evidence`) from the dogfood run's
JSON record. Confirm the evidence is real — a file path, command output, or exit code you can
independently check, not a remembered impression. Since this skill only ever runs from Wingman's
own dev-repo checkout (never a founder's installed copy), `node scripts/parse-wingman-logs.mjs` is
safely available here — run it (or its `recurringCategories()` export), or the friendlier
`node scripts/query-wingman-knowledge.mjs --recurring` CLI built on top of it, to check whether a
gap in the same category has already been logged as a `learning`/`retro`/`decision` before, instead
of relying on a remembered impression of this project's own history.

**2. Classify using this decision tree, in order:**

1. **Generic agent competence, not Wingman-specific** (e.g., "read the file before editing it,"
   "didn't fabricate a result") → `out-of-scope`. Append it once to
   `references/recognized-generic-behaviors.md` in this skill, so a future run checks that list
   first and doesn't re-flag the same thing. Do not promote anything here — the underlying model
   and harness already provide this; duplicating it in Wingman's own instructions would be dead
   weight.
2. **Purely mechanical** — checkable by file existence, exit code, or a regex/count match, with
   zero quality or intent judgment required — **and** safety-critical or clearly cheap to enforce
   hard → **hook candidate**. Go to step 3 and run the full safeguard checklist in Constraints
   before accepting; this is subject to the cooling-off rule.
3. **Requires situational judgment** — what counts as "enough," which of two paths applies, how to
   phrase a question to a founder — → **skill candidate**: either a new skill, or an addition to an
   existing skill's Core Workflow/Rationalizations section.
4. **Repeated, safe, multi-step, no per-step judgment, but not safety-critical enough to hard-block**
   → **command-instruction addition**: append an explicit step to an existing `commands/*.md`
   file's procedure (including `dogfood.md` itself, if the gap is about the dogfood process).
5. **None of the above cleanly fits** → `deferred`. Do not force a bucket under pressure to close
   the loop — wait for a second real dogfood run to clarify the shape before classifying.

**3. For a hook candidate, answer these in writing before proposing anything** (these become the
`docs/PROJECT.md` decision-log entry if approved):
- **Generalization**: does this hold across project types/languages, or is it stack-specific? If
  stack-specific, does it need a sniff-and-adapt approach (like `dod-structural-gate.mjs`'s
  `detectTestCommand()`, which checks `package.json`/`pytest.ini`/`go.mod`/`Cargo.toml`/`Gemfile`
  and picks accordingly, or skips gracefully if none match) rather than one hardcoded assumption?
- **Negative-case requirement**: does the eval case for this hook include a differently-shaped
  fixture where the hook must **not** fire? A hook that only proves it can catch something, never
  that it can correctly stay silent, is not ready.
- **Historical-bug check**: does this new rule assume a precondition that doesn't always hold —
  the same shape as `boardroom-checkpoint.mjs`'s old "every source has these sections" assumption,
  or `management-board-activation`'s old "every active department counts toward complexity"
  assumption? If so, narrow it before proposing.

**4. Present the classification to whoever is running this session via `AskUserQuestion`** — what
was observed, which bucket it falls into and why, and what the resulting change would be. This
approver is a Wingman maintainer/contributor working in this dev repo, not a founder approving
their own project's roster — a categorically different kind of approval than `evolve-promotion`'s.

**5. Once approved, drive the fix to completion — do not stop at "classified and proposed":**
- Implement the change in the appropriate `plugins/wingman/` location (`commands/`, `skills/`, or
  `hooks/` + `hooks.json` registration).
- Reproduce the *original* gap against the *same* fixture/path that found it, and confirm the fix
  actually closes it — not a different, easier scenario.
- Add eval coverage: a new `evals/cases/*.md` case if none exists for this area, or a new "Run N"
  in an existing one. Mark `provisional` until independently re-verified once more, then `verified`.
- Append a `## Retro:` entry to `docs/wingman/retros.md` describing the gap, the classification
  reasoning, and the fix.
- **If the approved change is a hook**: it does not finalize in the same run that found it. Mark it
  `pending-second-opinion` in the `docs/PROJECT.md` decision-log entry, and require a second,
  separate real dogfood run (not necessarily immediate) to confirm it doesn't over-block before
  calling it `verified`. Skill and command-instruction changes skip this — lower risk, easily
  reverted.
- Add a `docs/REGRESSION-CHECKLIST.md` Layer 0 line for the finding, and (once a hook clears
  cooling-off) its own Layer 1 line per that doc's existing graduation rule.
- Record the promotion in `docs/PROJECT.md`'s decisions log, including the step-3 safeguard answers
  for any hook.

## Constraints

**MUST:**
- Only run from Wingman's own dev-repo checkout (per `commands/dogfood.md`'s mode detection) —
  never from a founder's installed copy.
- Get explicit approval via `AskUserQuestion` before writing anything to `plugins/wingman/`.
- Answer all three step-3 safeguard questions in writing for any hook candidate.
- Hold a hook candidate at `pending-second-opinion` until a second, separate dogfood run confirms it.
- Reproduce the original gap and confirm the fix actually closes it before marking a run complete.

**MUST NOT:**
- Classify a generic-agent-competence observation as anything other than `out-of-scope`.
- Promote a hook without a negative-case eval fixture proving it can correctly stay silent.
- Finalize a hook in the same run that found the gap.
- Write to a founder's own `.claude/` directory — that's `evolve-promotion`'s job, not this skill's.
- Force a classification into one of the first four buckets when `deferred` is the honest answer.

## Rationalizations

| Excuse | Reality |
|---|---|
| "This is obviously a hook, let's just ship it now" | The cooling-off rule exists because this exact reflex produced two real over-block bugs in this project's own history. One clean run is not the same as confirming it doesn't over-block elsewhere. |
| "Every gap deserves the strongest enforcement available" | The whole point of this skill is picking the *right* enforcement, not the strongest one — a skill or command-instruction is often the correct, less risky answer. |
| "It's basically like the other generic-behavior entries, skip the list check" | Check `references/recognized-generic-behaviors.md` for real, every time — a new entry that looks similar might still be Wingman-specific in a way the existing list doesn't cover. |
| "The founder will benefit either way, let's write it now and ask forgiveness" | The approval step is not a formality — a Wingman maintainer decides what goes into the shared plugin every founder receives, the same way a founder decides what goes into their own project via `evolve-promotion`. |

## Red Flags — Stop and Reconsider

- You're about to write to `plugins/wingman/` from a session where `scripts/validate-structure.mjs`
  doesn't exist relative to the repo root (this means you're in founder mode — stop entirely).
- You're about to mark a hook `verified` without a second, separate dogfood run confirming it.
- You're about to propose a hook with no negative-case fixture.
- You're about to classify something as a hook purely because it would be the most reassuring
  outcome, not because steps 2-3 actually support it.
- You're about to skip writing the retro entry because the fix "was small."

## Verification

Before finalizing: re-read the `observed_gaps` entry's `evidence` field directly rather than trusting
a remembered summary; confirm the fix was actually reproduced against the same fixture/path that
found the gap (not a new, easier one); confirm the eval case exists and its trust level accurately
reflects whether a second differently-shaped run has happened; for hooks, confirm the
`pending-second-opinion` status is recorded and not silently skipped.

## Output

The `AskUserQuestion` proposal in step 4 (what was observed, the bucket, the proposed change). Once
approved and implemented: a `docs/PROJECT.md` decisions-log entry, a `docs/REGRESSION-CHECKLIST.md`
Layer 0 (and, once cleared, Layer 1) line, an eval-case update, and a `docs/wingman/retros.md` entry.

## Anti-Rationalization Defense

### Common Rationalizations

| Excuse | Reality |
|---|---|
| "This is obviously a hook, let's just ship it now" | Two real over-block bugs in this project's own history came from exactly this reflex. Cool off. |
| "One dogfood run is enough evidence for anything" | It's enough for a skill or command-instruction. It is explicitly not enough for a hook — that's the whole point of the cooling-off rule. |
| "The classification categories are fuzzy here, I'll just pick the closest one" | `deferred` exists precisely for this. A forced classification is worse than an honest "not yet clear." |

### Red Flags

- Writing to `plugins/wingman/` when mode detection would have said founder mode.
- Marking a hook `verified` after only one run.
- A hook proposal with no negative-case fixture in its eval coverage.
- Skipping the retro entry.

### Anti-Pattern Callouts

- **Over-hardcoding reflex:** treating "mechanically checkable" as sufficient justification for a
  hook, without also confirming it's safety-critical and generalizes — the exact failure mode
  `management-board-activation`'s threshold bug demonstrated (mechanically checkable, but the rule
  itself was wrong).
- **Founder/maintainer scope confusion:** writing a promoted artifact to the wrong place. Check the
  mode detection in `commands/dogfood.md` before writing anything, every time.
