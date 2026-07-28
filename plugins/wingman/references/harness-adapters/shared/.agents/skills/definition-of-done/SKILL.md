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

## Inputs

The stage about to be declared complete and whatever evidence already exists for it (tests run, threat register, docs touched) — this skill audits that evidence, it doesn't generate it.

## Output

A per-item pass/exception audit (see Core Workflow) — either every item holds with cited evidence, or an explicit, recorded exception for why one doesn't apply.

## Escalation

Any item that can't point to evidence, or an `OPEN` threat-register row — per Red Flags, this blocks the stage and requires either a real fix or explicit founder acceptance, never a wave-through.

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

## Techniques for two Definition-of-Done items

These two techniques back the "Tests" and a cost-aware reading of "Minimalism" above, and are what `commands/pipeline/build.md`'s Definition-of-Done gate names explicitly as its **Golden Dataset Regression** and **Cost & Performance Control** sub-checks (the gate's third sub-check, Security & Guardrails, is `security-checklist`'s job, not this skill's).

**Golden Dataset Regression.** Maintain a small, concrete checklist of user scenarios (roughly 10 is plenty for an early-stage product) that exercise the product's core value paths. Every time a feature is added or changed, re-run every scenario on the checklist by hand — not just the scenario for the new feature — before calling the change done. A scenario that used to work and now doesn't is a regression, full stop, regardless of whether it touches the changed code path directly. Grow the checklist as new core paths get established; it should track what the product actually promises, not shrink to fit whatever the latest change happened to test.

**Cost & Performance Control.** Any change that adds a new usage-scaling surface — a new API endpoint, a new expensive query or LLM call, a new externally-billed service call — needs a stated bound before it ships: a rate limit, a quota, or an explicit, logged reason none is needed yet (e.g. an admin-only internal tool with no public traffic). The point is preventing a single bug or bad actor from turning into an unbounded bill or a database spike, not achieving some specific performance number.

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
