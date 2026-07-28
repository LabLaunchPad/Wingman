---
description: Execute an approved Wingman plan task-by-task with test-driven discipline, clear its own Definition-of-Done gate, then hand off to /wingman:ship.
argument-hint: "[path to plan file, or leave blank to use the most recent approved plan]"
---

# Wingman: Build

The last stage of **Phase 4: AI-Assisted Architecture & Build**. Execute the plan approved at `/wingman:implementation-planning`'s own solo checkpoint (per `docs/ARCHITECTURE.md` §4d, no separate "Planning Milestone" bundle exists — every one of the 12 prior stages already cleared its own checkpoint). This stage is where code actually gets written — the founder should not need to watch this happen, only see the result at the next checkpoint. Sequence work the way an agentic IDE session should: hand the agent the plan/AI PRD, have it build the data layer first, then build individual feature modules one at a time — never everything at once.

$ARGUMENTS

## Build.1: Before starting

If no prior approved plan exists for this request (see below) — an ad hoc/direct build request that
skips the earlier pipeline stages — use the `change-triage` skill before anything else. A request
with an approved plan was already triaged implicitly by having passed through Discovery, so skip this
check in that case. A Level 0-1 classification routes to `/wingman:hotfix`'s lightweight loop instead
of Build; a Level 4 classification routes to `/wingman:incident` immediately; Level 2-3 continue here,
with a Level 3 classification meaning every downstream checkpoint for this request is mandatory full
review.

Confirm there is an approved plan (from `/wingman:implementation-planning`'s own solo checkpoint, boardroom-approved). If no plan exists, tell the founder plainly that you need a plan first and suggest running `/wingman:discovery` to start the planning sequence.

Check `.wingman/checkpoints.jsonl` for an entry with `"bundle": "planning-milestone"` for this project. If none exists, do not proceed silently — tell the founder plainly: "No prior Wingman plan found for this project — proceeding without traceability coverage from earlier pipeline stages. If you have your own spec, that's fine; if you meant to run `/wingman:discovery` through `/wingman:implementation-planning` first, stop now and do that instead." Wait for the founder's answer before continuing this stage.

**Resuming on a fresh session.** Before starting or re-starting any task, do not assume the plan's own checkbox state is the whole story — a fresh session has no memory of what an earlier session already did. Check both: (1) the plan file's own checkbox state for the task, and (2) `git log` for a commit that already completed that task (matching the plan's own task description/scope). Only treat a task as not-yet-done when both agree it isn't — a task with an unchecked box but a matching completed commit should be treated as done (and the box corrected), not redone from scratch.

Confirm the project is on a feature branch, not the default branch — check out or create one now (e.g. named for the plan's subject) before the first commit. Doing this here, before any work lands, means `ship.md`'s "on a feature branch" preflight check is a no-op confirmation instead of a late catch after work has already accumulated on the default branch.

If this is a JS/TS project about to need a package manager for the very first time (no lock file, no `package.json` `packageManager` field yet), use the `package-manager-selection` skill before running any install command. This never applies to a project that already has a lock file — that choice is respected, not revisited.

Use the `department-lead-activation` skill to check the Design, Engineering, Data, and QA activation signals against this project and the plan. `dept-engineering` and `dept-qa` are always active; create `dept-design` if the plan touches any user-facing surface, and `dept-data` if it touches a schema/migrations. Delegate each task to the relevant department lead rather than doing all the work as this command directly — **except** for a genuinely single-task plan (Implementation Planning named exactly one task): creating and dispatching a full department-lead persona for one small unit of work is overhead disproportionate to the task itself, so this command may execute that one task directly. This exception does not apply once a plan names 2+ tasks — delegate normally from there. (Found via two real maintainer-mode dogfood runs, 2026-07-18 and 2026-07-21 — see `docs/wingman/retros.md`.)

Immediately after, use the `management-board-activation` skill to check the Management Board activation threshold (see `references/pipeline-stage-boilerplate.md`'s Activation Checks section for the shared criteria) — if crossed, `mgr-engineering`/`mgr-design`/`mgr-data`/`mgr-qa`/`mgr-security` may need creating for whichever department leads are actually active (including `mgr-security`, once `dept-legal-security` is created just below).

Use the `department-lead-activation` skill to check the Legal & Security activation signal too: if this project touches auth, payments, or personal data, create `dept-legal-security` if it doesn't exist yet. Its work now happens inline as part of this stage's Definition-of-Done gate below, rather than as a separate `/wingman:secure` stage — folding a dedicated security pass into Build's own gate, not skipping it (see "Definition-of-Done gate" below).

See `references/pipeline-stage-boilerplate.md`'s Where You Are section. Use `skills/visual-founder-output` to show the pipeline-status tree — all 12 prior stages done, Build now the current stage.

## Build.2: Execution discipline

Work through the plan task-by-task, not all at once:

1. For each task: write the test first if the plan specifies one, run it to confirm it fails for the right reason, implement the minimal code to pass it, run it again to confirm it passes, then commit.
2. Never mark a task done without fresh evidence it works — see the bundled `verification-before-completion` skill. "Should work now" is not a completion claim; a passing test run is.
3. If you hit something the plan didn't anticipate (a genuine unknown, not a routine implementation detail), use the bundled `systematic-debugging` skill to investigate rather than guessing at fixes.
4. If a task turns out to require a decision the plan didn't make (and it's a business tradeoff, not a technical one), stop and ask the founder in plain language rather than guessing.
5. Keep commits small and scoped to one task each, with clear messages.
6. Apply `engineering-minimalism` and, for any user-facing work, `design-taste` — both are bundled skills, not department-lead-specific, so they apply whether or not a department lead exists yet for this piece of work.

## Build.3: Reuse over reinvention

Before writing new code for any task, check whether something in the codebase already does this or something close to it. Extend and reuse before adding a parallel implementation.

## Build.4: When the plan is fully executed

Run the full verification suite for the project (tests, typecheck, lint — whatever this project actually has). Only once everything passes with fresh evidence, move to the Definition-of-Done gate.

## Build.5: Definition-of-Done gate

This is where `secure.md`'s dedicated threat picture now lives — folded into Build's own gate rather than kept as a separate ship-blocking stage, so the discipline isn't diluted, only relocated. This is also where **Phase 5: Testing, Security & QA** lives — not a separate 15th stage, but three explicit, named sub-checks inside this same gate. This stage exists so a founder never has to personally judge whether something is "secure enough" or "done enough" — that call gets made by a dedicated, evidence-based review, and the founder only sees the outcome.

**The three Phase 5 sub-checks.** Each must resolve PASS before the gate clears, alongside the threat register below:

1. **Golden Dataset Regression** — PASS requires a maintained checklist of concrete user scenarios (see `skills/definition-of-done`'s Golden Dataset technique) re-run against this change, with no scenario newly broken.
2. **Security & Guardrails** — PASS requires the threat register below to have `threats_open == 0` (see `skills/security-checklist`), specifically covering input sanitization and that no user can reach another user's data.
3. **Cost & Performance Control** — PASS requires new usage-scaling surfaces (a new endpoint, a new expensive query, a new external API call) to have a stated usage/cost bound — a rate limit, a quota, or a documented reason none is needed yet (see `skills/definition-of-done`'s Cost & Performance Control technique).

Record all three as PASS/FAIL lines directly in the Boardroom checkpoint output alongside the gate checklist (Build.6) — a founder should see these three names, not just "security reviewed."

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

## Build.6: Gate checklist

Alongside the Definition-of-Done gate above, run the adaptive gap-finding loop and the 8-part output
format from `references/pipeline-gate-checklist.md`, then confirm this stage's own gate (this is the
QA and validation checklist a 17-phase spec would have run separately — Build's own
Definition-of-Done gate already covers it here, so no separate QA stage exists):

- **Must include:** changed files, a progress summary, verification results, plain-English
  narration, blockers.
- **Must decide:** whether the implementation matches the plan, and whether any blocker requires
  rework before shipping.
- **Gate passes only if** verification passes — tests, typecheck, lint, the threat register, and
  traceability/test-presence checks above all clear.

## Build.7: Boardroom checkpoint

Run `/wingman:boardroom diff` against the accumulated changes, once the Definition-of-Done gate above has cleared. This is the founder's chance to hear, in plain language, whether what got built matches what was promised and whether it's technically sound — the dedicated security pass already happened above, as part of this same stage's gate, not as a separate stage still to come.

The checkpoint checks the gate checklist above, not just the diff in general: it confirms every
Must-include item is present and every Must-decide question is answered. If the gate does not pass,
the checkpoint blocks here and names the specific missing item(s) to the founder — never a generic
"needs work."

- If the boardroom returns "ship it": proceed to `/wingman:ship`.
- If it returns concerns: fix them, then re-run the checkpoint before proceeding.

## References

- `skills/spec-handler` — each task in the plan is a spec; build the handler to its success criteria, then verify against them.
- `skills/testing-patterns` — follow AAA, mock at boundaries, and cover changed paths (>=80%) as you run the verification suite above.
- `skills/definition-of-done` — the standing cross-skill gate every executed task must satisfy before the checkpoint.
- `skills/security-checklist` — the enforced STRIDE + OWASP + prompt-injection discipline behind the Definition-of-Done gate's threat picture above.
- `references/threat-register.md` — the full CLOSED/OPEN disposition model and the `threats_open > 0` blocking rule the Definition-of-Done gate implements.
- `references/pipeline-gate-checklist.md` — the shared adaptive gap-finding loop, self-critique
  questions, gap register, and 8-part output format every stage runs before its own checkpoint.
- `skills/traceability-linking` — the marker convention the Definition-of-Done gate checks for.
- `skills/visual-founder-output` + `references/visual-output-templates.md` §2 — the pipeline-status
  tree shown at the start of this stage.
