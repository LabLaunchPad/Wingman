---
name: prompt-diff-check
description: Use when a command/agent/skill's prose instructions change (not just typo/formatting fixes) — check whether the existing eval case(s) covering it still exercise the changed behavior, or whether the change has silently outrun its own test coverage. Triggered by /wingman:harness's self-audit and before merging a diff that edits an existing shipped prompt file.
---

<!--
Narrow, evidence-gated addition (2026-07-20): a pasted "deep research report" proposed a full
"Prompt Regression Suite" citing Commey's finding that prompt changes are regression risks.
`evals/` already does behavioral regression testing of skill/command changes — ground-checked
before building anything. The one real, not-fully-redundant gap: nothing automatically flags when
a changed prompt file's existing eval case doesn't actually cover the section that changed. This
skill closes that one gap; it does not duplicate the eval harness itself. See
docs/PROJECT.md's decisions log, 2026-07-20, for the full assessment.
-->

# Prompt-Diff-Check

## Overview

A prompt file (`commands/*.md`, `agents/*.md`, `skills/*/SKILL.md`) changing its actual
instructions is a behavior change, even though nothing "compiles" to catch it. Wingman's own eval
harness (`evals/cases/*.md`) already exists to behaviorally test these files — but a diff that
changes one section of a prompt can silently outrun the eval case that's supposed to cover it, if
that case's fixture never exercised the changed section in the first place. This skill is the
narrow check for exactly that gap: not a new testing system, a cross-reference against the one
that already exists.

## When To Use

- Before merging a diff that changes an existing `commands/*.md`, `agents/*.md`, or
  `skills/*/SKILL.md` file's actual instructions (not a pure typo/formatting/link fix).
- During `/wingman:harness`'s self-audit, as one of its checked categories.

## Core Workflow

1. **Identify what changed.** Read the diff (or the before/after if no diff is available) for the
   prompt file. Isolate which section(s) of instructions actually changed in meaning — not
   whitespace, not a rephrase with identical behavior.
2. **Find the covering eval case(s).** Search `evals/cases/*.md` for the file's name (command/skill
   name, e.g. `debt-ledger` → `evals/cases/debt-ledger.md`). Some prompt files are covered by a
   shared/consolidated case instead of a dedicated one (e.g. `evals/cases/seven-stage-pipeline-e2e.md`
   covers several pipeline commands) — check both.
3. **Check whether the covering case actually exercises the changed section.** Read the case's
   `## Expectations` table and fixture description. If the changed section isn't represented by any
   row/checked behavior in the case, the eval doesn't actually cover what changed — flag this
   explicitly, don't assume "a case exists" means "the change is covered."
4. **If no case exists at all**, or the existing case demonstrably doesn't cover the changed
   section: say so plainly. Either extend the existing case with a new scenario, author a new case
   (per `evals/README.md`'s convention), or explicitly accept the gap with a stated reason (e.g. the
   change is low-risk prose clarification with no behavioral effect) — never silently merge past it.
5. **Never fabricate coverage.** A case file existing is not the same as it covering the specific
   change — this mirrors `verification-before-completion`'s core discipline applied to eval
   coverage specifically, not just to "did I run a command."

## Rationalizations

| Excuse | Reality |
|---|---|
| "There's already an eval case for this command" | A case existing doesn't mean it exercises the *specific section* that changed — check the expectations table, don't assume. |
| "It's just a prompt tweak, not real code" | Commey's finding (and this project's own history) is exactly that prompt changes are regression risks — a rephrase can change what a model does even with no code involved. |
| "I'll add the eval case later" | Later never comes reliably — the same excuse `doc-index` already rejects for reference docs applies here. |
| "The change is obviously safe" | "Obviously safe" is a judgment call this skill exists to replace with a checked one. |

## Red Flags — Stop and Reconsider

- A prompt file's instructions changed with no corresponding change to, or re-check of, its eval
  case.
- An eval case's `## Expectations` table doesn't mention the section that just changed.
- A shared/consolidated eval case is assumed to cover a file without checking it actually does.

## Verification

The discipline is itself verifiable: for the changed file, `grep` `evals/cases/*.md` for its name,
read the matching case's expectations table, and confirm — file:line to file:line — that the
changed section maps to a checked row. If it doesn't, that's the finding, not a false alarm.

## Referenced by

- `commands/adaptive/harness.md`
