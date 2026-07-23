---
name: spec-handler
description: Use when starting any Wingman command, subagent task, or build-time work — before writing code or taking action, state the spec (inputs, invariants, observable success criteria) and only then implement the handler. Enforces the superpowers spec-and-handler discipline.
---

<!--
Pattern (not code) adapted from `obra/superpowers`' discipline of separating a
spec (inputs, invariants, success criteria) from a handler (implementation) and
validating the spec before executing. Restated in Wingman's own words; see
`references/spec-handler-pattern.md`. Attribution in /ATTRIBUTIONS.md.
-->

# Spec-Handler

## Overview

Separate **what** must be done (the *spec*) from **how** it is done (the *handler*). Write or confirm the spec before acting, then judge the handler against the spec rather than against vibes. This is the contract discipline behind every Wingman command's `## Success Criteria`, TDD's failing-first test, and subagent task specs.

## When To Use

Any time a pipeline command runs, a department lead or specialist is dispatched, or `/wingman:build` begins work — before producing any output.

## Core Workflow

1. **Spec.** Name the inputs, the invariants that must hold, and the observable success criteria. One sentence is the floor, not the ceiling.
2. **Handler.** Implement to satisfy the spec. The handler may be swapped, refactored, or reviewed without altering the spec.
3. **Verify.** Run the spec's success criteria *before* declaring done (see `verification-before-completion`). The spec is the checklist.
4. For commands, the spec is the command's contract — see `references/spec-handler-pattern.md` for the minimum contract shape every Wingman command should answer.

## Rationalizations

| Excuse | Reality |
|---|---|
| "I'll just do it and see" | Without a spec, "done" is wherever you stopped. Write the success criteria first. |
| "The spec is the code" | No — the spec is the contract the code is judged against. Keep them separate so the code can be tested honestly. |
| "This is too small to need a spec" | Even a one-line task gets one sentence. Small is exactly where specs get skipped and rot. |

## Red Flags — Stop and Reconsider

- A command or task that cannot state its success criteria in one sentence.
- A handler built before the spec exists.
- "Done" claimed without running the spec's check.
- You are about to change the spec to match what you built, rather than the reverse.

## Verification

Every handler leaves a runnable check of its spec's success criteria — a test, or at minimum an assert-based self-check. The spec is unfinished without the check that proves it. See `verification-before-completion` for what counts as evidence.

## Referenced by

- `commands/adaptive/boardroom.md`
- `commands/pipeline/build.md`
- `skills/subagent-driven-development`
- `skills/test-driven-development`
