---
description: Execute an approved Wingman plan task-by-task with test-driven discipline, clear its own Definition-of-Done gate, then hand off to /wingman:ship.
argument-hint: "[path to plan file, or leave blank to use the most recent approved plan]"
---

# Wingman: Build

Execute the plan approved at the Planning Milestone checkpoint (`/wingman:implementation-planning`). This stage is where code actually gets written — the founder should not need to watch this happen, only see the result at the next checkpoint.

$ARGUMENTS

## Before starting

Confirm there is an approved plan (from `/wingman:implementation-planning`'s Planning Milestone checkpoint, boardroom-approved). If no plan exists, tell the founder plainly that you need a plan first and suggest running `/wingman:discovery` to start the planning sequence.

Confirm the project is on a feature branch, not the default branch — check out or create one now (e.g. named for the plan's subject) before the first commit. Doing this here, before any work lands, means `ship.md`'s "on a feature branch" preflight check is a no-op confirmation instead of a late catch after work has already accumulated on the default branch.

Use the `department-lead-activation` skill to check the Design, Engineering, Data, and QA activation signals against this project and the plan. `dept-engineering` and `dept-qa` are always active; create `dept-design` if the plan touches any user-facing surface, and `dept-data` if it touches a schema/migrations. Delegate each task to the relevant department lead rather than doing all the work as this command directly.

Immediately after, use the `management-board-activation` skill to check whether this project has crossed the 3+ conditionally-activated-department-lead complexity threshold (Design/Data/Legal-Security/DevOps/Growth only — never counting the always-active Product/Engineering/QA) — if so, `mgr-engineering`/`mgr-design`/`mgr-data`/`mgr-qa`/`mgr-security` may need creating for whichever department leads are actually active (including `mgr-security`, once `dept-legal-security` is created just below).

Use the `department-lead-activation` skill to check the Legal & Security activation signal too: if this project touches auth, payments, or personal data, create `dept-legal-security` if it doesn't exist yet. Its work now happens inline as part of this stage's Definition-of-Done gate below, rather than as a separate `/wingman:secure` stage — folding a dedicated security pass into Build's own gate, not skipping it (see "Definition-of-Done gate" below).

## Execution discipline

Work through the plan task-by-task, not all at once:

1. For each task: write the test first if the plan specifies one, run it to confirm it fails for the right reason, implement the minimal code to pass it, run it again to confirm it passes, then commit.
2. Never mark a task done without fresh evidence it works — see the bundled `verification-before-completion` skill. "Should work now" is not a completion claim; a passing test run is.
3. If you hit something the plan didn't anticipate (a genuine unknown, not a routine implementation detail), use the bundled `systematic-debugging` skill to investigate rather than guessing at fixes.
4. If a task turns out to require a decision the plan didn't make (and it's a business tradeoff, not a technical one), stop and ask the founder in plain language rather than guessing.
5. Keep commits small and scoped to one task each, with clear messages.
6. Apply `engineering-minimalism` and, for any user-facing work, `design-taste` — both are bundled skills, not department-lead-specific, so they apply whether or not a department lead exists yet for this piece of work.

## Reuse over reinvention

Before writing new code for any task, check whether something in the codebase already does this or something close to it. Extend and reuse before adding a parallel implementation.

## When the plan is fully executed

Run the full verification suite for the project (tests, typecheck, lint — whatever this project actually has). Only once everything passes with fresh evidence, move to the Definition-of-Done gate.

## Definition-of-Done gate

This is where `secure.md`'s dedicated threat picture now lives — folded into Build's own gate rather than kept as a separate ship-blocking stage, so the discipline isn't diluted, only relocated. This stage exists so a founder never has to personally judge whether something is "secure enough" or "done enough" — that call gets made by a dedicated, evidence-based review, and the founder only sees the outcome.

**Build a threat picture.** Look at what changed since the last checkpoint and build a short list of concrete risks — not a generic checklist recitation, but specific to what was actually built:

- Secrets or credentials that could leak (hardcoded, logged, committed).
- Unsanitized input reaching a database query, shell command, or rendered template (injection/XSS).
- Missing or weak authentication/authorization on new endpoints, routes, or actions.
- Sensitive data (customer data, payment info, PII) being over-exposed, logged, or returned somewhere it shouldn't be.
- New third-party dependencies or services that expand what could go wrong, without a clear reason.

If this session has access to Claude Code's built-in `/security-review` capability, run it over the diff and fold its findings into this list rather than duplicating the work.

If the founder has explicitly asked for deeper scrutiny than this standard checklist, use the `systematic-auditing` skill for this pass instead of just the list above.

For every risk found, decide: **CLOSED** (mitigated, or a documented accepted risk) or **OPEN** (nothing done about it yet). **Append the threat register as a new section directly to the same plan file `implementation-planning.md` wrote** (e.g. `## Build Threat Register`, below the Boardroom checkpoint marker) — do not create a separate file for it. `dod-structural-gate.mjs` only reads the plan file it can find via `docs/wingman/plans/`; a threat register kept anywhere else is invisible to that mechanical check, silently defeating the gate:

| ID | Risk Description | Status | Owner | Detection Date | Disposition / Acceptance |
|----|------------------|--------|-------|----------------|--------------------------|
| 1 | Hardcoded AWS credentials in source code | OPEN | dept-legal-security | 2026-07-13 | — |
| 2 | SQL injection vulnerability in user input | CLOSED | dept-engineering | 2026-07-13 | Fixed in PR #42, regression test added |
| ... | ... | ... | ... | ... | ... |

The threat register tracks **all risks** with explicit **CLOSED/OPEN statuses**. This implements gsd-plugin's phase-gate pattern: advancement is BLOCKED while **threats_open > 0**.

**Traceability and test presence.** Alongside the threat register, confirm every task this stage executed carries at least one `wingman:req` traceability marker (per `skills/traceability-linking`, minted back in `/wingman:define`/`/wingman:architecture`/`/wingman:uxflow`) and that a corresponding test file exists for every changed non-test source file — an explicit `<!-- wingman:no-test-needed: <reason> -->` marker is the only accepted exception for genuinely test-free changes (docs, config), and it must be logged, not silently assumed.

**The gate.** This stage does not clear with open risks, missing traceability, or missing tests. If anything is OPEN or missing:

1. Fix what can be fixed now (following the same test-then-implement discipline as the rest of this stage).
2. For a risk that genuinely can't be fixed right now, present it to the founder in plain language via `AskUserQuestion`: what the risk is, what it would take to fix, and what accepting it as-is would mean for the business. Only the founder can accept a business risk — do not decide this on their behalf. Once the founder decides, append a structured entry to `docs/wingman/founder-todos.md` in their project (create it if it doesn't exist yet) — a one-line risk summary, what accepting it means, and the date.
3. Re-check until every risk is CLOSED (fixed or explicitly accepted) and traceability/tests are complete.

The `dod-structural-gate.mjs` hook mechanically re-checks the threat-register/traceability/test-presence conditions above before `git push` can run in `/wingman:ship` — this section is what makes that check pass, not a separate step to remember later.

## Boardroom checkpoint

Run `/wingman:boardroom diff` against the accumulated changes, once the Definition-of-Done gate above has cleared. This is the founder's chance to hear, in plain language, whether what got built matches what was promised and whether it's technically sound — the dedicated security pass already happened above, as part of this same stage's gate, not as a separate stage still to come.

- If the boardroom returns "ship it": proceed to `/wingman:ship`.
- If it returns concerns: fix them, then re-run the checkpoint before proceeding.

## References

- `skills/spec-handler` — each task in the plan is a spec; build the handler to its success criteria, then verify against them.
- `skills/testing-patterns` — follow AAA, mock at boundaries, and cover changed paths (>=80%) as you run the verification suite above.
- `skills/definition-of-done` — the standing cross-skill gate every executed task must satisfy before the checkpoint.
- `skills/security-checklist` — the enforced STRIDE + OWASP + prompt-injection discipline behind the Definition-of-Done gate's threat picture above.
- `references/threat-register.md` — the full CLOSED/OPEN disposition model and the `threats_open > 0` blocking rule the Definition-of-Done gate implements.
- `skills/traceability-linking` — the marker convention the Definition-of-Done gate checks for.
