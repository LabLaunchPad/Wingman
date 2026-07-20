# Agent-Weakness Coverage Benchmark

This is Wingman's **coverage benchmark**: a catalog of community-verified coding-agent failure
modes, each mapped to the Wingman rule that addresses it and the eval case that *measures* whether
the rule actually works. It exists so the claim "Wingman encodes known agent weaknesses into
enforced, measured rules" is checkable, not asserted.

It is **not** a service-style performance benchmark. Wingman has no persistent runtime or request
traffic (`docs/ARCHITECTURE.md` §2), so there is no p95 latency / throughput / cost-function to
measure — a proposed MLOps benchmark of that shape was assessed and declined earlier (see
`docs/PROJECT.md`'s decisions log and `docs/GOVERNANCE.md`). What *is* real and computable is
**coverage**: of the known weaknesses, how many have both a rule and a passing, A/B-tested eval.

## What "A/B testing" means here

Wingman's eval harness already is the A/B test. `evals/README.md`'s `verified` trust level
*requires* two differently-shaped scenarios: a **positive** case (the rule must fire — catch the
flaw) and a **negative** case (the rule must stay quiet — not falsely flag a clean project). A
weakness only counts as **measured** when its mapped eval is `verified` (i.e. has that
positive/negative pair). That positive-vs-negative pairing is the A/B contrast for each rule.

## How this is scored

`node scripts/wingman-metrics.mjs` parses the `<!-- wingman:weakness ... -->` markers below and
reports coverage. Crucially, it does **not** trust each marker's hand-written `status`: it
re-derives the truth from reality — checks the `rule=` path exists on disk, checks the `eval=` path
exists and reads that eval case's *actual* `## Trust level`, and flags any marker whose written
status disagrees with the derived one (plus any broken path). The benchmark verifies its own
claims; it cannot silently rot or overstate coverage.

`status` values: `covered-measured` (rule exists **and** its eval is `verified`),
`covered-unmeasured` (rule exists, but no `verified` eval targets this weakness specifically yet),
`uncovered` (no dedicated rule — an evidence-gated candidate, not a speculative build).

## Sources

Community-verified failure-mode sources this catalog draws on (each entry cites which):

- **MAST** — Cemri et al., *Why Do Multi-Agent LLM Systems Fail?* (arXiv:2503.13657) — a taxonomy of
  agent failure modes incl. premature termination, no/incorrect verification, reasoning-action
  mismatch.
- **Spec-verification study** — *Uncovering Systematic Failures of LLMs in Verifying Code Against
  Natural Language Specifications* (arXiv:2508.12358) — documents partial implementation (42.2% of
  failures), over-trust in inline self-test (29.5%), and an "over-correction" tendency (assuming a
  defect exists in already-correct code).
- **Industry failure-mode writeups** — e.g. Galileo, *7 AI Agent Failure Modes* — practitioner
  catalogues of premature completion, context/verbosity degradation, and unverified self-reports.
- **First-party evidence** — this repo's own `docs/wingman/retros.md` and the cited `evals/cases/*.md`
  run logs, where the same failure modes were caught (or deliberately provoked and resisted) in real
  runs. This is the strongest evidence in the catalog: it's directly re-checkable in this repo.

The documented cross-cutting *solution* those sources converge on — multi-stage validators gating
every phase plus layered review (static rules + LLM judges + human sign-off) — is structurally
exactly Wingman's model (the 4 mechanical validators + the Boardroom review + the founder gate).

## Catalog

<!-- wingman:weakness id=W1 rule="plugins/wingman/skills/verification-before-completion" eval="evals/cases/verification-before-completion.md" status=covered-measured -->
- **W1 — Claiming work complete without running verification.** MAST's "premature termination"; the
  spec-verification study's "over-trust in inline self-test" (29.5%) — the agent substitutes
  self-narrated success for a real check. **Rule:** `skills/verification-before-completion` (evidence
  before assertions; run the command, read the output). **Measured by:** `evals/cases/verification-before-completion.md`
  (`verified`) — its negative/trap A/B case is a "fixed" bug whose fix actually introduces a
  regression; the skill correctly runs real verification instead of judging the diff by eye.

<!-- wingman:weakness id=W2 rule="plugins/wingman/skills/engineering-minimalism" eval="evals/cases/engineering-minimalism.md" status=covered-measured -->
- **W2 — Over-engineering / over-correction (assuming a defect or need exists in already-adequate
  code).** The spec-verification study's "over-correction tendency." **Rule:**
  `skills/engineering-minimalism` (smallest change that solves the real problem; justify any new
  abstraction). **Measured by:** `evals/cases/engineering-minimalism.md` (`verified`) — A/B pair:
  positive (catches a tempting over-engineered solution) vs. negative (does NOT reflexively flag
  genuinely-justified structure).

<!-- wingman:weakness id=W3 rule="plugins/wingman/skills/traceability-linking" eval="evals/cases/traceability-validator.md" status=covered-measured -->
- **W3 — Partial implementation / silently dropping spec requirements.** The spec-verification
  study's largest bucket (partial implementation, 42.2%). **Rule:** `skills/traceability-linking`
  (+ `skills/spec-handler`: state inputs/invariants/success criteria before building), so every
  requirement is minted as a trackable ID. **Measured by:** `evals/cases/traceability-validator.md`
  (`verified`) — all three shapes: linked, unlinked, and orphaned requirement IDs.

<!-- wingman:weakness id=W4 rule="plugins/wingman/skills/anti-rationalization" eval="evals/cases/anti-rationalization.md" status=covered-unmeasured -->
- **W4 — Rationalizing failures / moving the goalposts to declare success.** MAST's reasoning-action
  mismatch and task-derailment classes. **Rule:** `skills/anti-rationalization` (the meta-skill every
  discipline skill draws its rationalizations/red-flags table from). **Not yet measured:**
  `evals/cases/anti-rationalization.md` was downgraded from `verified` to `provisional` on
  2026-07-20 (one run, no negative/differently-shaped second scenario yet — see `FIXLOG.md` T1).
  Covered by a real rule, not yet backed by a `verified` eval.

<!-- wingman:weakness id=W5 rule="plugins/wingman/skills/systematic-debugging" eval="evals/cases/systematic-debugging.md" status=covered-unmeasured -->
- **W5 — Fixing symptoms before understanding root cause.** A widely-documented debugging failure
  mode; provoked and resisted in this repo's own `evals/cases/hotfix.md`/`incident-response.md` runs.
  **Rule:** `skills/systematic-debugging` (required first step of `/wingman:hotfix` before any fix).
  **Not yet measured:** `evals/cases/systematic-debugging.md` was downgraded from `verified` to
  `provisional` on 2026-07-20 (one run, no second scenario yet — see `FIXLOG.md` T1).

<!-- wingman:weakness id=W6 rule="plugins/wingman/skills/test-driven-development" eval="evals/cases/harness.md" status=covered-measured -->
- **W6 — Skipping or faking tests / trusting a rubber-stamp suite.** MAST's "no or incorrect
  verification"; the spec-verification study's over-trust in self-test. **Rule:**
  `skills/test-driven-development` (red-green-refactor, no production code without a failing test)
  + `skills/definition-of-done` + `/wingman:harness`'s fake-suite detection. **Measured by:**
  `evals/cases/harness.md` (`verified`) — the strongest A/B pair in the suite: positive (Wingman's
  own repo, correctly finds the one real CI gap) vs. negative (a fixture whose `npm test` always
  prints "4 passing" regardless of code — correctly distrusted, exact fake mechanism named).

<!-- wingman:weakness id=W7 rule="plugins/wingman/skills/doubt-driven-development" eval="evals/cases/doubt-driven-development.md" status=covered-measured -->
- **W7 — Premature confidence / accepting a false premise without doubt.** MAST; the spec-verification
  study. **Rule:** `skills/doubt-driven-development` (treat doubt as a signal to gather evidence
  before shipping). **Measured by:** `evals/cases/doubt-driven-development.md` (`verified`) — A/B
  across two edges: doubting a claim about test-coverage sufficiency (Run 1) and doubting a
  confidently-stated but false premise about existing code's runtime behavior (Run 2).

<!-- wingman:weakness id=W8 rule="plugins/wingman/skills/token-economy" eval="evals/cases/token-economy.md" status=covered-measured -->
- **W8 — Context/token waste degrading multi-step performance.** Industry failure-mode writeups
  (verbosity/context-bloat degradation). **Rule:** `skills/token-economy` (internal-only concision;
  never applied to founder-facing output). **Measured by:** `evals/cases/token-economy.md`
  (`verified`) — negative/trap A/B case confirms it refuses to compress away scope-boundary and
  irreversible-action detail, i.e. it doesn't over-compress.

<!-- wingman:weakness id=W9 rule="plugins/wingman/skills/evidence-gated-catalog" eval="evals/cases/evidence-gated-catalog.md" status=covered-measured -->
- **W9 — Untested patterns/abstractions entering the codebase (speculative generality).** The
  over-engineering literature; this repo's own evidence-gate discipline. **Rule:**
  `skills/evidence-gated-catalog` (no pattern enters the catalog without evidence it works).
  **Measured by:** `evals/cases/evidence-gated-catalog.md` (`verified`) — positive/negative pair: an
  unproven `proven`-claiming entry vs. a genuinely-evidenced `draft`-claiming one.

<!-- wingman:weakness id=W10 rule="plugins/wingman/skills/verification-loop" eval="evals/cases/verification-loop.md" status=covered-unmeasured -->
- **W10 — Multi-step verification decay (early-step success never re-checked at the end).** MAST's
  verification class. **Rule:** `skills/verification-loop` (a standing multi-phase verification
  system). **Not yet measured:** `evals/cases/verification-loop.md` was downgraded from `verified`
  to `provisional` on 2026-07-20 (one run, no second scenario yet — see `FIXLOG.md` T1).

<!-- wingman:weakness id=W11 rule="plugins/wingman/skills/test-driven-development" eval="" status=covered-unmeasured -->
- **W11 — Hallucinating APIs / methods / libraries that don't exist.** One of the most-reported
  coding-agent failure modes. **Partial rule:** `skills/test-driven-development` (a hallucinated API
  fails its test at red-green time) and `skills/research` (check real docs before relying on an API).
  **Not yet measured:** no eval case *specifically* provokes an API hallucination and confirms the
  rule catches it — so this is honestly `covered-unmeasured`, not `covered-measured`. A dedicated
  eval (a fixture that tempts a call to a plausible-but-nonexistent library method) is the concrete
  next step if this weakness is prioritized.

<!-- wingman:weakness id=W12 rule="" eval="" status=uncovered -->
- **W12 — Not reading existing code/conventions before editing (reinventing or contradicting
  established patterns).** A well-documented agent weakness. **No dedicated rule today:**
  `skills/engineering-minimalism` touches "reuse before adding," but there is no discrete
  read-before-edit / follow-existing-conventions discipline, and nothing measures it. Logged here as
  an **evidence-gated candidate** (per the promotion process in `docs/AGENT-ROSTER.md`) — *not*
  built speculatively. Promote only if a real dogfood run or founder session shows this failure mode
  actually recurring here.

## Adding an entry

New weakness → add a `<!-- wingman:weakness ... -->` marker + prose here, citing a real, verifiable
source (external, or a concrete first-party `retros.md`/eval run-log path). Never fabricate a
citation. Then run `node scripts/wingman-metrics.mjs` and confirm the derived status matches your
written one (it will complain if not). Prefer promoting an `uncovered` weakness only on real,
repeated evidence — this catalog measures coverage, it isn't a to-do list to fill for its own sake.
