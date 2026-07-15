# Retros

<!-- wingman:log type=retro category=dogfooding-mechanism status=resolved -->
## Retro: First real dogfood-of-the-dogfood run (`/wingman:dogfood`, both paths) — 2026-07-15

Ran the newly-built `/wingman:dogfood` maintainer-mode command for real against both fixtures —
this is the mandatory first exercise of the dogfooding subsystem itself, required before that
feature could be considered done (not exercising the 7-stage pipeline directly by hand, as the two
prior retros below did, but the formalized command wrapping that same process).

**What went well:**
- Both paths ran the full real 7-stage pipeline end to end: real `Agent`-tool dispatch (worked
  around this sandbox's lack of named-subagent-type resolution by loading a `general-purpose`
  agent with the actual persona file — disclosed, not hidden), real TDD (captured actual red
  failures before green), a real Definition-of-Done gate, and real `git commit`s (real `git push`
  disclosed as skipped — no remote on either local fixture).
- Gate dormancy/activation both confirmed correctly: the simple path's `.claude/agents/` ended up
  with only the 3 unconditionally-active department leads and zero managers; the complex path
  correctly activated 7 of 8 department leads (`dept-growth` correctly stayed dormant) and 6 of 9
  managers (`mgr-product`/`mgr-research`/`mgr-growth` correctly stayed dormant), with the
  conditional-department count landing at 4, matching the fixture's seeded signals.
- The Boardroom caught two real, independent bugs during the complex-path run: a first-pass
  `DO NOT SHIP` (no charge ID to refund against, no idempotency protection) and, later at Build, a
  schema-migration backfill bug that would have permanently locked every real existing customer out
  of their own cancel button (`userId` backfilled to `''`). Both fixed live, re-tested clean.

**The real findings — 5 genuine `observed_gaps`, classified via `dogfood-gap-classification`:**
1. Multi-ID traceability markers on one line (a single `wingman:req` token followed by more than
   one space-separated ID) silently dropped every ID after the first — undocumented, and the
   checker's regex only ever captured one. Fixed both the checker (`check-traceability.mjs` now
   captures the full space-separated ID list, not just the first) and the docs
   (`traceability-linking/SKILL.md` now documents the supported syntax explicitly).
2. Boardroom diff-checkpoints aren't deterministic across repeated dispatches of near-identical
   scope — Build's checkpoint cleared 8/8, then Ship's own re-dispatch of the same personas caught
   two things Build's pass missed. A real safety property, but nothing set that expectation. Fixed:
   `boardroom.md` now states plainly that a cleared checkpoint isn't a permanent guarantee.
3. `define.md`/`architecture.md`/`uxflow.md` never specified an output-file convention, unlike
   `discovery.md`'s explicit path — forced improvisation. Fixed: all three now name
   `docs/wingman/<stage>/<slug>.md`.
4. `management-board-activation`'s per-stage "Relevant to" gating on manager *creation* could
   permanently starve `mgr-product`/`mgr-research`, since their only relevant stage (`discovery`)
   typically runs once, early, before the threshold is usually crossed — confirmed directly in
   this run (threshold crossed at Build, `discovery` never ran again). Fixed: creation is now
   decoupled from stage-relevance (every invocation checks every missing manager whose department
   lead is active); the "Relevant to" table now only gates *dispatch* of a manager's coordination
   work, not whether its file gets created.
5. This sandbox's `Agent` tool can't dispatch named `dept-*`/`mgr-*`/`boardroom-*` subagent types —
   already documented in prior sessions as an environment limitation, not a plugin defect. Logged
   again in `references/recognized-generic-behaviors.md` so future runs don't re-flag it.

None of the 4 real fixes were hook candidates (all were doc/skill-content/logic clarifications to
existing skills/commands), so none required the cooling-off period — all were classified,
approved, implemented, and verified in this same pass.

**What we'd do differently next time:**
- The complex-path subagent twice ended its own turn with a vague "waiting for X" message instead
  of actually finishing a Boardroom dispatch it had started as background calls — had to be
  explicitly told to redo the dispatch synchronously. Worth a note in `dogfood.md` itself (or the
  general subagent-dispatch guidance) that a dogfood run's own internal Boardroom checkpoints
  should be dispatched synchronously, not as further background agents, to avoid this exact stall.

**Anything for you to know:**
- Both runs' structured JSON records live at `evals/dogfood-runs/2026-07-15T01-00-00Z-{simple,complex}.json`.
- Founder-mode verification and the final PR for the dogfooding subsystem are the next steps.

<!-- wingman:log type=retro category=management-board-activation status=resolved occurrence=2 -->
## Retro: Second dogfooding pass — the simple path, and a real complexity-gate bug — 2026-07-14/15

Deliberately picked the smallest possible real feature this time ("add a `GET /health` endpoint" to a tiny internal status API — no UI, no database, no auth, no external dependency) to test the *other* side of the Management Board's complexity gate: does it correctly stay dormant on a genuinely simple project, not just correctly activate on a complex one (the first retro's subject)?

**What went well:**
- The founder-in-the-loop `AskUserQuestion` flow, real TDD (a genuine red step, then green), and the Definition-of-Done gate all worked cleanly on the simple path, mirroring the first pass's mechanics at a smaller scale.
- A minor, honest hiccup along the way: my own first test for `GET /health` hung the test runner for a full 2 minutes because the assertion failure path never called `server.close()`, leaving an open socket handle. Root-caused directly (isolated the hang to a missing `try/finally`, not an environment issue) and fixed with proper cleanup — a genuine, if mundane, reminder that `verification-before-completion` cuts both ways: it's not just "did you check," it's also "did your check itself leave the harness in a bad state."

**The real finding — a serious bug, not a documentation nit:**
- By the time this trivial project reached Build, `active_department_leads` already had exactly 3 entries: `dept-product`, `dept-engineering`, `dept-qa` — the 3 departments `department-lead-activation`'s own table marks **unconditionally always-active**, regardless of project complexity. Since the Management Board's threshold was "3+ active department leads, no filtering," this meant the "complexity gate" was satisfied by Build time on **every single project**, trivial or not — directly contradicting the gate's own stated purpose (`docs/ARCHITECTURE.md`: "never on day one, never just in case," "most projects should never need this layer").
- Confirmed this wasn't a one-off: the first dogfooding pass's project also had these same 3 departments active, but its *conditional* departments (Design, Legal-Security) pushed the total to 5, masking the always-active 3 from view. Only a genuinely minimal second project exposed that the always-active 3 *alone* were doing all the threshold-crossing work.
- **Fix, confirmed with the user before applying** (this is a real design change, not a typo fix): the threshold now counts only the 5 *conditionally*-activated departments (Design/Data/Legal-Security/DevOps/Growth) — Product/Engineering/QA's own presence never counts toward it, though their managers remain eligible once the conditional count independently crosses 3. Verified directly: re-running the same trivial project's full pipeline with the fix applied shows `active_managers: []` throughout, as it should.

**What we'd do differently next time:**
- This bug existed through the entire first dogfooding pass and both merged PRs without being caught, because that project's complexity happened to mask it. The lesson: a "does the common/simple case stay clean" run is not optional follow-up polish after testing the complex case — it needs to run *before* trusting a complexity gate's threshold logic, since simple cases are exactly where miscounted "always-on" baselines get exposed.

**Anything for you to know:**
- Fix already committed and pushed (branch `claude/multi-domain-audit-benchmarks-7u9nrw`) alongside a promoted `management-board-activation` eval case (now `verified`) documenting this exact run.

<!-- wingman:log type=retro category=seven-stage-pipeline status=resolved occurrence=1 -->
## Retro: First real dogfooding pass of the 7-stage pipeline (MVP2) — 2026-07-14

Genuinely ran the whole `/wingman:discovery` → `/wingman:ship` sequence against a throwaway real project ("Tip Jar," a one-time Stripe tip feature), as a founder would — not a scripted eval with a pre-known correct answer. Real founder-in-the-loop `AskUserQuestion` decisions, real `dept-*`/`mgr-*` file creation, a real 8-seat Boardroom dispatch at the Planning Milestone checkpoint, real test-driven implementation, and a real `dod-structural-gate.mjs` hook run at `git push` time.

**What went well:**
- The 3-checkpoint bundling design held up under a real build, not just a synthetic one: exactly 3 lines in `checkpoints.jsonl` (Planning Milestone, Build, Ship) across 7 named stages, matching the design intent.
- The 8-seat Boardroom found 6 independent, genuine issues in the plan on the very first real dispatch (missing home-page link to the new feature, no server-side payment verification before showing success, a possible reflected-XSS, a missing test-writing task, an unconsidered simpler alternative — Stripe Payment Links — and an underspecified trust signal) — none of these were seeded or expected in advance; they were caught fresh. Two more real, genuine bugs (hardcoded `localhost` Stripe redirect URLs) were caught independently by the CTO and CISO seats at the *Build*-stage diff review, converging on the same root cause from different angles.
- `dod-structural-gate.mjs`'s new test-execution check (added in the prior MVP2 pass after a different eval caught a similar gap) worked correctly the whole way through: it denied a `git push` when a genuine `OPEN` threat-register row existed, and allowed once the project was actually clean.

**What was harder than expected — 2 real bugs found and fixed, permanently, in the plugin itself, not just this run:**
- `dod-structural-gate.mjs`'s threat-register check only ever read the single most recent file under `docs/wingman/plans/` — but `build.md` never specified where the Build-stage threat register should physically live, so this dogfood run put it in a separate `docs/wingman/build/` file by reasonable inference. Proved concretely (by deliberately introducing a real `OPEN` row there) that the hook silently missed it and wrongly allowed the push. Fixed two ways: `build.md` now names an exact convention (append to the same plan file), and the hook now also defensively scans `docs/wingman/build/` so a register kept elsewhere still can't slip through.
- `management-board-activation`'s "Relevant to" table still named stages retired by this same MVP2 rearchitecture (`plan`, `secure`), and Design Manager's own row never listed `uxflow` even though `uxflow.md` explicitly instructs checking for it there — hit this exact inconsistency for real when `dept-design`'s activation crossed the 3-department-lead threshold during the UX Flow stage. Fixed the table and added an explicit note that a manager should be created the first time *any* of its relevant stages runs, not withheld waiting for a stage that may never come (e.g. Product/Research managers were gated on a `plan` stage that no longer exists at all).

**What we'd do differently next time:**
- Run a second real dogfood pass on a project that legitimately never crosses the 3-department-lead Management Board threshold, to confirm the "common case" (no manager ever created) still reads as clean and unremarkable, not as a code path nobody exercises.
- The traceability check surfaced a genuine, non-blocking design nuance worth a future look: `IP-*` task IDs (and any requirement whose only downstream reference is itself, not something further along the chain) will *always* show as "unlinked" under the current script, since nothing is ever expected to reference the terminal stage's own ID, and the check isn't transitive (a `DEF-*` ID covered only via an `ARCH-*` marker several links downstream still shows unlinked unless it's also directly re-referenced). Worth clarifying in the skill's docs as expected/non-blocking, or making the checker transitive, in a future pass — not fixed now since it's a warning, not a blocking error, and didn't affect this run's real outcome.

**Anything for you to know:**
- Both fixes above are already committed and pushed to the PR (`e8e1314`, `75446fc`) — this dogfooding pass didn't just generate a report, it directly hardened the shipped plugin against exactly the failure modes it surfaced, verified by re-running the fix against the actual broken fixture that found it.

<!-- wingman:log type=retro category=vendor-integration status=resolved occurrence=1 -->
## Retro: Wingman vendor-pattern integration (v9–v12) — 2026-07-13

**What went well:**
- TDD discipline held end to end (red → green → refactor); 84/84 tests green, `validate-structure` and `check-repo-consistency` both pass with zero warnings.
- Found and fixed a real bug that had fully broken the plan-mode gate: a template literal in `boardroom-checkpoint.mjs` was closed with `"` instead of a backtick.
- A dead-reference-doc audit surfaced 9 orphaned docs; 5 were promoted into enforced skills (`spec-handler`, `definition-of-done`, `security-checklist`, `testing-patterns`, `doc-index`), closing a genuine quality gap.

**What was harder than expected:**
- Wingman's `vendor/` submodules are pinned but **empty on disk** in this environment — integration had to be design/knowledge-based, not runtime.
- `check-fixtures.mjs` (and eval grading) require `/bin/bash`, which doesn't exist on Windows PowerShell — so 6 v11 eval cases are authored but pending behavioral grading in CI, not locally verifiable here.

**What we'd do differently next time:**
- Wire `// minimal:` debt comments into `DEBT.md` from the first shortcut taken, instead of discovering the `debt-ledger` rule late. (Confirmed: the 13 `// minimal:` occurrences are test-fixture strings, not real debt — but the discipline should still be automatic.)

**Anything for you to know:**
- The Wingman plugin is markdown-only (commands/agents/skills + hook config). A `secure` pass comes back clean because there is no runtime/secret/auth surface — but the stage is still mandatory per the pipeline, and the threat register documents that the hunt was real, not skipped.
