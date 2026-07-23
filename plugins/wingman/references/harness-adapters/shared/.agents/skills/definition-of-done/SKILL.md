---
name: definition-of-done
description: Use when any Wingman stage (build, secure, ship) is about to be declared complete — verify the standing cross-skill Definition of Done before claiming done. The quality gate every pipeline stage must pass, not a suggestion.
---

<!--
The Definition of Done is Wingman's standing cross-skill quality gate. The full
checklist lives at `references/definition-of-done.md`; this skill enforces it as
an active gate rather than letting it sit as an unread doc. Attribution in
/ATTRIBUTIONS.md.
-->

# Definition of Done

## Overview

A standing, cross-skill quality gate. No pipeline stage (build, secure, ship) is "done" until every item below is satisfied and evidenced. This is the bar the Boardroom checkpoint and `verification-before-completion` both assume has been met.

## When To Use

Immediately before declaring any stage complete and before asking the founder for a checkpoint/approval. Run it as a final self-audit.

## Core Workflow

Walk every item; for each, either confirm it holds with evidence or explicitly record the exception and why it's acceptable.

1. **Spec met** — the task's success criteria (see `spec-handler`) are satisfied and verified.
2. **Tests** — behavior is covered by a test that fails without the change and passes with it (see `test-driven-development`, `testing-patterns`).
3. **Security** — no open threats in the `secure` register (`threats_open == 0`); no secrets, injection, or auth gaps (see `security-checklist`).
4. **Verification** — evidence exists before the claim (see `verification-before-completion`); no "looks done" assertions.
5. **Minimalism** — no speculative abstraction, no unrelated refactors, shortcuts marked (see `engineering-minimalism`).
6. **Docs in sync** — `CLAUDE.md` / `ARCHITECTURE.md` updated if the architecture changed; new artifacts attributed in `/ATTRIBUTIONS.md`.
7. **Plain-language summary** — the founder gets a jargon-free go/no-go, not a raw diff (see `plain-language-checkpoint`).

## Rationalizations

| Excuse | Reality |
|---|---|
| "It works, that's the only DoD that matters" | Working-by-eye fails the verification and security gates. Evidence, not vibes. |
| "Tests aren't needed for this small change" | Small changes ship small regressions. The one-check rule still applies. |
| "I'll update the docs later" | Later never comes; drift is how launch/hotfix went undocumented. Sync now. |
| "Security is fine, nothing sensitive here" | The threat register is what proves that. CLOSED every risk or get founder acceptance. |

## Red Flags — Stop and Reconsider

- About to claim done with zero runnable evidence.
- An `OPEN` threat in the register being waved through.
- A change that silently altered architecture without touching `ARCHITECTURE.md`.
- A summary written in mechanism, not consequence.

## Verification

The gate is itself verifiable: each item above should have a traceable artifact (a test, a CLOSED threat row, a doc edit, a plain-language summary). If an item can't point to evidence, it isn't done. See `verification-before-completion`.

## References

- `references/fablize-pattern.md` — the wiring/logic separation discipline this gate's own mechanical enforcement (`hooks/dod-structural-gate.mjs`, `scripts/dod-pre-push-check.mjs`) follows; consult it when adding a new mechanical check to understand why the decision logic stays generic-signal-based rather than tool-name-based.

## Referenced by

- `commands/pipeline/build.md`
