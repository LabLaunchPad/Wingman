# Retros

<!-- wingman:log type=retro category=audit status=resolved occurrence=1 -->
## Retro: Full parallel audit of PR #72's own content — real, small bugs found in code nobody had reviewed independently yet — 2026-07-21c

Ran `/wingman:audit`'s procedure for real: 4 narrowly-scoped parallel subagents (harness-adapters
correctness, repo-wide consistency/drift, security/secrets sweep, test/eval coverage), each with an
exact file list, dispatched right after PR #72 merged — the first independent review any of that
content had gotten (it was built and merged in the same session, by the same actor, with no second
pair of eyes).

**What was found and fixed, all independently re-verified against the real files/execution before
trusting the subagent report, per this project's own standing discipline:**
- `AGENTS.md`'s Repository map claimed `references/` "stay[s] flat" — stale the moment
  `references/harness-adapters/` (a genuinely nested subtree, 36 files not 15, mirroring Codex
  CLI's/OpenCode's own discovery layout) was added in the same PR that never updated this line.
  Fixed to describe both the flat majority and the one deliberate nested exception.
- `install-git-hooks.mjs` had two real bugs, neither exercised by the original manual scratch-clone
  verification: (1) a shell-quoting gap — `repoDir` was interpolated into the generated hook's
  double-quoted `/bin/sh` string with no escaping, so a path containing `"`/`` ` ``/`$` could break
  out of the quoting; fixed with proper POSIX single-quote escaping (`'...'` with `'` → `'\''`), and
  directly re-tested with a real path containing a literal single quote pushing through a real git
  remote. (2) `readFileSync` on an existing hook path had no try/catch — a directory or unreadable
  file at `.git/hooks/pre-push` crashed with a raw Node stack trace instead of the script's own
  graceful error convention; fixed and re-verified (a directory at the hook path now produces the
  same plain-language "couldn't read the existing hook" message every other failure path uses).
- Zero automated test coverage existed for `install-git-hooks.mjs`'s install/uninstall/idempotency/
  foreign-hook logic — closed with `tests/install-git-hooks/install-git-hooks.test.mjs` (10 real
  cases, including a direct regression test for the quoting fix and a case that would have caught
  the empty-file `unlinkSync`-vs-`writeFileSync('')` bug from earlier in the session, had it still
  been present).

**What was checked and came back genuinely clean, not skipped:** all 8 Codex CLI TOML agent files
(parsed with a real TOML parser — no syntax errors), the `wingman-gate.js` OpenCode plugin's
decision logic (compared line-by-line against `boardroom-checkpoint.mjs`, confirmed a faithful
port with no copy-paste drift), all 16 Boardroom-seat translation files for cross-seat contamination
(none found), repo-wide count/version consistency (all 4 validators PASS, `plugin.json`/
`CHANGELOG.md` versions match, no stale hand-copied numbers), and a full secret/injection sweep
(only synthetic test fixtures matched the SECRET patterns; `wingman-gate.js` has no shell/eval
surface at all; zero outbound network calls anywhere under `plugins/wingman/`).

**Feed-forward:** this is direct evidence for treating "just-merged, same-session, same-actor"
content as still needing an independent audit pass before being considered settled — three of four
real findings here were in code written and manually verified only hours earlier in this same
session. Not escalating to a standing rule yet (one occurrence); watching for a second, differently-
shaped instance of "self-verification missed something an independent audit caught" before
considering whether this needs to become part of `git-pr-workflow` or `dogfood-gap-classification`'s
own checklist.

<!-- wingman:log type=retro category=dogfooding-mechanism status=resolved occurrence=5 -->
## Retro: Maintainer-mode complex-path dogfood run — clean, and the prior run's fixes held — 2026-07-21b

Ran the real 7-stage pipeline against `evals/fixtures/setup-dogfood-complex.sh` (the "Fetch" app —
Next.js + Prisma + Stripe + Dockerfile/CI, 4 deliberate conditional signals), the same day as the
simple-path run above. All 3 Boardroom checkpoints dispatched for real — 24 more Agent-tool calls,
never a simulated verdict. Full run record:
`evals/dogfood-runs/2026-07-21T05-00-00Z-complex.json`.

**What went well — a genuinely clean run, `observed_gaps` empty by design, not by omission:**
- `department-lead-activation` correctly activated all 4 conditional leads (`dept-design`,
  `dept-data`, `dept-legal-security`, `dept-devops`) plus the 2 always-active ones, exactly
  matching the fixture's own documented expectations. `dept-growth` correctly stayed dormant (no
  explicit founder request).
- `management-board-activation` correctly crossed its 3+ conditional-department threshold (4 ≥ 3)
  and created exactly the 6 expected managers (`mgr-engineering`, `mgr-design`, `mgr-data`,
  `mgr-security`, `mgr-qa`, `mgr-platform`) — correctly **not** creating `mgr-product`/
  `mgr-research`/`mgr-growth`, since `dept-product`/`dept-growth` were never active in this run.
- Design and CISO rendered real, substantive (non-N/A) verdicts this time, given genuine UI and
  payments-adjacent context — confirms the Boardroom actually engages differently based on real
  project signals rather than always returning the same boilerplate the zero-signal simple path
  produced.
- The Planning Milestone checkpoint produced two genuine `GO_WITH_CONCERNS` findings (CTO+CISO on
  money-math rounding safety; Research on why not delegate to Stripe's native proration) that
  materially changed the implementation before Build — real Boardroom value on a real, non-trivial
  plan, not a rubber stamp.
- **Both fixes from the same-session simple-path run were directly re-tested here and held
  cleanly**: the feature branch was created up front, before the first commit (closing the simple
  path's Gap 2), and every Boardroom re-verification dispatch included the real on-disk fixture
  path (closing the simple path's Gap 3) — no spurious `NO_GO`, no branch-hygiene gap. This is
  confirming evidence the fixes actually work, not just that they were written.

**Anything for you to know:**
- No live Next.js/Prisma/Stripe toolchain exists in this sandbox, so real TDD was scoped to a
  genuinely-runnable plain-JS unit (`calculateProratedCharge`) rather than fabricating framework
  execution — a sandbox constraint, honestly disclosed, not a Wingman gap.
- Both the simple and complex paths have now run for real in the same session, closing out
  `dogfood.md`'s "default: both, sequentially" recommendation.

<!-- wingman:log type=retro category=dogfooding-mechanism status=resolved occurrence=4 -->
## Retro: Maintainer-mode simple-path dogfood run — real gaps found and fixed, not just confirmed clean — 2026-07-21

Ran the real 7-stage pipeline end to end against a fresh `evals/fixtures/setup-dogfood-simple.sh`
fixture ("internal-status-api"), adding a genuinely trivial feature (`GET /health` returning a
static `{"status":"ok"}`), same shape as the 2026-07-18 run. All 3 Boardroom checkpoints (Planning
Milestone, Build, Ship) dispatched for real — 24 total Agent-tool calls, each reading the actual
persona file, never a simulated verdict. Real TDD (test written and confirmed failing before the
implementation existed). Full run record: `evals/dogfood-runs/2026-07-21T04-00-00Z-simple.json`.

**What went well:**
- Gate dormancy confirmed clean again: `dept-design`/`dept-data`/`dept-legal-security`/`dept-devops`/`dept-growth`
  and `management-board-activation` all correctly stayed dormant.
- The Planning Milestone checkpoint produced a genuine, substantive `GO_WITH_CONCERNS` from CISO
  (the `/health` response body must stay static, never leak version/DB/error info) — a real finding
  the implementation then had to satisfy, not a rubber-stamp.
- `ship.md`'s "on a feature branch" preflight backstop worked exactly as designed (see below).

**What went wrong, and was fixed in the same round, not just logged:**
1. **`build.md`'s "delegate each task to a department lead" instruction had no proportionality
   carve-out for a genuinely single-task plan** — this is the *second* consecutive simple-path run
   to hit this (first: 2026-07-18). Fixed: `build.md` now explicitly allows direct execution for a
   plan naming exactly one task.
2. **This session (playing the pipeline) skipped `build.md`'s own correctly-worded "create a
   feature branch before the first commit" step** — work landed on the fixture's default branch.
   `ship.md`'s preflight step 3 caught it exactly as designed ("stop and offer to create one now")
   and recovery was clean. **No new hook was added for this** — the cooling-off rule
   (`dogfood-gap-classification`) explicitly warns against the "obviously needs a hard hook, ship
   it now" reflex, citing two real prior over-block bugs from that exact pattern. The existing
   two-layer design (instruct + backstop) demonstrably worked; hardening it further wasn't
   evidenced as necessary, just satisfying to close the loop with.
3. **A Boardroom re-verification dispatch omitted the actual file path**, giving the CISO seat only
   a diff snippet. It correctly searched the one repo it could see, found nothing, and correctly
   returned `NO_GO` rather than trust an unverified claim — the seat behaved exactly right; the
   dispatch was the gap. Fixed: `dogfood.md` now explicitly requires every code-reviewing dispatch
   to include the real on-disk path.

**Anything for you to know:**
- This run is genuine evidence that `/wingman:dogfood`'s own dispatch discipline matters as much as
  the pipeline being dogfooded — a rigorous Boardroom seat correctly refusing to certify something
  it can't see is a feature, not a bug, and the fix belongs in how the run is driven, not in the
  seat's own leniency.

<!-- wingman:log type=retro category=dogfooding-mechanism status=resolved occurrence=1 -->
## Retro: Maintainer-mode simple-path dogfood run — gate dormancy confirmed clean — 2026-07-18

Ran the real 7-stage pipeline (`/wingman:discovery` through `/wingman:ship`) against a fresh
`setup-dogfood-simple.sh` fixture (`internal-status-api`, a tiny Node.js HTTP API with zero
conditional signals). Stood in as founder for the one real decision (a minimal liveness `/health`
check vs. a deeper readiness probe — chose minimal, since the service has no dependencies yet to
check). Dispatched 24 real Boardroom seat reviews (8 seats x 3 checkpoints: Planning Milestone,
Build, Ship) via the `Agent` tool with each `boardroom-*.md` persona pasted in full — no
custom `boardroom-*`/`dept-*` subagent type is registered in this environment, only
`general-purpose` and a few other built-ins, consistent with prior dogfood runs' disclosed
limitation. All 24 seat verdicts came back clean `GO`. Implemented the feature for real with TDD:
wrote a failing test first (confirmed 404 for the right reason), then the minimal
`GET /health` route, then confirmed 2/2 tests green.

**What went well:**
- The gate this path exists to prove held completely: `dept-design`, `dept-data`,
  `dept-legal-security`, `dept-devops`, and `dept-growth` all stayed dormant end to end (0 of the 5
  conditional signals ever fired — no user-facing surface, no schema, no auth/payments, no CI
  config, no explicit growth request), and `management-board-activation` never triggered since it
  requires 3+ of those five. Only the 2 unconditional leads (`dept-product`, `dept-engineering`)
  were created, exactly as the simple-path fixture is designed to prove.
- `uxflow.md` correctly identified this project has no user-facing surface and was skipped in one
  plain sentence rather than manufacturing screens.
- The Build-stage Definition-of-Done gate (threat register, traceability markers, test presence)
  cleared cleanly on the first pass — 3 risks assessed, all CLOSED, no founder escalation needed.

**What was harder than expected:**
- `build.md` names `dept-qa` as always-active alongside `dept-engineering`, but this run never
  created a `dept-qa` lead file — the single-task TDD work was executed directly rather than
  delegated through a dispatched QA lead. For a genuinely one-task plan this reads as proportionate,
  but the command's own language ("delegate each task to the relevant department lead rather than
  doing all the work as this command directly") doesn't carve out a small-plan exception. Logged as
  an observed gap in the structured run output rather than silently working around it; not fixed in
  this pass since it's a single low-severity occurrence, not yet a repeated pattern.

**What we'd do differently next time:**
- Deliberately have a maintainer-mode session actually invoke a real `dept-*` Task-tool dispatch
  (not just author the persona file and then do the work inline) to see whether project-scoped
  agents under `.claude/agents/` really are discoverable mid-session the way
  `department-lead-activation` claims, rather than continuing to route around the question.

**Anything for you to know:**
- Structured run output recorded at `evals/dogfood-runs/2026-07-18T03-11-34Z-simple.json`. No
  `observed_gaps` entry rose to the level of needing `dogfood-gap-classification` — the one real
  friction found (missing `dept-qa` dispatch) is a single occurrence, tracked for a future repeat
  rather than acted on immediately.

<!-- wingman:log type=retro category=dogfooding-mechanism status=resolved -->
## Retro: Fresh founder-mode dogfood run confirms the synchronous-dispatch fix holds — 2026-07-15

Ran a second, fresh founder-mode `/wingman:dogfood` pass specifically to re-exercise the current
`commands/adaptive/dogfood.md` after adding an instruction (in the same PR as `git-pr-workflow`) telling it
to dispatch Boardroom/department-lead seats synchronously (`run_in_background:false`) rather than
as further background agents — a fix added because two earlier runs stalled by doing the opposite,
ending their own turn on a vague "waiting for results" message instead of actually finishing.

**What went well:** The fix held up completely under real, repeated exercise — 18 total `Agent`-
tool dispatches across 3 checkpoint rounds (Planning Milestone: 8 seats, Build-diff: 8 seats, a
post-fix re-check: 2 seats), every single one synchronous and returning a real result directly in
the same turn. Zero stalls, zero vague "waiting" messages. Real TDD (genuine red — a bare-text 404
causing a JSON-parse error in the test — then green), and a real bug caught by the Build-diff
Boardroom pass (an inconsistent 404 response shape between the new `/jobs/:id` route and the
catch-all route), fixed test-first and re-verified. Ship correctly stopped at preflight (no git
remote, no `gh` CLI) rather than faking a push.

**A genuinely interesting moment**: mid-run, the subagent's own `git status` check on Wingman's
real repo showed a staged change set it hadn't produced — this session's own concurrent
`package-manager-selection` work landing in the same shared container. Rather than panic or
silently ignore it, the subagent correctly reasoned from its own action log (every `Write`/`Edit`
it had issued targeted only the fixture directory) that this wasn't its own doing, continued the
run, and by the final check the transient state was gone again. This is exactly the kind of
distinction a verification step needs to make — "something changed" isn't automatically "I caused
it" — and it got that right without being told to.

**What we'd do differently next time:** none — this was specifically a confirmation run for an
already-identified fix, not a search for new gaps, and it found none. `evals/cases/dogfood.md`
promoted with this as its third, differently-shaped scenario (the mode-boundary itself, not just
gate-activation/dormancy).

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
