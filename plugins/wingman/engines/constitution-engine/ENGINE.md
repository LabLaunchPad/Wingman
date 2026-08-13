# Engine: Constitution

**Status:** built
**Purpose:** the 10 non-negotiable rules every other engine operates under — grounding truth before
generation, no bulk speculative creation, any real `NO_GO` blocks unconditionally, and the rest of
`references/constitution.md`. Split out of the Governance Engine 2026-07-30 (EngineOS reorganization)
because "what the rules are" and "what mechanically enforces them" are genuinely distinct concerns —
this engine owns the former; the Governance and Risk Engines own the latter.

## Inputs

None directly — this engine is cited by every other engine's own gate/skill, never invoked as its
own pipeline step.

## Output artifacts

The 10 rules themselves (`references/constitution.md`). No other engine may restate or fork them;
every citation points back to this one file.

## Members

- `references/constitution.md`

## State read + written

Reads: nothing. Writes: nothing — this is a static, cited reference, not a running check. The
mechanical enforcement of these rules lives in the Governance Engine (`dod-structural-gate.mjs`,
`change-triage`) and the Risk Engine (`deploy-approval-gate.mjs`, `prompt-guard.mjs`, etc.), each of
which cites the specific rule it enforces (`scripts/constitution-check.mjs`'s citation requirement).

## Escalation

None load-bearing directly — a constitution rule itself never blocks anything; the engines that cite
it do. A proposed change to the constitution's own text is itself a Must-ask: the 10 rules are the
one thing in this system that should almost never change, and never without the founder's explicit
sign-off.

## Permitted tool tiers

Read-only (`references/permission-model.md` Level 0) — this engine is cited, not executed.
